const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { 
  getChatWithFriend, 
  getGroupChat, 
  markMessageAsRead, 
  getUnreadCount, 
  sendDirectMessage, 
  sendGroupMessage 
} = require("../controllers/chatController");
const { generateDirectChatRoomId, generateGroupChatRoomId } = require('../utils/chatUtils');

// Get chat history with a friend
router.get("/user/:friendId", auth, getChatWithFriend);

// Get chat history in a group
router.get("/group/:groupId", auth, getGroupChat);

// Mark message as read
router.patch("/read/:chatId", auth, markMessageAsRead);

// Get unread message count
router.get("/unread/count", auth, getUnreadCount);

// Route to send a direct message to a user
router.post("/direct", auth, sendDirectMessage);

// Route to send a message to a group
router.post("/group", auth, sendGroupMessage);

// Get direct chat room ID (for socket.io)
router.get("/room/direct/:friendId", auth, (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.params;
  const roomId = generateDirectChatRoomId(userId, friendId);
  res.status(200).json({ roomId });
});

// Get group chat room ID (for socket.io)
router.get("/room/group/:groupId", auth, (req, res) => {
  const { groupId } = req.params;
  const roomId = generateGroupChatRoomId(groupId);
  res.status(200).json({ roomId });
});

module.exports = router; 