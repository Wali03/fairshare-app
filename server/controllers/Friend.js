const User = require("../models/User")
const Expense = require("../models/Expense")
const ActivityController = require("./Activity")
require("dotenv").config()



exports.getAllFriends = async(req,res) => {
    try{
        const id = req.user.id;

        const user = await User.findById(id);

        if(!user){
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }
        const friends = user.friends;

        return res.status(200).json({
            status: true,
            message: "friends of user found successfully",
            data: friends,
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
          })
    }
}



exports.createExpenseForFriend = async(req,res) => {
    try{
        const {
            friendId,
            category,
            subcategory,
            description,
            amount,
            date,
            image,
            paidBy,
            paidFor
        } = req.body;

        const id=req.user.id;
        const user = await User.findById(id);
        const friend = await User.findById(friendId);

        if(!friend || !user){
            return res.status(404).json({
                success: false,
                message: "friend or user not found"
            })
        }

        if(!category || !subcategory || !description || !amount || !paidBy || !paidFor){
            return res.status(500).json({
                success: false,
                message: "enter data correctly"
            })
        }

        // Validate paidBy is an array and sum matches amount
        if(!Array.isArray(paidBy) || paidBy.length === 0) {
            return res.status(400).json({
                success: false,
                message: "paidBy must be a non-empty array"
            });
        }
        const paidByTotal = paidBy.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
        if(paidByTotal !== amount) {
            return res.status(400).json({
                success: false,
                message: "Sum of amountPaid in paidBy must equal total amount"
            });
        }

        const total = paidFor.reduce((acc,curr) => acc+curr.amountOwed, 0);
        if(total != amount){
            return res.status(500).json({
                success: false,
                message: "amount not split properly"
            })
        }

        //create expense
        const expense = await Expense.create({
            description: description,
            category: category,
            subcategory: subcategory,
            amount: amount,
            date: date||Date.now(),
            image: image,
            paidBy: paidBy,
            paidFor: paidFor,
            createdBy: id
        });

        // Add expense to all payers' expenses arrays
        for(const payer of paidBy) {
            await User.findByIdAndUpdate(payer.userId, {
                $push: { expenses: expense._id }
            });
        }
        // Add expense to all payees' expenses arrays
        for(const payee of paidFor) {
            await User.findByIdAndUpdate(payee.person, {
                $push: { expenses: expense._id }
            });
        }
        
        // Create activities for users involved in the expense
        const ExpenseController = require("./Expense");
        await ExpenseController.createExpenseActivity(expense, id);

        return res.status(200).json({
            status: true,
            message: "expense created successfully",
            data: expense,
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
          })
    }
}


