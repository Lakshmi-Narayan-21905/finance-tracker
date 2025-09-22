const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const client = require("../utils/openaiClient");

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await Transaction.find({ user: userId });
    const budgets = await Budget.find({ user: userId });

    // Prepare structured financial data
    const summary = {
      totalIncome: transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0),
      totalExpense: transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0),
      balance: 0,
      budgets: budgets.map(b => ({
        category: b.category,
        limit: b.amount,
      })),
      transactions: transactions.map(t => ({
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
        date: t.date,
      }))
    };

    summary.balance = summary.totalIncome - summary.totalExpense;

    // Call OpenAI to generate advice
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // you can also use gpt-4.1 or gpt-4.1-mini
      messages: [
        {
          role: "system",
          content: "You are a financial advisor. Give practical money management advice based on user’s data."
        },
        {
          role: "user",
          content: `Here is the user's financial data: ${JSON.stringify(summary, null, 2)}. 
          Please provide personalized financial advice in simple, clear language.`
        }
      ],
    });

    const aiAdvice = response.choices[0].message.content;

    res.json({ advice: aiAdvice });
  } catch (error) {
    console.error("AI Advice Error:", error);
    res.status(500).json({ error: "Error generating AI financial advice" });
  }
});

module.exports = router;
