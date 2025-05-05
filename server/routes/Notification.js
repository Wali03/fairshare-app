const express = require("express")
const router = express.Router()
const { notificationController, getNotificationPreferences, saveNotificationPreferences } = require("../controllers/Notification")
const { auth } = require("../middlewares/auth")

// Routes for user notification preferences (authenticated)
router.get("/preferences", auth, getNotificationPreferences)
router.post("/preferences", auth, saveNotificationPreferences)

// Legacy route
router.post("/send", notificationController)

module.exports = router
