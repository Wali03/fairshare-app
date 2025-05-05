const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    description: {
        type: String,
    },

    image: {
        type: String,
        required: true,
    },

    people: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    expenses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
    }],

    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
})

module.exports = mongoose.model("Group", groupSchema);