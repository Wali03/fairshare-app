import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import api from '../api';

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  message: string;
  attachments?: string[];
  readBy: string[];
  receiver?: string;
  group?: string | { _id: string; name: string };
  createdAt: string;
  replyTo?: {
    _id: string;
    message: string;
    sender: {
      _id: string;
      name: string;
    };
  };
  room?: string;
  isSentByMe?: boolean;
}

interface ChatState {
  socket: Socket | null;
  messages: ChatMessage[];
  currentChatId: string | null;
  isFriendChat: boolean;
  isGroupChat: boolean;
  isLoading: boolean;
  error: string | null;
  replyingTo: ChatMessage | null;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  fetchDirectChatMessages: (friendId: string) => Promise<void>;
  fetchGroupChatMessages: (groupId: string) => Promise<void>;
  sendMessage: (message: string, attachments?: string[], replyToMessage?: ChatMessage) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  setCurrentChat: (id: string, isFriend: boolean) => void;
  setReplyingTo: (message: ChatMessage | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  messages: [],
  currentChatId: null,
  isFriendChat: false,
  isGroupChat: false,
  isLoading: false,
  error: null,
  replyingTo: null,

  connect: () => {
    // First disconnect existing socket if any
    const currentSocket = get().socket;
    if (currentSocket) {
      console.log('Disconnecting existing socket before reconnecting');
      currentSocket.disconnect();
    }
    
    console.log('Connecting to socket server...');
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected with ID:', socket.id || '');
      
      // Store the socket ID in localStorage for debugging
      if (socket.id) {
        localStorage.setItem('socketId', socket.id);
      }
      
      // Get user info and send it to the server
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser.id || currentUser._id;
        const userName = currentUser.name;
        
        if (userId) {
          console.log('Setting user info on socket:', { userId, userName });
          socket.emit('set_user', { userId, userName });
        }
        
        console.log('Connected as user:', { 
          id: userId,
          name: userName,
          socketId: socket.id
        });
      } catch (e) {
        console.error('Error getting user info from localStorage:', e);
      }
      
      // When reconnecting, automatically rejoin the current chat room
      const { currentChatId, isFriendChat } = get();
      if (currentChatId) {
        console.log('Automatically rejoining chat room after connection');
        // We need to rejoin the appropriate room
        setTimeout(() => {
          try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = currentUser.id || currentUser._id;
            
            if (isFriendChat && userId) {
              // For direct messages, we need to get the room ID based on user IDs
              // Create the room ID directly - sort user IDs to ensure consistency
              const roomId = userId < currentChatId 
                ? `${userId}_${currentChatId}` 
                : `${currentChatId}_${userId}`;
              console.log(`Rejoining direct chat room: ${roomId}`);
              socket.emit('join_room', roomId);
            } else if (!isFriendChat) {
              // For group messages, we can generate the room ID directly
              const roomId = `group_${currentChatId}`;
              console.log(`Rejoining group chat room: ${roomId}`);
              socket.emit('join_room', roomId);
            }
          } catch (e) {
            console.error('Error rejoining room:', e);
          }
        }, 200); // Reduced delay to ensure faster rejoining
      }
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
      
      // Try reconnecting after a timeout
      setTimeout(() => {
        console.log('Attempting to reconnect socket...');
        socket.connect();
      }, 3000);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected, reason:', reason);
      
