import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Target, PieChart, Calendar, Download } from 'lucide-react';
import { dashboardService, type DashboardStats, type RecentExpense } from '../services/dashboard';
import ExportModal from '../components/modals/ExportModal';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [dashboardStats, expenses] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getRecentExpenses(5)
        ]);
        
        setStats(dashboardStats);
        setRecentExpenses(expenses);
      } catch (err: unknown) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
        // If it's an auth error, don't keep retrying
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status?: number } };
          if (axiosError.response?.status === 401) {
            console.log('Dashboard: Authentication error, stopping data fetch');
            return;
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </button>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Expenses */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
              <p className="text-3xl font-bold text-primary-600">
                {formatCurrency(stats?.totalExpenses.amount || 0)}
              </p>
              <div className="flex items-center text-sm">
                {stats?.totalExpenses.change && stats.totalExpenses.change !== 0 ? (
                  <>
                    {stats.totalExpenses.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                    )}
                    <span className={stats.totalExpenses.change > 0 ? 'text-red-600' : 'text-green-600'}>
                      {Math.abs(stats.totalExpenses.change).toFixed(1)}% vs last month
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">This month</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Usage */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PieChart className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Budget Used</h3>
              <p className="text-3xl font-bold text-warning-600">
                {stats?.budgetUsage.percentage.toFixed(0) || 0}%
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(stats?.budgetUsage.spent || 0)} of {formatCurrency(stats?.budgetUsage.budget || 0)}
              </p>
              {stats?.budgetUsage.overBudgetCount && stats.budgetUsage.overBudgetCount > 0 && (
                <p className="text-sm text-red-600">
                  {stats.budgetUsage.overBudgetCount} over budget
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active Goals */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Active Goals</h3>
              <p className="text-3xl font-bold text-success-600">
                {stats?.activeGoals.count || 0}
              </p>
              <p className="text-sm text-gray-500">
                {stats?.activeGoals.progressPercentage.toFixed(0) || 0}% average progress
              </p>
            </div>
          </div>
        </div>

        {/* Savings Progress */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Goal Progress</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(stats?.activeGoals.totalCurrent || 0)}
              </p>
              <p className="text-sm text-gray-500">
                of {formatCurrency(stats?.activeGoals.totalTarget || 0)} target
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/expenses/new"
            className="flex items-center justify-center px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Add Expense
          </Link>
          <Link
            to="/budgets/new"
            className="flex items-center justify-center px-4 py-3 bg-warning-50 text-warning-700 rounded-lg hover:bg-warning-100 transition-colors"
          >
            <PieChart className="h-5 w-5 mr-2" />
            Create Budget
          </Link>
          <Link
            to="/goals/new"
            className="flex items-center justify-center px-4 py-3 bg-success-50 text-success-700 rounded-lg hover:bg-success-100 transition-colors"
          >
            <Target className="h-5 w-5 mr-2" />
            Set Goal
          </Link>
          <Link
            to="/analytics"
            className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Calendar className="h-5 w-5 mr-2" />
            View Reports
          </Link>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
          <Link
            to="/expenses"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        
        {recentExpenses.length > 0 ? (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: expense.category.color }}
                  >
                    {expense.category.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{expense.category.name}</span>
                      {expense.account && (
                        <>
                          <span>•</span>
                          <span>{expense.account.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No expenses yet</p>
            <Link
              to="/expenses/new"
              className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              Add your first expense
            </Link>
          </div>
        )}
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultDataTypes={{ 
          expenses: true, 
          budgets: true, 
          goals: true, 
          categories: true, 
          accounts: true 
        }}
        title="Export All Data"
      />
    </div>
  );
};

export default Dashboard;