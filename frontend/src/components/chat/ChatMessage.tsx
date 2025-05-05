'use client';

import { Message, MessageType } from '@/types/chat';
import { formatCurrency } from '@/utils/formatting';
import { formatDistanceToNow } from 'date-fns';
import { MdAttachMoney } from 'react-icons/md';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

export default function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  const formattedTime = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : 'Just now';

  const isExpense = message.type === MessageType.EXPENSE;

  return (
    <div
      className={`mb-4 flex ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isCurrentUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-white border rounded-bl-none'
        } ${isExpense ? 'w-64' : ''}`}
      >
        {isExpense ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Expense</span>
              <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                <MdAttachMoney className="text-green-600" />
              </div>
            </div>
            <div className="font-bold text-lg">
              {formatCurrency(message.expenseAmount || 0)}
            </div>
            <div>{message.content}</div>
            <div
              className={`text-xs ${
                isCurrentUser ? 'text-blue-200' : 'text-gray-500'
              }`}
            >
              {formattedTime}
            </div>
          </div>
        ) : (
          <div>
            <div>{message.content}</div>
            <div
              className={`text-xs mt-1 ${
                isCurrentUser ? 'text-blue-200' : 'text-gray-500'
              }`}
            >
              {formattedTime}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 