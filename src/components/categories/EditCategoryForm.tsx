import React, { useState } from 'react';
import { X, Tag, Palette, FileText } from 'lucide-react';
import { categoryService, type Category, type UpdateCategoryData } from '../../services/categories';

interface EditCategoryFormProps {
  category: Category;
  onSuccess: () => void;
  onClose: () => void;
}

const EditCategoryForm: React.FC<EditCategoryFormProps> = ({ category, onSuccess, onClose }) => {
  const [formData, setFormData] = useState<UpdateCategoryData>({
    name: category.name,
    color: category.color,
    icon: category.icon,
    description: category.description,
    is_active: category.is_active
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Common category colors
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#64748B'
  ];

  // Common category icons
  const icons = [
    '🍔', '🛒', '🏠', '🚗', '⛽', '🎬', '🏥', '💰', '🎓', '👕',
    '🎮', '☕', '🍕', '🚌', '📱', '💻', '🎵', '💊', '🧽', '⚡',
    '📺', '🛍️', '🎁', '🏃‍♂️', '📚', '🎪', '🍺', '✈️', '🏨', '🔧',
    '💅', '🚿', '🧼', '🐕', '🌱', '💡', '📝', '📊', '🎯', '❓'
  ];

  const handleInputChange = (field: keyof UpdateCategoryData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (formData.name?.trim() && formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (!formData.color) {
      newErrors.color = 'Color is required';
    }

    if (!formData.icon) {
      newErrors.icon = 'Icon is required';
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

      const categoryData = {
        ...formData,
        description: formData.description?.trim() || undefined
      };

      await categoryService.updateCategory(category.id, categoryData);
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update category:', err);
      setErrors({ submit: 'Failed to update category. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Category</h2>
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

          {/* Original vs Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-700 mb-2">Original</div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-medium shadow-sm"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-gray-600">{category.description}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xs font-medium text-blue-700 mb-2">Preview</div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-medium shadow-sm"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {formData.name || 'Category Name'}
                  </div>
                  {formData.description && (
                    <div className="text-sm text-gray-600">{formData.description}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4 inline mr-1" />
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`input ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="e.g., Groceries, Transportation, Entertainment"
              maxLength={50}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Palette className="h-4 w-4 inline mr-1" />
              Color *
            </label>
            <div className="grid grid-cols-9 gap-2 mb-3">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">Or choose custom color</span>
            </div>
            {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color}</p>}
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Icon *
            </label>
            <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {icons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleInputChange('icon', icon)}
                  className={`w-8 h-8 flex items-center justify-center text-lg rounded border transition-all ${
                    formData.icon === icon
                      ? 'border-primary-500 bg-primary-50 scale-110'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                className="input w-20 text-center"
                placeholder="🔖"
                maxLength={10}
              />
              <span className="text-sm text-gray-600">Or enter custom emoji/symbol</span>
            </div>
            {errors.icon && <p className="mt-1 text-sm text-red-600">{errors.icon}</p>}
          </div>

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
              placeholder="Brief description of what this category includes..."
              maxLength={200}
            />
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
              Category is active
            </label>
            <p className="text-xs text-gray-500 ml-3">
              Inactive categories won't appear in expense forms
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
              {isSubmitting ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryForm;