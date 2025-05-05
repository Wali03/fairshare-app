const bcrypt = require("bcrypt")
const User = require("../models/User")
const OTP = require("../models/OTP")
const jwt = require("jsonwebtoken")
const otpGenerator = require("otp-generator")
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const Profile = require("../models/Profile")
require("dotenv").config()

// Signup Controller for Registering USers

exports.signup = async (req, res) => {
  try {
    // Destructure fields from the request body
    const {
      name,
      email,
      password,
      confirmPassword,
      otp,
    } = req.body
    // Check if All Details are there or not
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      })
    }
    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match. Please try again.",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      })
    }

    // Find the most recent OTP for the email
    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)
    console.log(response)
    if (response.length === 0) {
      // OTP not found for the email
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      })
    } else if (otp !== response[0].otp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the Additional Profile For User
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    })
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      additionalDetails: profileDetails._id,
      friends: [],
      groups: [],
      // peopleGive: [],
      // peopleTake: [],
      expenses: [],
    })

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    })
  }
}

// Login controller for authenticating users
exports.login = async (req, res) => {
  try {
    // Get email and password from request body
    const { email, password } = req.body

    // Check if email or password is missing
    if (!email || !password) {
      // Return 400 Bad Request status code with error message
      return res.status(400).json({
        success: false,
        message: `Please Fill up All the Required Fields`,
      })
    }

    // Find user with provided email
    const user = await User.findOne({ email }).populate("additionalDetails")

    // If user not found with provided email
    if (!user) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is not Registered with Us Please SignUp to Continue`,
      })
    }

    // Generate JWT token and Compare Password
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      )

      // Save token to user document in database
      user.token = token
      user.password = undefined
      // Set cookie for token and return success response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      }
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: `User Login Success`,
      })
    } else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      })
    }
  } catch (error) {
    console.error(error)
    // Return 500 Internal Server Error status code with error message
    return res.status(500).json({
      success: false,
      message: `Login Failure Please Try Again`,
    })
  }
}
// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body

    // Check if user is already present
    // Find user with provided email
    const checkUserPresent = await User.findOne({ email })
    // to be used in case of signup

    // If user found with provided email
    if (checkUserPresent) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      })
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })
    const result = await OTP.findOne({ otp: otp })
    console.log("Result is Generate OTP Func")
    console.log("OTP", otp)
    console.log("Result", result)
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      })
    }
    const otpPayload = { email, otp }
    const otpBody = await OTP.create(otpPayload)
    console.log("OTP Body", otpBody)
    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
      otp,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, error: error.message })
  }
}

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)
    if (!userDetails) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      })
    }

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword, confirmPassword } = req.body

    // Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match"
      })
    }

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" })
    }

    // Check password length requirement
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.name}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error but don't fail the request
      console.error("Error occurred while sending email:", error)
      // Continue with success response as password was updated
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}

// Delete user account and associated data
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the user to be deleted
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ===== 1. HANDLE EXPENSES =====
    const Expense = require("../models/Expense");
    
    // Get all expenses where user is involved
    const userExpenses = await Expense.find({
      $or: [
        { "paidBy.userId": userId },
        { "paidFor.person": userId },
        { createdBy: userId }
      ]
    });
    
    // For each expense
    for (const expense of userExpenses) {
      // Gather all users involved in this expense
      const allInvolvedUserIds = new Set();
      
      // Add users from paidBy
      expense.paidBy.forEach(payer => {
        if (payer.userId && payer.userId.toString() !== userId) {
          allInvolvedUserIds.add(payer.userId.toString());
        }
      });
      
      // Add users from paidFor
      expense.paidFor.forEach(recipient => {
        if (recipient.person && recipient.person.toString() !== userId) {
          allInvolvedUserIds.add(recipient.person.toString());
        }
      });
      
      // Add creator if not the user being deleted
      if (expense.createdBy && expense.createdBy.toString() !== userId) {
        allInvolvedUserIds.add(expense.createdBy.toString());
      }
      
      // Remove expense from each involved user's expenses array
      for (const involvedUserId of allInvolvedUserIds) {
        await User.updateOne(
          { _id: involvedUserId },
          { $pull: { expenses: expense._id } }
        );
      }
      
      // Finally delete the expense
      await Expense.findByIdAndDelete(expense._id);
    }

    // ===== 2. HANDLE GROUPS =====
    const Group = require("../models/Group");
    
    // Get all groups where user is admin
    const adminGroups = await Group.find({ admin: userId });
    
    // For each group where user is admin
    for (const group of adminGroups) {
      // Get all members
      const memberIds = group.people || [];
      
      // Remove group from each member's groups array
      for (const memberId of memberIds) {
        if (memberId.toString() !== userId) {
          await User.updateOne(
            { _id: memberId },
            { $pull: { groups: group._id } }
          );
        }
      }
      
      // Delete the group
      await Group.findByIdAndDelete(group._id);
    }
    
    // Remove user from groups they're a member of but not admin
    const memberGroups = await Group.find({ members: userId, admin: { $ne: userId } });
    
    for (const group of memberGroups) {
      await Group.updateOne(
        { _id: group._id },
        { $pull: { members: userId } }
      );
    }

    // ===== 3. HANDLE ACTIVITIES =====
    const Activity = require("../models/Activity");
    
    // Delete all activities where user is involved
    await Activity.deleteMany({
      $or: [
        { user: userId },
        { actor: userId }
      ]
    });

    // ===== 4. CLEAN UP FRIEND RELATIONSHIPS =====
    
    // Remove user from friends lists of other users
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // ===== 5. DELETE USER PROFILE =====
    
    // Delete user's profile (additionalDetails)
    if (user.additionalDetails) {
      const Profile = require("../models/Profile");
      await Profile.findByIdAndDelete(user.additionalDetails);
    }

    // ===== 6. FINALLY DELETE THE USER =====
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account. Please try again."
    });
  }
}

// Verify user password
exports.verifyPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email or password is missing
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    // Find user with provided email
    const user = await User.findOne({ email });
    
    // If user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }
    
    // Password is valid
    return res.status(200).json({
      success: true,
      message: "Password verified successfully"
    });
  } catch (error) {
    console.error("Error verifying password:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify password"
    });
  }
}
