const express = require("express")
const router = express.Router()
const { auth } = require("../middlewares/auth")
const { getAllFriends,
        createExpenseForFriend, 
        addFriend, 
        removeFriend, 
        showAllFriendExpenses, 
        getFriendBalance,
        getFriend } = require("../controllers/Friend")

router.get("/getAllFriends", auth, getAllFriends)
router.get("/getFriend/:friendId", auth, getFriend)
router.post("/createExpenseForFriend", auth, createExpenseForFriend)
router.post("/addFriend", auth, addFriend)
router.delete("/removeFriend/:friendId", auth, removeFriend)
router.post("/showAllFriendExpenses", auth, showAllFriendExpenses)
router.get("/getFriendBalance", auth, getFriendBalance)

module.exports = router