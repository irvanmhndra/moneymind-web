import React, { useState } from 'react';
import { X, Calendar, DollarSign, FileText } from 'lucide-react';
import { goalService, type Goal, type CreateContributionData } from '../../services/goals';

interface ContributionFormProps {
  goal: Goal;
  onSuccess: () => void;
  onClose: () => void;
}

const ContributionForm: React.FC<ContributionFormProps> = ({ goal, onSuccess, onClose }) => {
  const [formData, setFormData] = useState<CreateContributionData>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateContributionData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Check if contribution would exceed target
    const newTotal = goal.current_amount + formData.amount;
    if (newTotal > goal.target_amount) {
      newErrors.amount = `Contribution would exceed target. Maximum: $${(goal.target_amount - goal.current_amount).toFixed(2)}`;
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

      const contributionData = {
        ...formData,
        notes: formData.notes?.trim() || undefined
      };

      await goalService.addContribution(goal.id, contributionData);
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to add contribution:', err);
      setErrors({ submit: 'Failed to add contribution. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNewProgress = () => {
    if (!formData.amount) return goal.progress_percentage;
    const newTotal = goal.current_amount + formData.amount;
    return (newTotal / goal.target_amount) * 100;
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Contribution</h2>
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

          {/* Goal Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h3 className="font-medium text-blue-900 mb-2">{goal.name}</h3>
            <div className="text-sm text-blue-700 mb-2">
              Current: {formatCurrency(goal.current_amount, goal.currency)} / {formatCurrency(goal.target_amount, goal.currency)}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Contribution Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={goal.target_amount - goal.current_amount}
              value={formData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className={`input ${errors.amount ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Remaining to goal: {formatCurrency(goal.remaining_amount, goal.currency)}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Contribution Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`input ${errors.date ? 'border-red-300 focus:ring-red-500' : ''}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="input"
              rows={3}
              placeholder="Add any notes about this contribution..."
              maxLength={200}
            />
          </div>

          {/* Progress Preview */}
          {formData.amount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="text-sm text-green-700 mb-2">
                After this contribution:
              </div>
              <div className="text-sm text-green-700 mb-2">
                New total: {formatCurrency(goal.current_amount + formData.amount, goal.currency)} ({getNewProgress().toFixed(1)}%)
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getNewProgress(), 100)}%` }}
                ></div>
              </div>
              {getNewProgress() >= 100 && (
                <div className="text-sm font-medium text-green-800 mt-2">
                  🎉 This contribution will complete your goal!
                </div>
              )}
            </div>
          )}

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
              {isSubmitting ? 'Adding...' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContributionForm;