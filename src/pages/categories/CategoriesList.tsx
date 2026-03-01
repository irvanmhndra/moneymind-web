import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Eye,
  EyeOff,
  MoreVertical,
  Grid,
  List
} from 'lucide-react';
import { categoryService, type Category } from '../../services/categories';
import AddCategoryForm from '../../components/categories/AddCategoryForm';
import EditCategoryForm from '../../components/categories/EditCategoryForm';

const CategoriesList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    fetchCategories();
  }, [showInactive]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.getCategories(showInactive);
      setCategories(data);
    } catch (err: unknown) {
      setError('Failed to load categories');
      console.error('Categories error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    
    try {
      await categoryService.deleteCategory(id);
      setCategories(categories.filter(category => category.id !== id));
    } catch (err: unknown) {
      alert('Failed to delete category');
      console.error('Delete category error:', err);
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const updatedCategory = await categoryService.updateCategory(category.id, {
        is_active: !category.is_active
      });
      setCategories(categories.map(c => c.id === category.id ? updatedCategory : c));
    } catch (err: unknown) {
      alert('Failed to update category status');
      console.error('Update category error:', err);
    }
  };

  const handleCategoryCreated = () => {
    setShowAddModal(false);
    fetchCategories(); // Refresh the categories list
  };

  const handleCategoryUpdated = () => {
    setEditingCategory(null);
    fetchCategories(); // Refresh the categories list
  };



  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchCategories} 
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
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="input pl-10 w-64"
            />
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show inactive</span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500 ml-4">
            {filteredCategories.length} categor{filteredCategories.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
      </div>

      {/* Categories */}
      {filteredCategories.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`card relative group hover:shadow-md transition-shadow ${
                    !category.is_active ? 'opacity-75 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-medium shadow-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 truncate">{category.description}</p>
                      )}
                      {!category.is_active && (
                        <span className="text-xs text-gray-500">Inactive</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-1 text-gray-400 hover:text-primary-600 rounded"
                        title="Edit Category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <div className="relative group/menu">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md border py-1 z-10 hidden group-hover/menu:block min-w-[120px]">
                          <button
                            onClick={() => toggleCategoryStatus(category)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            {category.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </button>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.icon}
                            </div>
                            <span className="font-medium text-gray-900">{category.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {category.description || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            category.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingCategory(category)}
                              className="p-1 text-gray-400 hover:text-primary-600 rounded"
                              title="Edit Category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleCategoryStatus(category)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title={category.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No categories found' : 'No categories yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No categories match "${searchTerm}". Try adjusting your search.`
              : "Categories help you organize your expenses. Create your first category to get started."
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddCategoryForm
          onSuccess={handleCategoryCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingCategory && (
        <EditCategoryForm
          category={editingCategory}
          onSuccess={handleCategoryUpdated}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
};

export default CategoriesList;