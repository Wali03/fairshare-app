const Chat = require("../models/Chat");
const User = require("../models/User");
const Group = require("../models/Group");

// Get all messages between a user and a friend
exports.getUserChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;

        // Validate if friend exists and is in user's friend list
        const user = await User.findById(userId);
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({
                success: false,
                message: "User is not in your friends list"
            });
        }

        // Get all messages between the two users (in both directions)
        const messages = await Chat.find({
            $or: [
                { sender: userId, receiver: friendId, receiverModel: "User" },
                { sender: friendId, receiver: userId, receiverModel: "User" }
            ]
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            message: "Chat history retrieved successfully",
            data: messages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve chat history",
            error: error.message
        });
    }
};

// Get all messages in a group
exports.getGroupChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { groupId } = req.params;

        // Validate if user is in the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        if (!group.people.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        // Get all messages for the group
        const messages = await Chat.find({
            receiver: groupId,
            receiverModel: "Group"
        }).sort({ createdAt: 1 }).populate("sender", "name image");

        return res.status(200).json({
            success: true,
            message: "Group chat history retrieved successfully",
            data: messages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve group chat history",
            error: error.message
        });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat message not found"
            });
        }

        // Only the receiver can mark messages as read
        if (chat.receiver.toString() !== userId && chat.receiverModel === "User") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to mark this message as read"
            });
        }

        chat.isRead = true;
        await chat.save();

        return res.status(200).json({
            success: true,
            message: "Message marked as read"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark message as read",
            error: error.message
        });
    }
};

// Get unread messages count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const unreadCount = await Chat.countDocuments({
            receiver: userId,
            receiverModel: "User",
            isRead: false
        });

        return res.status(200).json({
            success: true,
            message: "Unread count retrieved successfully",
            data: unreadCount
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get unread count",
            error: error.message
        });
    }
}; 