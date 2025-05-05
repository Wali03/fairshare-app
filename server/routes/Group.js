const express = require("express")
const router = express.Router()
const { auth } = require("../middlewares/auth")
const { createGroup, 
        addPeopleInGroup, 
        showAllGroups, 
        createGroupExpense, 
        showAllGroupExpense,
        leaveGroup, 
        deleteGroup, 
        getGroup,
        removeFromGroup,
        getUserDetails,
        getGroupwiseBalances } = require("../controllers/Group")

router.post("/createGroup", auth, createGroup)
router.post("/addPeopleInGroup", auth, addPeopleInGroup)
router.get("/showAllGroups", auth, showAllGroups)
router.post("/createGroupExpense", auth, createGroupExpense)
router.post("/showAllGroupExpense", auth, showAllGroupExpense)
router.post("/leaveGroup", auth, leaveGroup)
router.delete("/deleteGroup", auth, deleteGroup)
router.get("/getGroup/:groupId", auth, getGroup)
router.post("/removeFromGroup", auth, removeFromGroup)
router.get("/getUserDetails/:userId", auth, getUserDetails)
router.get("/getGroupwiseBalances/:groupId", auth, getGroupwiseBalances)

module.exports = router