const Chat = require('../models/Chat');
const User = require('../models/User');
const Group = require('../models/Group');
const { StatusCodes } = require('http-status-codes');
const { generateDirectChatRoomId, generateGroupChatRoomId } = require('../utils/chatUtils');
const ActivityController = require('./Activity');

// Get chat history with a specific friend
const getChatWithFriend = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  // Validate the friend exists
  const friend = await User.findOne({ _id: friendId });
  if (!friend) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Friend not found'
    });
  }

  // Get messages where current user is either sender or receiver and friend is either receiver or sender
  const messages = await Chat.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId }
    ],
    group: { $exists: false }
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email profilePicture')
    .populate('receiver', 'name email profilePicture');

  // Mark messages as read if current user is the receiver
  await Chat.updateMany(
    { sender: friendId, receiver: userId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  res.status(StatusCodes.OK).json({ messages, count: messages.length });
};

// Get chat history in a group
const getGroupChat = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Validate the group exists and user is a member
  const group = await Group.findOne({ _id: groupId, people: userId });
  if (!group) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Group not found or you are not a member'
    });
  }

  // Get messages for the group
  const messages = await Chat.find({ group: groupId })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email profilePicture')
    .populate('group', 'name');

  // Mark messages as read
  await Chat.updateMany(
    { group: groupId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  res.status(StatusCodes.OK).json({ messages, count: messages.length });
};

// Mark a message as read
const markMessageAsRead = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user has permission to read this message
  if (
    chat.receiver && !chat.receiver.equals(userId) && !chat.sender.equals(userId) ||
    chat.group && !(await Group.findOne({ _id: chat.group, people: userId }))
  ) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Not authorized to access this message'
    });
  }

  if (!chat.readBy.includes(userId)) {
    chat.readBy.push(userId);
    await chat.save();
  }

  res.status(StatusCodes.OK).json({ message: 'Message marked as read' });
};

// Get count of unread messages
const getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  // Get user's groups
  const userGroups = await Group.find({ people: userId }).select('_id');
  const groupIds = userGroups.map(group => group._id);

  // Count unread direct messages
  const unreadDirectCount = await Chat.countDocuments({
    receiver: userId,
    readBy: { $ne: userId }
  });

  // Count unread group messages
  const unreadGroupCount = await Chat.countDocuments({
    group: { $in: groupIds },
    sender: { $ne: userId },
    readBy: { $ne: userId }
  });

  res.status(StatusCodes.OK).json({
    totalUnread: unreadDirectCount + unreadGroupCount,
    directUnread: unreadDirectCount,
    groupUnread: unreadGroupCount
  });
};

// Send a message to a user
const sendDirectMessage = async (req, res) => {
  const { receiverId, message, attachments, replyToId } = req.body;
  const sender = req.user.id;

  console.log('⚡️ sendDirectMessage called:', {
    sender,
    receiverId,
    message: message?.substring(0, 30),
    hasReplyTo: !!replyToId
  });

  if (!message && (!attachments || attachments.length === 0)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Message or attachment is required'
    });
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Receiver not found'
    });
  }

  // Create new message object
  const chatData = {
    sender,
    receiver: receiverId,
    message: message || '',
    attachments: attachments || [],
    readBy: [sender] // Sender has read their own message
  };

  // If replying to a message, add the replyTo field
  if (replyToId) {
    // Find the original message
    const originalMessage = await Chat.findById(replyToId)
      .populate('sender', 'name');
    
    if (originalMessage) {
      console.log('Found original message for reply:', {
        id: originalMessage._id,
        message: originalMessage.message?.substring(0, 30),
        sender: originalMessage.sender?.name
      });
      
      chatData.replyTo = {
        _id: originalMessage._id,
        message: originalMessage.message,
        sender: {
          _id: originalMessage.sender._id,
          name: originalMessage.sender.name
        }
      };
    } else {
      console.warn('Reply message not found:', replyToId);
    }
  }

  // Create the chat message
  const chat = await Chat.create(chatData);
  console.log('Created new chat message:', {
    id: chat._id,
    hasReplyTo: !!chat.replyTo
  });

  const populatedChat = await Chat.findById(chat._id)
    .populate('sender', 'name email profilePicture')
    .populate('receiver', 'name email profilePicture');

  // Create a unique room ID for the direct message chat using utility function
  const roomId = generateDirectChatRoomId(sender, receiverId);
  console.log('Generated direct chat room ID:', roomId);
  
  // Access the Socket.IO instance from the req object (will be added in index.js)
  if (req.app.get('io')) {
    // Emit to the room so both users get the message
    console.log(`🔥 Emitting direct message to room: ${roomId}`, {
      messageId: populatedChat._id,
      sender: populatedChat.sender.name,
      receiver: populatedChat.receiver.name
    });
    req.app.get('io').to(roomId).emit('receive_message', populatedChat);
  } else {
    console.error('🚫 Socket.IO instance not available');
  }
  
  // Create message activity for the receiver
  await ActivityController.createMessageReceivedActivity(
    receiverId, // userId (receiver)
    sender,     // actorId (sender)
    message     // message content
  );

  res.status(StatusCodes.CREATED).json({ chat: populatedChat });
};

// Send a message to a group
const sendGroupMessage = async (req, res) => {
  const { groupId, message, attachments, replyToId } = req.body;
  const sender = req.user.id;

  if (!message && (!attachments || attachments.length === 0)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Message or attachment is required'
    });
  }

  // Check if group exists and user is a member
  const group = await Group.findOne({ _id: groupId, people: sender });
  if (!group) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: 'Group not found or you are not a member'
    });
  }

  // Create new message object
  const chatData = {
    sender,
    group: groupId,
    message: message || '',
    attachments: attachments || [],
    readBy: [sender] // Sender has read their own message
  };

  // If replying to a message, add the replyTo field
  if (replyToId) {
    // Find the original message
    const originalMessage = await Chat.findById(replyToId)
      .populate('sender', 'name');
    
    if (originalMessage) {
      chatData.replyTo = {
        _id: originalMessage._id,
        message: originalMessage.message,
        sender: {
          _id: originalMessage.sender._id,
          name: originalMessage.sender.name
        }
      };
    }
  }

  // Create the chat message
  const chat = await Chat.create(chatData);

  const populatedChat = await Chat.findById(chat._id)
    .populate('sender', 'name email profilePicture')
    .populate('group', 'name');

  // Create a group room ID using utility function
  const roomId = generateGroupChatRoomId(groupId);
  
  // Access the Socket.IO instance from the req object
  if (req.app.get('io')) {
    console.log(`Emitting group message to room: ${roomId}`);
    req.app.get('io').to(roomId).emit('receive_message', populatedChat);
  }
  
  // Create message activities for all group members except the sender
  const groupMembers = group.people.filter(member => member.toString() !== sender);
  for (const memberId of groupMembers) {
    await ActivityController.createMessageReceivedActivity(
      memberId, // userId (group member)
      sender,   // actorId (sender)
      message,  // message content
      groupId   // groupId
    );
  }

  res.status(StatusCodes.CREATED).json({ chat: populatedChat });
};

module.exports = {
  getChatWithFriend,
  getGroupChat,
  markMessageAsRead,
  getUnreadCount,
  sendDirectMessage,
  sendGroupMessage
}; 