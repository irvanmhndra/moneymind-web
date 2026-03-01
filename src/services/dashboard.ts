import apiClient from './api';
import type { Expense } from '../types/index';
import type { BudgetSummary } from './budgets';
import type { GoalSummary } from './goals';

export interface DashboardStats {
  totalExpenses: {
    amount: number;
    period: string;
    change: number;
  };
  budgetUsage: {
    percentage: number;
    spent: number;
    budget: number;
    overBudgetCount: number;
  };
  activeGoals: {
    count: number;
    totalTarget: number;
    totalCurrent: number;
    progressPercentage: number;
  };
  savings: {
    amount: number;
    change: number;
  };
}

export interface RecentExpense {
  id: number;
  amount: number;
  currency: string;
  description: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
  date: string;
  account?: {
    name: string;
  };
}

export interface QuickStats {
  thisMonth: {
    expenses: number;
    income: number;
    net: number;
  };
  lastMonth: {
    expenses: number;
    income: number;
    net: number;
  };
  changes: {
    expensesChange: number;
    incomeChange: number;
    netChange: number;
  };
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get current month expenses
      const currentExpenses = await apiClient.get<Expense[]>('/expenses', {
      params: {
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
        limit: 1000
      }
    });

    // Get last month expenses for comparison
    const lastMonthExpenses = await apiClient.get<Expense[]>('/expenses', {
      params: {
        start_date: startOfLastMonth.toISOString().split('T')[0],
        end_date: endOfLastMonth.toISOString().split('T')[0],
        limit: 1000
      }
    });

    // Get budget summary
    const budgetSummary = await apiClient.get<BudgetSummary>('/budgets/summary');

    // Get goal summary
    const goalSummary = await apiClient.get<GoalSummary>('/goals/summary');

    // Handle null/undefined responses
    const currentExpensesArray = Array.isArray(currentExpenses) ? currentExpenses : [];
    const lastMonthExpensesArray = Array.isArray(lastMonthExpenses) ? lastMonthExpenses : [];
    const budgetSummaryData = budgetSummary || {} as BudgetSummary;
    const goalSummaryData = goalSummary || {} as GoalSummary;

    const currentTotal = currentExpensesArray.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
    const lastMonthTotal = lastMonthExpensesArray.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
    const expenseChange = lastMonthTotal > 0 ? ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    return {
      totalExpenses: {
        amount: currentTotal,
        period: 'This month',
        change: expenseChange
      },
      budgetUsage: {
        percentage: budgetSummaryData.total_budget_amount > 0 ?
          (budgetSummaryData.total_spent_amount / budgetSummaryData.total_budget_amount) * 100 : 0,
        spent: budgetSummaryData.total_spent_amount || 0,
        budget: budgetSummaryData.total_budget_amount || 0,
        overBudgetCount: budgetSummaryData.over_budget_count || 0
      },
      activeGoals: {
        count: goalSummaryData.active_goals || 0,
        totalTarget: goalSummaryData.total_target_amount || 0,
        totalCurrent: goalSummaryData.total_current_amount || 0,
        progressPercentage: goalSummaryData.overall_progress || 0
      },
      savings: {
        amount: goalSummaryData.total_current_amount || 0,
        change: 0 // We'll calculate this if needed
      }
    };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return empty/default stats when API fails
      return {
        totalExpenses: {
          amount: 0,
          period: 'This month',
          change: 0
        },
        budgetUsage: {
          percentage: 0,
          spent: 0,
          budget: 0,
          overBudgetCount: 0
        },
        activeGoals: {
          count: 0,
          totalTarget: 0,
          totalCurrent: 0,
          progressPercentage: 0
        },
        savings: {
          amount: 0,
          change: 0
        }
      };
    }
  }

  async getRecentExpenses(limit: number = 10): Promise<RecentExpense[]> {
    try {
      const expenses = await apiClient.get('/expenses', {
        params: {
          limit,
          sort: 'date',
          order: 'desc'
        }
      });

      // Handle null or undefined response
      if (!expenses || !Array.isArray(expenses)) {
        console.warn('No expenses data received or invalid format');
        return [];
      }

      return expenses.map((expense: Expense) => ({
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description,
        category: expense.category || { name: 'Uncategorized', color: '#6B7280', icon: '🏷️' },
        date: expense.date,
        account: expense.account
      }));
    } catch (error) {
      console.error('Failed to fetch recent expenses:', error);
      return [];
    }
  }

  async getQuickStats(): Promise<QuickStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentExpenses, lastMonthExpenses] = await Promise.all([
      apiClient.get<Expense[]>('/expenses', {
        params: {
          start_date: startOfMonth.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
          limit: 1000
        }
      }),
      apiClient.get<Expense[]>('/expenses', {
        params: {
          start_date: startOfLastMonth.toISOString().split('T')[0],
          end_date: endOfLastMonth.toISOString().split('T')[0],
          limit: 1000
        }
      })
    ]);

    const thisMonthExpenses = currentExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
    const lastMonthExpensesTotal = lastMonthExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);

    const expensesChange = lastMonthExpensesTotal > 0 ? 
      ((thisMonthExpenses - lastMonthExpensesTotal) / lastMonthExpensesTotal) * 100 : 0;

    return {
      thisMonth: {
        expenses: thisMonthExpenses,
        income: 0, // We don't track income yet
        net: -thisMonthExpenses
      },
      lastMonth: {
        expenses: lastMonthExpensesTotal,
        income: 0,
        net: -lastMonthExpensesTotal
      },
      changes: {
        expensesChange,
        incomeChange: 0,
        netChange: expensesChange * -1
      }
    };
  }
}

export const dashboardService = new DashboardService();