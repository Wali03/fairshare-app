'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import ChatContainer from '@/components/chat/ChatContainer';
import { Message, MessageType } from '@/types/chat';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function FriendChatPage() {
  const params = useParams();
  const friendId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [friend, setFriend] = useState<{ id: string, name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Simulating loading friend data
  useEffect(() => {
    // In a real app, we would fetch the friend data and messages from API
    const mockFriend = {
      id: friendId,
      name: 'Sarah Johnson',
    };

    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'current-user',
        content: 'Hey Sarah! How are you?',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        type: MessageType.TEXT,
      },
      {
        id: '2',
        senderId: friendId,
        content: 'I\'m good, thanks! What about you?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: MessageType.TEXT,
      },
      {
        id: '3',
        senderId: 'current-user',
        content: 'About the dinner last night',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: MessageType.EXPENSE,
        expenseAmount: 45.80,
        expenseId: 'exp123',
      },
      {
        id: '4',
        senderId: friendId,
        content: 'Thanks for adding that! I\'ll pay you back soon.',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        type: MessageType.TEXT,
      },
    ];

    setFriend(mockFriend);
    setMessages(mockMessages);
    setLoading(false);
  }, [friendId]);

  const handleSendMessage = (content: string, type: MessageType) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'current-user',
      content,
      timestamp: new Date().toISOString(),
      type,
    };

    setMessages(prev => [...prev, newMessage]);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!friend) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-500">Friend not found</p>
          <Link href="/friends" className="mt-4 text-primary hover:underline">
            Back to Friends
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-4">
          <Link href={`/friends/${friendId}`} className="text-gray-500 hover:text-gray-700 mr-2">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Chat with {friend.name}</h1>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden bg-white">
          <ChatContainer
            messages={messages}
            currentUserId="current-user"
            recipientName={friend.name}
            recipientId={friend.id}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </AppLayout>
  );
} 