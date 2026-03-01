import apiClient from './api';

export interface Expense {
  id: number;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
  account?: {
    id: number;
    name: string;
    type: string;
  };
  receipt_url?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  amount: number;
  currency?: string;
  description: string;
  date: string;
  category_id: number;
  account_id?: number;
  notes?: string;
  tags?: string[];
}

export interface UpdateExpenseData {
  amount?: number;
  currency?: string;
  description?: string;
  date?: string;
  category_id?: number;
  account_id?: number;
  notes?: string;
  tags?: string[];
}

export interface ExpenseFilters {
  category_id?: number;
  account_id?: number;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sort?: 'date' | 'amount' | 'description' | 'category';
  order?: 'asc' | 'desc';
}

export interface ExpenseSummary {
  total_amount: number;
  total_count: number;
  average_amount: number;
  categories: {
    category_id: number;
    category_name: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  monthly_totals: {
    month: string;
    amount: number;
    count: number;
  }[];
}

class ExpenseService {
  async getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    const params = filters ? { ...filters } : {};

    // Convert arrays to comma-separated strings for API
    if (params.tags && Array.isArray(params.tags)) {
      (params as Record<string, unknown>).tags = params.tags.join(',');
    }
    
    return await apiClient.get('/expenses', { params });
  }

  async getExpense(id: number): Promise<Expense> {
    return await apiClient.get(`/expenses/${id}`);
  }

  async createExpense(data: CreateExpenseData): Promise<Expense> {
    return await apiClient.post('/expenses', data);
  }

  async updateExpense(id: number, data: UpdateExpenseData): Promise<Expense> {
    return await apiClient.patch(`/expenses/${id}`, data);
  }

  async deleteExpense(id: number): Promise<void> {
    return await apiClient.delete(`/expenses/${id}`);
  }

  async uploadReceipt(expenseId: number, file: File, onProgress?: (progress: number) => void): Promise<{ receipt_url: string }> {
    const formData = new FormData();
    formData.append('receipt', file);
    
    return await apiClient.upload(`/expenses/${expenseId}/receipt`, formData, onProgress);
  }

  async deleteReceipt(expenseId: number): Promise<void> {
    return await apiClient.delete(`/expenses/${expenseId}/receipt`);
  }

  async getExpenseSummary(filters?: Omit<ExpenseFilters, 'limit' | 'offset' | 'sort' | 'order'>): Promise<ExpenseSummary> {
    const params = filters ? { ...filters } : {};

    // Convert arrays to comma-separated strings for API
    if (params.tags && Array.isArray(params.tags)) {
      (params as Record<string, unknown>).tags = params.tags.join(',');
    }
    
    return await apiClient.get('/expenses/summary', { params });
  }

  async bulkDeleteExpenses(ids: number[]): Promise<void> {
    return await apiClient.post('/expenses/bulk-delete', { ids });
  }

  async duplicateExpense(id: number): Promise<Expense> {
    return await apiClient.post(`/expenses/${id}/duplicate`);
  }
}

export const expenseService = new ExpenseService();