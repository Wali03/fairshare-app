import { create } from 'zustand';
import { fetchCategories as apiFetchCategories, fetchSubcategories as apiFetchSubcategories } from '../api';

export interface Category {
  _id: string;
  name: string;
  subcategories: string[];
}

export interface Subcategory {
  _id: string;
  name: string;
  image?: string;
}

interface CategoryState {
  categories: Category[];
  subcategories: Subcategory[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchSubcategoriesForCategory: (categoryId: string) => Promise<void>;
  fetchAllSubcategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  subcategories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiFetchCategories();
      console.log('Categories response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        set({ 
          categories: response.data.data,
          isLoading: false
        });
        
        // Fetch all subcategories for all categories
        get().fetchAllSubcategories();
      } else {
        set({
          categories: [],
          isLoading: false,
          error: 'Failed to fetch categories'
        });
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      set({
        isLoading: false,
        error: error.message || 'An error occurred while fetching categories'
      });
    }
  },

  fetchSubcategoriesForCategory: async (categoryId: string) => {
    try {
      const response = await apiFetchSubcategories(categoryId);
      console.log(`Subcategories for ${categoryId}:`, response.data);
      
      if (response.data.success && Array.isArray(response.data.subcategories)) {
        // Merge with existing subcategories rather than replacing
        set(state => ({ 
          subcategories: [...state.subcategories.filter(s => 
            !response.data.subcategories.some((newSub: Subcategory) => newSub._id === s._id)
          ), ...response.data.subcategories]
        }));
        return response.data.subcategories;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  },

  fetchAllSubcategories: async () => {
    const { categories } = get();
    const allSubcategories: Subcategory[] = [];
    
    console.log('Fetching subcategories for all categories:', categories.length);
    
    for (const category of categories) {
      try {
        const subcats = await get().fetchSubcategoriesForCategory(category._id);
        console.log(`Fetched ${subcats.length} subcategories for category ${category.name}`);
        
        // No need to process subcats as they're already added in fetchSubcategoriesForCategory
      } catch (error) {
        console.error(`Error fetching subcategories for category ${category._id}:`, error);
      }
    }
    
    console.log('Finished fetching all subcategories');
  }
})); 