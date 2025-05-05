const express = require("express")
const router = express.Router()
const { createActivity, showAllActivities, markActivitiesAsRead, getUnreadActivitiesCount } = require("../controllers/Activity")
const { auth } = require("../middlewares/auth")

router.post("/createActivity", auth, createActivity)
router.get("/getAllActivities", auth, showAllActivities)
router.post("/markAsRead", auth, markActivitiesAsRead)
router.get("/unreadCount", auth, getUnreadActivitiesCount)

module.exports = router