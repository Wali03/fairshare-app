'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ExpenseFormModal }from '../expenses/ExpenseFormModal';
import { Message } from '@/types/chat';

interface ChatInterfaceProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
  onAddExpense?: (data: { amount: number; description: string }) => void;
  isGroupChat?: boolean;
  contactId?: string;
  groupId?: string;
}

export default function ChatInterface({
  messages,
  currentUserId,
  onSendMessage,
  onAddExpense,
  isGroupChat = false,
  contactId,
  groupId
}: ChatInterfaceProps) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAddExpense = (data: { amount: number; description: string }) => {
    if (onAddExpense) {
      onAddExpense(data);
      setShowExpenseForm(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header can be added here */}
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUserId}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <ChatInput
        onSendMessage={onSendMessage}
        onAddExpense={onAddExpense ? () => setShowExpenseForm(true) : undefined}
      />
      
      {/* Expense form modal */}
      {showExpenseForm && onAddExpense && (
        <ExpenseFormModal
          isOpen={showExpenseForm}
          onClose={() => setShowExpenseForm(false)}
          onSubmit={handleAddExpense}
          contactId={contactId}
          groupId={groupId}
        />
      )}
    </div>
  );
} 