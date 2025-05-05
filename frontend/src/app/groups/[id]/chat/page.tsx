'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import ChatContainer from '@/components/chat/ChatContainer';
import { Message, MessageType } from '@/types/chat';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function GroupChatPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<{ id: string, name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Simulating loading group data
  useEffect(() => {
    // In a real app, we would fetch the group data and messages from API
    const mockGroup = {
      id: groupId,
      name: 'Roommates',
    };

    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'user1',
        senderName: 'Michael',
        content: 'Hey everyone! Let\'s discuss the utility bills.',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        type: MessageType.TEXT,
      },
      {
        id: '2',
        senderId: 'current-user',
        content: 'Sure, I can pay the electricity bill this month.',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        type: MessageType.TEXT,
      },
      {
        id: '3',
        senderId: 'user2',
        senderName: 'Jessica',
        content: 'I\'ll cover the internet bill then.',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        type: MessageType.TEXT,
      },
      {
        id: '4',
        senderId: 'current-user',
        content: 'Electricity bill for this month',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        type: MessageType.EXPENSE,
        expenseAmount: 85.50,
        expenseId: 'exp456',
      },
      {
        id: '5',
        senderId: 'user1',
        senderName: 'Michael',
        content: 'Thanks for taking care of that!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: MessageType.TEXT,
      },
    ];

    setGroup(mockGroup);
    setMessages(mockMessages);
    setLoading(false);
  }, [groupId]);

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

  if (!group) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-500">Group not found</p>
          <Link href="/groups" className="mt-4 text-primary hover:underline">
            Back to Groups
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-4">
          <Link href={`/groups/${groupId}`} className="text-gray-500 hover:text-gray-700 mr-2">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">{group.name} Chat</h1>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden bg-white">
          <ChatContainer
            messages={messages}
            currentUserId="current-user"
            recipientName={group.name}
            recipientId={group.id}
            isGroup={true}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </AppLayout>
  );
} 