import apiClient from './api';
import type { Expense, Category, Account, Budget, Goal } from '../types/index';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: 'expense' | 'category' | 'account' | 'budget' | 'goal' | 'split-expense';
  url: string;
  amount?: number;
  currency?: string;
  date?: string;
  icon?: string;
  color?: string;
}

export interface SearchFilters {
  types?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

class SearchService {
  async globalSearch(query: string, filters?: SearchFilters, limit: number = 20): Promise<SearchResult[]> {
    if (!query.trim() || query.trim().length < 2) {
      return [];
    }

    const results: SearchResult[] = [];

    try {
      // Search expenses
      if (!filters?.types || filters.types.includes('expense')) {
        const expenseResults = await this.searchExpenses(query, limit);
        results.push(...expenseResults);
      }

      // Search categories
      if (!filters?.types || filters.types.includes('category')) {
        const categoryResults = await this.searchCategories(query, limit);
        results.push(...categoryResults);
      }

      // Search accounts
      if (!filters?.types || filters.types.includes('account')) {
        const accountResults = await this.searchAccounts(query, limit);
        results.push(...accountResults);
      }

      // Search budgets
      if (!filters?.types || filters.types.includes('budget')) {
        const budgetResults = await this.searchBudgets(query, limit);
        results.push(...budgetResults);
      }

      // Search goals
      if (!filters?.types || filters.types.includes('goal')) {
        const goalResults = await this.searchGoals(query, limit);
        results.push(...goalResults);
      }

      // Search split expenses
      if (!filters?.types || filters.types.includes('split-expense')) {
        const splitExpenseResults = await this.searchSplitExpenses(query, limit);
        results.push(...splitExpenseResults);
      }

      // Sort results by relevance (simple scoring based on query match)
      return this.sortResultsByRelevance(results, query).slice(0, limit);
    } catch (error) {
      console.error('Global search failed:', error);
      return [];
    }
  }

  private async searchExpenses(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const expenses = await apiClient.get<Expense[]>('/expenses', {
        params: {
          search: query,
          limit: limit * 2, // Get more to filter later
          sort: 'date',
          order: 'desc'
        }
      });

      return expenses.map((expense: Expense) => ({
        id: `expense_${expense.id}`,
        title: expense.description,
        subtitle: expense.category?.name || 'Uncategorized',
        description: expense.notes,
        type: 'expense' as const,
        url: `/expenses`,
        amount: expense.amount,
        currency: expense.currency || 'USD',
        date: expense.date,
        icon: expense.category?.icon || '💰',
        color: expense.category?.color || '#6B7280'
      }));
    } catch (error) {
      console.error('Expense search failed:', error);
      return [];
    }
  }

