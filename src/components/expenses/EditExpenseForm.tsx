import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, DollarSign, Tag, Building2, FileText, Trash2 } from 'lucide-react';
import { expenseService, type UpdateExpenseData, type Expense } from '../../services/expenses';
import { categoryService, type Category } from '../../services/categories';
import { accountService, type Account } from '../../services/accounts';

interface EditExpenseFormProps {
  expense: Expense;
  onSuccess: () => void;
  onClose: () => void;
}

const EditExpenseForm: React.FC<EditExpenseFormProps> = ({ expense, onSuccess, onClose }) => {
  const [formData, setFormData] = useState<UpdateExpenseData>({
    amount: expense.amount,
    currency: expense.currency,
    description: expense.description,
    date: expense.date.split('T')[0], // Convert to YYYY-MM-DD format
    category_id: expense.category.id,
    account_id: expense.account?.id,
    notes: expense.notes || '',
    tags: expense.tags || []
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, accountsData] = await Promise.all([
        categoryService.getCategories(),
        accountService.getAccounts()
      ]);
      
      setCategories(categoriesData);
      setAccounts(accountsData);
    } catch (err) {
      console.error('Failed to fetch form data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateExpenseData, value: string | number | string[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, receipt: 'Please select an image or PDF file' }));
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, receipt: 'File size must be less than 5MB' }));
        return;
      }
      
      setReceiptFile(file);
      setErrors(prev => ({ ...prev, receipt: '' }));
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setReceiptPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const uploadReceipt = async () => {
    if (!receiptFile) return;
    
    try {
      setIsUploadingReceipt(true);
      await expenseService.uploadReceipt(expense.id, receiptFile);
      
      // Refresh the expense data to get the new receipt URL
      const updatedExpense = await expenseService.getExpense(expense.id);
      expense.receipt_url = updatedExpense.receipt_url;
      
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (err) {
      console.error('Failed to upload receipt:', err);
      setErrors(prev => ({ ...prev, receipt: 'Failed to upload receipt' }));
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const deleteReceipt = async () => {
    if (!expense.receipt_url || !confirm('Are you sure you want to delete this receipt?')) return;
    
    try {
      await expenseService.deleteReceipt(expense.id);
      expense.receipt_url = undefined;
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      alert('Failed to delete receipt');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      handleInputChange('tags', [...(formData.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
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
      
      // Update the expense
      await expenseService.updateExpense(expense.id, {
        ...formData,
        tags: formData.tags?.length ? formData.tags : undefined
      });
      
      // Upload receipt if provided
      if (receiptFile) {
        try {
          await expenseService.uploadReceipt(expense.id, receiptFile);
        } catch (receiptError) {
          console.error('Failed to upload receipt:', receiptError);
          // Don't fail the entire operation if receipt upload fails
        }
      }
      
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update expense:', err);
      setErrors({ submit: 'Failed to update expense. Please try again.' });
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
          <h2 className="text-xl font-semibold text-gray-900">Edit Expense</h2>
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

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Amount *
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description *
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`input ${errors.description ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="What did you spend money on?"
              maxLength={200}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={formData.date || ''}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`input ${errors.date ? 'border-red-300 focus:ring-red-500' : ''}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* Category and Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Category *
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => handleInputChange('category_id', parseInt(e.target.value))}
                className={`input ${errors.category_id ? 'border-red-300 focus:ring-red-500' : ''}`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Account
              </label>
              <select
                value={formData.account_id || ''}
                onChange={(e) => handleInputChange('account_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="input"
              >
                <option value="">Select an account (optional)</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input flex-1"
                placeholder="Add a tag..."
                maxLength={20}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-secondary"
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="input"
              rows={3}
              placeholder="Additional notes about this expense..."
              maxLength={500}
            />
          </div>

          {/* Receipt Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="h-4 w-4 inline mr-1" />
              Receipt
            </label>
            
            {expense.receipt_url && !receiptFile && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Receipt</p>
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        View Receipt
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={deleteReceipt}
                    className="text-red-600 hover:text-red-800 p-2 rounded"
                    title="Delete Receipt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {receiptPreview ? (
                <div className="space-y-2">
                  <img src={receiptPreview} alt="Receipt preview" className="max-h-32 mx-auto rounded" />
                  <p className="text-sm text-gray-600">{receiptFile?.name}</p>
                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={uploadReceipt}
                      disabled={isUploadingReceipt}
                      className="btn btn-primary btn-sm"
                    >
                      {isUploadingReceipt ? 'Uploading...' : 'Upload Now'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : receiptFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">{receiptFile.name}</p>
                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={uploadReceipt}
                      disabled={isUploadingReceipt}
                      className="btn btn-primary btn-sm"
                    >
                      {isUploadingReceipt ? 'Uploading...' : 'Upload Now'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptFile(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {expense.receipt_url ? 'Replace receipt' : 'Upload receipt'}
                  </p>
                  <p className="text-sm text-gray-400">PNG, JPG, PDF up to 5MB</p>
                </div>
              )}
              {!receiptFile && (
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              )}
            </div>
            {errors.receipt && <p className="mt-1 text-sm text-red-600">{errors.receipt}</p>}
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
              {isSubmitting ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseForm;