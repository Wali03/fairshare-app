const Profile = require("../models/Profile")
const User = require("../models/User")
const Group = require("../models/Group")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const mongoose = require("mongoose")
const { convertSecondsToDuration } = require("../utils/secToDuration")
// Method for updating a profile
exports.updateProfile = async (req, res) => {
  try {
    // Extract data from request body
    const { name = "", additionalDetails = {} } = req.body
    
    // Get user ID from authenticated user
    const id = req.user.id

    // Find the user by ID
    const userDetails = await User.findById(id)
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Step 1: Update the user's name
    await User.findByIdAndUpdate(
      id,
      { name: name },
      { new: true }
    )

    // Step 2: Update the user's profile details
    if (!userDetails.additionalDetails) {
      return res.status(404).json({
        success: false,
        message: "Profile details not found",
      })
    }

    // Extract profile details
    const { dateOfBirth = "", about = "", contactNumber = "", gender = "" } = additionalDetails

    // Update profile
    await Profile.findByIdAndUpdate(
      userDetails.additionalDetails,
      {
        dateOfBirth: dateOfBirth,
        about: about,
        contactNumber: contactNumber,
        gender: gender
      },
      { new: true }
    )

    // Get the updated user details
    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec()

    // Return success response with updated user details
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    })
  }
}

exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id
    console.log(id)
    const user = await User.findById({ _id: id })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
    // Delete Assosiated Profile with the User
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(user.additionalDetails),
    })
    for (const friendId of user.friends) {
      await User.findByIdAndUpdate(
        friendId,
        { $pull: { friends: id } },
        { new: true }
      )
    }

    for (const groupId of user.groups) {
        await Group.findByIdAndUpdate(
          groupId,
          { $pull: { people: id } },
          { new: true }
        )
    }

    //TODO: should I delete his expenses with other people?

    // Now Delete User
    await User.findByIdAndDelete({ _id: id })
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "User Cannot be deleted successfully" })
  }
}

exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec()
    console.log(userDetails)
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateDisplayPicture = async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }
    
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(displayPicture.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPEG, PNG, JPG and GIF are allowed."
      });
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (displayPicture.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB."
      });
    }
    
    // Upload to Cloudinary
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME || 'fairshare',
      1000,
      1000
    );
    
    if (!image || !image.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Error uploading image to cloud storage"
      });
    }
    
    // Update user profile with the new image URL
    const updatedProfile = await User.findByIdAndUpdate(
      userId,
      { image: image.secure_url },
      { new: true }
    ).populate("additionalDetails");
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: updatedProfile
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
      error: error.message
    });
  }
}

// New function to fetch all users with basic details
exports.fetchAllUsers = async (req, res) => {
  try {
    // Find all users but only return necessary fields
    const users = await User.find({})
      .select('_id firstName lastName email name profileImage')
      .lean();
    
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
}

