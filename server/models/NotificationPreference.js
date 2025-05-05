const mongoose = require("mongoose");

const notificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  addedToGroup: {
    type: Boolean,
    default: true
  },
  addedAsFriend: {
    type: Boolean,
    default: true
  },
  expenseAdded: {
    type: Boolean,
    default: true
  },
  expenseEdited: {
    type: Boolean, 
    default: true
  },
  expenseDeleted: {
    type: Boolean,
    default: true
  },
  chatMessage: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("NotificationPreference", notificationPreferenceSchema); 