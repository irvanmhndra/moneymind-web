import apiClient from './api';

export interface Budget {
  id: number;
  name: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  category_ids: number[];
  start_date: string;
  end_date?: string;
  is_active: boolean;
  categories: {
    id: number;
    name: string;
    color: string;
    icon: string;
  }[];
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  days_left?: number;
  is_over_budget: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetData {
  name: string;
  amount: number;
  currency?: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  category_ids: number[];
  start_date: string;
  end_date?: string;
}

export interface UpdateBudgetData {
  name?: string;
  amount?: number;
  currency?: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  category_ids?: number[];
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface BudgetFilters {
  is_active?: boolean;
  period?: 'monthly' | 'quarterly' | 'yearly';
  category_id?: number;
  over_budget_only?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'amount' | 'created_at' | 'percentage_used';
  order?: 'asc' | 'desc';
}

export interface BudgetSummary {
  total_budgets: number;
  active_budgets: number;
  total_budget_amount: number;
  total_spent_amount: number;
  total_remaining_amount: number;
  over_budget_count: number;
  average_usage_percentage: number;
  upcoming_budget_renewals: {
    budget_id: number;
    budget_name: string;
    renewal_date: string;
  }[];
}

export interface BudgetAnalytics {
  budget_id: number;
  budget_name: string;
  daily_spending: {
    date: string;
    amount: number;
  }[];
  category_breakdown: {
    category_id: number;
    category_name: string;
    amount: number;
    percentage: number;
  }[];
  monthly_comparison: {
    month: string;
    budget_amount: number;
    spent_amount: number;
    percentage_used: number;
  }[];
}

class BudgetService {
  async getBudgets(filters?: BudgetFilters): Promise<Budget[]> {
    const params = filters ? { ...filters } : {};
    return await apiClient.get('/budgets', { params });
  }

  async getBudget(id: number): Promise<Budget> {
    return await apiClient.get(`/budgets/${id}`);
  }

  async createBudget(data: CreateBudgetData): Promise<Budget> {
    return await apiClient.post('/budgets', data);
  }

  async updateBudget(id: number, data: UpdateBudgetData): Promise<Budget> {
    return await apiClient.patch(`/budgets/${id}`, data);
  }

  async deleteBudget(id: number): Promise<void> {
    return await apiClient.delete(`/budgets/${id}`);
  }

  async getBudgetSummary(filters?: Omit<BudgetFilters, 'limit' | 'offset' | 'sort' | 'order'>): Promise<BudgetSummary> {
    const params = filters ? { ...filters } : {};
    return await apiClient.get('/budgets/summary', { params });
  }

  async getBudgetAnalytics(id: number, startDate?: string, endDate?: string): Promise<BudgetAnalytics> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    return await apiClient.get(`/budgets/${id}/analytics`, { params });
  }

  async duplicateBudget(id: number): Promise<Budget> {
    return await apiClient.post(`/budgets/${id}/duplicate`);
  }

  async resetBudget(id: number): Promise<Budget> {
    return await apiClient.post(`/budgets/${id}/reset`);
  }

  async getBudgetHistory(id: number, limit?: number): Promise<{
    date: string;
    amount: number;
    description: string;
    category_name: string;
  }[]> {
    const params: Record<string, number> = {};
    if (limit) params.limit = limit;
    
    return await apiClient.get(`/budgets/${id}/history`, { params });
  }
}

export const budgetService = new BudgetService();