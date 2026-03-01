import apiClient from './api';
import type { Expense, Account } from '../types/index';


export interface CategoryAnalytics {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  transactionCount: number;
  [key: string]: any;
}

export interface MonthlyTrend {
  month: string;
  expenses: number;
  income: number;
  net: number;
}

export interface AccountAnalytics {
  account: string;
  balance: number;
  spent: number;
  percentage: number;
}

export interface WeeklySpendingPattern {
  day: string;
  amount: number;
  dayOfWeek: number;
}

export interface SpendingOverTime {
  date: string;
  amount: number;
  cumulativeAmount: number;
}

export interface BudgetAnalytics {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'under' | 'near' | 'over';
}

class AnalyticsService {
  async getCategoryBreakdown(period: 'month' | 'quarter' | 'year' = 'month'): Promise<CategoryAnalytics[]> {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case 'quarter':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    const expenses = await apiClient.get('/expenses', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        limit: 1000
      }
    });

    // Group by category
    const categoryMap = new Map<string, { amount: number; count: number; color: string }>();
    let totalAmount = 0;

    // Handle null/undefined response
    const expensesArray = Array.isArray(expenses) ? expenses : [];

    expensesArray.forEach((expense: Expense) => {
      const categoryName = expense.category?.name || 'Uncategorized';
      const categoryColor = expense.category?.color || '#6B7280';
      const amount = Number(expense.amount) || 0;

      totalAmount += amount;

      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        categoryMap.set(categoryName, {
          amount: existing.amount + amount,
          count: existing.count + 1,
          color: categoryColor
        });
      } else {
        categoryMap.set(categoryName, {
          amount,
          count: 1,
          color: categoryColor
        });
      }
    });

    // Convert to array and calculate percentages
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        color: data.color,
        transactionCount: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  async getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - months + 1, 1);

    const expenses = await apiClient.get('/expenses', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        limit: 10000
      }
    });

    // Group by month
    const monthlyData = new Map<string, { expenses: number; income: number }>();

    // Initialize all months
    for (let i = 0; i < months; i++) {
      const date = new Date(endDate.getFullYear(), endDate.getMonth() - months + 1 + i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData.set(monthKey, { expenses: 0, income: 0 });
    }

    // Aggregate expenses by month
    (expenses as Expense[]).forEach((expense: Expense) => {
      const expenseDate = new Date(expense.date);
      const monthKey = expenseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (monthlyData.has(monthKey)) {
        const existing = monthlyData.get(monthKey)!;
        monthlyData.set(monthKey, {
          ...existing,
          expenses: existing.expenses + (Number(expense.amount) || 0)
        });
      }
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      expenses: data.expenses,
      income: data.income,
      net: data.income - data.expenses
    }));
  }

  async getAccountAnalytics(): Promise<AccountAnalytics[]> {
    const [accounts, expenses] = await Promise.all([
      apiClient.get('/accounts'),
      apiClient.get('/expenses', {
        params: {
          start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          limit: 1000
        }
      })
    ]);

    const accountSpending = new Map<string, number>();
    let totalSpending = 0;

    (expenses as Expense[]).forEach((expense: Expense) => {
      const accountName = expense.account?.name || 'No Account';
      const amount = Number(expense.amount) || 0;
      totalSpending += amount;

      accountSpending.set(accountName, (accountSpending.get(accountName) || 0) + amount);
    });

    return (accounts as Account[]).map((account: Account) => {
      const spent = accountSpending.get(account.name) || 0;
      return {
        account: account.name,
        balance: Number(account.balance) || 0,
        spent,
        percentage: totalSpending > 0 ? (spent / totalSpending) * 100 : 0
      };
    }).sort((a, b) => b.spent - a.spent);
  }

  async getWeeklySpendingPattern(): Promise<WeeklySpendingPattern[]> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    const expenses = await apiClient.get('/expenses', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        limit: 1000
      }
    });

    const daySpending = new Map<number, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      daySpending.set(i, 0);
    }

    (expenses as Expense[]).forEach((expense: Expense) => {
      const expenseDate = new Date(expense.date);
      const dayOfWeek = expenseDate.getDay();
      const amount = Number(expense.amount) || 0;

      daySpending.set(dayOfWeek, (daySpending.get(dayOfWeek) || 0) + amount);
    });

    return Array.from(daySpending.entries()).map(([dayOfWeek, amount]) => ({
      day: dayNames[dayOfWeek],
      amount,
      dayOfWeek
    }));
  }

  async getSpendingOverTime(period: 'month' | 'quarter' = 'month'): Promise<SpendingOverTime[]> {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case 'quarter':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    const expenses = await apiClient.get('/expenses', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        limit: 1000,
        sort: 'date',
        order: 'asc'
      }
    });

    const dailySpending = new Map<string, number>();
    let cumulativeAmount = 0;

    (expenses as Expense[]).forEach((expense: Expense) => {
      const date = expense.date;
      const amount = Number(expense.amount) || 0;

      dailySpending.set(date, (dailySpending.get(date) || 0) + amount);
    });

    return Array.from(dailySpending.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, amount]) => {
        cumulativeAmount += amount;
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
          cumulativeAmount
        };
      });
  }

  async getBudgetAnalytics(): Promise<BudgetAnalytics[]> {
    const budgets = await apiClient.get('/budgets');

    interface Budget {
      amount: number;
      spent?: number;
      category?: { name: string };
    }

    return (budgets as Budget[]).map((budget: Budget) => {
      const percentage = budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0;
      let status: 'under' | 'near' | 'over';

      if (percentage >= 100) {
        status = 'over';
      } else if (percentage >= 80) {
        status = 'near';
      } else {
        status = 'under';
      }

      return {
        category: budget.category?.name || 'Uncategorized',
        budgetAmount: Number(budget.amount) || 0,
        spentAmount: Number(budget.spent || 0) || 0,
        percentage,
        status
      };
    }).sort((a: BudgetAnalytics, b: BudgetAnalytics) => b.percentage - a.percentage);
  }
}

export const analyticsService = new AnalyticsService();