      // If the server disconnected us, try to reconnect
      if (reason === 'io server disconnect') {
        console.log('Server disconnected us, attempting to reconnect...');
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      
      // Rejoin rooms after reconnecting
      const { currentChatId, isFriendChat } = get();
      if (currentChatId) {
        console.log('Rejoining room after reconnection');
        // Rejoin with a small delay to ensure connection is stable
        setTimeout(() => {
          if (isFriendChat) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = currentUser.id || currentUser._id;
            const roomId = `${userId < currentChatId ? userId : currentChatId}_${userId < currentChatId ? currentChatId : userId}`;
            console.log(`Rejoining direct room: ${roomId}`);
            socket.emit('join_room', roomId);
          } else {
            const roomId = `group_${currentChatId}`;
            console.log(`Rejoining group room: ${roomId}`);
            socket.emit('join_room', roomId);
          }
        }, 500);
      }
    });

    socket.on('reconnect_error', (error) => {
      console.error('🔴 Socket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('🔴 Socket reconnection failed after multiple attempts');
      // Try to create a new socket connection
      setTimeout(() => {
        console.log('Creating new socket connection after failed reconnection');
        get().connect();
      }, 5000);
    });

    socket.on('receive_message', (message: ChatMessage) => {
      // Add new message to the state if it belongs to the current chat
      const { currentChatId, isFriendChat, messages } = get();
      console.log('⚡️ Received message via socket:', {
        messageId: message._id,
        from: message.sender?.name || 'Unknown',
        content: message.message?.substring(0, 30) + (message.message?.length > 30 ? '...' : ''),
        receiver: message.receiver || 'None', 
        group: typeof message.group === 'object' ? message.group._id : message.group || 'None'
      });
      
      // Get current user to check if message is from self
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.id || currentUser._id;
      const isSentByMe = message.sender?._id === userId;
      
      // Set flag to track sender
      if (isSentByMe) {
        message.isSentByMe = true;
      }
      
      // For direct messages, check if this message belongs to our current chat
      // We need to check both directions for direct messages
      const isDirectMessageForCurrentChat = isFriendChat && (
        // This message is from the friend we're chatting with
        (message.sender && message.sender._id === currentChatId) || 
        // This message is to the friend we're chatting with
        (message.receiver === currentChatId)
      );
      
      // For group messages, check if this message belongs to our current group
      const isGroupMessageForCurrentChat = !isFriendChat && 
        (typeof message.group === 'object' 
          ? message.group._id === currentChatId
          : message.group === currentChatId);
      
      // Only add the message if it belongs to the current chat
      if (isDirectMessageForCurrentChat || isGroupMessageForCurrentChat) {
        console.log('✅ Message belongs to current chat, checking for duplicates...');
        
        // More robust duplicate detection - check by ID and also recent messages by content
        const isDuplicate = messages.some(msg => {
          // Check for exact ID match
          if (msg._id === message._id) return true;
          
          // Check for temporary ID with same content (same sender, similar timestamp, same message)
          if (msg._id.startsWith('temp-') && 
              msg.sender?._id === message.sender?._id &&
              msg.message === message.message) {
            // Compare timestamps within 5 seconds to handle recent messages
            const msgTime = new Date(msg.createdAt).getTime();
            const newMsgTime = new Date(message.createdAt).getTime();
            return Math.abs(msgTime - newMsgTime) < 5000; // Within 5 seconds
          }
          
          return false;
        });
        
        if (!isDuplicate) {
          console.log('✅ Adding new message to state', {
            id: message._id,
            content: message.message,
            sender: message.sender?.name || 'unknown'
          });
          
          set(() => ({ 
            messages: [...messages, message] 
          }));
          
          // Also save to sessionStorage for persistence
          const chatKey = `chat_messages_${isFriendChat ? 'dm' : 'group'}_${currentChatId}`;
          try {
            const updatedMessages = [...messages, message];
            sessionStorage.setItem(chatKey, JSON.stringify(updatedMessages));
          } catch (e) {
            console.error('Failed to save message to sessionStorage:', e);
          }
        } else {
          console.log('❌ Ignoring duplicate message', message._id);
        }
      } else {
        console.log('❌ Message not for current chat', {
          messageDetails: {
            sender: message.sender?._id,
            receiver: message.receiver,
            group: message.group
          },
          currentChat: {
            id: currentChatId,
            isFriend: isFriendChat
          }
        });
      }
    });

    socket.on('user_joined', (data) => {
      console.log('👋 User joined room:', data);
    });

    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });

    set({ socket });
    return socket; // Return the socket to allow error handling
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      console.log('Manually disconnecting socket');
      
      // Leave any rooms before disconnecting
      const { currentChatId, isFriendChat } = get();
      if (currentChatId) {
        try {
          if (isFriendChat) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = currentUser.id || currentUser._id;
            const roomId = `${userId < currentChatId ? userId : currentChatId}_${userId < currentChatId ? currentChatId : userId}`;
            console.log(`Leaving room before disconnect: ${roomId}`);
            socket.emit('leave_room', roomId);
          } else {
            const roomId = `group_${currentChatId}`;
            console.log(`Leaving room before disconnect: ${roomId}`);
            socket.emit('leave_room', roomId);
          }
        } catch (e) {
          console.error('Error leaving room before disconnect:', e);
        }
      }
      
      socket.disconnect();
      set({ socket: null });
    }
  },

  joinRoom: (roomId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      console.log(`Joining room: ${roomId}`);
      socket.emit('join_room', roomId);
    } else if (socket) {
      console.warn('Socket exists but not connected, attempting to reconnect');
      // Try reconnecting
      socket.connect();
      
      // Attempt to join after a delay
      setTimeout(() => {
        if (socket.connected) {
          console.log(`Joining room after reconnect: ${roomId}`);
          socket.emit('join_room', roomId);
        } else {
          console.error('Failed to reconnect socket for joining room');
        }
      }, 1000);
    } else {
      console.error('Cannot join room - socket not connected');
      // Create a new socket and let connect handle rejoining
      get().connect();
    }
  },

  leaveRoom: (roomId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_room', roomId);
    }
  },

  fetchDirectChatMessages: async (friendId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/chat/user/${friendId}`);
      
      // Check if we received messages before overwriting
      if (response.data.messages && response.data.messages.length > 0) {
        console.log(`Fetched ${response.data.messages.length} direct messages from API`);
        set({ 
          messages: response.data.messages, 
          isLoading: false,
          currentChatId: friendId,
          isFriendChat: true,
          isGroupChat: false
        });
      } else {
        console.log('No messages returned from API for direct chat');
        
        // Only clear messages if we don't already have some cached
        const { messages } = get();
        if (messages.length === 0) {
          set({ 
            messages: [], 
            isLoading: false,
            currentChatId: friendId,
            isFriendChat: true,
            isGroupChat: false
          });
        } else {
          // Just update the chat state but keep existing messages
          set({
            isLoading: false,
            currentChatId: friendId,
            isFriendChat: true,
            isGroupChat: false
          });
        }
      }
      
      // Get room ID and join it
      try {
        const roomResponse = await api.get(`/chat/room/direct/${friendId}`);
        if (roomResponse.data && roomResponse.data.roomId) {
          get().joinRoom(roomResponse.data.roomId);
        } else {
          // Fallback: manually construct room ID if API fails
          console.log('API did not return a room ID, creating one manually');
          // Get user info
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = currentUser.id || currentUser._id;
          if (userId) {
            // Create room ID by sorting the IDs
            const roomId = userId < friendId 
              ? `${userId}_${friendId}` 
              : `${friendId}_${userId}`;
            get().joinRoom(roomId);
          }
        }
      } catch (error) {
        console.error('Failed to get room ID, using fallback:', error);
        // Fallback: manually construct room ID
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser.id || currentUser._id;
        if (userId) {
          const roomId = userId < friendId 
            ? `${userId}_${friendId}` 
            : `${friendId}_${userId}`;
          get().joinRoom(roomId);
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching direct chat messages:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chat messages'
      });
    }
  },

  fetchGroupChatMessages: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/chat/group/${groupId}`);

      // Check if we received messages before overwriting
      if (response.data.messages && response.data.messages.length > 0) {
        console.log(`Fetched ${response.data.messages.length} group messages from API`);
        set({ 
          messages: response.data.messages, 
          isLoading: false,
          currentChatId: groupId,
          isFriendChat: false,
          isGroupChat: true
        });
      } else {
        console.log('No messages returned from API for group chat');
        
        // Only clear messages if we don't already have some cached
        const { messages } = get();
        if (messages.length === 0) {
          set({ 
            messages: [], 
            isLoading: false,
            currentChatId: groupId,
            isFriendChat: false,
            isGroupChat: true
          });
        } else {
          // Just update the chat state but keep existing messages
          set({
            isLoading: false,
            currentChatId: groupId,
            isFriendChat: false,
            isGroupChat: true
          });
        }
      }
      
      // Generate a room ID for the group chat and join it
      const roomId = `group_${groupId}`;
      console.log(`Joining group chat room: ${roomId}`);
      get().joinRoom(roomId);

    } catch (error: unknown) {
      console.error('Error fetching group chat:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch group chat messages',
        messages: []
      });
    }
  },

  sendMessage: async (message, attachments = [], replyToMessage) => {
    const { currentChatId, isFriendChat, socket } = get();
    
    // Additional debug logs
    console.log('Sending message with state:', {
      currentChatId,
      isFriendChat,
      socketConnected: !!socket?.connected,
      messageText: message.substring(0, 30) + (message.length > 30 ? '...' : '')
    });
    
    // If no chat ID is set but we're clearly trying to send a message,
    // we should check for user information and try to determine the chat
    if (!currentChatId) {
      console.error('No active chat selected, trying to recover...');
      
      // Get active user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.id || currentUser._id;
      
      // Look for a target chat ID in localStorage or sessionStorage
      const targetId = sessionStorage.getItem('currentChatTarget') || localStorage.getItem('lastChatTarget');
      
      if (targetId && userId) {
        // Set the current chat
        const isDirectChat = sessionStorage.getItem('isDirectChat') === 'true';
        console.log('Recovered chat target:', { targetId, isDirectChat });
        set({ 
          currentChatId: targetId, 
          isFriendChat: isDirectChat,
          isGroupChat: !isDirectChat
        });
        return get().sendMessage(message, attachments, replyToMessage);
      } else {
        set({ error: 'No active chat selected and recovery failed' });
        return Promise.reject(new Error('No active chat selected'));
      }
    }

    try {
      // Optimistically add message to UI before server response
      const tempId = `temp-${Date.now()}`;
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.id || currentUser._id;
      
      // Create a temporary message object to display immediately
      const tempMessage: ChatMessage = {
        _id: tempId,
        sender: {
          _id: userId,
          name: currentUser.name,
          email: currentUser.email,
          profilePicture: currentUser.profilePicture
        },
        message,
        readBy: [userId],
        createdAt: new Date().toISOString(),
        isSentByMe: true // Mark as sent by current user
      };
      
      // Add reply information if replying to a message
      if (replyToMessage) {
        tempMessage.replyTo = {
          _id: replyToMessage._id,
          message: replyToMessage.message,
          sender: {
            _id: replyToMessage.sender._id,
            name: replyToMessage.sender.name
          }
        };
      }
      
      // Set the correct receiver or group property
      if (isFriendChat) {
        tempMessage.receiver = currentChatId;
      } else {
        tempMessage.group = currentChatId;
      }
      
      // Determine the room ID for this message
      let room = '';
      if (isFriendChat) {
        // For direct messages, create the room ID from sorted user IDs
        room = userId < currentChatId 
          ? `${userId}_${currentChatId}` 
          : `${currentChatId}_${userId}`;
      } else {
        // For group messages, use the group ID
        room = `group_${currentChatId}`;
      }
      
      // Add the room to the message
      tempMessage.room = room;
      
      // Store the current chat target for recovery if needed
      sessionStorage.setItem('currentChatTarget', currentChatId);
      sessionStorage.setItem('isDirectChat', String(isFriendChat));
      localStorage.setItem('lastChatTarget', currentChatId);
      
      // Update the messages array immediately
      const updatedMessages = [...get().messages, tempMessage];
      set({ messages: updatedMessages });
      
      // Save to session storage
      const chatKey = `chat_messages_${isFriendChat ? 'dm' : 'group'}_${currentChatId}`;
      try {
        sessionStorage.setItem(chatKey, JSON.stringify(updatedMessages));
      } catch (e) {
        console.error('Failed to save message to sessionStorage:', e);
      }

      // Then send to the server
      let response;
      if (isFriendChat) {
        // Send direct message
        response = await api.post('/chat/direct', {
          receiverId: currentChatId,
          message,
          attachments,
          replyToId: replyToMessage?._id
        });
      } else {
        // Send group message
        response = await api.post('/chat/group', {
          groupId: currentChatId,
          message,
          attachments,
          replyToId: replyToMessage?._id
        });
      }
      
      // If we got back the real message, replace our temp message
      if (response.data && response.data.chat) {
        // Add the room and isSentByMe flag to the server response message
        response.data.chat.room = room;
        response.data.chat.isSentByMe = true;
        
        // If socket is connected, emit the message via socket too for real-time updates
        // But set a flag so we know not to add this message again when it comes back via socket
        if (socket && socket.connected) {
          console.log('Emitting message via socket:', {
            id: response.data.chat._id,
            room,
            message: response.data.chat.message.substring(0, 30) + (response.data.chat.message.length > 30 ? '...' : '')
          });
          
          // Instead of emitting and potentially getting our own message back,
          // just let the server handle broadcasting to other clients
          socket.emit('send_message', {
            ...response.data.chat,
            fromSelf: true // Add flag to identify source
          });
        } else {
          console.warn('Socket not connected, message sent via API only');
        }
        
        // Replace the temp message with the real one
        set({ 
          messages: get().messages.map(msg => 
            msg._id === tempId ? response.data.chat : msg
          ),
          replyingTo: null // Clear reply state after sending
        });
        
        // Update in session storage
        try {
          const currentMessages = get().messages;
          sessionStorage.setItem(chatKey, JSON.stringify(currentMessages));
        } catch (e) {
          console.error('Failed to update message in sessionStorage:', e);
        }
      }
      
      return response;
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
      throw error;
    }
  },

  markMessageAsRead: async (messageId) => {
    try {
      await api.patch(`/chat/read/${messageId}`);
      // Update the message in the local state
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, read: true } 
          : msg
      );
      set({ messages: updatedMessages });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark message as read'
      });
    }
  },

  setCurrentChat: (id, isFriend) => {
    set({ 
      currentChatId: id, 
      isFriendChat: isFriend,
      isGroupChat: !isFriend
    });
  },

  setReplyingTo: (message) => {
    set({ replyingTo: message });
  },

  clearChat: () => {
    const { currentChatId, isFriendChat } = get();
    
    // Leave the current room if there is one
    if (currentChatId) {
      if (isFriendChat) {
        api.get(`/chat/room/direct/${currentChatId}`)
          .then(res => get().leaveRoom(res.data.roomId))
          .catch(console.error);
      } else {
        api.get(`/chat/room/group/${currentChatId}`)
          .then(res => get().leaveRoom(res.data.roomId))
          .catch(console.error);
      }
    }
    
    set({ 
      messages: [],
      currentChatId: null,
      isFriendChat: false,
      isGroupChat: false,
      replyingTo: null
    });
  }
})); 