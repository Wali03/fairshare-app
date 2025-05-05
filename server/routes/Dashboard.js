const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/Dashboard');
const { auth } = require('../middlewares/auth');

// All dashboard routes need authentication
router.use(auth);

// Get user balance (lent - owed)
router.get('/user/balance', dashboardController.getUserBalance);

// Get expenses summary for the current and last month
router.get('/expenses/summary', dashboardController.getExpensesSummary);

// Get income summary for the current and last month
router.get('/income/summary', dashboardController.getIncomeSummary);

// Get daily expense chart data
router.get('/expenses/chart', dashboardController.getExpensesChartData);

// Get recent transactions
router.get('/transactions/recent', dashboardController.getRecentTransactions);

// Get expenses by category
router.get('/expenses/by-category', dashboardController.getExpensesByCategory);

module.exports = router; 