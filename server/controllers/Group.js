const User = require("../models/User")
const mongoose = require("mongoose")
const Group = require("../models/Group")
const Expense = require("../models/Expense")
const ActivityController = require("./Activity")
require("dotenv").config()

exports.createGroup = async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, emails, image } = req.body;
  
      const user = await User.findById(userId);
  
      // Step 1: Create group with admin
      const group = await Group.create({
        name,
        image,
        people: [],
        expenses: [],
        admin: userId,
      });
  
      const groupMemberIds = new Set(); // Store valid member IDs
  
      // Step 2: Add admin to group
      group.people.push(userId);
      user.groups.push(group._id);
      groupMemberIds.add(userId);
      await user.save();
  
      // Step 3: Find and add valid users by email
      for (const email of emails) {
        const person = await User.findOne({ email });
        if (person) {
          group.people.push(person._id);
          person.groups.push(group._id);
          groupMemberIds.add(person._id.toString());
          await person.save();
          
          // Create activity for the added person
          await ActivityController.createGroupAddedActivity(
            person._id, // userId (the one receiving the activity)
            userId, // actorId (the one who created the group)
            group._id // groupId
          );
        } else {
          console.log(`User with email ${email} not found.`);
        }
      }
  
      // Step 4: Make all group members friends with each other
      const allUserIds = [...groupMemberIds];
      for (let i = 0; i < allUserIds.length; i++) {
        for (let j = i + 1; j < allUserIds.length; j++) {
          const uid1 = allUserIds[i];
          const uid2 = allUserIds[j];
  
          const user1 = await User.findById(uid1);
          const user2 = await User.findById(uid2);
  
          // Add uid2 to user1's friends if not already there
          if (!user1.friends.includes(uid2)) {
            user1.friends.push(uid2);
          }
  
          // Add uid1 to user2's friends if not already there
          if (!user2.friends.includes(uid1)) {
            user2.friends.push(uid1);
          }
  
          await user1.save();
          await user2.save();
        }
      }
  
      await group.save();
      
      // Create activity for the creator
      await ActivityController.createGroupCreatedActivity(
        userId, // userId (the creator)
        group._id // groupId
      );
  
      return res.status(200).json({
        success: true,
        message: "Group created successfully, and all members added as friends.",
        group,
      });
    } catch (error) {
      console.error("Error in createGroup:", error);
      return res.status(500).json({
        success: false,
        message: "Group cannot be created.",
        error: error.message,
      });
    }
  };
  


exports.addPeopleInGroup = async(req,res) => {
    try{
        const { groupId, emails } = req.body;
        const userId = req.user.id;
        const group = await Group.findById(groupId);
        const user = await User.findById(userId);

        //add every new person being added in same group to each other's friend list
        for(const email of emails){
            const person = await User.findOne({email: email});
            if(person){
                //check if already added in group
                if(group.people.includes(person._id)){
                    return res.status(500).json({
                        success: false,
                        message: email+" already added in group.",
                    })
                }

                //add person in every group person friend list
                for(const memberid of group.people){
                    if(person.friends.includes(memberid)){
                        continue;
                    }

                    //add friend
                    const member = await User.findById(memberid);
                    person.friends.push(memberid);
                    member.friends.push(person._id);
                    await member.save();
                }
                //add in group
                group.people.push(person._id);
                person.groups.push(group._id);
                
                // Create activity for the person being added
                await ActivityController.createGroupAddedActivity(
                    person._id, // userId (the one receiving the activity)
                    userId, // actorId (the one who added the person)
                    groupId // groupId
                );
                
                // Create activity for existing members about the new addition
                for (const memberId of group.people) {
                    // Skip the person being added and the actor
                    if (memberId.toString() === person._id.toString() || memberId.toString() === userId) {
                        continue;
                    }
                    
                    await ActivityController.createGroupMemberAddedActivity(
                        memberId, // userId (the one receiving the activity)
                        userId, // actorId (the one who added the person)
                        groupId, // groupId
                        person._id // memberId (the one being added)
                    );
                }
                
                await person.save();
            }
            else{
                console.log("person not found");
            }
        }
        await group.save();
        await user.save();

        return res.status(200).json({
            success: true,
            message: "people added successfully",
            group,
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Error in adding people in group.",
            error: error.message,
        })
    }
}


