const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },

    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    }],

    subcategory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
    }],

    amount: {
        type: Number,
        required: true,
    },

    date: {
        type: Date,
        default: Date.now(),
        required: true,
    },

    image: {
        type: String,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
    },

    paidBy: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            amountPaid: {
                type: Number,
                required: true,
            },
        }
    ],

    paidFor: [{
        person: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        amountOwed: {
            type: Number,
            required: true,
        },
    }]
})

module.exports = mongoose.model("Expense", expenseSchema);