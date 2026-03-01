import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, Target, FileText, Zap, Star, AlertCircle } from 'lucide-react';
import { goalService, type CreateGoalData } from '../../services/goals';
import { categoryService, type Category } from '../../services/categories';

interface AddGoalFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const AddGoalForm: React.FC<AddGoalFormProps> = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState<CreateGoalData>({
    name: '',
    description: '',
    target_amount: 0,
    currency: 'USD',
    target_date: '',
    priority: 'medium',
    category_id: undefined
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleInputChange = (field: keyof CreateGoalData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Zap className="h-4 w-4" />;
      case 'medium': return <Star className="h-4 w-4" />;
      case 'low': return <Target className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const calculateMonthlyContribution = () => {
    if (!formData.target_amount || !formData.target_date) return null;

    const targetDate = new Date(formData.target_date);
    const currentDate = new Date();
    const monthsLeft = Math.max(1, Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    return (formData.target_amount / monthsLeft).toFixed(2);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    if (!formData.target_amount || formData.target_amount <= 0) {
      newErrors.target_amount = 'Target amount is required and must be greater than 0';
    }

    if (formData.target_date) {
      const targetDate = new Date(formData.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (targetDate <= today) {
        newErrors.target_date = 'Target date must be in the future';
      }
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

      const goalData = {
        ...formData,
        description: formData.description?.trim() || undefined,
        target_date: formData.target_date || undefined,
        category_id: formData.category_id || undefined
      };

      await goalService.createGoal(goalData);
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to create goal:', err);
      setErrors({ submit: 'Failed to create goal. Please try again.' });
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
          <h2 className="text-xl font-semibold text-gray-900">Create New Goal</h2>
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

          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="h-4 w-4 inline mr-1" />
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`input ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="e.g., Emergency Fund, New Car, Vacation"
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="input"
              rows={3}
              placeholder="Describe your goal and why it's important to you..."
              maxLength={500}
            />
          </div>

          {/* Target Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Target Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.target_amount || ''}
                onChange={(e) => handleInputChange('target_amount', parseFloat(e.target.value) || 0)}
                className={`input ${errors.target_amount ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="0.00"
              />
              {errors.target_amount && <p className="mt-1 text-sm text-red-600">{errors.target_amount}</p>}
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

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.target_date || ''}
              onChange={(e) => handleInputChange('target_date', e.target.value)}
              className={`input ${errors.target_date ? 'border-red-300 focus:ring-red-500' : ''}`}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.target_date && <p className="mt-1 text-sm text-red-600">{errors.target_date}</p>}
          </div>

          {/* Monthly Contribution Calculator */}
          {formData.target_amount && formData.target_date && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-700">
                  You'll need to save approximately <strong>${calculateMonthlyContribution()}/month</strong> to reach this goal by {formData.target_date}
                </span>
              </div>
            </div>
          )}

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="space-y-2">
                {(['high', 'medium', 'low'] as const).map(priority => (
                  <label key={priority} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="mr-3"
                    />
                    <div className={`flex items-center ${getPriorityColor(priority)}`}>
                      {getPriorityIcon(priority)}
                      <span className="ml-2 capitalize">{priority}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Category (Optional)
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="input"
              >
                <option value="">No category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalForm;