const User = require("../models/User");
const Group = require("../models/Group");
const Expense = require("../models/Expense");
const { StatusCodes } = require("http-status-codes");
const { startOfMonth, endOfMonth, subMonths, format } = require('date-fns');
const mongoose = require('mongoose');

// Get user's net balance
exports.getUserBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all expenses where the user is involved
    const userExpenses = await Expense.find({
      $or: [
        { "paidBy.userId": new mongoose.Types.ObjectId(userId) },
        { "paidFor.person": new mongoose.Types.ObjectId(userId) }
      ]
    }).populate('paidBy.userId', 'name email');

    let totalLent = 0;
    let totalOwed = 0;

    // Calculate total lent and owed
    userExpenses.forEach(expense => {
      // Check if user is a payer
      const userPayment = expense.paidBy.find(payer => 
        payer.userId && payer.userId._id && payer.userId._id.toString() === userId
      );
      
      const isPayer = !!userPayment;
      
      if (isPayer) {
        // User paid for the expense, calculate how much others owe them
        const amountPaid = userPayment ? userPayment.amountPaid : 0;
        let userOwes = 0;
        
        // Find what user owes themselves
        const userDebt = expense.paidFor.find(item => 
          item.person && item.person.toString() === userId
        );
        
        if (userDebt) {
          userOwes = userDebt.amountOwed;
        }
        
        // Total lent is what they paid minus what they owe themselves
        totalLent += (amountPaid - userOwes);
      } else {
        // User didn't pay, find their debt
        const userDebt = expense.paidFor.find(item => 
          item.person && item.person.toString() === userId
        );
        
        if (userDebt) {
          totalOwed += userDebt.amountOwed;
        }
      }
    });

    const netBalance = totalLent - totalOwed;

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        lent: totalLent,
        owed: totalOwed,
        netBalance
      }
    });
  } catch (error) {
    console.error("Error in getUserBalance:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve user balance"
    });
  }
};

// Get expenses summary for current and last month
exports.getExpensesSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Define current month range
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Define last month range
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Get current month expenses
    const currentMonthExpenses = await Expense.find({
      $or: [
        { "paidBy.userId": new mongoose.Types.ObjectId(userId) },
        { "paidFor.person": new mongoose.Types.ObjectId(userId) }
      ],
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    // Get last month expenses
    const lastMonthExpenses = await Expense.find({
      $or: [
        { "paidBy.userId": new mongoose.Types.ObjectId(userId) },
        { "paidFor.person": new mongoose.Types.ObjectId(userId) }
      ],
      date: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Calculate total expenses for current month
    let currentMonthTotal = 0;
    currentMonthExpenses.forEach(expense => {
      // Check if user is a payer
      const userPayment = expense.paidBy.find(payer => 
        payer.userId && payer.userId.toString() === userId
      );
      
      // Find the user's portion of this expense
      const userPaidFor = expense.paidFor.find(item => 
        item.person && item.person.toString() === userId
      );
      
      if (userPaidFor) {
        currentMonthTotal += userPaidFor.amountOwed;
      }
    });

    // Calculate total expenses for last month
    let lastMonthTotal = 0;
    lastMonthExpenses.forEach(expense => {
      // Find the user's portion of this expense
      const userPaidFor = expense.paidFor.find(item => 
        item.person && item.person.toString() === userId
      );
      
      if (userPaidFor) {
        lastMonthTotal += userPaidFor.amountOwed;
      }
    });

    // Calculate month-over-month percentage change
    let percentageChange = 0;
    if (lastMonthTotal > 0) {
      percentageChange = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        currentMonth: {
          total: currentMonthTotal,
          month: format(now, 'MMMM')
        },
        lastMonth: {
          total: lastMonthTotal,
          month: format(subMonths(now, 1), 'MMMM')
        },
        percentageChange
      }
    });
  } catch (error) {
    console.error("Error in getExpensesSummary:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve expenses summary"
    });
  }
};

// Get income summary for current and last month (estimated from income-type expenses)
exports.getIncomeSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Define current month range
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Define last month range
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // First, find the Income category ObjectId
    const incomeCategory = await mongoose.model("Category").findOne({ name: "Income" });
    
    if (!incomeCategory) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          currentMonth: { total: 0, month: format(now, 'MMMM') },
          lastMonth: { total: 0, month: format(subMonths(now, 1), 'MMMM') },
          percentageChange: 0
        }
      });
    }

    // Get current month income (expenses with category "Income")
    const currentMonthIncome = await Expense.find({
      paidBy: { $elemMatch: { userId: new mongoose.Types.ObjectId(userId) } },
      category: { $elemMatch: { $eq: incomeCategory._id } },
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    // Get last month income
    const lastMonthIncome = await Expense.find({
      paidBy: { $elemMatch: { userId: new mongoose.Types.ObjectId(userId) } },
      category: { $elemMatch: { $eq: incomeCategory._id } },
      date: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Calculate totals
    const currentMonthTotal = currentMonthIncome.reduce((sum, income) => sum + income.amount, 0);
    const lastMonthTotal = lastMonthIncome.reduce((sum, income) => sum + income.amount, 0);

    // Calculate month-over-month percentage change
    let percentageChange = 0;
    if (lastMonthTotal > 0) {
      percentageChange = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        currentMonth: {
          total: currentMonthTotal,
          month: format(now, 'MMMM')
        },
        lastMonth: {
          total: lastMonthTotal,
          month: format(subMonths(now, 1), 'MMMM')
        },
        percentageChange
      }
    });
  } catch (error) {
    console.error("Error in getIncomeSummary:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve income summary"
    });
  }
};

// Get expenses chart data for daily view
exports.getExpensesChartData = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const daysToShow = 14; // Show data for last 14 days
    
    // Create an array of dates for the last 14 days
    const dates = Array.from({ length: daysToShow }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysToShow - 1 - i));
      return {
        date: format(date, 'yyyy-MM-dd'),
        displayDate: format(date, 'EEE, d'),
        day: format(date, 'EEE'),
        value: 0
      };
    });

    // Get expenses for the last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - daysToShow);
    
    const expenses = await Expense.find({
      $or: [
        { "paidBy.userId": new mongoose.Types.ObjectId(userId) },
        { "paidFor.person": new mongoose.Types.ObjectId(userId) }
      ],
      date: { $gte: twoWeeksAgo }
    });

    // Calculate daily expenses
    expenses.forEach(expense => {
      let userAmount = 0;
      // Find the user's share of this expense
      const userPaidFor = expense.paidFor.find(item => 
        item.person && item.person.toString() === userId
      );
      
      if (userPaidFor) {
        userAmount = userPaidFor.amountOwed;
      }
      
      // Add to the appropriate day
      const expenseDate = format(new Date(expense.date), 'yyyy-MM-dd');
      const dayIndex = dates.findIndex(d => d.date === expenseDate);
      if (dayIndex !== -1) {
        dates[dayIndex].value += userAmount;
      }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: dates
    });
  } catch (error) {
    console.error("Error in getExpensesChartData:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve expenses chart data"
    });
  }
};

// Get recent transactions
exports.getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    
    // Get recent expenses
    const recentExpenses = await Expense.find({
      $or: [
        { "paidBy.userId": new mongoose.Types.ObjectId(userId) },
        { "paidFor.person": new mongoose.Types.ObjectId(userId) }
      ]
    })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .populate('paidBy.userId', 'name email profilePicture')
    .populate('category');

    // Format transactions for the frontend
    const transactions = recentExpenses.map(expense => {
      // Check if user is a payer
      const userPayment = expense.paidBy.find(payer => 
        payer.userId && payer.userId._id && payer.userId._id.toString() === userId
      );
      
      const isPayer = !!userPayment;
      let amount = 0;
      
      // Calculate the amount relevant to the user
      if (isPayer) {
        // If user paid, show amount they paid minus their own share
        const amountPaid = userPayment ? userPayment.amountPaid : 0;
        
        // Find what user owes themselves
        const userOwes = expense.paidFor.find(item => 
          item.person && item.person.toString() === userId
        );
        
        const userAmount = userOwes ? userOwes.amountOwed : 0;
        amount = amountPaid - userAmount;
      } else {
        // If user didn't pay, show their share as a negative number
        const userOwes = expense.paidFor.find(item => 
          item.person && item.person.toString() === userId
        );
        
        amount = userOwes ? -userOwes.amountOwed : 0;
      }

      return {
        _id: expense._id,
        description: expense.description,
        amount: amount,
        isPositive: amount >= 0,
        date: expense.date,
        formattedDate: format(new Date(expense.date), 'dd MMMM yyyy'),
        category: expense.category && expense.category.length > 0 ? 
          expense.category[0].name : 'Uncategorized',
        paidBy: userPayment ? userPayment.userId : (expense.paidBy.length > 0 ? expense.paidBy[0].userId : null),
        isPayer
      };
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error("Error in getRecentTransactions:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve recent transactions"
    });
  }
};

// Get expenses by category
exports.getExpensesByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Define current month range
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Get expenses for current month
    const expenses = await Expense.find({
      $or: [
        { "paidBy.userId": new mongoose.Types.ObjectId(userId) },
        { "paidFor.person": new mongoose.Types.ObjectId(userId) }
      ],
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    }).populate('category');

    // Group expenses by category
    const categoriesMap = new Map();
    
    expenses.forEach(expense => {
      // Get user's portion of this expense
      let userAmount = 0;
      
      // Find the user's portion
      const userPaidFor = expense.paidFor.find(item => 
        item.person && item.person.toString() === userId
      );
      
      if (userPaidFor) {
        userAmount = userPaidFor.amountOwed;
      }
      
      // Skip if user has no portion in this expense
      if (userAmount <= 0) return;
      
      // Get category name
      let categoryName = 'Uncategorized';
      if (expense.category && expense.category.length > 0 && expense.category[0]) {
        categoryName = expense.category[0].name;
      }
      
      // Update category sum
      if (categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, categoriesMap.get(categoryName) + userAmount);
      } else {
        categoriesMap.set(categoryName, userAmount);
      }
    });
    
    // Convert map to array of objects with category and amount
    const categories = Array.from(categoriesMap, ([category, amount]) => ({
      category,
      amount,
      // Add colors for pie chart (these can be adjusted or made dynamic)
      color: getCategoryColor(category)
    }));
    
    // Sort by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error("Error in getExpensesByCategory:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve expenses by category"
    });
  }
};

// Helper function to assign colors to categories
function getCategoryColor(category) {
  const colorMap = {
    'Food': '#FF6384',
    'Groceries': '#36A2EB',
    'Transport': '#FFCE56',
    'Entertainment': '#4BC0C0',
    'Shopping': '#9966FF',
    'Utilities': '#FF9F40',
    'Rent': '#C9CBCF',
    'Health': '#7BC8A4',
    'Travel': '#FFCD56',
    'Education': '#6495ED',
    'Income': '#9ACD32',
    'Uncategorized': '#A9A9A9'
  };
  
  return colorMap[category] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
} 