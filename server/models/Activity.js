const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    // Who performed the action (if different from user)
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    
    // Type of activity
    type: {
        type: String,
        required: true,
        enum: [
            'FRIEND_ADDED', 
            'GROUP_ADDED', 
            'GROUP_REMOVED', 
            'EXPENSE_ADDED',
            'EXPENSE_UPDATED',  // Add this new type
            'EXPENSE_DELETED', 
            'GROUP_CREATED',
            'GROUP_MEMBER_ADDED',
            'FRIEND_REQUEST',
            'MESSAGE_RECEIVED'
        ]
    },
    
    // Description of the activity
    desc: {
        type: String,
        required: true,
    },

    // Timestamp of the activity
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },

    // Reference to related entities
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
    },

    expense: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
    },
    
    friend: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    // Optional image for the activity (icon or entity image)
    image: {
        type: String,
    },

    // Actor profile image
    actorImage: {
        type: String,
    },
    
    // Is this activity read by the user
    isRead: {
        type: Boolean,
        default: false
    },

    // Message content (for chat activities)
    message: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);