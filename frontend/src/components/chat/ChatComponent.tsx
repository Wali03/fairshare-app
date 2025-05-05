'use client';

import { useEffect, useState, useRef } from 'react';
import { useChatStore, ChatMessage } from '@/lib/stores/chatStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { format } from 'date-fns';
import { FaReply, FaTimes } from 'react-icons/fa';
import api from '@/lib/api';

interface ChatComponentProps {
  targetId: string;
  isFriendChat: boolean;
  targetName: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  targetId,
  isFriendChat,
  targetName
}) => {
  const [message, setMessage] = useState('');
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get user from both store and localStorage as backup
  const storeUser = useAuthStore(state => state.user);
  const [userId, setUserId] = useState<string | undefined>(storeUser?.id);
  
  const {
    messages,
    connect,
    disconnect,
    fetchDirectChatMessages,
    fetchGroupChatMessages,
    sendMessage,
    isLoading,
    error,
    replyingTo,
    setReplyingTo
  } = useChatStore();

  // Get user ID from localStorage if not available in store
  useEffect(() => {
    if (!userId) {
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const id = localUser.id || localUser._id;
        if (id) {
          console.log('Retrieved user ID from localStorage:', id);
          setUserId(id);
        } else {
          console.error('No user ID found in localStorage');
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }, [userId]);

  // Save current chat info for recovery
  useEffect(() => {
    if (userId && targetId) {
      // Store the current chat target for recovery
      console.log('Storing chat parameters:', { targetId, isFriendChat, userId });
      sessionStorage.setItem('currentChatTarget', targetId);
      sessionStorage.setItem('isDirectChat', String(isFriendChat));
      localStorage.setItem('lastChatTarget', targetId);
      
      // Cache messages in sessionStorage to prevent loss on refresh
      if (messages.length > 0) {
        sessionStorage.setItem(`chat_messages_${isFriendChat ? 'dm' : 'group'}_${targetId}`, 
          JSON.stringify(messages));
      }
    }
  }, [userId, targetId, isFriendChat, messages]);

  // Try to load cached messages while waiting for API
  useEffect(() => {
    if (targetId) {
      try {
        const cachedMessages = sessionStorage.getItem(
          `chat_messages_${isFriendChat ? 'dm' : 'group'}_${targetId}`
        );
        if (cachedMessages) {
          const parsedMessages = JSON.parse(cachedMessages);
          if (parsedMessages.length > 0 && messages.length === 0) {
            console.log('Loading cached messages:', parsedMessages.length);
            useChatStore.setState({ messages: parsedMessages });
          }
        }
      } catch (e) {
        console.error('Error loading cached messages:', e);
      }
    }
  }, [targetId, isFriendChat, messages.length]);

  // Initialize socket connection when component mounts
  useEffect(() => {
    console.log('🔌 ChatComponent mounted, connecting to socket...', {
      targetId, 
      isFriendChat,
      userId
    });
    
    // Connect to socket using the correct method name
    connect();
    
    // Set current chat immediately to avoid "no active chat" errors
    if (userId && targetId) {
      console.log('Setting current chat on mount:', {userId, targetId, isFriendChat});
      useChatStore.getState().setCurrentChat(targetId, isFriendChat);
      
      // Delayed check to ensure chat state is properly set
      setTimeout(() => {
        const state = useChatStore.getState();
        console.log('Verifying chat state after mount:', {
          currentChatId: state.currentChatId,
          isFriendChat: state.isFriendChat
        });
        
        // If state wasn't set correctly, force it again
        if (!state.currentChatId) {
          console.warn('Chat state not set correctly, forcing it again');
          useChatStore.getState().setCurrentChat(targetId, isFriendChat);
        }
      }, 1000);
    }
    
    // Clean up on unmount
    return () => {
      console.log('🔌 ChatComponent unmounting, disconnecting socket...');
      disconnect();
    };
  }, [connect, disconnect, userId, targetId, isFriendChat]);
  
  // Join the appropriate chat room when chat type, userId or targetId changes
  useEffect(() => {
    if (!userId || !targetId) {
      console.log('Missing userId or targetId, cannot initialize chat', {userId, targetId});
      return;
    }
    
    setInitializing(true);
    
    console.log('💬 Chat parameters changed, updating chat room', { 
      chatType: isFriendChat ? 'friend' : 'group', 
      userId, 
      targetId
    });
    
    // Explicitly set the current chat again for safety
    useChatStore.getState().setCurrentChat(targetId, isFriendChat);
    
    // Fetch messages based on chat type immediately
    console.log('Fetching initial messages for:', {isFriendChat, targetId, userId});
    
    const fetchMessages = async () => {
      try {
        if (isFriendChat) {
          await fetchDirectChatMessages(targetId);
        } else {
          await fetchGroupChatMessages(targetId);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setInitializing(false);
      }
    };
    
    fetchMessages();
    
    // Join room with a small delay to ensure messages are fetched first
    setTimeout(() => {
      if (isFriendChat) {
        // For direct messages
        console.log('Joining direct chat room for:', targetId);
        // We need to manually construct the room ID for now
        const roomId = `${userId < targetId ? userId : targetId}_${userId < targetId ? targetId : userId}`;
        console.log('Joining room with ID:', roomId);
        useChatStore.getState().joinRoom(roomId);
      } else {
        // For group messages
        console.log('Joining group chat room for:', targetId);
        const roomId = `group_${targetId}`;
        console.log('Joining room with ID:', roomId);
        useChatStore.getState().joinRoom(roomId);
      }
    }, 500);
    
    // Clean up on param change - leave room
    return () => {
      // Leave the previous room when changing chats
      if (isFriendChat) {
        const roomId = `${userId < targetId ? userId : targetId}_${userId < targetId ? targetId : userId}`;
        console.log('Leaving room with ID:', roomId);
        useChatStore.getState().leaveRoom(roomId);
      } else {
        const roomId = `group_${targetId}`;
        console.log('Leaving room with ID:', roomId);
        useChatStore.getState().leaveRoom(roomId);
      }
    };
  }, [isFriendChat, userId, targetId, fetchDirectChatMessages, fetchGroupChatMessages]);

  // Debug when user ID or target ID changes
  useEffect(() => {
    console.log('🎯 Current user ID:', userId);
    console.log('🎯 Target ID:', targetId);
  }, [userId, targetId]);

  // Additional debugging for messages
  useEffect(() => {
    console.log('📨 Messages updated:', messages.map(m => ({
      id: m._id,
      sender: m.sender._id,
      senderName: m.sender.name,
      message: m.message.substring(0, 20) + (m.message.length > 20 ? '...' : ''),
      hasReply: !!m.replyTo,
      timestamp: new Date(m.createdAt).toLocaleTimeString()
    })));
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim() || !userId) return;
    
    console.log('📤 Sending message:', { 
      content: message, 
      chatType: isFriendChat ? 'friend' : 'group', 
      to: targetId,
      from: userId,
      replyingTo: replyingTo?._id
    });
    
    // Make sure current chat is set correctly before sending
    if (!useChatStore.getState().currentChatId) {
      console.log('No active chat found, setting it now');
      useChatStore.getState().setCurrentChat(targetId, isFriendChat);
    }
    
    // Send the message using the store's sendMessage method
    sendMessage(message, [], replyingTo || undefined);
    
    // Clear the input and reply state
    setMessage('');
    setReplyingTo(null);
  };

  const handleReplyToMessage = (msg: ChatMessage) => {
    setReplyingTo(msg);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center shadow-md">
        <h2 className="text-xl font-bold flex items-center">
          {isFriendChat ? (
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center mr-2 text-sm">
              {targetName?.charAt(0)?.toUpperCase()}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center mr-2 text-sm">
              G
            </div>
          )}
          {targetName}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 bg-opacity-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8 p-6 bg-white rounded-lg shadow-sm">
            <div className="text-5xl mb-2">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Check if the sender is the current user
            const isCurrentUser = msg.sender._id === userId || msg.sender._id === useAuthStore.getState().user?._id;
            
            return (
              <div 
                key={msg._id} 
                className="group" // Add group for hover effect
              >
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  {/* Reply button for current user (left side) */}
                  {isCurrentUser && (
                    <div className="self-end mb-2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleReplyToMessage(msg)}
                        className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                        title="Reply to this message"
                      >
                        <FaReply className="text-gray-600 text-sm" />
                      </button>
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {/* If this message is replying to another message, show the reply preview */}
                    {msg.replyTo && (
                      <div 
                        className={`text-xs rounded-lg px-3 py-1.5 mb-1 max-w-[90%] truncate cursor-pointer hover:opacity-90 ${
                          isCurrentUser ? 'bg-blue-400 text-white' : 'bg-gray-300 text-gray-800'
                        }`}
                      >
                        <span className="font-bold">{msg.replyTo.sender.name}: </span>
                        {msg.replyTo.message}
                      </div>
                    )}
                    
                    <div 
                      className={`rounded-lg p-3.5 shadow-sm ${
                    isCurrentUser 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {!isCurrentUser && (
                        <div className="font-medium text-sm mb-1 text-blue-600">{msg.sender.name}</div>
                  )}
                      <div className="whitespace-pre-wrap break-words">{msg.message}</div>
                      <div className="text-xs mt-1.5 opacity-70 flex justify-end">
                    {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    
                    {/* Message timestamp */}
                    <div className="text-xs text-gray-500 mt-1 mx-1">
                      {isCurrentUser ? (
                        <span>You • {format(new Date(msg.createdAt), 'h:mm a')}</span>
                      ) : (
                        <span>{msg.sender.name.split(' ')[0]} • {format(new Date(msg.createdAt), 'h:mm a')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Reply button for others (right side) */}
                  {!isCurrentUser && (
                    <div className="self-end mb-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleReplyToMessage(msg)}
                        className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                        title="Reply to this message"
                      >
                        <FaReply className="text-gray-600 text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Reply preview (if replying to a message) */}
      {replyingTo && (
        <div className="px-4 pt-3 pb-2 bg-gray-100 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1">
            <div className="text-xs text-blue-600 font-medium">Replying to {replyingTo.sender.name}</div>
            <div className="text-sm truncate text-gray-700">{replyingTo.message}</div>
          </div>
          <button 
            onClick={() => setReplyingTo(null)} 
            className="ml-2 p-1.5 hover:bg-gray-200 rounded-full"
            title="Cancel reply"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        className="p-3 bg-white border-t border-gray-200 flex items-center"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={replyingTo ? `Reply to ${replyingTo.sender.name}...` : "Type a message..."}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-r-lg hover:bg-blue-700 transition-colors font-medium"
          disabled={!message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatComponent; 