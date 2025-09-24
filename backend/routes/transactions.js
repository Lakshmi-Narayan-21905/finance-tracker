const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all transactions for user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, startDate, endDate } = req.query;
    
    let query = { user: req.user.id };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new transaction
router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;
    
    const transaction = new Transaction({
      user: req.user.id,
      type,
      category,
      amount,
      description,
      date: date || Date.now()
    });
    
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get financial summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find({
      user: req.user.id,
      ...dateQuery
    });
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    const categoryBreakdown = transactions.reduce((acc, transaction) => {
      const key = transaction.type === 'income' ? 'income' : 'expense';
      if (!acc[key][transaction.category]) {
        acc[key][transaction.category] = 0;
      }
      acc[key][transaction.category] += transaction.amount;
      return acc;
    }, { income: {}, expense: {} });
    
    res.json({
      income,
      expenses,
      balance,
      categoryBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// --- FIX HIGHLIGHTS ---
// Specific routes are now defined BEFORE dynamic '/:id' routes.

// The actual route to clear all transactions
router.delete('/clear-all', auth, async (req, res) => {
  try {
    await Transaction.deleteMany({ user: req.user.id });
    res.json({ message: 'All transactions have been successfully cleared.' });
  } catch (error) {
    console.error('Error clearing all transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint
router.delete('/clear-all-test', auth, async (req, res) => {
  try {
    res.json({ 
      message: 'Test endpoint works!',
      userId: req.user.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update transaction (dynamic route)
router.put('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    Object.assign(transaction, req.body);
    await transaction.save();
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete single transaction (dynamic route)
// This must come AFTER specific '/clear-all' routes to avoid conflicts.
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    // Catch potential ObjectId casting errors
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid transaction ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;