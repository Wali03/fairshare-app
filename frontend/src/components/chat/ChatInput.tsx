'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MdSend, MdAttachMoney } from 'react-icons/md';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onAddExpense: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSendMessage,
  onAddExpense,
  disabled = false
}: ChatInputProps) {
  const [messageText, setMessageText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t bg-white">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onAddExpense}
          disabled={disabled}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Add expense"
        >
          <MdAttachMoney className="h-5 w-5" />
        </Button>
        
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1"
          disabled={disabled}
        />
        
        <Button
          type="submit"
          size="icon"
          disabled={!messageText.trim() || disabled}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <MdSend className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
} 