const mongoose = require("mongoose");
require("dotenv").config();

const Transaction = require("./models/Transaction");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.error("MongoDB connection error:", err));

async function seedTransactions() {
  try {
    const userId = "68d0e53bdeac7d239645dc3b"; // Replace with your actual user _id

    const categories = {
      income: ["Salary", "Freelance", "Bonus", "Investments", "Gift"],
      expense: [
        "Food",
        "Transport",
        "Shopping",
        "Entertainment",
        "Bills",
        "Groceries",
        "Travel",
        "Health",
        "Education",
        "Rent",
      ],
    };

    const transactions = [];

    for (let i = 0; i < 50; i++) {
      const type = Math.random() < 0.4 ? "income" : "expense"; // ~40% income, 60% expense
      const categoryList = categories[type];
      const category =
        categoryList[Math.floor(Math.random() * categoryList.length)];
      const amount =
        type === "income"
          ? Math.floor(Math.random() * 50000) + 5000 // income between 5k-55k
          : Math.floor(Math.random() * 15000) + 100; // expense between 100-15k
      const description = `${category} transaction`;
      const month = Math.floor(Math.random() * 12); // 0-11 for Jan-Dec
      const day = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid invalid dates
      const date = new Date(2025, month, day);

      transactions.push({
        user: userId,
        type,
        category,
        amount,
        description,
        date,
      });
    }

    await Transaction.insertMany(transactions);
    console.log("50 sample transactions inserted successfully!");
  } catch (err) {
    console.error("Error inserting transactions:", err);
  } finally {
    mongoose.connection.close();
  }
}

seedTransactions();
