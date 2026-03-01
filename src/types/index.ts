// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  currency?: string;
  timezone?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Category types
export interface Category {
  id: number;
  user_id?: number;
  name: string;
  color: string;
  icon: string;
  is_system: boolean;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: Category;
  subcategories?: Category[];
}

export interface CategoryCreate {
  name: string;
  color?: string;
  icon?: string;
  parent_id?: number;
}

// Account types
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other';

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
}

// Expense types
export interface Expense {
  id: number;
  user_id: number;
  account_id?: number;
  category_id?: number;
  amount: number;
  currency: string;
  description: string;
  notes: string;
  location: string;
  receipt_path: string;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tax_deductible: boolean;
  tax_category: string;
  created_at: string;
  updated_at: string;
  account?: Account;
  category?: Category;
}

export interface ExpenseCreate {
  account_id?: number;
  category_id?: number;
  amount: number;
  currency?: string;
  description: string;
  notes?: string;
  location?: string;
  date: string;
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tax_deductible?: boolean;
  tax_category?: string;
}

export interface ExpenseFilter {
  start_date?: string;
  end_date?: string;
  category_id?: number;
  account_id?: number;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  tax_deductible?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Budget types
export interface Budget {
  id: number;
  user_id: number;
  name: string;
  category_id?: number;
  amount: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface BudgetStatus extends Budget {
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  days_remaining: number;
  is_over_budget: boolean;
  expense_count: number;
  daily_average: number;
  projected_amount: number;
}

// Goal types
export type GoalType = 'savings' | 'debt_payoff' | 'expense_reduction' | 'other';

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  is_achieved: boolean;
  goal_type: GoalType;
  created_at: string;
  updated_at: string;
}

export interface GoalWithProgress extends Goal {
  progress_percentage: number;
  remaining_amount: number;
  days_remaining?: number;
  daily_target_amount?: number;
  on_track: boolean;
}

// Analytics types
export interface ExpenseAnalytics {
  total_expenses: number;
  total_income: number;
  net_amount: number;
  expense_count: number;
  category_breakdown: CategoryExpenseBreakdown[];
  monthly_trends: MonthlyTrend[];
  account_breakdown: AccountExpenseBreakdown[];
  tax_deductible_sum: number;
}

export interface CategoryExpenseBreakdown {
  category_id: number;
  category_name: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  amount: number;
  count: number;
}

export interface AccountExpenseBreakdown {
  account_id: number;
  account_name: string;
  total_amount: number;
  count: number;
}

// Form types
export interface FormError {
  field: string;
  message: string;
}

// API types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}