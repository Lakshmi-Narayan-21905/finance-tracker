// utils/openaiClient.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // store in .env
});

module.exports = client;
