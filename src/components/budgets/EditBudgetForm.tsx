import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, PieChart, Clock, AlertCircle } from 'lucide-react';
import { budgetService, type Budget, type UpdateBudgetData } from '../../services/budgets';
import { categoryService, type Category } from '../../services/categories';

interface EditBudgetFormProps {
  budget: Budget;
  onSuccess: () => void;
  onClose: () => void;
}

const EditBudgetForm: React.FC<EditBudgetFormProps> = ({ budget, onSuccess, onClose }) => {
  const [formData, setFormData] = useState<UpdateBudgetData>({
    name: budget.name,
    amount: budget.amount,
    currency: budget.currency,
    period: budget.period,
    category_ids: budget.category_ids,
    start_date: budget.start_date,
    end_date: budget.end_date
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(
    new Set(budget.category_ids)
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateBudgetData, value: string | number | boolean | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newSelected = new Set(selectedCategoryIds);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategoryIds(newSelected);
    handleInputChange('category_ids', Array.from(newSelected));
  };

  const selectAllCategories = () => {
    if (selectedCategoryIds.size === categories.length) {
      // Deselect all
      setSelectedCategoryIds(new Set());
      handleInputChange('category_ids', []);
    } else {
      // Select all
      const allIds = new Set(categories.map(c => c.id));
      setSelectedCategoryIds(allIds);
      handleInputChange('category_ids', Array.from(allIds));
    }
  };

  const getEndDate = () => {
    if (!formData.start_date) return '';

    const startDate = new Date(formData.start_date);
    const endDate = new Date(startDate);

    switch (formData.period) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    endDate.setDate(endDate.getDate() - 1); // Last day of period
    return endDate.toISOString().split('T')[0];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.category_ids || formData.category_ids.length === 0) {
      newErrors.category_ids = 'Please select at least one category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const budgetData = {
        ...formData,
        end_date: getEndDate()
      };

      await budgetService.updateBudget(budget.id, budgetData);
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update budget:', err);
      setErrors({ submit: 'Failed to update budget. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Budget</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Budget Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between text-sm text-blue-700">
              <span>Current spent: ${budget.spent_amount.toFixed(2)}</span>
              <span>{budget.percentage_used.toFixed(1)}% used</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Budget Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PieChart className="h-4 w-4 inline mr-1" />
              Budget Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`input ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="e.g., Monthly Groceries, Quarterly Entertainment"
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Budget Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`input ${errors.amount ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="0.00"
              />
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="input"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
          </div>

          {/* Period and Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Budget Period *
              </label>
              <select
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                className="input"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={`input ${errors.start_date ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
              {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
            </div>
          </div>

          {/* End Date Preview */}
          {formData.start_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-700">
                  This {formData.period} budget will run from {formData.start_date} to {getEndDate()}
                </span>
              </div>
            </div>
          )}

          {/* Categories */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Tag className="h-4 w-4 inline mr-1" />
                Categories * ({selectedCategoryIds.size} selected)
              </label>
              <button
                type="button"
                onClick={selectAllCategories}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                {selectedCategoryIds.size === categories.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {categories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedCategoryIds.has(category.id) ? 'bg-primary-50 border border-primary-200' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.has(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="rounded border-gray-300 mr-3"
                      />
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm mr-3"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No categories available</p>
              )}
            </div>
            {errors.category_ids && <p className="mt-1 text-sm text-red-600">{errors.category_ids}</p>}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active !== false}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="rounded border-gray-300 mr-3"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Budget is active
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetForm;