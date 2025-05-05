const express = require("express")
const router = express.Router()
const { showAllExpenses } = require("../controllers/Expense")
const { createCategory, showAllCategories } = require("../controllers/Category")
const { createSubcategory, showSubcategories } = require("../controllers/Subcategory")
const { createRating, getAverageRating, getAllRatingReview } = require("../controllers/RatingAndReview")
const { auth } = require("../middlewares/auth")

//expense routes
router.get("/showAllExpenses", auth, showAllExpenses)

//category routes
router.post("/createCategory", createCategory)
router.get("/showAllCategories", showAllCategories)

//subcategory routes
router.post("/createSubcategory", createSubcategory)
router.post("/showSubcategories", showSubcategories)

//rating review routes
router.post("/createRating", auth, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getAllRatingReview", getAllRatingReview)

module.exports = router