  private async searchCategories(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const categories = await apiClient.get<Category[]>('/categories', {
        params: { search: query, limit }
      });

      return categories.map((category: Category) => ({
        id: `category_${category.id}`,
        title: category.name,
        subtitle: 'Category',
        description: undefined,
        type: 'category' as const,
        url: `/categories`,
        icon: category.icon || '📁',
        color: category.color || '#6B7280'
      }));
    } catch (error) {
      console.error('Category search failed:', error);
      return [];
    }
  }

  private async searchAccounts(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const accounts = await apiClient.get<Account[]>('/accounts', {
        params: { search: query, limit }
      });

      return accounts.map((account: Account) => ({
        id: `account_${account.id}`,
        title: account.name,
        subtitle: `${account.type} Account`,
        description: account.type,
        type: 'account' as const,
        url: `/accounts`,
        amount: account.balance,
        currency: account.currency || 'USD',
        icon: account.type === 'checking' ? '🏦' :
              account.type === 'savings' ? '💵' :
              account.type === 'credit_card' ? '💳' : '🏛️',
        color: '#10B981'
      }));
    } catch (error) {
      console.error('Account search failed:', error);
      return [];
    }
  }

  private async searchBudgets(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const budgets = await apiClient.get<Budget[]>('/budgets', {
        params: { search: query, limit }
      });

      return budgets.map((budget: Budget) => ({
        id: `budget_${budget.id}`,
        title: `${budget.category?.name || 'Budget'} Budget`,
        subtitle: 'Budget',
        description: `Budget: ${budget.amount}`,
        type: 'budget' as const,
        url: `/budgets`,
        amount: budget.amount,
        currency: 'USD',
        icon: '🎯',
        color: '#3B82F6'
      }));
    } catch (error) {
      console.error('Budget search failed:', error);
      return [];
    }
  }

  private async searchGoals(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const goals = await apiClient.get<Goal[]>('/goals', {
        params: { search: query, limit }
      });

      return goals.map((goal: Goal) => ({
        id: `goal_${goal.id}`,
        title: goal.name,
        subtitle: 'Financial Goal',
        description: goal.description,
        type: 'goal' as const,
        url: `/goals`,
        amount: goal.target_amount,
        currency: 'USD',
        icon: '🎯',
        color: '#8B5CF6'
      }));
    } catch (error) {
      console.error('Goal search failed:', error);
      return [];
    }
  }

  private async searchSplitExpenses(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const splitExpenses = await apiClient.get<any[]>('/split-expenses', {
        params: { search: query, limit }
      });

      return splitExpenses.map((splitExpense: any) => ({
        id: `split_expense_${splitExpense.id}`,
        title: splitExpense.expense?.description || splitExpense.description || 'Split Expense',
        subtitle: `Split with ${splitExpense.participants?.length || 0} people`,
        description: `${splitExpense.split_type} split`,
        type: 'split-expense' as const,
        url: `/split-expenses`,
        amount: splitExpense.total_amount,
        currency: splitExpense.currency || 'USD',
        icon: '👥',
        color: '#F59E0B'
      }));
    } catch (error) {
      console.error('Split expense search failed:', error);
      return [];
    }
  }

  private sortResultsByRelevance(results: SearchResult[], query: string): SearchResult[] {
    const queryLower = query.toLowerCase();

    return results.sort((a, b) => {
      // Calculate relevance scores
      const scoreA = this.calculateRelevanceScore(a, queryLower);
      const scoreB = this.calculateRelevanceScore(b, queryLower);

      return scoreB - scoreA; // Sort descending (highest score first)
    });
  }

  private calculateRelevanceScore(result: SearchResult, queryLower: string): number {
    let score = 0;

    // Title exact match gets highest score
    if (result.title.toLowerCase() === queryLower) {
      score += 100;
    }

    // Title starts with query gets high score
    if (result.title.toLowerCase().startsWith(queryLower)) {
      score += 80;
    }

    // Title contains query gets medium score
    if (result.title.toLowerCase().includes(queryLower)) {
      score += 50;
    }

    // Subtitle match gets medium score
    if (result.subtitle?.toLowerCase().includes(queryLower)) {
      score += 30;
    }

    // Description match gets low score
    if (result.description?.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Recent items get bonus points (for expenses)
    if (result.date) {
      const daysDiff = Math.abs(new Date().getTime() - new Date(result.date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) score += 20; // Recent items
      else if (daysDiff <= 30) score += 10; // Month old items
    }

    return score;
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim() || query.trim().length < 1) {
      return this.getDefaultSuggestions();
    }

    try {
      // Get recent searches from localStorage
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');

      // Filter recent searches that match the query
      const matchingRecent = recentSearches.filter((search: string) =>
        search.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);

      // Get category suggestions
      const categories = await apiClient.get<Category[]>('/categories', { params: { limit: 5 } });
      const categorySuggestions = categories
        .filter((cat: Category) => cat.name.toLowerCase().includes(query.toLowerCase()))
        .map((cat: Category) => cat.name)
        .slice(0, 3);

      // Combine and deduplicate suggestions
      const allSuggestions = [...matchingRecent, ...categorySuggestions];
      return [...new Set(allSuggestions)].slice(0, 5);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return this.getDefaultSuggestions();
    }
  }

  private getDefaultSuggestions(): string[] {
    return [
      'Groceries',
      'Coffee',
      'Gas',
      'Restaurant',
      'Utilities'
    ];
  }

  saveSearch(query: string): void {
    if (!query.trim()) return;

    try {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');

      // Remove if already exists
      const filtered = recentSearches.filter((search: string) => search !== query);

      // Add to beginning
      const updated = [query, ...filtered].slice(0, 10); // Keep only last 10

      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }

  clearRecentSearches(): void {
    localStorage.removeItem('recentSearches');
  }
}

export const searchService = new SearchService();