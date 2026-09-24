// backend/src/services/__tests__/careerProgressAndUI.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("\n=======================================================");
console.log("RUNNING CAREER PROGRESS & UI RESILIENCE VERIFICATION");
console.log("=======================================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  process.stdout.write(`TEST ${total}: ${name} ... `);
  try {
    fn();
    console.log("✅ PASSED");
    passed++;
  } catch (e) {
    console.log("❌ FAILED");
    console.error("   Error:", e.message);
  }
}

function loadFileNormalized(relPath) {
  return fs
    .readFileSync(path.resolve(__dirname, relPath), "utf8")
    .replace(/\r\n/g, "\n");
}

// 1. Verify AiMockInterview has double-click guard
test("AiMockInterview prevents duplicate startInterview clicks via loading guard", () => {
  const code = loadFileNormalized("../../../../frontend/src/components/Pages/AiMockInterview.jsx");
  assert.ok(
    code.includes("const startInterview = async () => {\n    if (loading) return;"),
    "startInterview must check if (loading) return;"
  );
});

// 2. Verify AiMockInterview has evaluateAnswer double-click guard
test("AiMockInterview prevents duplicate evaluateAnswer clicks via loading guard", () => {
  const code = loadFileNormalized("../../../../frontend/src/components/Pages/AiMockInterview.jsx");
  assert.ok(
    code.includes("const evaluateAnswer = async () => {\n    if (loading) return;"),
    "evaluateAnswer must check if (loading) return;"
  );
  assert.ok(
    code.includes("disabled={loading}"),
    "Submit button must have disabled={loading}"
  );
});

// 3. Verify user's answer is NOT wiped when evaluateAnswer fails
test("AiMockInterview preserves user answer in state on evaluation failure", () => {
  const code = loadFileNormalized("../../../../frontend/src/components/Pages/AiMockInterview.jsx");
  const evalIdx = code.indexOf("const evaluateAnswer = async () =>");
  const nextIdx = code.indexOf("const nextQuestion = () =>");
  const evalBlock = code.slice(evalIdx, nextIdx);

  const catchIdx = evalBlock.indexOf("} catch (err) {");
  const catchBlock = evalBlock.slice(catchIdx);
  assert.ok(!catchBlock.includes('setAnswer("")'), "catch block must NOT reset answer to empty string");
});

// 4. Verify completed interview results are saved to localStorage and trigger storage event
test("AiMockInterview saves lastInterviewScore and dispatches storage event", () => {
  const code = loadFileNormalized("../../../../frontend/src/components/Pages/AiMockInterview.jsx");
  assert.ok(
    code.includes('localStorage.setItem(\n      "lastInterviewScore"'),
    "Must save lastInterviewScore to localStorage"
  );
  assert.ok(
    code.includes('window.dispatchEvent(new Event("storage"))'),
    "Must dispatch storage event to notify Career Progress"
  );
});

// 5. Verify Career Progress reads lastInterviewScore on load and on storage event
test("CareerProgress reads lastInterviewScore and marks interview checklist item complete", () => {
  const code = loadFileNormalized("../../../../frontend/src/components/Pages/CareerProgress.jsx");
  assert.ok(
    code.includes('localStorage.getItem("lastInterviewScore")'),
    "Must read lastInterviewScore from localStorage"
  );
  assert.ok(
    code.includes("complete: interviewScore > 0"),
    "Checklist item must be complete when interviewScore > 0"
  );
  assert.ok(
    code.includes('window.addEventListener("storage", refresh)'),
    "Must listen to storage events for real-time progress update"
  );
});

console.log(`\n-------------------------------------------------------`);
console.log(`RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log(`-------------------------------------------------------\n`);

if (passed !== total) {
  process.exit(1);
}
