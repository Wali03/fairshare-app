const User = require("../models/User")
const Expense = require("../models/Expense")
const Group = require("../models/Group")
const ActivityController = require("./Activity")
require("dotenv").config()

// Helper function to get all users involved in an expense
const getInvolvedUsers = (expense, excludeUserId = null) => {
    const userIds = new Set();
    
    // Add payers
    expense.paidBy.forEach(payer => {
        const payerId = payer.userId.toString();
        if (payerId !== excludeUserId) {
            userIds.add(payerId);
        }
    });
    
    // Add payees
    expense.paidFor.forEach(payee => {
        if (payee.person) {
            const payeeId = payee.person.toString();
            if (payeeId !== excludeUserId) {
                userIds.add(payeeId);
            }
        }
    });
    
    return Array.from(userIds);
};

exports.showAllExpenses = async(req,res) => {
    try{
        const id = req.user.id;
        const user = await User.findById(id);

        const userExpenses = user.expenses;
        return res.status(200).json({
            success: true,
            message: "all user expenses fetched",
            userExpenses,
        })
    }
    catch(error){
        return res.status(200).json({
            success: false,
            message: "user expenses cannot be fetched",
            error: error.message,
        })
    }
}

exports.getExpenseById = async(req, res) => {
    try {
        const { expenseId } = req.params;
        
        if (!expenseId) {
            return res.status(400).json({
                success: false,
                message: "Expense ID is required"
            });
        }

        // Find the expense by ID
        const expense = await Expense.findById(expenseId);
        
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Expense fetched successfully",
            expense
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching expense details",
            error: error.message
        });
    }
}

// Update the deleteExpense function to create activities
exports.deleteExpense = async(req, res) => {
    try {
        const { expenseId } = req.params;
        const userId = req.user.id;
        
        if (!expenseId) {
            return res.status(400).json({
                success: false,
                message: "Expense ID is required"
            });
        }

        // Find the expense by ID
        const expense = await Expense.findById(expenseId);
        
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        // Verify the user is the creator of the expense
        if (expense.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this expense"
            });
        }

        // Get all users involved in the expense except the actor
        const involvedUsers = getInvolvedUsers(expense, userId);
        
        // Store expense details before deletion for activity creation
        const expenseAmount = expense.amount;
        const expenseDescription = expense.description;
        const groupId = expense.group;

        // Remove the expense from all users who have it
        // First, get all users who are either payers or payees
        const userIds = new Set();
        
        // Add payers
        expense.paidBy.forEach(payer => {
            userIds.add(payer.userId.toString());
        });
        
        // Add payees
        expense.paidFor.forEach(payee => {
            if (payee.person) {
                userIds.add(payee.person.toString());
            }
        });
        
        // Remove expense from each user's expenses array
        for (const id of userIds) {
            await User.findByIdAndUpdate(id, {
                $pull: { expenses: expenseId }
            });
        }
        
        // Check if expense is part of a group and remove it from the group
        const groups = await Group.find({ expenses: expenseId });
        for (const group of groups) {
            await Group.findByIdAndUpdate(group._id, {
                $pull: { expenses: expenseId }
            });
        }

        // Delete the expense
        await Expense.findByIdAndDelete(expenseId);

        // Create activities for all involved users about the expense deletion
        for (const userId of involvedUsers) {
            await ActivityController.createExpenseDeletedActivity(
                userId,            // userId (the one receiving the activity)
                req.user.id,       // actorId (the one who deleted the expense)
                expenseAmount,     // amount of the deleted expense
                expenseDescription, // description of the deleted expense
                groupId            // groupId (if it was a group expense)
            );
        }

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting expense",
            error: error.message
        });
    }
}

// Update the updateExpense function to create activities
exports.updateExpense = async(req, res) => {
    try {
        const { expenseId } = req.params;
        const userId = req.user.id;
        const {
            description,
            category,
            subcategory,
            amount,
            date,
            image,
            paidBy,
            paidFor
        } = req.body;
        
        if (!expenseId) {
            return res.status(400).json({
                success: false,
                message: "Expense ID is required"
            });
        }

        // Find the expense by ID
        const expense = await Expense.findById(expenseId);
        
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        // Verify the user is the creator of the expense
        if (expense.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to edit this expense"
            });
        }

        // Validate paidBy and paidFor if provided
        if (paidBy && paidFor) {
            if (!Array.isArray(paidBy) || paidBy.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "paidBy must be a non-empty array"
                });
            }
            
            const paidByTotal = paidBy.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
            if (amount && paidByTotal !== amount) {
                return res.status(400).json({
                    success: false,
                    message: "Sum of amountPaid in paidBy must equal total amount"
                });
            }
            
            const paidForTotal = paidFor.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
            if (amount && paidForTotal !== amount) {
                return res.status(400).json({
                    success: false,
                    message: "Sum of amountOwed in paidFor must equal total amount"
                });
            }
        }

        // Keep track of what fields were updated for descriptive activity creation
        const changes = {};
        if (description && description !== expense.description) changes.description = true; 
        if (amount && amount !== expense.amount) changes.amount = true;
        // Add more tracked changes as needed

        // Create update object with only provided fields
        const updateData = {};
        if (description) updateData.description = description;
        if (category) updateData.category = category;
        if (subcategory) updateData.subcategory = subcategory;
        if (amount) updateData.amount = amount;
        if (date) updateData.date = date;
        if (image) updateData.image = image;
        if (paidBy) updateData.paidBy = paidBy;
        if (paidFor) updateData.paidFor = paidFor;

        // Update the expense
        const updatedExpense = await Expense.findByIdAndUpdate(
            expenseId,
            updateData,
            { new: true }
        );

        // Get all users involved in the expense except the actor
        const involvedUsers = getInvolvedUsers(updatedExpense, userId);
        
        // Create activities for all involved users about the expense update
        for (const userId of involvedUsers) {
            await ActivityController.createExpenseUpdatedActivity(
                userId,              // userId (the one receiving the activity)
                req.user.id,         // actorId (the one who updated the expense)
                expenseId,           // expenseId
                updatedExpense.group, // groupId (if it's a group expense)
                changes              // what fields were changed
            );
        }

        return res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            expense: updatedExpense
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating expense",
            error: error.message
        });
    }
}

// Create activities when a friend expense is created
exports.createExpenseActivity = async (expense, actorId) => {
    try {
        // Get all users involved in the expense except the actor
        const involvedUsers = getInvolvedUsers(expense, actorId);
        
        // Create activities for all involved users
        for (const userId of involvedUsers) {
            await ActivityController.createExpenseAddedActivity(
                userId, // userId (the one receiving the activity)
                actorId, // actorId (the one who created the expense)
                expense._id, // expenseId
                expense.group // groupId (if it's a group expense)
            );
        }
    } catch (error) {
        console.error("Error creating expense activities:", error);
    }
};
