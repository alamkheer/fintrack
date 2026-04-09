import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { dbService, syncChannel } from '../services/db';
import type { Category } from '../types/schema';

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  addCategory: (data: Omit<Category, 'id' | 'syncMeta'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    const loaded = await dbService.getAll<Category>('categories');
    setCategories(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshCategories();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DATA_CHANGED' && event.data.store === 'categories') {
        refreshCategories();
      }
    };

    syncChannel.addEventListener('message', handleMessage);
    return () => syncChannel.removeEventListener('message', handleMessage);
  }, [refreshCategories]);

  const addCategory = async (data: Omit<Category, 'id' | 'syncMeta'>) => {
    const newCategory = await dbService.addCategory(data);
    await refreshCategories();
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = await dbService.updateCategory(id, updates);
    await refreshCategories();
    return updated;
  };

  const deleteCategory = async (id: string) => {
    await dbService.softDeleteCategory(id);
    await refreshCategories();
  };

  return (
    <CategoryContext.Provider value={{ 
      categories, 
      isLoading, 
      addCategory, 
      updateCategory, 
      deleteCategory, 
      refreshCategories 
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
