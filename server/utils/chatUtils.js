/**
 * Utility functions for chat functionality
 */

/**
 * Generate a unique room ID for direct messages between two users
 * Sorts user IDs to ensure the same room ID regardless of who sends the message
 * @param {string} userId1 - First user's ID
 * @param {string} userId2 - Second user's ID
 * @returns {string} Consistent room ID
 */
const generateDirectChatRoomId = (userId1, userId2) => {
  // Sort the user IDs to ensure the same room ID regardless of who initiates the chat
  const sortedIds = [userId1, userId2].sort();
  const roomId = `direct_${sortedIds[0]}_${sortedIds[1]}`;
  console.log(`Generated direct chat room ID: ${roomId} for users:`, sortedIds);
  return roomId;
};

/**
 * Generate a room ID for group chats
 * @param {string} groupId - The group's ID
 * @returns {string} Group room ID
 */
const generateGroupChatRoomId = (groupId) => {
  const roomId = `group_${groupId}`;
  console.log(`Generated group chat room ID: ${roomId}`);
  return roomId;
};

module.exports = {
  generateDirectChatRoomId,
  generateGroupChatRoomId
}; 