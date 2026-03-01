import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, DollarSign, Calculator, Mail, User } from 'lucide-react';
import { splitExpenseService, type CreateSplitExpenseData, type CreateSplitParticipantData } from '../../services/splitExpenses';
import { expenseService, type Expense } from '../../services/expenses';

interface AddSplitExpenseFormProps {
  onSuccess: () => void;
  onClose: () => void;
  expenseId?: number;
}

const AddSplitExpenseForm: React.FC<AddSplitExpenseFormProps> = ({ onSuccess, onClose, expenseId }) => {
  const [formData, setFormData] = useState<CreateSplitExpenseData>({
    expense_id: expenseId || 0,
    total_amount: 0,
    split_type: 'equal',
    description: '',
    participants: [
      { email: '', name: '', amount_owed: 0, percentage: 0 },
      { email: '', name: '', amount_owed: 0, percentage: 0 }
    ]
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchExpenses();
    if (expenseId) {
      fetchExpenseDetails(expenseId);
    }
  }, [expenseId]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await expenseService.getExpenses({ limit: 100, sort: 'date', order: 'desc' });
      setExpenses(data);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenseDetails = async (id: number) => {
    try {
      const expense = await expenseService.getExpense(id);
      setFormData(prev => ({
        ...prev,
        expense_id: id,
        total_amount: expense.amount,
        description: `Split: ${expense.description}`
      }));
      calculateSplit({ ...formData, total_amount: expense.amount });
    } catch (err) {
      console.error('Failed to fetch expense details:', err);
    }
  };

  const handleInputChange = (field: keyof CreateSplitExpenseData, value: unknown) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (field === 'total_amount' || field === 'split_type') {
      calculateSplit(newFormData);
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateSplit = (data: CreateSplitExpenseData) => {
    if (data.split_type === 'equal') {
      const amountPerPerson = splitExpenseService.calculateEqualSplit(data.total_amount, data.participants.length);
      const updatedParticipants = data.participants.map(p => ({
        ...p,
        amount_owed: amountPerPerson,
        percentage: 100 / data.participants.length
      }));
      setFormData(prev => ({ ...prev, participants: updatedParticipants }));
    }
  };

  const handleParticipantChange = (index: number, field: keyof CreateSplitParticipantData, value: unknown) => {
    const updatedParticipants = [...formData.participants];
    updatedParticipants[index] = { ...updatedParticipants[index], [field]: value };

    if (field === 'percentage' && formData.split_type === 'percentage') {
      const percentage = parseFloat(String(value)) || 0;
      updatedParticipants[index].amount_owed = splitExpenseService.calculatePercentageSplit(formData.total_amount, percentage);
    }

    setFormData(prev => ({ ...prev, participants: updatedParticipants }));

    if (errors[`participant_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`participant_${index}_${field}`]: '' }));
    }
  };

  const addParticipant = () => {
    const newParticipants = [...formData.participants, { email: '', name: '', amount_owed: 0, percentage: 0 }];
    const newFormData = { ...formData, participants: newParticipants };
    setFormData(newFormData);
    calculateSplit(newFormData);
  };

  const removeParticipant = (index: number) => {
    if (formData.participants.length > 2) {
      const newParticipants = formData.participants.filter((_, i) => i !== index);
      const newFormData = { ...formData, participants: newParticipants };
      setFormData(newFormData);
      calculateSplit(newFormData);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.expense_id) {
      newErrors.expense_id = 'Please select an expense';
    }

    if (!formData.total_amount || formData.total_amount <= 0) {
      newErrors.total_amount = 'Total amount must be greater than 0';
    }

    formData.participants.forEach((participant, index) => {
      if (!participant.email.trim()) {
        newErrors[`participant_${index}_email`] = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(participant.email)) {
        newErrors[`participant_${index}_email`] = 'Invalid email format';
      }

      if (!participant.name.trim()) {
        newErrors[`participant_${index}_name`] = 'Name is required';
      }
    });

    const validationError = splitExpenseService.validateParticipants(formData.participants, formData.split_type, formData.total_amount);
    if (validationError) {
      newErrors.participants = validationError;
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

      await splitExpenseService.createSplitExpense({
        ...formData,
        description: formData.description?.trim() || undefined
      });

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to create split expense:', err);
      setErrors({ submit: 'Failed to create split expense. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalPercentage = () => {
    return formData.participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
  };

  const getTotalAmount = () => {
    return formData.participants.reduce((sum, p) => sum + (p.amount_owed || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Split Expense</h2>
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

          {/* Expense Selection */}
          {!expenseId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Select Expense *
              </label>
              <select
                value={formData.expense_id || ''}
                onChange={(e) => {
                  const selectedId = parseInt(e.target.value);
                  handleInputChange('expense_id', selectedId);
                  if (selectedId) {
                    fetchExpenseDetails(selectedId);
                  }
                }}
                className={`input ${errors.expense_id ? 'border-red-300 focus:ring-red-500' : ''}`}
              >
                <option value="">Choose an expense to split</option>
                {expenses.map(expense => (
                  <option key={expense.id} value={expense.id}>
                    {expense.description} - {formatCurrency(expense.amount)} ({new Date(expense.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {errors.expense_id && <p className="mt-1 text-sm text-red-600">{errors.expense_id}</p>}
            </div>
          )}

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calculator className="h-4 w-4 inline mr-1" />
              Total Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.total_amount || ''}
              onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
              className={`input ${errors.total_amount ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors.total_amount && <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>}
          </div>

          {/* Split Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Split Method</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'equal', label: 'Equal Split', desc: 'Split equally among all participants' },
                { value: 'percentage', label: 'Percentage', desc: 'Split by custom percentages' },
                { value: 'amount', label: 'Custom Amounts', desc: 'Specify exact amounts for each person' }
              ].map(method => (
                <label
                  key={method.value}
                  className={`flex flex-col p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    formData.split_type === method.value ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="split_type"
                    value={method.value}
                    checked={formData.split_type === method.value}
                    onChange={(e) => handleInputChange('split_type', e.target.value)}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">{method.label}</span>
                  <span className="text-xs text-gray-500 mt-1">{method.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="input"
              placeholder="Additional notes about this split..."
              maxLength={200}
            />
          </div>

          {/* Participants */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                <Users className="h-4 w-4 inline mr-1" />
                Participants ({formData.participants.length})
              </label>
              <button
                type="button"
                onClick={addParticipant}
                className="btn btn-secondary btn-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Person
              </button>
            </div>

            {errors.participants && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm mb-4">
                {errors.participants}
              </div>
            )}

            <div className="space-y-4">
              {formData.participants.map((participant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">Person {index + 1}</h4>
                    {formData.participants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="h-3 w-3 inline mr-1" />
                        Name *
                      </label>
                      <input
                        type="text"
                        value={participant.name}
                        onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                        className={`input ${errors[`participant_${index}_name`] ? 'border-red-300' : ''}`}
                        placeholder="Enter name"
                      />
                      {errors[`participant_${index}_name`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`participant_${index}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="h-3 w-3 inline mr-1" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={participant.email}
                        onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                        className={`input ${errors[`participant_${index}_email`] ? 'border-red-300' : ''}`}
                        placeholder="email@example.com"
                      />
                      {errors[`participant_${index}_email`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`participant_${index}_email`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Amount/Percentage Input */}
                  <div className="mt-4">
                    {formData.split_type === 'percentage' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={participant.percentage || ''}
                            onChange={(e) => handleParticipantChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                            className="input w-24"
                            placeholder="0"
                          />
                          <span className="text-gray-500">% = {formatCurrency(participant.amount_owed || 0)}</span>
                        </div>
                      </div>
                    )}

                    {formData.split_type === 'amount' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Owed</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={participant.amount_owed || ''}
                          onChange={(e) => handleParticipantChange(index, 'amount_owed', parseFloat(e.target.value) || 0)}
                          className="input w-32"
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    {formData.split_type === 'equal' && (
                      <div className="text-sm text-gray-600">
                        Owes: <span className="font-medium">{formatCurrency(participant.amount_owed || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Split Summary */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Split Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Amount:</span>
                  <div className="font-medium">{formatCurrency(formData.total_amount)}</div>
                </div>
                {formData.split_type === 'percentage' && (
                  <div>
                    <span className="text-blue-700">Total Percentage:</span>
                    <div className={`font-medium ${Math.abs(getTotalPercentage() - 100) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                      {getTotalPercentage().toFixed(1)}%
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-blue-700">Sum of Amounts:</span>
                  <div className={`font-medium ${Math.abs(getTotalAmount() - formData.total_amount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(getTotalAmount())}
                  </div>
                </div>
              </div>
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
              {isSubmitting ? 'Creating Split...' : 'Create Split Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSplitExpenseForm;