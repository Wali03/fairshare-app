import api from '../api';

export interface BalanceData {
  lent: number;
  owed: number;
  netBalance: number;
}

export interface MonthSummary {
  currentMonth: {
    total: number;
    month: string;
  };
  lastMonth: {
    total: number;
    month: string;
  };
  percentageChange: number;
}

export interface ChartDataPoint {
  date: string;
  displayDate: string;
  day: string;
  value: number;
}

export interface Transaction {
  _id: string;
  description: string;
  amount: number;
  isPositive: boolean;
  date: string;
  formattedDate: string;
  category: string;
  paidBy: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  isPayer: boolean;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  color: string;
}

export const dashboardService = {
  // Get user balance
  getUserBalance: async (): Promise<BalanceData> => {
    const response = await api.get('/dashboard/user/balance');
    return response.data.data;
  },

  // Get expenses summary
  getExpensesSummary: async (): Promise<MonthSummary> => {
    const response = await api.get('/dashboard/expenses/summary');
    return response.data.data;
  },

  // Get income summary
  getIncomeSummary: async (): Promise<MonthSummary> => {
    const response = await api.get('/dashboard/income/summary');
    return response.data.data;
  },

  // Get chart data
  getExpensesChartData: async (): Promise<ChartDataPoint[]> => {
    const response = await api.get('/dashboard/expenses/chart');
    return response.data.data;
  },

  // Get recent transactions
  getRecentTransactions: async (limit: number = 5): Promise<Transaction[]> => {
    const response = await api.get(`/dashboard/transactions/recent?limit=${limit}`);
    return response.data.data;
  },

  // Get expenses by category
  getExpensesByCategory: async (): Promise<CategoryExpense[]> => {
    const response = await api.get('/dashboard/expenses/by-category');
    return response.data.data;
  },
}; 