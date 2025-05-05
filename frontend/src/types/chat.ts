export enum MessageType {
  TEXT = 'TEXT',
  EXPENSE = 'EXPENSE'
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
  type: MessageType;
  expenseAmount?: number;
  expenseId?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: {
    id: string;
    name: string;
  }[];
  lastMessage?: Message;
  isGroup: boolean;
  unreadCount?: number;
} 