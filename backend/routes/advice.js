const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- AI Configuration ---
// FIXED: Added a check to ensure the API key is loaded.
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in the .env file.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// --- Prompt Engineering Function ---
const createAIPrompt = (transactions, budgets) => {
    // ... (This function remains the same as before)
    const transactionList = transactions.map(t => 
        `- ${new Date(t.date).toLocaleDateString()}: ${t.type === 'expense' ? '-' : '+'}₹${t.amount} on ${t.category} (${t.description || 'no description'})`
    ).join('\n');
    const budgetList = budgets.map(b => 
        `- ${b.category}: ₹${b.amount} per ${b.period}`
    ).join('\n');
    const prompt = `
        You are an expert financial advisor. Analyze the following financial data for a user from India.
        The data covers the last 30 days. All monetary values are in Indian Rupees (₹).
        **User's Budgets:**
        ${budgetList.length > 0 ? budgetList : "No budgets have been set."}
        **User's Transactions (Last 30 Days):**
        ${transactionList}
        ---
        **Your Task:**
        Based ONLY on the data provided, provide a concise financial analysis. Your response must include the following sections, using markdown for formatting:
        1.  **### Financial Summary:** Briefly state the total income, total expenses, and net savings.
        2.  **### Key Insights:** Provide 2-3 bullet points highlighting important observations (e.g., highest spending category, budget performance, savings rate).
        3.  **### Actionable Recommendations:** Provide 2-3 clear, actionable recommendations for the user to improve their financial health.
        Keep the tone encouraging and helpful. Do not invent any information not present in the data.
    `;
    return prompt;
};

// GET api/advice (Initial advice route)
router.get('/', auth, async (req, res) => {
    // ... (This route remains the same as before)
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const transactions = await Transaction.find({ user: req.user.id, date: { $gte: thirtyDaysAgo } });
        const budgets = await Budget.find({ user: req.user.id });
        if (transactions.length < 3) {
            return res.json({ advice: "There's not enough transaction data from the last 30 days to generate advice. Please add more recent income and expenses!" });
        }
        const prompt = createAIPrompt(transactions, budgets);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const adviceText = response.text();
        res.json({ advice: adviceText });
    } catch (error) {
        console.error("AI Advice Error:", error);
        res.status(500).send('Error generating AI advice.');
    }
});


// ### UPDATED CHATBOT ENDPOINT ###
/**
 * @route   POST api/advice/chat
 * @desc    Handle conversational follow-up questions
 * @access  Private
 */
router.post('/chat', auth, async (req, res) => {
    const { history } = req.body; // The full history comes from the frontend

    if (!history || history.length === 0) {
        return res.status(400).json({ error: 'History is required.' });
    }

    try {
        let conversationHistory = [...history];

        // --- THE FIX ---
        // The Gemini API requires the conversation history to start with a 'user' role.
        // Since our flow begins with the AI's advice ('model'), we prepend a generic
        // user message to the start of the array to make the history valid.
        if (conversationHistory[0].role === 'model') {
            conversationHistory.unshift({
                role: 'user',
                parts: [{ text: "You have just provided me with a financial analysis. Now, please answer my follow-up questions based on that context and our conversation." }]
            });
        }
        
        // Use the model.generateContent method, which is ideal for when you have the full conversation history.
        const result = await model.generateContent({
            contents: conversationHistory,
        });
        
        const response = result.response;
        const chatResponseText = response.text();

        res.json({ reply: chatResponseText });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).send('Error getting chat response.');
    }
});

module.exports = router;