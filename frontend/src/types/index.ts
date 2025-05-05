export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy: User;
  group?: Group;
  splitEqually: boolean;
  shares: ExpenseShare[];
  category: ExpenseCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseShare {
  id: string;
  user: User;
  amount: number;
  paid: boolean;
}

export type ExpenseCategory = 
  | 'Daily'
  | 'Groceries'
  | 'Entertainment'
  | 'Food'
  | 'Medical'
  | 'Education'
  | 'Transportation'
  | 'Housing'
  | 'Utilities'
  | 'Travel'
  | 'Other';

export interface Message {
  id: string;
  content: string;
  sender: User;
  groupId: string;
  createdAt: string;
}

export interface Balance {
  amount: number;
  currency: string;
}

export interface Activity {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'message';
  description: string;
  date: string;
  amount?: number;
  currency?: string;
  involvedUsers: User[];
  groupId?: string;
  expenseId?: string;
}

export interface Statistics {
  totalExpenses: number;
  totalIncome: number;
  byCategory: Record<ExpenseCategory, number>;
  byWeek: { date: string; amount: number }[];
} 