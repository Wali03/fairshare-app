import React, { useState, useEffect } from 'react';
import { FaShoppingBag, FaChevronDown, FaChevronUp, FaUser, FaMoneyBill, FaEdit, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { Expense, useExpenseStore } from '@/lib/stores/expenseStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { toast } from 'react-hot-toast';
import ExpenseForm, { ExpenseFormData } from './ExpenseForm';

interface ExpandableExpensesListProps {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  getUserName?: (userId: string) => string;
  currentUserId?: string;
  friendId?: string;
}

export default function ExpandableExpensesList({
  expenses,
  isLoading,
  error,
  getUserName = (id) => id, // Default to returning the ID if no name lookup function provided
  currentUserId,
  friendId,
}: ExpandableExpensesListProps) {
  const [expandedExpenses, setExpandedExpenses] = useState<Record<string, boolean>>({});
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const { categories, subcategories, fetchCategories } = useCategoryStore();
  const { deleteExpense, updateExpense } = useExpenseStore();

  // Fetch categories if they're not already loaded
  useEffect(() => {
    if (categories.length === 0) {
      console.log('No categories loaded, fetching them now...');
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  // Debug category and subcategory data
  useEffect(() => {
    console.log('Categories available in component:', categories);
    console.log('Subcategories available in component:', subcategories);
    
    if (expenses.length > 0) {
      console.log('Example expense category/subcategory IDs:', expenses.map(exp => ({
        expenseId: exp._id,
        description: exp.description,
        categoryId: exp.category,
        subcategoryId: exp.subcategory
      })));
    }
  }, [categories, subcategories, expenses]);

  const toggleExpenseExpand = (expenseId: string) => {
    setExpandedExpenses(prev => ({
      ...prev,
      [expenseId]: !prev[expenseId]
    }));
  };

  const handleDeleteExpense = async (expenseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId);
        toast.success('Expense deleted successfully');
      } catch (error) {
        console.error('Failed to delete expense:', error);
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleEditExpense = (expenseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // For debugging
    const expense = expenses.find(e => e._id === expenseId);
    console.log('Editing expense:', {
      expense,
      friendId,
      currentUserId
    });
    
    setEditingExpense(expenseId);
  };

  const handleEditCancel = () => {
    setEditingExpense(null);
  };

  const handleEditSubmit = async (data: ExpenseFormData) => {
    if (!editingExpense) return;
    
    try {
      await updateExpense(editingExpense, data);
      setEditingExpense(null);
      toast.success('Expense updated successfully');
    } catch (error) {
      console.error('Failed to update expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const getSubcategoryName = (subcategoryId: string) => {
    if (!subcategoryId) return 'No subcategory';
    
    // Handle potential array format
    const id = Array.isArray(subcategoryId) ? subcategoryId[0] : subcategoryId;
    
    console.log(`Looking for subcategory with ID ${id}`, {
      id,
      availableSubcategories: subcategories.map(s => ({ id: s._id, name: s.name }))
    });
    
    const subcategory = subcategories.find(sub => sub._id === id);
    
    if (subcategory) {
      return subcategory.name;
    } else {
      // If we can't find it by ID, just format the ID for display
      return typeof id === 'string' && id.length > 10 ? 
        `${id.substring(0, 8)}...` : // Truncate long IDs
        String(id);
    }
  };
  
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'No category';
    
    // Handle potential array format
    const id = Array.isArray(categoryId) ? categoryId[0] : categoryId;
    
    console.log(`Looking for category with ID ${id}`, {
      id,
      availableCategories: categories.map(c => ({ id: c._id, name: c.name }))
    });
    
    const category = categories.find(cat => cat._id === id);
    
    if (category) {
      return category.name;
    } else {
      // If we can't find it by ID, just format the ID for display
      return typeof id === 'string' && id.length > 10 ? 
        `${id.substring(0, 8)}...` : // Truncate long IDs
        String(id);
    }
  };

  // Extract name from email or user ID
  const extractDisplayName = (nameOrEmail: string): string => {
    // Check if it looks like an email
    if (nameOrEmail.includes('@')) {
      // Extract part before the @ symbol
      return nameOrEmail.split('@')[0];
    }
    return nameOrEmail;
  };

  // Safely format date with fallback
  const formatCreationTime = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (expenses.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No expenses found. Add your first expense!</p>
      </div>
    );
  }

  if (editingExpense) {
    const expense = expenses.find(e => e._id === editingExpense);
    if (!expense) {
      return <div className="text-center py-8 text-red-500">Expense not found</div>;
    }
    
    // Determine if this is a friend expense or group expense
    // If friendId is provided, this is explicitly a friend expense
    // Otherwise, check if the expense has a groupId
    const expenseType = friendId ? 'friend' : (expense.groupId ? 'group' : 'friend');
    const targetId = friendId || expense.groupId || '';
    
    console.log('Editing expense in ExpandableExpensesList:', {
      expense,
      friendId,
      expenseType,
      targetId,
      initialType: expenseType,
      initialTargetId: targetId
    });
    
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">Edit Expense</h2>
        <ExpenseForm
          onCancel={handleEditCancel}
          onSubmit={handleEditSubmit}
          initialValues={{
            ...expense,
            // Only set friendId if we actually have one (from props or additional data)
            ...(friendId ? { friendId } : {})
          }}
          isEditing={true}
          initialType={expenseType}
          initialTargetId={targetId}
        />
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-500">Description</th>
            <th className="hidden md:table-cell py-2 md:py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-500">Date</th>
            <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-500">Subcategory</th>
            <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-500">Amount</th>
            <th className="py-2 md:py-3 px-2 md:px-4 text-center text-xs md:text-sm font-medium text-gray-500 w-8 md:w-10"></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <React.Fragment key={expense._id}>
              <tr 
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpenseExpand(expense._id)}
              >
                <td className="py-2 md:py-4 px-2 md:px-4">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-1 md:p-2 rounded-lg mr-2 md:mr-3">
                      {(() => {
                        // First try to get image from subcategory
                        if (expense.subcategory) {
                          const id = Array.isArray(expense.subcategory) ? expense.subcategory[0] : expense.subcategory;
                          const subcategory = subcategories.find(sub => sub._id === id);
                          
                          if (subcategory && subcategory.image) {
                            return <img src={subcategory.image} alt="Category" className="border-[1px] border-gray-300 rounded-md scale-[1.75] w-4 h-4 md:w-5 md:h-5" />;
                          }
                        }
                        
                        // If no subcategory image, try category
                        if (expense.category) {
                          const id = Array.isArray(expense.category) ? expense.category[0] : expense.category;
                          const category = categories.find(cat => cat._id === id);
                          const categorySubcategories = category?.subcategories || [];
                          
                          // If category has subcategories, try to find one with an image
                          if (categorySubcategories.length > 0) {
                            const firstSubWithImage = subcategories.find(sub => 
                              categorySubcategories.includes(sub._id) && sub.image
                            );
                            
                            if (firstSubWithImage && firstSubWithImage.image) {
                              return <img src={firstSubWithImage.image} alt="Category" className="w-4 h-4 md:w-5 md:h-5" />;
                            }
                          }
                        }
                        
                        // Default fallback icon
                        return <FaShoppingBag className="text-blue-500 text-sm md:text-base" />;
                      })()}
                    </div>
                    <div>
                      <h4 className="text-sm md:text-base font-medium truncate max-w-[120px] md:max-w-none">{expense.description}</h4>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell py-2 md:py-4 px-2 md:px-4">
                  <p className="text-xs text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </td>
                <td className="py-2 md:py-4 px-2 md:px-4">
                  <span className="text-xs text-gray-500 truncate max-w-[80px] md:max-w-none inline-block">
                    {getSubcategoryName(expense.subcategory || '') || getCategoryName(expense.category)}
                  </span>
                </td>
                <td className="py-2 md:py-4 px-2 md:px-4">
                  <span className="text-sm md:text-base font-medium">₹{expense.amount.toLocaleString()}</span>
                </td>
                <td className="py-2 md:py-4 px-2 md:px-4 text-center">
                  {expandedExpenses[expense._id] ? 
                    <FaChevronUp size={12} className="md:text-base" /> : 
                    <FaChevronDown size={12} className="md:text-base" />
                  }
                </td>
              </tr>
              {expandedExpenses[expense._id] && (
                <tr className="bg-gray-50">
                  <td colSpan={5} className="p-2 md:p-4">
                    <div className="rounded-lg p-3 md:p-4 bg-gray-100">
                      <div className="flex justify-between mb-3 md:mb-4">
                        <h4 className="text-sm md:text-base font-medium">Payment Details</h4>
                        
                        {/* Show action buttons if current user is the creator */}
                        {currentUserId && expense.createdBy && expense.createdBy === currentUserId && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleEditExpense(expense._id, e)}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 md:px-3 rounded-md text-xs md:text-sm flex items-center gap-1"
                            >
                              <FaEdit size={12} className="md:text-base" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteExpense(expense._id, e)}
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 md:px-3 rounded-md text-xs md:text-sm flex items-center gap-1"
                            >
                              <FaTrash size={12} className="md:text-base" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs md:text-sm text-gray-500">
                        <span className="block md:hidden mb-2">
                          Date: {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mb-2 md:mb-3">
                        <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">
                          <FaUser className="inline-block mr-1 text-xs md:text-sm" /> Who Paid
                        </p>
                        <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm">
                          {expense.paidBy && expense.paidBy.map((payment, idx) => {
                            const userName = getUserName(payment.userId);
                            // Extract name without email
                            const displayName = extractDisplayName(userName);
                            
                            return (
                              <li key={`paid-${idx}`}>
                                <span className="font-medium">
                                  {displayName}
                                  {currentUserId && payment.userId === currentUserId && " (You)"}
                                </span>: ₹{payment.amountPaid.toLocaleString()}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      
                      <div className="mb-2 md:mb-3">
                        <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">
                          <FaMoneyBill className="inline-block mr-1 text-xs md:text-sm" /> Who Owes
                        </p>
                        <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm">
                          {expense.paidFor && expense.paidFor.map((payment, idx) => {
                            const userName = getUserName(payment.person);
                            // Extract name without email
                            const displayName = extractDisplayName(userName);
                            
                            return (
                              <li key={`owed-${idx}`}>
                                <span className="font-medium">
                                  {displayName}
                                  {currentUserId && payment.person === currentUserId && " (You)"}
                                </span>: ₹{payment.amountOwed.toLocaleString()}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2 md:mt-3">
                        {expense.createdAt && <p>Created: {formatCreationTime(expense.createdAt)}</p>}
                        {expense.createdBy && <p>Created by: {getUserName(expense.createdBy)}</p>}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
} 