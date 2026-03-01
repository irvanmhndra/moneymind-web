import apiClient from './api';

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
  icon?: string;
  description?: string;
  is_active?: boolean;
}

class CategoryService {
  async getCategories(includeInactive = false): Promise<Category[]> {
    return await apiClient.get('/categories', {
      params: { include_inactive: includeInactive }
    });
  }

  async getCategory(id: number): Promise<Category> {
    return await apiClient.get(`/categories/${id}`);
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    return await apiClient.post('/categories', data);
  }

  async updateCategory(id: number, data: UpdateCategoryData): Promise<Category> {
    return await apiClient.patch(`/categories/${id}`, data);
  }

  async deleteCategory(id: number): Promise<void> {
    return await apiClient.delete(`/categories/${id}`);
  }
}

export const categoryService = new CategoryService();