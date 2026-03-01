import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Receipt, 
  Calendar,
  DollarSign,
  Tag,
  Building2,
  Copy,
  Download
} from 'lucide-react';
import { expenseService, type Expense, type ExpenseFilters } from '../../services/expenses';
import { categoryService, type Category } from '../../services/categories';
import { accountService, type Account } from '../../services/accounts';
import AddExpenseForm from '../../components/expenses/AddExpenseForm';
import EditExpenseForm from '../../components/expenses/EditExpenseForm';
import ExportModal from '../../components/modals/ExportModal';

const ExpensesList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<ExpenseFilters>({
    limit: 50,
    offset: 0,
    sort: 'date',
    order: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedAccount, setSelectedAccount] = useState<number | ''>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [expensesData, categoriesData, accountsData] = await Promise.all([
        expenseService.getExpenses(filters),
        categoryService.getCategories(),
        accountService.getAccounts()
      ]);

      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err: unknown) {
      setError('Failed to load expenses data');
      console.error('Expenses error:', err);
      // Set empty arrays as fallbacks to prevent null pointer errors
      setExpenses([]);
      setCategories([]);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const data = await expenseService.getExpenses(filters);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError('Failed to load expenses');
      console.error('Fetch expenses error:', err);
      setExpenses([]);
    }
  };

  const handleSearch = () => {
    const newFilters: ExpenseFilters = {
      ...filters,
      offset: 0,
      search: searchTerm || undefined,
      start_date: dateFrom || undefined,
      end_date: dateTo || undefined,
      category_id: selectedCategory || undefined,
      account_id: selectedAccount || undefined
    };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setSelectedCategory('');
    setSelectedAccount('');
    setFilters({
      limit: 50,
      offset: 0,
      sort: 'date',
      order: 'desc'
    });
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await expenseService.deleteExpense(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
    } catch (err: unknown) {
      alert('Failed to delete expense');
      console.error('Delete expense error:', err);
    }
  };

  const handleExpenseCreated = () => {
    setShowAddModal(false);
    fetchExpenses(); // Refresh the expenses list
  };

  const handleExpenseUpdated = () => {
    setEditingExpense(null);
    fetchExpenses(); // Refresh the expenses list
  };

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedExpenses.length} expenses?`)) return;
    
    try {
      await expenseService.bulkDeleteExpenses(selectedExpenses);
      setExpenses(expenses.filter(expense => !selectedExpenses.includes(expense.id)));
      setSelectedExpenses([]);
    } catch (err: unknown) {
      alert('Failed to delete expenses');
      console.error('Bulk delete error:', err);
    }
  };

  const handleDuplicateExpense = async (id: number) => {
    try {
      const newExpense = await expenseService.duplicateExpense(id);
      setExpenses([newExpense, ...expenses]);
    } catch (err: unknown) {
      alert('Failed to duplicate expense');
      console.error('Duplicate expense error:', err);
    }
  };

  const toggleSelectExpense = (id: number) => {
    setSelectedExpenses(prev => 
      prev.includes(id) 
        ? prev.filter(expenseId => expenseId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedExpenses(
      selectedExpenses.length === (expenses || []).length ? [] : (expenses || []).map(e => e.id)
    );
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="card">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-3 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <div className="flex items-center space-x-3">
          {selectedExpenses.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-secondary text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedExpenses.length})
            </button>
          )}
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
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search expenses..."
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
                className="input"
              >
                <option value="">All Categories</option>
                {(categories || []).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : '')}
                className="input"
              >
                <option value="">All Accounts</option>
                {(accounts || []).map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
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

      {/* Expenses List */}
      <div className="card">
        {(expenses || []).length > 0 ? (
          <>
            {/* Table Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedExpenses.length === (expenses || []).length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">
                  {(expenses || []).length} expense{(expenses || []).length !== 1 ? 's' : ''}
                  {selectedExpenses.length > 0 && ` (${selectedExpenses.length} selected)`}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={`${filters.sort}-${filters.order}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                    setFilters({...filters, sort: sort as 'date' | 'amount' | 'description', order});
                  }}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="amount-desc">Amount (High to Low)</option>
                  <option value="amount-asc">Amount (Low to High)</option>
                  <option value="description-asc">Description (A-Z)</option>
                  <option value="category-asc">Category (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-2">
              {(expenses || []).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleSelectExpense(expense.id)}
                      className="rounded border-gray-300"
                    />
                    
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: expense.category?.color || '#6B7280' }}
                    >
                      {expense.category?.icon || '💰'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {expense.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {expense.category?.name || 'Uncategorized'}
                        </span>
                        {expense.account && (
                          <span className="flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {expense.account.name}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(expense.date)}
                        </span>
                        {expense.receipt_url && (
                          <span className="flex items-center text-primary-600">
                            <Receipt className="h-3 w-3 mr-1" />
                            Receipt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="p-2 text-gray-400 hover:text-primary-600 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDuplicateExpense(expense.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-500 mb-4">
              {Object.keys(filters).some(key => filters[key as keyof ExpenseFilters] && key !== 'limit' && key !== 'offset' && key !== 'sort' && key !== 'order')
                ? "Try adjusting your filters or add a new expense."
                : "Get started by adding your first expense."
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddExpenseForm
          onSuccess={handleExpenseCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingExpense && (
        <EditExpenseForm
          expense={editingExpense}
          onSuccess={handleExpenseUpdated}
          onClose={() => setEditingExpense(null)}
        />
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultDataTypes={{ expenses: true }}
        title="Export Expenses"
      />
    </div>
  );
};

export default ExpensesList;