exports.showAllGroups = async(req,res) => {
    try{
        const id = req.user.id;

        const user = await User.findById(id);

        const groups = user.groups;
        
        return res.status(200).json({
            success: true,
            message:"groups fetched successfully",
            groups
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message:"groups cannot be fetched",
            error: error.message
        })
    }
}



exports.createGroupExpense = async(req,res) => {
    try{
        const {
            groupId,
            category,
            subcategory,
            description,
            amount,
            date,
            image,
            paidBy,
            paidFor
        } = req.body;

        const userId = req.user.id;
        const group = await Group.findById(groupId);

        if(!category || !subcategory || !description || !amount || !paidBy || !paidFor){
            return res.status(500).json({
                success: false,
                message: "enter data correctly"
            })
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
            createdBy: userId,
            group: groupId
        });

        // Add expense to each payer's expenses
        for(const payer of paidBy) {
            await User.findByIdAndUpdate(payer.userId, {
                $push: {expenses: expense._id}
            }, { new: true });
        }

        // Add expense to each payee's expenses (if not already added)
        for(const people of paidFor){
            // Avoid duplicate if payer is also payee
            if(!paidBy.some(p => String(p.userId) === String(people.person))) {
                await User.findByIdAndUpdate(people.person, {
                    $push: {expenses: expense._id}
                }, { new: true });
            }
        }

        group.expenses.push(expense);
        await group.save();
        
        // Create activities for users involved in the expense
        const ExpenseController = require("./Expense");
        await ExpenseController.createExpenseActivity(expense, userId);

        return res.status(200).json({
            success: true,
            message:"group expense created successfully",
            expense
        })

    }
    catch(error){
        return res.status(500).json({
            success: false,
            message:"groups expense cannot be created",
            error: error.message
        })
    }
}


exports.showAllGroupExpense = async(req,res) => {
    try{
        const { groupId } = req.body;

        const group = await Group.findById(groupId);
        const expenses = group.expenses;

        return res.status(200).json({
            success: true,
            message:"group expense fetched successfully",
            expenses
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message:"groups expense cannot be fetched",
            error: error.message
        })
    }
}



exports.leaveGroup = async(req,res) => {
    try{
        const id = req.user.id;
        const { groupId } = req.body;

        const user = await User.findById(id);
        const group = await Group.findById(groupId);

        // Check if user is admin
        if(group.admin.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "Admin cannot leave the group. Please delete the group or transfer admin rights."
            });
        }

        //remove user from group
        const updatedGroup = await Group.findByIdAndUpdate(groupId,
            {
                $pull: { people: id }
            },
            { new: true}
        );


        //remove group from user
        const updatedUser = await User.findByIdAndUpdate(id,
            {
                $pull: { groups: groupId }
            },
            { new: true}
        );


        return res.status(200).json({
            success: true,
            message:"user left successfully",
            updatedUser,
            updatedGroup
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message:"error occured while leaving group",
            error: error.message
        })
    }
}



exports.deleteGroup = async(req,res) => {
    try{
        const { groupId } = req.body;
        const userId = req.user.id;
        const group = await Group.findById(groupId);

        // Check if user is admin
        if(group.admin.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Only group admin can delete the group"
            });
        }

        //delete all group related expenses and remove group expenses from each member
        for(const expense of group.expenses){
            for(const personId of group.people){
               //remove expense from person
                const updatedPerson = await User.findByIdAndUpdate(personId,
                    {
                        $pull: {expenses : expense}
                    },
                    {
                        new: true
                    }
                )
            }
            await Expense.findByIdAndDelete({_id: expense});
        }

        //remove group from each member
        for(const person of group.people){
            const updatedPerson = await User.findByIdAndUpdate(person,
                {
                    $pull: {groups : groupId}
                },
                {
                    new: true
                }
            )
        };

        //delete group
        await Group.findByIdAndDelete({_id: groupId});


        return res.status(200).json({
            success: true,
            message:"group deleted successfully"
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message:"groups cannot be deleted",
            error: error.message
        })
    }
}

