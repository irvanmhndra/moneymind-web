import React, { useState } from 'react';
import { X, Building2, CreditCard, Wallet, PiggyBank, Banknote, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { accountService, type Account, type UpdateAccountData } from '../../services/accounts';

interface EditAccountFormProps {
  account: Account;
  onSuccess: () => void;
  onClose: () => void;
}

const EditAccountForm: React.FC<EditAccountFormProps> = ({ account, onSuccess, onClose }) => {
  const [formData, setFormData] = useState<UpdateAccountData>({
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    description: account.description,
    is_active: account.is_active
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accountTypes = [
    { value: 'checking', label: 'Checking Account', icon: Building2, description: 'For daily expenses and bill payments' },
    { value: 'savings', label: 'Savings Account', icon: PiggyBank, description: 'For saving money and earning interest' },
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard, description: 'For credit purchases and building credit history' },
    { value: 'cash', label: 'Cash', icon: Banknote, description: 'Physical cash on hand' },
    { value: 'investment', label: 'Investment Account', icon: TrendingUp, description: 'For stocks, bonds, and other investments' },
    { value: 'other', label: 'Other', icon: Wallet, description: 'Other types of accounts' }
  ];

  const handleInputChange = (field: keyof UpdateAccountData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (formData.name?.trim() && formData.name.trim().length < 2) {
      newErrors.name = 'Account name must be at least 2 characters';
    }

    if (formData.balance === undefined || formData.balance === null) {
      newErrors.balance = 'Balance is required';
    }

    // For credit cards, balance should typically be 0 or positive (debt)
    if (formData.type === 'credit_card' && formData.balance! < 0) {
      newErrors.balance = 'Credit card balance should be 0 or positive (representing debt)';
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

      const accountData = {
        ...formData,
        description: formData.description?.trim() || undefined
      };

      await accountService.updateAccount(account.id, accountData);
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update account:', err);
      setErrors({ submit: 'Failed to update account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = accountTypes.find(type => type.value === formData.type)!;
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Account</h2>
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

          {/* Current Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-700">
              <div className="font-medium">Current balance: {formatCurrency(account.balance, account.currency)}</div>
              <div className="text-xs mt-1">Created: {new Date(account.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`input ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="e.g., Chase Checking, Emergency Fund, Main Credit Card"
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accountTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      formData.type === type.value ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <IconComponent className="h-5 w-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Balance and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Current Balance *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance || ''}
                onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                className={`input ${errors.balance ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="0.00"
              />
              {errors.balance && <p className="mt-1 text-sm text-red-600">{errors.balance}</p>}
              {formData.type === 'credit_card' && (
                <p className="mt-1 text-xs text-gray-500">
                  Enter your current debt amount (e.g., $500 if you owe $500)
                </p>
              )}
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

          {/* Account Info */}
          {selectedType && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <selectedType.icon className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-blue-900">{selectedType.label}</div>
                  <div className="text-xs text-blue-700">{selectedType.description}</div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description (Optional)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="input"
              rows={3}
              placeholder="Add any additional notes about this account..."
              maxLength={500}
            />
          </div>

          {/* Account Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active !== false}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="rounded border-gray-300 mr-3"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Account is active
            </label>
            <p className="text-xs text-gray-500 ml-3">
              Inactive accounts won't appear in expense forms
            </p>
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
              {isSubmitting ? 'Updating...' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountForm;