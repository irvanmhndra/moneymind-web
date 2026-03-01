import apiClient from './api';

export interface SplitExpense {
  id: number;
  expense_id: number;
  payer_user_id: number;
  total_amount: number;
  split_type: 'equal' | 'percentage' | 'amount';
  description: string;
  created_at: string;
  updated_at: string;
  expense?: {
    id: number;
    amount: number;
    description: string;
    date: string;
    category?: {
      id: number;
      name: string;
    };
  };
  payer_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  participants?: SplitParticipant[];
}

export interface SplitParticipant {
  id: number;
  split_expense_id: number;
  user_id?: number;
  email: string;
  name: string;
  amount_owed: number;
  amount_paid: number;
  percentage?: number;
  is_settled: boolean;
  settled_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateSplitExpenseData {
  expense_id: number;
  total_amount: number;
  split_type: 'equal' | 'percentage' | 'amount';
  description?: string;
  participants: CreateSplitParticipantData[];
}

export interface CreateSplitParticipantData {
  user_id?: number;
  email: string;
  name: string;
  amount_owed?: number;
  percentage?: number;
}

export interface UpdateSplitExpenseData {
  total_amount?: number;
  split_type?: 'equal' | 'percentage' | 'amount';
  description?: string;
  participants?: CreateSplitParticipantData[];
}

export interface SplitExpenseFilters {
  expense_id?: number;
  payer_user_id?: number;
  split_type?: 'equal' | 'percentage' | 'amount';
  is_settled?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface SettleParticipantData {
  amount_paid: number;
}

class SplitExpenseService {
  async getSplitExpenses(filters?: SplitExpenseFilters): Promise<SplitExpense[]> {
    return await apiClient.get('/split-expenses', {
      params: filters
    });
  }

  async getSplitExpense(id: number): Promise<SplitExpense> {
    return await apiClient.get(`/split-expenses/${id}`);
  }

  async createSplitExpense(data: CreateSplitExpenseData): Promise<SplitExpense> {
    return await apiClient.post('/split-expenses', data);
  }

  async updateSplitExpense(id: number, data: UpdateSplitExpenseData): Promise<SplitExpense> {
    return await apiClient.patch(`/split-expenses/${id}`, data);
  }

  async deleteSplitExpense(id: number): Promise<void> {
    return await apiClient.delete(`/split-expenses/${id}`);
  }

  async getUserSplitExpenses(): Promise<SplitExpense[]> {
    return await apiClient.get('/split-expenses/user');
  }

  async settleParticipant(splitExpenseId: number, participantId: number, data: SettleParticipantData): Promise<SplitParticipant> {
    return await apiClient.patch(`/split-expenses/${splitExpenseId}/participants/${participantId}/settle`, data);
  }

  async unsettleParticipant(splitExpenseId: number, participantId: number): Promise<SplitParticipant> {
    return await apiClient.patch(`/split-expenses/${splitExpenseId}/participants/${participantId}/unsettle`);
  }

  async getSplitExpensesByExpense(expenseId: number): Promise<SplitExpense[]> {
    return await apiClient.get(`/expenses/${expenseId}/split-expenses`);
  }

  // Utility functions for split calculations
  calculateEqualSplit(totalAmount: number, participantCount: number): number {
    return Math.round((totalAmount / participantCount) * 100) / 100;
  }

  calculatePercentageSplit(totalAmount: number, percentage: number): number {
    return Math.round((totalAmount * percentage / 100) * 100) / 100;
  }

  validateParticipants(participants: CreateSplitParticipantData[], splitType: string, totalAmount: number): string | null {
    if (participants.length < 2) {
      return 'At least 2 participants are required';
    }

    if (splitType === 'percentage') {
      const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return 'Percentages must add up to 100%';
      }
    }

    if (splitType === 'amount') {
      const totalAmount_ = participants.reduce((sum, p) => sum + (p.amount_owed || 0), 0);
      if (Math.abs(totalAmount_ - totalAmount) > 0.01) {
        return 'Individual amounts must add up to total amount';
      }
    }

    return null;
  }

  async markParticipantSettled(splitExpenseId: number, participantId: number): Promise<void> {
    return apiClient.patch(`/split-expenses/${splitExpenseId}/participants/${participantId}/settle`);
  }
}

export const splitExpenseService = new SplitExpenseService();