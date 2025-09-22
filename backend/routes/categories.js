const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');

/**
 * @route   GET api/categories
 * @desc    Get all categories for a user (creates default if none exist)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        let categories = await Category.findOne({ user: req.user.id });

        // If no categories document exists for the user, create one with the default values
        if (!categories) {
            categories = new Category({ user: req.user.id });
            await categories.save();
        }

        res.json({
            income: categories.incomeCategories,
            expense: categories.expenseCategories
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST api/categories
 * @desc    Add a new category
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    const { type, name } = req.body; // type should be 'income' or 'expense'

    if (!['income', 'expense'].includes(type) || !name) {
        return res.status(400).json({ msg: 'Invalid type or name provided.' });
    }

    try {
        const fieldToUpdate = type === 'income' ? 'incomeCategories' : 'expenseCategories';
        
        // Use $addToSet to add the category to the array only if it doesn't already exist
        const updatedCategories = await Category.findOneAndUpdate(
            { user: req.user.id },
            { $addToSet: { [fieldToUpdate]: name } },
            { new: true, upsert: true } // upsert: creates the document if it doesn't exist
        );

        res.json({
            income: updatedCategories.incomeCategories,
            expense: updatedCategories.expenseCategories
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE api/categories/:type/:name
 * @desc    Delete a category
 * @access  Private
 */
router.delete('/:type/:name', auth, async (req, res) => {
    const { type, name } = req.params;

    if (!['income', 'expense'].includes(type) || !name) {
        return res.status(400).json({ msg: 'Invalid type or name provided.' });
    }
    
    try {
        const fieldToUpdate = type === 'income' ? 'incomeCategories' : 'expenseCategories';

        // Use $pull to remove the specified category from the array
        const updatedCategories = await Category.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { [fieldToUpdate]: name } },
            { new: true }
        );

        if (!updatedCategories) {
            return res.status(404).json({ msg: 'User categories not found.' });
        }

        res.json({
            income: updatedCategories.incomeCategories,
            expense: updatedCategories.expenseCategories
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;