import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { analyticsService } from '../services/analytics';

const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState(6);

  // Queries for different analytics
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['analytics', 'categories', selectedPeriod],
    queryFn: () => analyticsService.getCategoryBreakdown(selectedPeriod)
  });

  const { data: monthlyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'trends', selectedTrendPeriod],
    queryFn: () => analyticsService.getMonthlyTrends(selectedTrendPeriod)
  });

  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['analytics', 'accounts'],
    queryFn: () => analyticsService.getAccountAnalytics()
  });

  const { data: weeklyPattern, isLoading: weeklyLoading } = useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: () => analyticsService.getWeeklySpendingPattern()
  });

  const { data: spendingOverTime, isLoading: spendingTimeLoading } = useQuery({
    queryKey: ['analytics', 'spending-time', selectedPeriod],
    queryFn: () => analyticsService.getSpendingOverTime(selectedPeriod === 'year' ? 'quarter' : 'month')
  });

  const { data: budgetAnalytics } = useQuery({
    queryKey: ['analytics', 'budgets'],
    queryFn: () => analyticsService.getBudgetAnalytics()
  });

  const StatCard: React.FC<{
    title: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(change).toFixed(1)}% from last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: { color: string; name: string; value: unknown }, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : String(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalExpenses = categoryData?.reduce((sum, cat) => sum + cat.amount, 0) || 0;
  const lastMonthExpenses = monthlyTrends?.[monthlyTrends.length - 2]?.expenses || 0;
  const currentMonthExpenses = monthlyTrends?.[monthlyTrends.length - 1]?.expenses || 0;
  const expenseChange = lastMonthExpenses > 0 ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change={expenseChange}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title="Categories Tracked"
          value={categoryData?.length.toString() || '0'}
          icon={<PieChartIcon className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Accounts"
          value={accountData?.length.toString() || '0'}
          icon={<BarChart3 className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Budget Items"
          value={budgetAnalytics?.length.toString() || '0'}
          icon={<Target className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
            <PieChartIcon className="w-5 h-5 text-gray-500" />
          </div>
          {categoryLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : categoryData && categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  label={(props: unknown) => {
                    const labelProps = props as { category?: string; name?: string; percentage?: number };
                    return `${labelProps.category || labelProps.name}: ${(labelProps.percentage || 0).toFixed(1)}%`;
                  }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>

        {/* Monthly Trends Line Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Trends</h2>
            <select
              value={selectedTrendPeriod}
              onChange={(e) => setSelectedTrendPeriod(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          {trendsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : monthlyTrends && monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Net"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No trend data available
            </div>
          )}
        </div>

        {/* Account Spending */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Account</h2>
          {accountLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : accountData && accountData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accountData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                <YAxis type="category" dataKey="account" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="spent" fill="#6366f1" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No account data available
            </div>
          )}
        </div>

        {/* Weekly Spending Pattern */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Spending Pattern</h2>
          {weeklyLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : weeklyPattern && weeklyPattern.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#10b981" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No weekly pattern data available
            </div>
          )}
        </div>
      </div>

      {/* Spending Over Time Area Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Daily Spending Over Time</h2>
          <Clock className="w-5 h-5 text-gray-500" />
        </div>
        {spendingTimeLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : spendingOverTime && spendingOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={spendingOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulativeAmount"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                name="Cumulative Spending"
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
                name="Daily Spending"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No spending timeline data available
          </div>
        )}
      </div>

      {/* Budget vs Actual */}
      {budgetAnalytics && budgetAnalytics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual Spending</h2>
          <div className="space-y-4">
            {budgetAnalytics.map((budget) => (
              <div key={budget.category} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{budget.category}</span>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        budget.status === 'over' ? 'bg-red-500' :
                        budget.status === 'near' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${
                      budget.status === 'over' ? 'text-red-600' :
                      budget.status === 'near' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {budget.percentage.toFixed(1)}% used
                    </span>
                    {budget.status === 'over' && (
                      <span className="text-xs text-red-600">
                        Over by {formatCurrency(budget.spentAmount - budget.budgetAmount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
        <div className="space-y-3">
          {categoryData && categoryData.length > 0 && (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <p className="text-sm text-blue-700">
                <strong>Top spending category:</strong> {categoryData[0].category} accounts for {categoryData[0].percentage.toFixed(1)}%
                of your total spending ({formatCurrency(categoryData[0].amount)})
              </p>
            </div>
          )}

          {weeklyPattern && (
            <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
              <p className="text-sm text-green-700">
                <strong>Peak spending day:</strong> You tend to spend the most on {
                  weeklyPattern.reduce((max, day) => day.amount > max.amount ? day : max, weeklyPattern[0])?.day
                }
              </p>
            </div>
          )}

          {budgetAnalytics && budgetAnalytics.some(b => b.status === 'over') && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
              <p className="text-sm text-red-700">
                <strong>Budget alert:</strong> You have {budgetAnalytics.filter(b => b.status === 'over').length}
                {budgetAnalytics.filter(b => b.status === 'over').length === 1 ? ' category' : ' categories'} over budget
              </p>
            </div>
          )}

          {expenseChange !== 0 && (
            <div className={`p-3 border-l-4 rounded ${
              expenseChange > 0
                ? 'bg-red-50 border-red-400'
                : 'bg-green-50 border-green-400'
            }`}>
              <p className={`text-sm ${expenseChange > 0 ? 'text-red-700' : 'text-green-700'}`}>
                <strong>Monthly trend:</strong> Your spending has {expenseChange > 0 ? 'increased' : 'decreased'} by {Math.abs(expenseChange).toFixed(1)}%
                compared to last month
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;