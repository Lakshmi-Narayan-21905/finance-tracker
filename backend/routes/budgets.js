const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all budgets for user
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update the POST route to be more flexible
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, period = 'monthly', type } = req.body;
    
    // Use period if provided, otherwise handle type for backward compatibility
    const finalPeriod = period || (type === 'overall' ? 'monthly' : 'monthly');
    
    // Check if budget already exists for this category
    const existingBudget = await Budget.findOne({
      user: req.user.id,
      category
    });
    
    if (existingBudget) {
      return res.status(400).json({ message: 'Budget already exists for this category' });
    }
    
    const budget = new Budget({
      user: req.user.id,
      category,
      amount,
      period: finalPeriod
    });
    
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error('Budget creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update budget
router.put('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    Object.assign(budget, req.body);
    await budget.save();
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get budget progress
router.get('/progress', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id, active: true });
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const budgetProgress = await Promise.all(
      budgets.map(async (budget) => {
        let expenses = [];
        
        if (budget.budgetType === 'category') {
          expenses = await Transaction.find({
            user: req.user.id,
            type: 'expense',
            category: budget.category,
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
          });
        } else {
          // Overall budget - get all expenses
          expenses = await Transaction.find({
            user: req.user.id,
            type: 'expense',
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
          });
        }

        const totalSpent = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const percentage = (totalSpent / budget.amount) * 100;

        return {
          budget: budget,
          spent: totalSpent,
          percentage: percentage,
          remaining: budget.amount - totalSpent,
          status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good'
        };
      })
    );

    res.json(budgetProgress);
  } catch (error) {
    console.error('Error fetching budget progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;