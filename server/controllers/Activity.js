const User = require("../models/User")
const Activity = require("../models/Activity")
const Group = require("../models/Group")
const Expense = require("../models/Expense")
const { sendActivityNotification } = require("./Notification")
require("dotenv").config()

// Helper to create an activity entry
async function createActivityHelper(activityData) {
    try {
        // Create and return the activity
        const activity = await Activity.create(activityData);
        
        // Send email notification
        await sendActivityNotification(activity);
        
        return activity;
    } catch (error) {
        console.error("Error creating activity:", error);
        return null;
    }
}

exports.createActivity = async(req, res) => {
    try {
        const { type, description, userId, actorId, groupId, expenseId, friendId, image, actorImage } = req.body;

        // Validate essential data
        if (!type || !userId || !description) {
            return res.status(400).json({
                success: false,
                message: "Type, userId, and description are required",
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Create activity
        const activity = await Activity.create({
            user: userId,
            actor: actorId,
            type,
            desc: description,
            group: groupId,
            expense: expenseId,
            friend: friendId,
            image,
            actorImage,
            date: new Date()
        });

        return res.status(200).json({
            success: true,
            message: "Activity created successfully",
            activity
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Activity cannot be created",
            error: error.message,
        });
    }
}

// Create friend request activity
exports.createFriendRequestActivity = async (userId, actorId, image, actorName) => {
    try {
        // Get actor details for image
        const actor = await User.findById(actorId);
        if (!actor) return null;

        const activityData = {
            user: userId,
            actor: actorId,
            type: 'FRIEND_ADDED',
            desc: `${actorName} added you as a friend`,
            friend: actorId,
            actorImage: image || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating friend request activity:", error);
        return null;
    }
};

// Create group added activity
exports.createGroupAddedActivity = async (userId, actorId, groupId) => {
    try {
        // Get actor and group details
        const actor = await User.findById(actorId);
        const group = await Group.findById(groupId);
        
        if (!actor || !group) return null;

        const activityData = {
            user: userId,
            actor: actorId,
            type: 'GROUP_ADDED',
            desc: `${actor.name || actor.email} added you to the group ${group.name}`,
            group: groupId,
            actorImage: actor.profileImage || null,
            image: group.image || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating group added activity:", error);
        return null;
    }
};

// Create group removed activity
exports.createGroupRemovedActivity = async (userId, actorId, groupName) => {
    try {
        // Get actor details
        const actor = await User.findById(actorId);
        if (!actor) return null;

        const activityData = {
            user: userId,
            actor: actorId,
            type: 'GROUP_REMOVED',
            desc: `${actor.name || actor.email} removed you from the group ${groupName}`,
            actorImage: actor.profileImage || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating group removed activity:", error);
        return null;
    }
};

// Create expense added activity
exports.createExpenseAddedActivity = async (userId, actorId, expenseId, groupId) => {
    try {
        // Get actor, expense, and optional group details
        const actor = await User.findById(actorId);
        const expense = await Expense.findById(expenseId);
        let group = null;
        
        if (groupId) {
            group = await Group.findById(groupId);
        }
        
        if (!actor || !expense) return null;

        let description = `${actor.name || actor.email} added an expense of ₹${expense.amount}`;
        if (group) {
            description += ` in group ${group.name}`;
        }

        const activityData = {
            user: userId,
            actor: actorId,
            type: 'EXPENSE_ADDED',
            desc: description,
            expense: expenseId,
            group: groupId,
            actorImage: actor.profileImage || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating expense added activity:", error);
        return null;
    }
};

// Create group created activity
exports.createGroupCreatedActivity = async (userId, groupId) => {
    try {
        // Get user and group details
        const user = await User.findById(userId);
        const group = await Group.findById(groupId);
        
        if (!user || !group) return null;

        const activityData = {
            user: userId,
            actor: userId,
            type: 'GROUP_CREATED',
            desc: `You created the group ${group.name}`,
            group: groupId,
            actorImage: user.profileImage || null,
            image: group.image || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating group created activity:", error);
        return null;
    }
};

// Create group member added activity
exports.createGroupMemberAddedActivity = async (userId, actorId, groupId, memberId) => {
    try {
        // Get actor, group, and member details
        const actor = await User.findById(actorId);
        const group = await Group.findById(groupId);
        const member = await User.findById(memberId);
        
        if (!actor || !group || !member) return null;

        const activityData = {
            user: userId,
            actor: actorId,
            type: 'GROUP_MEMBER_ADDED',
            desc: `${actor.name || actor.email} added ${member.name || member.email} to the group ${group.name}`,
            group: groupId,
            friend: memberId,
            actorImage: actor.profileImage || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating group member added activity:", error);
        return null;
    }
};

// Create message received activity
exports.createMessageReceivedActivity = async (userId, actorId, message, groupId = null) => {
    try {
        // Get actor details for image
        const actor = await User.findById(actorId);
        if (!actor) return null;
        
        // Determine if this is a group or direct message
        let description = '';
        let activityData = {};
        
        if (groupId) {
            // It's a group message
            const group = await Group.findById(groupId);
            if (!group) return null;
            
            description = `${actor.name || actor.email} sent a message in ${group.name}`;
            activityData = {
                user: userId,
                actor: actorId,
                type: 'MESSAGE_RECEIVED',
                desc: description,
                message: message.length > 50 ? message.substring(0, 47) + '...' : message,
                group: groupId,
                actorImage: actor.profileImage || null,
                date: new Date()
            };
        } else {
            // It's a direct message
            description = `${actor.name || actor.email} sent you a message`;
            activityData = {
                user: userId,
                actor: actorId,
                type: 'MESSAGE_RECEIVED',
                desc: description,
                message: message.length > 50 ? message.substring(0, 47) + '...' : message,
                friend: actorId,
                actorImage: actor.profileImage || null,
                date: new Date()
            };
        }

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating message activity:", error);
        return null;
    }
};
// Add these two new activity creation functions to your ActivityController

// Create expense deleted activity
exports.createExpenseDeletedActivity = async (userId, actorId, expenseAmount, expenseDescription, groupId) => {
    try {
        // Get actor details
        const actor = await User.findById(actorId);
        let group = null;
        
        if (groupId) {
            group = await Group.findById(groupId);
        }
        
        if (!actor) return null;

        let description = `${actor.name || actor.email} deleted an expense of ₹${expenseAmount}`;
        if (expenseDescription) {
            description += ` for "${expenseDescription}"`;
        }
        if (group) {
            description += ` in group ${group.name}`;
        }

        const activityData = {
            user: userId,
            actor: actorId,
            type: 'EXPENSE_DELETED',
            desc: description,
            group: groupId,
            actorImage: actor.profileImage || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating expense deleted activity:", error);
        return null;
    }
};

// Create expense updated activity
exports.createExpenseUpdatedActivity = async (userId, actorId, expenseId, groupId, changes) => {
    try {
        // Get actor, expense, and optional group details
        const actor = await User.findById(actorId);
        const expense = await Expense.findById(expenseId);
        let group = null;
        
        if (groupId) {
            group = await Group.findById(groupId);
        }
        
        if (!actor || !expense) return null;

        // Create a description of what changed
        let changeDescription = "";
        if (changes.amount) {
            changeDescription += ` amount to ₹${expense.amount}`;
        }
        if (changes.description) {
            changeDescription += changeDescription ? " and" : "";
            changeDescription += ` description to "${expense.description}"`;
        }
        // If no specific changes mentioned or multiple other fields changed
        if (!changeDescription) {
            changeDescription = " details";
        }

        let description = `${actor.name || actor.email} updated${changeDescription} for an expense`;
        if (group) {
            description += ` in group ${group.name}`;
        }

        const activityData = {
            user: userId,
            actor: actorId,
            type: 'EXPENSE_UPDATED',
            desc: description,
            expense: expenseId,
            group: groupId,
            actorImage: actor.profileImage || null,
            date: new Date()
        };

        return await createActivityHelper(activityData);
    } catch (error) {
        console.error("Error creating expense updated activity:", error);
        return null;
    }
};

exports.showAllActivities = async(req, res) => {
    try {
        const userId = req.user.id;
        const activities = await Activity.find({ user: userId })
            .populate('actor', 'name email profileImage')
            .populate('group', 'name image')
            .populate('expense', 'description amount date')
            .populate('friend', 'name email profileImage')
            .sort({ date: -1 });

        return res.status(200).json({
            success: true,
            message: "All activities of user fetched",
            activities,
        });
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Activities of user cannot be fetched",
            error: error.message,
        });
    }
}

// Mark activities as read
exports.markActivitiesAsRead = async(req, res) => {
    try {
        const userId = req.user.id;
        const { activityIds } = req.body;

        if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Activity IDs are required",
            });
        }

        // Update isRead status for the specified activities
        await Activity.updateMany(
            { _id: { $in: activityIds }, user: userId },
            { $set: { isRead: true } }
        );

        return res.status(200).json({
            success: true,
            message: "Activities marked as read successfully",
        });
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark activities as read",
            error: error.message,
        });
    }
}

// Get unread activities count
exports.getUnreadActivitiesCount = async(req, res) => {
    try {
        const userId = req.user.id;
        const count = await Activity.countDocuments({ user: userId, isRead: false });

        return res.status(200).json({
            success: true,
            count
        });
    }
    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get unread activities count",
            error: error.message,
        });
    }
}