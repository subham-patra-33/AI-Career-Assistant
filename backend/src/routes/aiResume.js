const express = require('express');
const router = express.Router();
const { callGemini } = require('../utils/gemini');

router.post('/generate', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Missing resume data' });
    const result = await callGemini(data);
    res.json({ resume: result });
  } catch (err) {
    console.error('AI Generate Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;