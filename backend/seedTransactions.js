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
    const userId = "68d0e53bdeac7d239645dc3b"; // 👈 Replace with your actual user _id

    const transactions = [
      {
        user: userId,
        type: "expense",
        category: "Food",
        amount: 250,
        description: "Lunch with friends",
        date: new Date("2025-01-10"),
      },
      {
        user: userId,
        type: "income",
        category: "Salary",
        amount: 50000,
        description: "Monthly salary",
        date: new Date("2025-01-05"),
      },
      {
        user: userId,
        type: "expense",
        category: "Transport",
        amount: 1200,
        description: "Cab and bus fares",
        date: new Date("2025-01-15"),
      },
      {
        user: userId,
        type: "expense",
        category: "Shopping",
        amount: 3000,
        description: "Clothes and accessories",
        date: new Date("2025-01-20"),
      },
      {
        user: userId,
        type: "income",
        category: "Freelance",
        amount: 15000,
        description: "Freelance project",
        date: new Date("2025-01-22"),
      },
      {
        user: userId,
        type: "expense",
        category: "Entertainment",
        amount: 800,
        description: "Movie tickets",
        date: new Date("2025-01-25"),
      },
      {
        user: userId,
        type: "expense",
        category: "Bills",
        amount: 4500,
        description: "Electricity and water bill",
        date: new Date("2025-01-28"),
      },
      {
        user: userId,
        type: "expense",
        category: "Groceries",
        amount: 2200,
        description: "Monthly groceries",
        date: new Date("2025-02-02"),
      },
      {
        user: userId,
        type: "income",
        category: "Bonus",
        amount: 10000,
        description: "Performance bonus",
        date: new Date("2025-02-05"),
      },
      {
        user: userId,
        type: "expense",
        category: "Travel",
        amount: 15000,
        description: "Weekend trip",
        date: new Date("2025-02-08"),
      },
      {
        user: userId,
        type: "expense",
        category: "Health",
        amount: 2000,
        description: "Medicines",
        date: new Date("2025-02-10"),
      },
      {
        user: userId,
        type: "expense",
        category: "Education",
        amount: 6000,
        description: "Course fees",
        date: new Date("2025-02-15"),
      },
      {
        user: userId,
        type: "income",
        category: "Investments",
        amount: 7000,
        description: "Stock dividends",
        date: new Date("2025-02-20"),
      },
      {
        user: userId,
        type: "expense",
        category: "Rent",
        amount: 12000,
        description: "Monthly rent",
        date: new Date("2025-02-25"),
      },
    ];

    await Transaction.insertMany(transactions);
    console.log("Sample transactions inserted successfully!");
  } catch (err) {
    console.error("Error inserting transactions:", err);
  } finally {
    mongoose.connection.close();
  }
}

seedTransactions();
