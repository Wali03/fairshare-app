const express = require("express")
const router = express.Router()
const { auth } = require("../middlewares/auth")
const { showAllExpenses, getExpenseById, deleteExpense, updateExpense } = require("../controllers/Expense")

router.get("/showAllExpenses", auth, showAllExpenses)
router.get("/:expenseId", auth, getExpenseById)
router.delete("/:expenseId", auth, deleteExpense)
router.put("/:expenseId", auth, updateExpense)

module.exports = router