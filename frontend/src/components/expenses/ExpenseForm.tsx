'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { FaMoneyBillAlt, FaCalendarAlt, FaUsers, FaTags, FaPlus, FaMinus } from 'react-icons/fa';
import { useExpenseStore } from '@/lib/stores/expenseStore';
import { useGroupStore } from '@/lib/stores/groupStore';
import { useFriendStore } from '@/lib/stores/friendStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { fetchCategories, fetchSubcategories } from '@/lib/api';

interface ExpenseFormData {
  description: string;
  amount: number;
  date: string;
  category: string;
  subcategory?: string;
  paidBy: Array<{ userId: string; amountPaid: number }>;
  friendId?: string;
  groupId?: string;
  splitType: 'equal' | 'unequal';
  paidFor: Array<{
    person: string;
    amountOwed: number;
  }>;
}

// Export the interface for other components to use
export type { ExpenseFormData };

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  initialType?: 'friend' | 'group';
  initialTargetId?: string;
  initialValues?: Partial<ExpenseFormData> & { group?: string };
  isEditing?: boolean;
}

export default function ExpenseForm({ 
  onSubmit, 
  onCancel, 
  initialType, 
  initialTargetId,
  initialValues,
  isEditing = false
}: ExpenseFormProps) {
  const [splitType, setSplitType] = useState<'equal' | 'unequal'>(
    initialValues?.splitType || 'equal'
  );
  
  // Determine expense type, prioritizing friendId and explicit initialType
  const [expenseType, setExpenseType] = useState<'friend' | 'group'>(
    initialType === 'friend' ? 'friend' :
    initialValues?.friendId ? 'friend' : 
    initialValues?.group ? 'group' :
    initialValues?.groupId ? 'group' :
    initialType === 'group' ? 'group' :
    'friend'
  );
  
  // Add debug logs
  console.log('ExpenseForm - Initial props:', { 
    initialType, 
    initialTargetId, 
    initialValues, 
    isEditing,
    expenseType,
    friendId: initialValues?.friendId,
    effectiveGroupId: initialValues?.group || initialValues?.groupId || (initialType === 'group' ? initialTargetId : undefined)
  });
  
  const { user } = useAuthStore();
  const { friends, fetchFriends } = useFriendStore();
  const { groups, fetchGroups } = useGroupStore();
  const { createFriendExpense, createGroupExpense } = useExpenseStore();
  
  // Derived groupId - check from multiple potential sources and memoize to prevent changes
  const effectiveGroupId = useMemo(() => {
    const groupId = initialValues?.group || 
                    initialValues?.groupId || 
                    (initialType === 'group' ? initialTargetId : undefined);
    console.log('Effective group ID stabilized at:', groupId);
    return groupId;
  }, [initialValues?.group, initialValues?.groupId, initialType, initialTargetId]);
  
  // Also memoize the effective friend ID to prevent frequent changes
  const effectiveFriendId = useMemo(() => {
    return initialValues?.friendId || 
           (initialType === 'friend' ? initialTargetId : undefined);
  }, [initialValues?.friendId, initialType, initialTargetId]);

  // Get default values for form
  const getDefaultValues = () => {
    if (isEditing && initialValues) {
      // Ensure groupId is set correctly when editing a group expense
      const groupId = initialValues.group || initialValues.groupId || '';
      
      return {
        description: initialValues.description || '',
        amount: initialValues.amount || 0,
        date: initialValues.date ? new Date(initialValues.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: initialValues.category || '',
        subcategory: initialValues.subcategory || '',
        paidBy: initialValues.paidBy || [],
        friendId: initialValues.friendId || (initialType === 'friend' ? initialTargetId : ''),
        groupId: groupId,
        splitType: (initialValues.splitType || 'equal') as 'equal' | 'unequal',
        paidFor: initialValues.paidFor || []
      };
    }
    
    return {
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: '',
      subcategory: '',
      paidBy: user ? [{ userId: user._id, amountPaid: 0 }] : [],
      friendId: initialType === 'friend' ? initialTargetId : '',
      groupId: initialType === 'group' ? initialTargetId : '',
      splitType: 'equal' as 'equal' | 'unequal',
      paidFor: []
    };
  };
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues } = useForm<ExpenseFormData>({
    defaultValues: getDefaultValues()
  });
  
  // Fetch groups and friends only once when needed, not on every render
  useEffect(() => {
    if (friends.length === 0) {
      console.log('No friends loaded, fetching them now...');
      fetchFriends();
    }
    
    if (groups.length === 0) {
      console.log('No groups loaded, fetching them now...');
      fetchGroups();
    }
  }, [fetchGroups, fetchFriends, friends.length, groups.length]);
  
  // Get current values from form - using memoized values where possible
  const amount = watch('amount');
  const selectedFriendId = watch('friendId');
  const selectedGroupId = effectiveGroupId || watch('groupId');

  // Add state for multi-payer
  const [payers, setPayers] = useState<Array<{ userId: string; amountPaid: number }>>(
    isEditing && initialValues?.paidBy ? 
    initialValues.paidBy : 
    user ? [{ userId: user._id, amountPaid: 0 }] : []
  );
  const [payerError, setPayerError] = useState<string | null>(null);

  // Add state for split error
  const [splitError, setSplitError] = useState<string | null>(null);

  // Paid For selection state
  const [splitAmounts, setSplitAmounts] = useState<Record<string, number>>({});

  // Categories state
  const [categories, setCategories] = useState<{ _id: string; name: string; subcategories: string[] }[]>([]);
  const [subcategories, setSubcategories] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(res => {
      setCategories(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedCategory(res.data.data[0]._id);
      }
    });
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory).then(res => {
        setSubcategories(res.data.subcategories || []);
        setSelectedSubcategory('');
      });
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);
  
  // Special effect for setting initial values when editing - only run once
  useEffect(() => {
    if (isEditing && initialValues) {
      console.log('Setting initial values for editing');
      
      // Set the form values
      setValue('description', initialValues.description || '');
      setValue('amount', initialValues.amount || 0);
      setValue('date', initialValues.date ? new Date(initialValues.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setValue('category', initialValues.category || '');
      setValue('subcategory', initialValues.subcategory || '');
      setValue('paidBy', initialValues.paidBy || []);
      setValue('paidFor', initialValues.paidFor || []);
      
      // Ensure groupId or friendId is set correctly when editing
      if (initialValues.group || initialValues.groupId) {
        setValue('groupId', initialValues.group || initialValues.groupId || '');
      }
      
      // If we have initialTargetId and initialType is 'friend', set friendId
      if (initialType === 'friend' && initialTargetId) {
        console.log('Setting friendId from initialTargetId:', initialTargetId);
        setValue('friendId', initialTargetId);
      } else if (initialValues.friendId) {
        console.log('Setting friendId from initialValues.friendId:', initialValues.friendId);
        setValue('friendId', initialValues.friendId);
      }
      
      // Set split type based on paidFor
      if (initialValues.paidFor && initialValues.paidFor.length > 0) {
        // Check if all amounts are equal
        const firstAmount = initialValues.paidFor[0].amountOwed;
        const isEqual = initialValues.paidFor.every((p) => p.amountOwed === firstAmount);
        setSplitType(isEqual ? 'equal' : 'unequal');
      }
      
      // Set payers
      if (initialValues.paidBy && initialValues.paidBy.length > 0) {
        setPayers(initialValues.paidBy);
      }
      
      // Set selected category and trigger subcategory fetch
      if (initialValues.category) {
        setSelectedCategory(initialValues.category);
      }
      
      if (initialValues.subcategory) {
        setSelectedSubcategory(initialValues.subcategory);
      }
    }
  }, [isEditing, initialValues, setValue, initialType, initialTargetId]);

  // Use memoization to calculate splitPeople - THIS IS THE KEY FIX:
  // Adding selectedFriendId as a dependency so it updates when a friend is selected
  const memoizedSplitPeople = useMemo(() => {
    console.log('Recalculating split people with stable IDs:', {
      expenseType,
      effectiveFriendId,
      selectedFriendId, // Added this to see the value in logs
      selectedGroupId, 
      isEditing
    });
    
    const newSplitPeople: string[] = [];
    
    if (expenseType === 'group' && selectedGroupId) {
      const group = groups.find(g => g._id === selectedGroupId);
      
      if (group && Array.isArray(group.people) && group.people.length > 0) {
        group.people.forEach(person => {
          if (typeof person === 'object' && person !== null && '_id' in person) {
            newSplitPeople.push((person as { _id: string })._id);
          } else if (typeof person === 'string') {
            newSplitPeople.push(String(person));
          }
        });
      }
    } else if (expenseType === 'friend') {
      // When editing a friend expense or creating a new one
      // Start with the current user
      if (user?._id) {
        newSplitPeople.push(user._id);
      }
      
      // Add the selected friend, if any
      // First check effectiveFriendId (for editing), then fallback to selectedFriendId (from dropdown)
      const friendId = effectiveFriendId || selectedFriendId;
      if (friendId) {
        newSplitPeople.push(friendId);
      }
      
      // If editing, check for additional people in the expense
      if (isEditing && initialValues) {
        // Add all payers that aren't already included
        if (initialValues.paidBy) {
          initialValues.paidBy.forEach(payer => {
            if (!newSplitPeople.includes(payer.userId)) {
              newSplitPeople.push(payer.userId);
            }
          });
        }
        
        // Add all people in paidFor that aren't already included
        if (initialValues.paidFor) {
          initialValues.paidFor.forEach(payee => {
            if (payee.person && !newSplitPeople.includes(payee.person)) {
              newSplitPeople.push(payee.person);
            }
          });
        }
      }
    }
    
    return newSplitPeople;
  }, [expenseType, effectiveFriendId, selectedFriendId, selectedGroupId, groups, user, isEditing, initialValues]);

  // Add back the effect for calculating equal amounts
  useEffect(() => {
    if (splitType === 'equal' && memoizedSplitPeople.length > 0) {
      const perPerson = amount / memoizedSplitPeople.length;
      const paidFor = memoizedSplitPeople.map(personId => ({
        person: personId,
        amountOwed: perPerson
      }));
      setValue('paidFor', paidFor);
    }
  }, [amount, splitType, memoizedSplitPeople, setValue]);

  // Memoize the possible payers to prevent frequent changes
  const possiblePayers = useMemo(() => {
    console.log('getPossiblePayers called with stable IDs:', { 
      expenseType, 
      effectiveFriendId,
      selectedFriendId, // Added this to see the value in logs
      selectedGroupId
    });

    if (expenseType === 'group' && selectedGroupId) {
      const group = groups.find(g => g._id === selectedGroupId);
      
      if (!group || !Array.isArray(group.people) || group.people.length === 0) {
        return [];
      }
      
      return group.people.map(person => {
        let _id: string, name: string = '';
        
        // Handle different person formats
        if (typeof person === 'object' && person !== null) {
          if ('_id' in person) {
            _id = (person as { _id: string })._id;
          } else if ('id' in person) {
            _id = (person as { id: string }).id;
          } else {
            _id = String(person);
          }
          
          if ('name' in person) {
            name = (person as { name: string }).name;
          } else if ('email' in person) {
            name = (person as { email: string }).email;
          }
        } else {
          _id = String(person);
        }
        
        // If this is the current user, use their info
        if (user && _id === user._id) {
          return { userId: _id, name: user.name || 'You' };
        }
        
        // Check if in friends list
        const friend = friends.find(f => f._id === _id);
        if (friend) {
          return { userId: _id, name: friend.name };
        }
        
        return { userId: _id, name: name || `User ${_id.substring(0, 6)}...` };
      });
    } else if (expenseType === 'friend') {
      // For friend expenses, include both the user and the friend
      
      // First, add the current user
      const result = [{ userId: user?._id || '', name: user?.name || 'You' }];
      
      // Check both effectiveFriendId and selectedFriendId to include the friend
      const friendId = effectiveFriendId || selectedFriendId;
      if (friendId) {
        const friend = friends.find(f => f._id === friendId);
        if (friend) {
          result.push({ userId: friend._id, name: friend.name || 'Friend' });
        }
      }
      
      // Add people from splitPeople that aren't already in the result
      if (memoizedSplitPeople && memoizedSplitPeople.length > 0) {
        memoizedSplitPeople.forEach(personId => {
          // Skip if already in the result
          if (result.some(p => p.userId === personId)) {
            return;
          }
          
          // Look for this person in friends
          const friend = friends.find(f => f._id === personId);
          if (friend) {
            result.push({ userId: friend._id, name: friend.name || 'Friend' });
          }
        });
      }
      
      return result;
    } else {
      return user ? [{ userId: user._id, name: user.name || 'You' }] : [];
    }
  }, [expenseType, effectiveFriendId, selectedFriendId, selectedGroupId, groups, user, friends, memoizedSplitPeople]);

  // Handler to add a payer
  const handleAddPayer = () => {
    const unused = possiblePayers.find(p => !payers.some(pay => pay.userId === p.userId));
    if (unused) {
      setPayers([...payers, { userId: unused.userId, amountPaid: 0 }]);
    }
  };

  // Handler to remove a payer
  const handleRemovePayer = (userId: string) => {
    setPayers(payers.filter(p => p.userId !== userId));
  };

  // Handler to update payer amount
  const handlePayerAmountChange = (userId: string, value: number) => {
    setPayers(payers.map(p => p.userId === userId ? { ...p, amountPaid: Number(value) } : p));
  };

  // Calculate sums
  const paidBySum = payers.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const paidForSum = Object.values(splitAmounts).reduce((sum, amount) => sum + (Number(amount) || 0), 0);

  // Validate before submit
  const validateAll = () => {
    let valid = true;
    if (Math.abs(paidBySum - Number(amount)) > 0.01) {
      setPayerError('Sum of paid amounts must equal total amount');
      valid = false;
    } else {
      setPayerError(null);
    }
    
    if (splitType === 'unequal' && Math.abs(paidForSum - Number(amount)) > 0.01) {
      setSplitError('Sum of owed amounts must equal total amount');
      valid = false;
    } else {
      setSplitError(null);
    }
    
    return valid;
  };

  // Handle form submission
  const handleFormSubmit = async (data: ExpenseFormData) => {
    if (!validateAll()) return;
    
    try {
      // Prepare the expense data
      const formData = getValues();
      
      const expenseData = {
        description: data.description,
        amount: Number(data.amount),
        date: data.date,
        category: selectedCategory,
        subcategory: selectedSubcategory || undefined,
        paidBy: payers.map(p => ({
          userId: p.userId,
          amountPaid: Number(p.amountPaid)
        })),
        paidFor: splitType === 'equal' 
          ? memoizedSplitPeople.map(pid => ({ 
              person: pid, 
              amountOwed: amount / memoizedSplitPeople.length 
            }))
          : Object.entries(splitAmounts).map(([pid, amt]) => ({ 
              person: pid, 
              amountOwed: Number(amt) 
            })),
        splitType
      };

      if (isEditing) {
        await onSubmit({
          ...formData,
          ...expenseData
        });
      } else if (expenseType === 'friend') {
        await createFriendExpense(data.friendId!, expenseData);
        onSubmit(data);
      } else if (expenseType === 'group') {
        await createGroupExpense(data.groupId!, expenseData);
        onSubmit(data);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  // Function to get a person's name from their ID
  const getPersonNameById = (personId: string): string => {
    // First check if this is the current user
    if (user && user._id === personId) {
      return user.name || 'You';
    }
    
    // Then check if this is a friend
    const friend = friends.find(f => f._id === personId);
    if (friend) {
      return friend.name;
    }
    
    // Then check if this person is in the group
    if (selectedGroupId) {
      const group = groups.find(g => g._id === selectedGroupId);
      if (group && Array.isArray(group.people)) {
        for (const person of group.people) {
          if (typeof person === 'object' && person !== null) {
            if ('_id' in person && (person as { _id: string })._id === personId) {
              if ('name' in person) return (person as { name: string }).name;
              if ('email' in person) return (person as { email: string }).email;
            }
          }
        }
      }
    }
    
    // If we can't find a name, return a shortened version of the ID
    return `User ${personId.substring(0, 6)}...`;
  };

  // Add a helper function to calculate the "Get possible payers" that uses our memoized value
  const getPossiblePayers = () => possiblePayers;

  // Add back the handleSplitAmountChange function
  const handleSplitAmountChange = (personId: string, value: number) => {
    setSplitAmounts(prev => ({ ...prev, [personId]: value }));
    
    // Update paidFor in the form
    const updatedPaidFor = memoizedSplitPeople.map(pid => ({
      person: pid,
      amountOwed: pid === personId ? value : splitAmounts[pid] || 0
    }));
    
    setValue('paidFor', updatedPaidFor);
  };

  // Update splitAmounts when memoizedSplitPeople changes
  useEffect(() => {
    if (memoizedSplitPeople.length > 0) {
      // Initialize split amounts for equal splitting
      if (splitType === 'equal') {
        const perPerson = amount / memoizedSplitPeople.length;
        const newSplitAmounts: Record<string, number> = {};
        
        memoizedSplitPeople.forEach(pid => {
          newSplitAmounts[pid] = perPerson;
        });
        
        setSplitAmounts(newSplitAmounts);
      } else {
        // For unequal, preserve existing amounts or initialize to 0
        const newSplitAmounts: Record<string, number> = {};
        
        memoizedSplitPeople.forEach(pid => {
          newSplitAmounts[pid] = splitAmounts[pid] || 0;
        });
        
        setSplitAmounts(newSplitAmounts);
      }
    }
  }, [memoizedSplitPeople, splitType, amount]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Expense Type selector - hide when editing */}
      {!isEditing && (
        <div className="mb-6">
          <label className="form-label mb-2">Expense Type</label>
          <div className="flex gap-4">
            <button
              type="button"
              className={`${
                expenseType === 'friend' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              } py-2 px-4 rounded-md flex-1 transition-colors`}
              onClick={() => setExpenseType('friend')}
            >
              Friend
            </button>
            <button
              type="button"
              className={`${
                expenseType === 'group' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              } py-2 px-4 rounded-md flex-1 transition-colors`}
              onClick={() => setExpenseType('group')}
            >
              Group
            </button>
          </div>
        </div>
      )}
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          id="description"
          type="text"
          {...register('description', { required: 'Description is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          placeholder="What was this expense for?"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      
      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          <div className="flex items-center">
            <FaMoneyBillAlt className="mr-2 text-gray-500" />
            <span>Amount</span>
          </div>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
          <input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { 
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' }
            })}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            placeholder="0.00"
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>
      
      {/* Date and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2 text-gray-500" />
              <span>Date</span>
            </div>
          </label>
          <input
            id="date"
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center">
              <FaTags className="mr-2 text-gray-500" />
              <span>Category</span>
            </div>
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
            <span>Subcategory</span>
          </label>
          <select
            id="subcategory"
            value={selectedSubcategory}
            onChange={e => setSelectedSubcategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">Select a subcategory</option>
            {subcategories.map(subcat => (
              <option key={subcat._id} value={subcat._id}>{subcat.name}</option>
            ))}
          </select>
        </div>
      </div>
        
      {/* Paid By (Multi-payer) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <div className="flex items-center">
            <FaUsers className="mr-2 text-gray-500" />
            <span>Paid by (multi-payer)</span>
          </div>
        </label>
        {payers.map((payer, idx) => (
          <div key={payer.userId} className="flex items-center gap-2 mb-2">
            <select
              value={payer.userId}
              onChange={e => {
                const newId = e.target.value;
                setPayers(payers.map((p, i) => i === idx ? { ...p, userId: newId } : p));
              }}
              className="px-2 py-1 border rounded"
            >
              {getPossiblePayers().map(opt => (
                <option key={opt.userId} value={opt.userId}>{opt.name}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={payer.amountPaid}
              onChange={e => handlePayerAmountChange(payer.userId, Number(e.target.value))}
              className="w-24 px-2 py-1 border rounded"
              placeholder="Amount paid"
            />
            {payers.length > 1 && (
              <button type="button" onClick={() => handleRemovePayer(payer.userId)} className="text-red-500"><FaMinus /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddPayer} className="text-green-600 flex items-center gap-1 mt-1"><FaPlus /> Add payer</button>
        <div className="text-xs text-gray-500 mt-1">Sum: ₹{paidBySum} / ₹{amount}</div>
        {payerError && <p className="text-red-600 text-sm mt-1">{payerError}</p>}
      </div>
      
      {/* Friend or Group selection based on expenseType */}
      {expenseType === 'friend' && !isEditing && (
        <div>
          <label htmlFor="friendId" className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center">
              <FaUsers className="mr-2 text-gray-500" />
              <span>Friend</span>
            </div>
          </label>
          <select
            id="friendId"
            {...register('friendId', { required: expenseType === 'friend' ? 'Friend is required' : false })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">Select a friend</option>
            {friends.map((friend) => (
              <option key={friend._id} value={friend._id}>
                {friend.name}
              </option>
            ))}
          </select>
          {errors.friendId && (
            <p className="mt-1 text-sm text-red-600">{errors.friendId.message}</p>
          )}
        </div>
      )}
      
      {expenseType === 'group' && !isEditing && (
        <div>
          <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center">
              <FaUsers className="mr-2 text-gray-500" />
              <span>Group</span>
            </div>
          </label>
          <select
            id="groupId"
            {...register('groupId', { required: expenseType === 'group' ? 'Group is required' : false })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">Select a group</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
          {errors.groupId && (
            <p className="mt-1 text-sm text-red-600">{errors.groupId.message}</p>
          )}
        </div>
      )}
      
      {/* For debugging - show the effective group ID when editing */}
      {/* {isEditing && (
        <div className="text-xs text-gray-500">
          {expenseType === 'group' ? (
            `Editing Group Expense: ${selectedGroupId ? groups.find(g => g._id === selectedGroupId)?.name || 'Unknown Group' : 'Unknown Group'}`
          ) : (
            `Editing Friend Expense: ${selectedFriendId ? friends.find(f => f._id === selectedFriendId)?.name || 'Unknown Friend' : 'Unknown Friend'}`
          )}
        </div>
      )} */}
      
      {/* Split Options */}
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">Split options</span>
        <div className="flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="equal"
              checked={splitType === 'equal'}
              onChange={() => setSplitType('equal')}
              className="form-radio h-4 w-4 text-primary"
            />
            <span className="ml-2 text-sm text-gray-700">Split equally</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="unequal"
              checked={splitType === 'unequal'}
              onChange={() => setSplitType('unequal')}
              className="form-radio h-4 w-4 text-primary"
            />
            <span className="ml-2 text-sm text-gray-700">Split unequally</span>
          </label>
        </div>
      </div>
      
      {/* Custom Split UI for Unequal Split */}
      {splitType === 'unequal' && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-3">Specify amounts for each person:</h3>
          {memoizedSplitPeople.map(personId => (
            <div key={personId} className="flex items-center mb-2">
              <span className="w-1/2">{getPersonNameById(personId)}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                value={splitAmounts[personId] || ''}
                onChange={(e) => handleSplitAmountChange(personId, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
          <div className="mt-2 text-sm text-gray-600">
            Sum: ₹{Object.values(splitAmounts).reduce((sum, amount) => sum + (amount || 0), 0).toFixed(2)} / ₹{amount}
          </div>
          {splitError && <p className="text-red-600 text-sm mt-1">{splitError}</p>}
        </div>
      )}
      
      {/* Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 border border-gray-300 rounded-md text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="py-2 px-4 bg-primary hover:bg-primary-dark text-white rounded-md"
        >
          {isEditing ? 'Update Expense' : 'Create Expense'}
        </button>
      </div>
    </form>
  );
} 