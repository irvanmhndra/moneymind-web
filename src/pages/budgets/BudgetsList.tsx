import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Calendar,
  MoreVertical,
  Copy,
  RefreshCw,
  PieChart,
  Clock,
  Download
} from 'lucide-react';
import { budgetService, type Budget, type BudgetFilters } from '../../services/budgets';
import { categoryService, type Category } from '../../services/categories';
import ExportModal from '../../components/modals/ExportModal';
import AddBudgetForm from '../../components/budgets/AddBudgetForm';
import EditBudgetForm from '../../components/budgets/EditBudgetForm';

const BudgetsList: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<BudgetFilters>({
    limit: 50,
    offset: 0,
    sort: 'created_at',
    order: 'desc',
    is_active: true
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [showOverBudgetOnly, setShowOverBudgetOnly] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [budgetsData, categoriesData] = await Promise.all([
        budgetService.getBudgets(filters),
        categoryService.getCategories()
      ]);
      
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: unknown) {
      setError('Failed to load budgets data');
      console.error('Budgets error:', err);
      setBudgets([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const data = await budgetService.getBudgets(filters);
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError('Failed to load budgets');
      console.error('Fetch budgets error:', err);
      setBudgets([]);
    }
  };

  const handleSearch = () => {
    const newFilters: BudgetFilters = {
      ...filters,
      offset: 0,
      period: (selectedPeriod as 'monthly' | 'quarterly' | 'yearly') || undefined,
      category_id: selectedCategory || undefined,
      over_budget_only: showOverBudgetOnly || undefined
    };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSelectedPeriod('');
    setSelectedCategory('');
    setShowOverBudgetOnly(false);
    setFilters({
      limit: 50,
      offset: 0,
      sort: 'created_at',
      order: 'desc',
      is_active: true
    });
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await budgetService.deleteBudget(id);
      setBudgets(budgets.filter(budget => budget.id !== id));
    } catch (err: unknown) {
      alert('Failed to delete budget');
      console.error('Delete budget error:', err);
    }
  };

  const handleBudgetCreated = () => {
    setShowAddModal(false);
    fetchBudgets(); // Refresh the budgets list
  };

  const handleBudgetUpdated = () => {
    setEditingBudget(null);
    fetchBudgets(); // Refresh the budgets list
  };

  const handleDuplicateBudget = async (id: number) => {
    try {
      const newBudget = await budgetService.duplicateBudget(id);
      setBudgets([newBudget, ...budgets]);
    } catch (err: unknown) {
      alert('Failed to duplicate budget');
      console.error('Duplicate budget error:', err);
    }
  };

  const handleResetBudget = async (id: number) => {
    if (!confirm('Are you sure you want to reset this budget? This will clear all spent amounts.')) return;
    
    try {
      const updatedBudget = await budgetService.resetBudget(id);
      setBudgets(budgets.map(budget => budget.id === id ? updatedBudget : budget));
    } catch (err: unknown) {
      alert('Failed to reset budget');
      console.error('Reset budget error:', err);
    }
  };

  const toggleBudgetStatus = async (budget: Budget) => {
    try {
      const updatedBudget = await budgetService.updateBudget(budget.id, { 
        is_active: !budget.is_active 
      });
      setBudgets(budgets.map(b => b.id === budget.id ? updatedBudget : b));
    } catch (err: unknown) {
      alert('Failed to update budget status');
      console.error('Update budget error:', err);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-yellow-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'text-red-700';
    if (percentage >= 90) return 'text-yellow-700';
    if (percentage >= 75) return 'text-orange-700';
    return 'text-green-700';
  };



  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-2 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchInitialData} 
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input"
              >
                <option value="">All Periods</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.is_active ? 'active' : filters.is_active === false ? 'inactive' : ''}
                onChange={(e) => setFilters({
                  ...filters, 
                  is_active: e.target.value === '' ? undefined : e.target.value === 'active'
                })}
                className="input"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOverBudgetOnly}
                  onChange={(e) => setShowOverBudgetOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Over budget only</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
            <button onClick={handleSearch} className="btn btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className={`card relative ${!budget.is_active ? 'opacity-75 bg-gray-50' : ''} ${
                budget.is_over_budget ? 'border-red-200' : ''
              }`}
            >
              {/* Budget Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                    {budget.is_over_budget && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {!budget.is_active && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {formatPeriod(budget.period)} Budget
                  </p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingBudget(budget)}
                    className="p-2 text-gray-400 hover:text-primary-600 rounded"
                    title="Edit Budget"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md border py-1 z-10 hidden group-hover:block">
                      <button
                        onClick={() => handleDuplicateBudget(budget.id)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleResetBudget(budget.id)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </button>
                      <button
                        onClick={() => toggleBudgetStatus(budget)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        {budget.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Amount */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(budget.spent_amount, budget.currency)}
                  </span>
                  <span className="text-lg text-gray-600">
                    of {formatCurrency(budget.amount, budget.currency)}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      getProgressColor(budget.percentage_used, budget.is_over_budget)
                    }`}
                    style={{ 
                      width: `${Math.min(budget.percentage_used, 100)}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className={getProgressTextColor(budget.percentage_used, budget.is_over_budget)}>
                    {budget.percentage_used.toFixed(1)}% used
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(budget.remaining_amount, budget.currency)} left
                  </span>
                </div>
              </div>

              {/* Categories */}
              {budget.categories.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {budget.categories.slice(0, 3).map(category => (
                      <span
                        key={category.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {category.icon} {category.name}
                      </span>
                    ))}
                    {budget.categories.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{budget.categories.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Time Info */}
              <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {new Date(budget.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                    {budget.end_date && (
                      <> - {new Date(budget.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}</>
                    )}
                  </span>
                </div>
                
                {budget.days_left !== undefined && budget.days_left >= 0 && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{budget.days_left} days left</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets found</h3>
          <p className="text-gray-500 mb-4">
            {Object.keys(filters).some(key => filters[key as keyof BudgetFilters] && key !== 'limit' && key !== 'offset' && key !== 'sort' && key !== 'order')
              ? "Try adjusting your filters or create a new budget."
              : "Create your first budget to start tracking your spending."
            }
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddBudgetForm
          onSuccess={handleBudgetCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingBudget && (
        <EditBudgetForm
          budget={editingBudget}
          onSuccess={handleBudgetUpdated}
          onClose={() => setEditingBudget(null)}
        />
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultDataTypes={{ budgets: true }}
        title="Export Budgets"
      />
    </div>
  );
};

export default BudgetsList;