const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    additionalDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
    },

    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
    }],

    // peopleTake: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    // }],

    // peopleGive: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    // }],

    expenses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
    }],

    image: {
        type: String,
    },

    token: {
        type: String,
        default: null,
    },

    resetPasswordExpires: {
        type: Date,
      },

    activity: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
    }]
});

module.exports = mongoose.model("User", userSchema);