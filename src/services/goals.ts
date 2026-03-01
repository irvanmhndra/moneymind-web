import apiClient from './api';

export interface Goal {
  id: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  category?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
  progress_percentage: number;
  remaining_amount: number;
  days_left?: number;
  is_achievable: boolean;
  monthly_contribution_needed?: number;
  contributions: {
    id: number;
    amount: number;
    date: string;
    notes?: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  name: string;
  description?: string;
  target_amount: number;
  currency?: string;
  target_date?: string;
  priority?: 'low' | 'medium' | 'high';
  category_id?: number;
}

export interface UpdateGoalData {
  name?: string;
  description?: string;
  target_amount?: number;
  currency?: string;
  target_date?: string;
  priority?: 'low' | 'medium' | 'high';
  category_id?: number;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface GoalContribution {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface CreateContributionData {
  amount: number;
  date: string;
  notes?: string;
}

export interface GoalFilters {
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  category_id?: number;
  target_date_from?: string;
  target_date_to?: string;
  achievable_only?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'target_amount' | 'progress_percentage' | 'target_date' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface GoalSummary {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_target_amount: number;
  total_current_amount: number;
  total_remaining_amount: number;
  overall_progress: number;
  goals_on_track: number;
  goals_behind: number;
  upcoming_targets: {
    goal_id: number;
    goal_name: string;
    target_date: string;
    days_left: number;
  }[];
}

export interface GoalAnalytics {
  goal_id: number;
  goal_name: string;
  contribution_history: {
    date: string;
    amount: number;
    cumulative_amount: number;
  }[];
  monthly_progress: {
    month: string;
    contributions: number;
    cumulative_total: number;
    progress_percentage: number;
  }[];
  projection: {
    estimated_completion_date: string;
    monthly_contribution_needed: number;
    is_on_track: boolean;
  };
}

class GoalService {
  async getGoals(filters?: GoalFilters): Promise<Goal[]> {
    const params = filters ? { ...filters } : {};
    return await apiClient.get('/goals', { params });
  }

  async getGoal(id: number): Promise<Goal> {
    return await apiClient.get(`/goals/${id}`);
  }

  async createGoal(data: CreateGoalData): Promise<Goal> {
    return await apiClient.post('/goals', data);
  }

  async updateGoal(id: number, data: UpdateGoalData): Promise<Goal> {
    return await apiClient.patch(`/goals/${id}`, data);
  }

  async deleteGoal(id: number): Promise<void> {
    return await apiClient.delete(`/goals/${id}`);
  }

  async getGoalSummary(filters?: Omit<GoalFilters, 'limit' | 'offset' | 'sort' | 'order'>): Promise<GoalSummary> {
    const params = filters ? { ...filters } : {};
    return await apiClient.get('/goals/summary', { params });
  }

  async getGoalAnalytics(id: number, startDate?: string, endDate?: string): Promise<GoalAnalytics> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    return await apiClient.get(`/goals/${id}/analytics`, { params });
  }

  async addContribution(goalId: number, data: CreateContributionData): Promise<GoalContribution> {
    return await apiClient.post(`/goals/${goalId}/contributions`, data);
  }

  async updateContribution(goalId: number, contributionId: number, data: Partial<CreateContributionData>): Promise<GoalContribution> {
    return await apiClient.patch(`/goals/${goalId}/contributions/${contributionId}`, data);
  }

  async deleteContribution(goalId: number, contributionId: number): Promise<void> {
    return await apiClient.delete(`/goals/${goalId}/contributions/${contributionId}`);
  }

  async getContributions(goalId: number, limit?: number): Promise<GoalContribution[]> {
    const params: Record<string, number> = {};
    if (limit) params.limit = limit;
    
    return await apiClient.get(`/goals/${goalId}/contributions`, { params });
  }

  async duplicateGoal(id: number): Promise<Goal> {
    return await apiClient.post(`/goals/${id}/duplicate`);
  }

  async completeGoal(id: number): Promise<Goal> {
    return await apiClient.post(`/goals/${id}/complete`);
  }

  async pauseGoal(id: number): Promise<Goal> {
    return await apiClient.post(`/goals/${id}/pause`);
  }

  async resumeGoal(id: number): Promise<Goal> {
    return await apiClient.post(`/goals/${id}/resume`);
  }

  async calculateProjection(goalId: number, monthlyContribution: number): Promise<{
    estimated_completion_date: string;
    total_months_needed: number;
    is_achievable_by_target_date: boolean;
  }> {
    return await apiClient.post(`/goals/${goalId}/projection`, {
      monthly_contribution: monthlyContribution
    });
  }
}

export const goalService = new GoalService();