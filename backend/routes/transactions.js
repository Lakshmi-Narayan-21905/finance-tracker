const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all transactions for user
router.get('/', auth, async (req, res) => {
  try {
    // --- START: MODIFIED LOGIC ---
    // 1. Destructure timeRange along with the other parameters
    const { page = 1, limit = 10, type, category, startDate, endDate, timeRange } = req.query;
    
    let query = { user: req.user.id };
    
    if (type) query.type = type;
    if (category) query.category = category;

    // 2. Define date variables
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    // 3. If timeRange is provided, calculate the start date
    if (timeRange) {
      const now = new Date();
      finalEndDate = now.toISOString(); // Set end date to now
      const calculatedStartDate = new Date();

      if (timeRange === '1month') {
        calculatedStartDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === '3months') {
        calculatedStartDate.setMonth(now.getMonth() - 3);
      } else if (timeRange === '6months') {
        calculatedStartDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === '1year') {
        calculatedStartDate.setFullYear(now.getFullYear() - 1);
      }
      finalStartDate = calculatedStartDate.toISOString();
    }
    
    // 4. Build the final date query
    if (finalStartDate || finalEndDate) {
      query.date = {};
      if (finalStartDate) query.date.$gte = new Date(finalStartDate);
      if (finalEndDate) query.date.$lte = new Date(finalEndDate);
    }
    // --- END: MODIFIED LOGIC ---
    
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
    // --- START: MODIFIED LOGIC (Identical to the one above) ---
    // 1. Destructure timeRange along with other parameters
    const { startDate, endDate, timeRange } = req.query;
    
    let dateQuery = {};
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    // 2. If timeRange is provided, calculate the start date
    if (timeRange) {
      const now = new Date();
      finalEndDate = now.toISOString();
      const calculatedStartDate = new Date();

      if (timeRange === '1month') {
        calculatedStartDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === '3months') {
        calculatedStartDate.setMonth(now.getMonth() - 3);
      } else if (timeRange === '6months') {
        calculatedStartDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === '1year') {
        calculatedStartDate.setFullYear(now.getFullYear() - 1);
      }
      finalStartDate = calculatedStartDate.toISOString();
    }
    
    // 3. Build the final date query
    if (finalStartDate || finalEndDate) {
      dateQuery.date = {};
      if (finalStartDate) dateQuery.date.$gte = new Date(finalStartDate);
      if (finalEndDate) dateQuery.date.$lte = new Date(finalEndDate);
    }
    // --- END: MODIFIED LOGIC ---
    
    const transactions = await Transaction.find({
      user: req.user.id,
      ...dateQuery
    });
    
    // The rest of the summary calculation logic is fine
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    const categoryBreakdown = // ... (rest of the logic is fine)

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