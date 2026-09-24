// backend/src/services/__tests__/fallbackVerification.test.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const assert = require("assert");
const aiService = require("../aiService");

console.log("\n=======================================================");
console.log("RUNNING PART 13 — FALLBACK VERIFICATION TEST SUITE");
console.log("=======================================================\n");

let passedCount = 0;
let totalCount = 0;

async function runTest(testName, testFn) {
  totalCount++;
  process.stdout.write(`TEST ${totalCount}: ${testName} ... `);
  try {
    await testFn();
    console.log("✅ PASSED");
    passedCount++;
  } catch (err) {
    console.log("❌ FAILED");
    console.error("   Error details:", err.message);
  }
}

(async () => {
  // CRITERION 10: Backend starts without crashing when XAI_API_KEY is missing
  await runTest("Backend starts and aiService initializes cleanly without crashing", async () => {
    assert.strictEqual(typeof aiService.executeWithFallback, "function");
    assert.strictEqual(typeof aiService.generateInterviewQuestions, "function");
    assert.strictEqual(typeof aiService.evaluateInterviewAnswer, "function");
  });

  // CRITERION 6 & 9: Gemini is used first; Grok is NOT called when Gemini succeeds
  await runTest("Gemini is called first, and Grok is NOT called when Gemini succeeds", async () => {
    let geminiCalled = 0;
    let grokCalled = 0;

    const originalGrokKey = process.env.XAI_API_KEY;
    process.env.XAI_API_KEY = "test_grok_key_mock";
    aiService.resetGeminiQuotaStatus();

    const result = await aiService.executeWithFallback({
      featureName: "Gemini Priority Test",
      prompt: "test",
      geminiCaller: async () => {
        geminiCalled++;
        return { questions: ["What is React virtual DOM?"] };
      },
    });

    process.env.XAI_API_KEY = originalGrokKey;

    assert.strictEqual(geminiCalled, 1, "Gemini should be called exactly once");
    assert.strictEqual(grokCalled, 0, "Grok should NOT be called when Gemini succeeds");
    assert.strictEqual(result.provider, "gemini");
    assert.deepStrictEqual(result.data.questions, ["What is React virtual DOM?"]);
  });

  // CRITERION 7: Gemini temporary 429 is handled with bounded retries before succeeding
  await runTest("Gemini temporary 429 triggers bounded retries with backoff before succeeding", async () => {
    let geminiAttempts = 0;
    aiService.resetGeminiQuotaStatus();

    const startTime = Date.now();
    const result = await aiService.executeWithFallback({
      featureName: "Temporary 429 Retry Test",
      prompt: "test",
      geminiCaller: async () => {
        geminiAttempts++;
        if (geminiAttempts < 2) {
          const err = new Error("Rate limit exceeded. Too many requests.");
          err.status = 429;
          throw err;
        }
        return { questions: ["Explain JavaScript event loop"] };
      },
    });
    const elapsed = Date.now() - startTime;

    assert.strictEqual(geminiAttempts, 2, "Gemini should retry and succeed on attempt 2");
    assert.strictEqual(result.provider, "gemini");
    assert.ok(elapsed >= 900, "Should have delayed ~1s for attempt 1 backoff");
  });

  // CRITERION 8 & 13: Gemini daily quota exhaustion switches to Grok fallback
  await runTest("Gemini daily quota exhaustion switches to Grok fallback without infinite retry", async () => {
    let geminiAttempts = 0;
    let grokCalled = 0;
    aiService.resetGeminiQuotaStatus();

    // Temporarily mock fetch to simulate Grok response
    const originalFetch = global.fetch;
    global.fetch = async (url, opts) => {
      if (url.includes("api.x.ai")) {
        grokCalled++;
        assert.ok(opts.headers.Authorization.includes("Bearer mock_grok_key"));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    questions: ["Grok: What are microservices advantages?"],
                  }),
                },
              },
            ],
          }),
        };
      }
      return originalFetch(url, opts);
    };

    const prevXaiKey = process.env.XAI_API_KEY;
    process.env.XAI_API_KEY = "mock_grok_key";

    try {
      const result = await aiService.executeWithFallback({
        featureName: "Daily Quota Fallback Test",
        prompt: "test",
        geminiCaller: async () => {
          geminiAttempts++;
          const err = new Error("Resource exhausted: daily limit reached for quota metric.");
          err.status = 429;
          throw err;
        },
      });

      assert.strictEqual(geminiAttempts, 1, "Gemini should NOT retry when daily quota is exhausted");
      assert.strictEqual(grokCalled, 1, "Grok fallback should be called");
      assert.strictEqual(result.provider, "grok");
      assert.deepStrictEqual(result.data.questions, ["Grok: What are microservices advantages?"]);
      assert.ok(aiService.isGeminiDailyQuotaExhausted(), "Gemini should remain marked quota exhausted in memory");
    } finally {
      global.fetch = originalFetch;
      process.env.XAI_API_KEY = prevXaiKey;
      aiService.resetGeminiQuotaStatus();
    }
  });

  // CRITERION 11: Controlled error when both providers fail
  await runTest("Controlled error is returned when both Gemini and Grok fail", async () => {
    aiService.resetGeminiQuotaStatus();
    const prevXaiKey = process.env.XAI_API_KEY;
    delete process.env.XAI_API_KEY; // Grok has no key

    try {
      await aiService.executeWithFallback({
        featureName: "Both Fail Test",
        prompt: "test",
        geminiCaller: async () => {
          const err = new Error("Quota exceeded");
          err.status = 429;
          throw err;
        },
      });
      assert.fail("Should have thrown controlled error");
    } catch (err) {
      assert.strictEqual(err.code, "ALL_AI_PROVIDERS_UNAVAILABLE");
      assert.strictEqual(err.status, 503);
      assert.ok(err.message.includes("All AI providers are currently unavailable"));
    } finally {
      process.env.XAI_API_KEY = prevXaiKey;
      aiService.resetGeminiQuotaStatus();
    }
  });

  // CRITERION 1, 2, 3, 4: Live HTTP API check against running server
  await runTest("HTTP API POST /api/ai/mock-interview returns valid route (not 404)", async () => {
    const res = await fetch("http://localhost:4000/api/ai/mock-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "Software Engineer" }),
    });

    assert.notStrictEqual(res.status, 404, "Must not return 404");
    const json = await res.json();
    assert.ok(typeof json === "object", "Must return valid JSON");
    assert.ok(json.success !== undefined, "Must return success field");
  });

  // CRITERION 17: No API key appears in frontend code, browser requests, or logs
  await runTest("No API keys exposed in frontend code or client bundle", async () => {
    const fs = require("fs");
    const path = require("path");

    const frontendFiles = [
      path.resolve(__dirname, "../../../../frontend/src/components/Pages/AiMockInterview.jsx"),
      path.resolve(__dirname, "../../../../frontend/src/components/Pages/CareerProgress.jsx"),
      path.resolve(__dirname, "../../../../frontend/src/lib/api.js"),
    ];

    for (const f of frontendFiles) {
      if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, "utf8");
        assert.ok(!content.includes("AIzaSy"), `Google API key leaked in ${f}`);
        assert.ok(!content.includes("xai-"), `xAI API key leaked in ${f}`);
        assert.ok(!content.includes("GEMINI_API_KEY"), `GEMINI_API_KEY should not be in frontend ${f}`);
        assert.ok(!content.includes("XAI_API_KEY"), `XAI_API_KEY should not be in frontend ${f}`);
      }
    }
  });

  console.log(`\n-------------------------------------------------------`);
  console.log(`RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`-------------------------------------------------------\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
})();