exports.getGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        
        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group ID is required"
            });
        }

        // Find the group by ID and populate the people field to get user details
        const group = await Group.findById(groupId).populate('people', 'name email');
        
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        return res.status(200).json({
            success: true,
            group
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching group details",
            error: error.message
        });
    }
}

exports.removeFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const adminId = req.user.id;
        
        const group = await Group.findById(groupId);
        
        // Check if requester is admin
        if (group.admin.toString() !== adminId) {
            return res.status(403).json({
                success: false,
                message: "Only group admin can remove members"
            });
        }
        
        // Check if user to be removed exists in the group
        if (!group.people.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "User is not a member of this group"
            });
        }
        
        // Check if trying to remove admin
        if (group.admin.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: "Admin cannot be removed from the group"
            });
        }
        
        // Remove user from group
        await Group.findByIdAndUpdate(groupId, 
            { 
                $pull: { people: userId } 
            },
            { new: true }
        );
        
        // Remove group from user
        await User.findByIdAndUpdate(userId, 
            { 
                $pull: { groups: groupId } 
            },
            { new: true }
        );
        
        // Create activity for the removed person
        await ActivityController.createGroupRemovedActivity(
            userId, // userId (the one receiving the activity)
            adminId, // actorId (the admin who removed the person)
            group.name // groupName
        );
        
        return res.status(200).json({
            success: true,
            message: "Member removed successfully from the group"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error removing member from group",
            error: error.message
        });
    }
}

exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('firstName lastName email profileImage');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching user details",
            error: error.message
        });
    }
}

exports.getGroupwiseBalances = async (req, res) => {
    try {
        const { groupId } = req.params;
    
        const group = await Group.findById(groupId).populate("people", "_id name email");
        if (!group) {
          return res.status(404).json({ success: false, message: "Group not found" });
        }
    
        const groupUserIds = group.people.map(user => user._id.toString());
    
        // Fetch only expenses that belong to this group
        const allRelevantExpenses = await Expense.find({ group: groupId });
    
        // Step 1: Calculate net balances
        const balances = {};
    
        for (const expense of allRelevantExpenses) {
          for (const paid of expense.paidBy) {
            const uid = paid.userId.toString();
            balances[uid] = (balances[uid] || 0) + paid.amountPaid;
          }
    
          for (const owed of expense.paidFor) {
            const uid = owed.person.toString();
            balances[uid] = (balances[uid] || 0) - owed.amountOwed;
          }
        }
    
        // Filter balances to only include group members
        const groupBalances = {};
        for (const userId of groupUserIds) {
          if (balances[userId] !== undefined) {
            groupBalances[userId] = balances[userId];
          }
        }
    
        // Step 2: Smart settlement
        const debtors = [];
        const creditors = [];
    
        for (const [userId, amount] of Object.entries(groupBalances)) {
          if (amount < 0) debtors.push({ userId, amount: -amount });
          else if (amount > 0) creditors.push({ userId, amount });
        }
    
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);
    
        const transactions = [];
        let i = 0, j = 0;
    
        while (i < debtors.length && j < creditors.length) {
          const debtor = debtors[i];
          const creditor = creditors[j];
    
          const amount = Math.min(debtor.amount, creditor.amount);
          transactions.push({
            from: debtor.userId,
            to: creditor.userId,
            amount
          });
    
          debtor.amount -= amount;
          creditor.amount -= amount;
    
          if (debtor.amount === 0) i++;
          if (creditor.amount === 0) j++;
        }
    
        return res.status(200).json({
          success: true,
          balances: groupBalances,
          optimizedTransactions: transactions
        });
    
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to compute settlement",
          error: error.message
        });
      }
  };
  