exports.addFriend = async(req,res) => {
    try{
        const id = req.user.id;
        const {email} = req.body;

        const user = await User.findById(id);

        //check if friend id made or not
        const friend = await User.findOne({
            email: email
        })

        if(!friend){
            return res.status(404).json({
                success: false,
                message: "friend id has not been made yet",
            })
        }

        //check if already friend
        const isFriend = user.friends.some(fId => 
            fId.toString() === friend._id.toString()
        );
        
        if(isFriend){
            return res.status(500).json({
                success: false,
                message: "this user is already added as friend",
            })
        }

        //add user as friend
        const updatedUser = await User.findByIdAndUpdate(id,{
            $push: {
                friends: friend._id,
            }
        })

        const updatedFriend = await User.findByIdAndUpdate(friend._id,{
            $push: {
                friends: id,
            }
        })
        
        // Create activity for the other user
        await ActivityController.createFriendRequestActivity(
            friend._id, // userId (the one receiving the activity)
            id, // actorId (the one who added the friend)
            user.image, // image
            user.name || user.email // actor name
        );

        return res.status(200).json({
            success: true,
            message: "friend added successfully",
        })
    }
    catch(error){
        console.log("error in adding friend");
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


exports.removeFriend = async(req,res) => {
    try{
        const id = req.user.id;
        const { friendId } = req.params;

        const user = await User.findById(id);
        const friend = await User.findById(friendId);

        if(!user || !friend){
            return res.status(404).json({
                success: false,
                message: "user or friend not found",
            })
        }

        // Check if friendId is in user's friends list
        const isFriend = user.friends.some(fId => 
            fId.toString() === friendId.toString()
        );
        
        if(!isFriend){
            return res.status(500).json({
                success: false,
                message: "friend not added so cant remove friend",
            })
        }

        //remove friend
        const updatedUser = await User.findByIdAndUpdate(id,{
            $pull: {
                friends: friendId,
            }
        })

        const updatedFriend = await User.findByIdAndUpdate(friendId,{
            $pull: {
                friends: id,
            }
        })

        //TODO: should I remove all the expenses between the two
        return res.status(200).json({
            success: true,
            message: "friend removed successfully",
        })
    }
    catch(error){
        console.log("error in removing friend");
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


exports.showAllFriendExpenses = async(req,res) => {
    try{
        const id = req.user.id;
        const {friendId} = req.body;

        console.log('showAllFriendExpenses called with user ID:', id, 'and friendId:', friendId);

        const user = await User.findById(id);
        const friend = await User.findById(friendId);

        if(!user || !friend){
            return res.status(404).json({
                success: false,
                message: "user or friend not found",
            })
        }

        // Check if friendId is in user's friends list by comparing string values
        const isFriend = user.friends.some(fId => 
            fId.toString() === friendId.toString()
        );
        
        if(!isFriend){
            return res.status(404).json({
                success: false,
                message: "friend not found",
            })
        }

        // Find expenses where current user paid and friend owes
        const expenses1 = await Expense.find({
            paidBy: { $elemMatch: { userId: id } },
            paidFor: { $elemMatch: { person: friendId } }
        });

        // Find expenses where friend paid and current user owes
        const expenses2 = await Expense.find({
            paidBy: { $elemMatch: { userId: friendId } },
            paidFor: { $elemMatch: { person: id } }
        });

        console.log('Found expenses where user paid:', expenses1.length);
        console.log('Found expenses where friend paid:', expenses2.length);

        return res.status(200).json({
            success: true,
            data: [expenses1, expenses2],
        })
        
    }
    catch(error){
        console.log("error in fetching expenses shared with friend:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.getFriendBalance = async(req,res) => {
    try {
        const userId = req.user.id;
    
        const user = await User.findById(userId).populate("friends", "_id name email");
        if (!user) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
    
        const friendIds = user.friends.map(friend => friend._id.toString());
    
        // Fetch all expenses involving user or their friends (both group and non-group)
        const relevantIds = [userId, ...friendIds];
        const expenses = await Expense.find({
          $or: [
            { "paidBy.userId": { $in: relevantIds } },
            { "paidFor.person": { $in: relevantIds } }
          ]
        });
    
        const friendBalances = {}; // friendId -> balance
    
        for (const expense of expenses) {
          for (const paid of expense.paidBy) {
            const payerId = paid.userId.toString();
    
            for (const owed of expense.paidFor) {
              const owerId = owed.person.toString();
              const amount = owed.amountOwed;
    
              const isUserInvolved = payerId === userId || owerId === userId;
              const isFriendInvolved = friendIds.includes(payerId) || friendIds.includes(owerId);
    
              if (isUserInvolved && isFriendInvolved && payerId !== owerId) {
                const friendId = payerId === userId ? owerId : payerId;
                const sign = payerId === userId ? 1 : -1;
    
                if (!friendBalances[friendId]) friendBalances[friendId] = 0;
                friendBalances[friendId] += sign * amount;
              }
            }
          }
        }
    
        const response = [];
    
        for (const friend of user.friends) {
          const fid = friend._id.toString();
          if (fid in friendBalances) {
            response.push({
              friend: {
                id: fid,
                name: friend.name,
                email: friend.email
              },
              balance: friendBalances[fid]
            });
          }
        }
    
        return res.status(200).json({
          success: true,
          balances: response
        });
    
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to compute balances with friends",
          error: error.message
        });
      }
}



exports.getFriend = async(req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;

        // Get the current user to verify the friendship
        const currentUser = await User.findById(userId);
        if(!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if they are friends by comparing string values
        const isFriend = currentUser.friends.some(fId => 
            fId.toString() === friendId.toString()
        );
        
        if(!isFriend) {
            return res.status(403).json({
                success: false,
                message: "This user is not your friend"
            });
        }

        // Get friend details
        const friend = await User.findById(friendId).select('_id firstName lastName email profilePicture name');
        
        if (!friend) {
            return res.status(404).json({
                success: false,
                message: "Friend not found"
            });
        }

        // Format the response
        const friendData = {
            _id: friend._id,
            name: friend.name || 
                (friend.firstName && friend.lastName ? `${friend.firstName} ${friend.lastName}` : 
                friend.firstName || friend.email.split('@')[0]),
            email: friend.email,
            profilePicture: friend.profilePicture || null
        };

        return res.status(200).json({
            success: true,
            message: "Friend details retrieved successfully",
            data: friendData
        });
    } catch (error) {
        console.error("Error in getFriend:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

