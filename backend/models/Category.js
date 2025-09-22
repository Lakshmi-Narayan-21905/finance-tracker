const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensures each user has only one category document
    },
    incomeCategories: {
        type: [String],
        default: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other']
    },
    expenseCategories: {
        type: [String],
        default: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other']
    }
}, { 
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Category', CategorySchema);