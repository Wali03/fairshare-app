const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
require('dotenv').config();

const seedActivities = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB for seeding activities');
    
    // Get the first user
    const users = await User.find({}).limit(2);
    
    if (users.length < 2) {
      console.error('Need at least 2 users in the database');
      process.exit(1);
    }
    
    const targetUser = users[0];
    const actorUser = users[1];
    
    // Get a group if it exists
    const group = await Group.findOne({});
    
    // Get an expense if it exists
    const expense = await Expense.findOne({});
    
    // Clear existing activities for the target user
    await Activity.deleteMany({ user: targetUser._id });
    
    // Create sample activities
    const activityTypes = [
      {
        type: 'FRIEND_ADDED',
        desc: `${actorUser.name || actorUser.email} added you as a friend`,
        friend: actorUser._id,
        actorImage: actorUser.profileImage || null,
      },
      {
        type: 'GROUP_ADDED',
        desc: `${actorUser.name || actorUser.email} added you to a group`,
        group: group ? group._id : null,
        actorImage: actorUser.profileImage || null,
      },
      {
        type: 'EXPENSE_ADDED',
        desc: `${actorUser.name || actorUser.email} added an expense of ₹${expense ? expense.amount : '25'}`,
        expense: expense ? expense._id : null,
        actorImage: actorUser.profileImage || null,
      },
      {
        type: 'GROUP_CREATED',
        desc: 'You created a new group',
        group: group ? group._id : null,
        actorImage: targetUser.profileImage || null,
      },
      {
        type: 'EXPENSE_SETTLED',
        desc: `${actorUser.name || actorUser.email} settled an expense`,
        actorImage: actorUser.profileImage || null,
      }
    ];
    
    // Create activities with different dates
    const activities = [];
    
    for (let i = 0; i < activityTypes.length; i++) {
      const daysAgo = Math.floor(Math.random() * 10); // Random days ago (0 to 9)
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      activities.push({
        user: targetUser._id,
        actor: i === 3 ? targetUser._id : actorUser._id, // For 'GROUP_CREATED' the actor is the target user
        date,
        isRead: Math.random() > 0.6, // 40% chance of being unread
        ...activityTypes[i]
      });
    }
    
    // Create 10 more random activities
    for (let i = 0; i < 10; i++) {
      const randomTypeIndex = Math.floor(Math.random() * activityTypes.length);
      const daysAgo = Math.floor(Math.random() * 14); // Random days ago (0 to 13)
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      activities.push({
        user: targetUser._id,
        actor: randomTypeIndex === 3 ? targetUser._id : actorUser._id,
        date,
        isRead: Math.random() > 0.4, // 60% chance of being read
        ...activityTypes[randomTypeIndex]
      });
    }
    
    // Insert the activities
    await Activity.insertMany(activities);
    
    console.log(`Created ${activities.length} sample activities for user ${targetUser.name || targetUser.email}`);
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error seeding activities:', error);
    process.exit(1);
  }
};

seedActivities(); 