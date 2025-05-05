const Category = require("../models/Category")
const Subcategory = require("../models/Subcategory")
require("dotenv").config()


exports.createSubcategory = async(req,res) => {
    try{
        const { name, image, category } = req.body;
        const subcategory = await Subcategory.create({
            name: name,
            image: image,
        });

        if(!name || !image){
            return res.status(400).json({
                success: false,
                message:"enter all details of subcategory",
            })
        }
        //add subcategory in category
        const updatedCategory = await Category.findByIdAndUpdate(category,
            {
                $push: {subcategories: subcategory}
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message:"SUBCATEGORY CREATION SUCCESSFUL",
        })
    }
    catch(error){
        return res.status(500).json({
            success: true,
            message: "cannot create subcategory",
        })
    }
}

exports.showSubcategories = async(req,res) => {
    try{
        const { categoryid } = req.body;
        const category = await Category.findById(categoryid).populate('subcategories');

        if(!category){
            return res.status(400).json({
                success: false,
                message:"category not found",
            })
        }
        // fetch subcategories with names and images
        const subcategories = category.subcategories.map(subcat => ({
            _id: subcat._id,
            name: subcat.name,
            image: subcat.image
        }));
        return res.status(200).json({
            success: true,
            subcategories,
        })
    }
    catch(error){
        return res.status(500).json({
            success: true,
            message: "cannot find subcategories",
        })
    }
}

