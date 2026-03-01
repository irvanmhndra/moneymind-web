import apiClient from './api';

export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other';
  balance: number;
  currency: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountData {
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other';
  balance?: number;
  currency?: string;
  description?: string;
}

export interface UpdateAccountData {
  name?: string;
  type?: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other';
  balance?: number;
  currency?: string;
  description?: string;
  is_active?: boolean;
}

class AccountService {
  async getAccounts(includeInactive = false): Promise<Account[]> {
    return await apiClient.get('/accounts', {
      params: { include_inactive: includeInactive }
    });
  }

  async getAccount(id: number): Promise<Account> {
    return await apiClient.get(`/accounts/${id}`);
  }

  async createAccount(data: CreateAccountData): Promise<Account> {
    return await apiClient.post('/accounts', data);
  }

  async updateAccount(id: number, data: UpdateAccountData): Promise<Account> {
    return await apiClient.patch(`/accounts/${id}`, data);
  }

  async deleteAccount(id: number): Promise<void> {
    return await apiClient.delete(`/accounts/${id}`);
  }
}

export const accountService = new AccountService();