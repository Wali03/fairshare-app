const Category = require("../models/Category")
require("dotenv").config()



exports.createCategory = async (req, res) => {
    try {
      const { name } = req.body
      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" })
      }
      const CategorysDetails = await Category.create({
        name: name,
        subcategories: [],
      })
      console.log(CategorysDetails)
      return res.status(200).json({
        success: true,
        message: "Category Created Successfully",
      })
    } catch (error) {
      return res.status(500).json({
        success: true,
        message: error.message,
      })
    }
  }

exports.showAllCategories = async (req, res) => {
    try {
      const allCategorys = await Category.find()
      res.status(200).json({
        success: true,
        data: allCategorys,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }