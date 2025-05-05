const { notificationEmail } = require("../mail/templates/notificationTemplate")
const mailSender = require("../utils/mailSender")
const NotificationPreference = require("../models/NotificationPreference")
const User = require("../models/User")

// Get user notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id
    
    // Find or create preferences
    let preferences = await NotificationPreference.findOne({ user: userId })
    
    // If no preferences exist yet, create with defaults (all enabled)
    if (!preferences) {
      preferences = await NotificationPreference.create({
        user: userId,
        addedToGroup: true,
        addedAsFriend: true,
        expenseAdded: true,
        expenseEdited: true,
        expenseDeleted: true,
        chatMessage: true
      })
    }
    
    return res.status(200).json({
      success: true,
      message: "Notification preferences retrieved successfully",
      preferences
    })
  } catch (error) {
    console.log("Error", error)
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve notification preferences",
      error: error.message
    })
  }
}

// Save user notification preferences
exports.saveNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id
    const { preferences } = req.body
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: "Notification preferences are required"
      })
    }
    
    // Update or create preferences
    const updatedPreferences = await NotificationPreference.findOneAndUpdate(
      { user: userId },
      {
        addedToGroup: Boolean(preferences.addedToGroup),
        addedAsFriend: Boolean(preferences.addedAsFriend),
        expenseAdded: Boolean(preferences.expenseAdded),
        expenseEdited: Boolean(preferences.expenseEdited),
        expenseDeleted: Boolean(preferences.expenseDeleted),
        chatMessage: Boolean(preferences.chatMessage)
      },
      { new: true, upsert: true }
    )
    
    return res.status(200).json({
      success: true,
      message: "Notification preferences saved successfully",
      preferences: updatedPreferences
    })
  } catch (error) {
    console.log("Error", error)
    return res.status(500).json({
      success: false,
      message: "Failed to save notification preferences",
      error: error.message
    })
  }
}

// Check if user has enabled notifications for a specific activity type
exports.shouldSendNotification = async (userId, activityType) => {
  try {
    // Find user preferences
    const preferences = await NotificationPreference.findOne({ user: userId })
    
    // If no preferences found, return true (default is to send notifications)
    if (!preferences) return true
    
    // Map activity type to preference setting
    const preferenceMap = {
      'GROUP_ADDED': 'addedToGroup',
      'FRIEND_ADDED': 'addedAsFriend',
      'EXPENSE_ADDED': 'expenseAdded',
      'EXPENSE_UPDATED': 'expenseEdited',
      'EXPENSE_DELETED': 'expenseDeleted',
      'MESSAGE_RECEIVED': 'chatMessage'
    }
    
    // Get the corresponding preference setting
    const preferenceSetting = preferenceMap[activityType]
    
    // If we don't have a mapping for this activity type, default to true
    if (!preferenceSetting) return true
    
    // Return the user's preference for this activity type
    return preferences[preferenceSetting]
  } catch (error) {
    console.error("Error checking notification preferences:", error)
    // Default to true in case of error
    return true
  }
}

// Send email notification for an activity
exports.sendActivityNotification = async (activity) => {
  try {
    if (!activity || !activity.user) return false
    
    // Check if user has enabled notifications for this activity type
    const shouldNotify = await exports.shouldSendNotification(activity.user, activity.type)
    if (!shouldNotify) return false
    
    // Get user details to send email
    const user = await User.findById(activity.user)
    if (!user || !user.email) return false
    
    // Send email notification
    await mailSender(
      user.email,
      `FairShare Notification: ${activity.type.replace(/_/g, ' ').toLowerCase()}`,
      notificationEmail(
        user.email,
        user.name || user.email,
        activity.desc,
        activity.type,
        activity
      )
    )
    
    return true
  } catch (error) {
    console.error("Error sending activity notification:", error)
    return false
  }
}

// Legacy notification controller
exports.notificationController = async (req, res) => {
  const { email, name, message } = req.body
  console.log(req.body)
  try {
    const emailRes = await mailSender(
      email,
      "Your Data send successfully",
      notificationEmail(email, name, message)
    )
    console.log("Email Res ", emailRes)
    return res.json({
      success: true,
      message: "Email send successfully",
    })
  } catch (error) {
    console.log("Error", error)
    console.log("Error message :", error.message)
    return res.json({
      success: false,
      message: "Something went wrong...",
    })
  }
}
