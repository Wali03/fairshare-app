'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Message, MessageType } from '@/types/chat';
import { useRouter } from 'next/navigation';

interface ChatContainerProps {
  messages: Message[];
  currentUserId: string;
  recipientName: string;
  recipientId: string | number;
  isGroup?: boolean;
  onSendMessage: (content: string, type: MessageType) => void;
}

export default function ChatContainer({
  messages,
  currentUserId,
  recipientName,
  recipientId,
  isGroup = false,
  onSendMessage,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    onSendMessage(content, MessageType.TEXT);
  };

  const handleAddExpense = () => {
    // Navigate to add expense page with pre-filled recipient
    if (isGroup) {
      router.push(`/groups/${recipientId}/expenses/new`);
    } else {
      router.push(`/friends/${recipientId}/expenses/new`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-white">
        <h2 className="font-semibold text-lg">{recipientName}</h2>
        <p className="text-sm text-gray-500">
          {isGroup ? 'Group' : 'Friend'}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start chatting</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
} 