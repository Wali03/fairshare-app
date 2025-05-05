const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // For direct messages between users
    receiver: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    // For group messages
    group: {
      type: mongoose.Types.ObjectId,
      ref: "Group",
    },
    // Track read status
    readBy: [{
      type: mongoose.Types.ObjectId,
      ref: "User",
    }],
    // Attachments, if any (file paths or URLs)
    attachments: [{
      type: String,
    }],
    // For reply functionality
    replyTo: {
      _id: {
        type: mongoose.Types.ObjectId,
        ref: "Chat"
      },
      message: String,
      sender: {
        _id: {
          type: mongoose.Types.ObjectId,
          ref: "User"
        },
        name: String
      }
    }
  },
  { timestamps: true }
);

// A chat must have either a receiver (direct message) or a group (group message)
ChatSchema.pre("save", function (next) {
  if (!this.receiver && !this.group) {
    return next(new Error("Chat must have either a receiver or a group"));
  }
  if (this.receiver && this.group) {
    return next(new Error("Chat cannot have both a receiver and a group"));
  }
  next();
});

module.exports = mongoose.model("Chat", ChatSchema); 