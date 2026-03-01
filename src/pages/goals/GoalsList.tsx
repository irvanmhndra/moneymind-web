import React, { useState, useEffect } from 'react';
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  MoreVertical,
  Copy,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Star
} from 'lucide-react';
import { goalService, type Goal, type GoalFilters } from '../../services/goals';
import { categoryService, type Category } from '../../services/categories';
import AddGoalForm from '../../components/goals/AddGoalForm';
import EditGoalForm from '../../components/goals/EditGoalForm';
import ContributionForm from '../../components/goals/ContributionForm';

const GoalsList: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showContributionModal, setShowContributionModal] = useState<Goal | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<GoalFilters>({
    limit: 50,
    offset: 0,
    sort: 'created_at',
    order: 'desc',
    status: 'active'
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [showAchievableOnly, setShowAchievableOnly] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [goalsData, categoriesData] = await Promise.all([
        goalService.getGoals(filters),
        categoryService.getCategories()
      ]);
      
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: unknown) {
      setError('Failed to load goals data');
      console.error('Goals error:', err instanceof Error ? err.message : String(err));
      setGoals([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const data = await goalService.getGoals(filters);
      setGoals(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError('Failed to load goals');
      console.error('Fetch goals error:', err instanceof Error ? err.message : String(err));
      setGoals([]);
    }
  };

  const handleSearch = () => {
    const newFilters: GoalFilters = {
      ...filters,
      offset: 0,
      status: (selectedStatus as 'active' | 'completed' | 'paused' | 'cancelled') || undefined,
      priority: (selectedPriority as 'low' | 'medium' | 'high') || undefined,
      category_id: selectedCategory || undefined,
      achievable_only: showAchievableOnly || undefined
    };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSelectedStatus('active');
    setSelectedPriority('');
    setSelectedCategory('');
    setShowAchievableOnly(false);
    setFilters({
      limit: 50,
      offset: 0,
      sort: 'created_at',
      order: 'desc',
      status: 'active'
    });
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await goalService.deleteGoal(id);
      setGoals(goals.filter(goal => goal.id !== id));
    } catch (err: unknown) {
      alert('Failed to delete goal');
      console.error('Delete goal error:', err instanceof Error ? err.message : String(err));
    }
  };

  const handleDuplicateGoal = async (id: number) => {
    try {
      const newGoal = await goalService.duplicateGoal(id);
      setGoals([newGoal, ...goals]);
    } catch (err: unknown) {
      alert('Failed to duplicate goal');
      console.error('Duplicate goal error:', err instanceof Error ? err.message : String(err));
    }
  };

  const handleCompleteGoal = async (id: number) => {
    if (!confirm('Are you sure you want to mark this goal as completed?')) return;
    
    try {
      const updatedGoal = await goalService.completeGoal(id);
      setGoals(goals.map(goal => goal.id === id ? updatedGoal : goal));
    } catch (err: unknown) {
      alert('Failed to complete goal');
      console.error('Complete goal error:', err instanceof Error ? err.message : String(err));
    }
  };

  const handlePauseGoal = async (id: number) => {
    try {
      const updatedGoal = await goalService.pauseGoal(id);
      setGoals(goals.map(goal => goal.id === id ? updatedGoal : goal));
    } catch (err: unknown) {
      alert('Failed to pause goal');
      console.error('Pause goal error:', err instanceof Error ? err.message : String(err));
    }
  };

  const handleResumeGoal = async (id: number) => {
    try {
      const updatedGoal = await goalService.resumeGoal(id);
      setGoals(goals.map(goal => goal.id === id ? updatedGoal : goal));
    } catch (err: unknown) {
      alert('Failed to resume goal');
      console.error('Resume goal error:', err instanceof Error ? err.message : String(err));
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Zap className="h-4 w-4 text-red-500" />;
      case 'medium': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Target className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getProgressColor = (percentage: number, status: string) => {
    if (status === 'completed') return 'bg-blue-500';
    if (status === 'cancelled') return 'bg-red-500';
    if (status === 'paused') return 'bg-yellow-500';
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-green-400';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  const handleGoalCreated = () => {
    setShowAddModal(false);
    fetchGoals();
  };

  const handleGoalUpdated = () => {
    setEditingGoal(null);
    fetchGoals();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="input"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
            
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAchievableOnly}
                  onChange={(e) => setShowAchievableOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Achievable only</span>
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

      {/* Goal Cards */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`card relative ${
                goal.status === 'paused' ? 'opacity-75 bg-gray-50' : ''
              } ${goal.status === 'completed' ? 'border-blue-200 bg-blue-50' : ''}`}
            >
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                    {getPriorityIcon(goal.priority)}
                    {!goal.is_achievable && goal.target_date && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </span>
                    {goal.category && (
                      <span className="text-xs text-gray-600 flex items-center">
                        <span style={{ color: goal.category.color }}>{goal.category.icon}</span>
                        <span className="ml-1">{goal.category.name}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-gray-400 hover:text-primary-600 rounded"
                    title="Edit Goal"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md border py-1 z-10 hidden group-hover:block min-w-[150px]">
                      <button
                        onClick={() => setShowContributionModal(goal)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Add Contribution
                      </button>
                      
                      {goal.status === 'active' && (
                        <>
                          <button
                            onClick={() => handlePauseGoal(goal.id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </button>
                          <button
                            onClick={() => handleCompleteGoal(goal.id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </button>
                        </>
                      )}
                      
                      {goal.status === 'paused' && (
                        <button
                          onClick={() => handleResumeGoal(goal.id)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDuplicateGoal(goal.id)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal Description */}
              {goal.description && (
                <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
              )}

              {/* Goal Amount */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(goal.current_amount, goal.currency)}
                  </span>
                  <span className="text-lg text-gray-600">
                    of {formatCurrency(goal.target_amount, goal.currency)}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      getProgressColor(goal.progress_percentage, goal.status)
                    }`}
                    style={{ 
                      width: `${Math.min(goal.progress_percentage, 100)}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {goal.progress_percentage.toFixed(1)}% complete
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(goal.remaining_amount, goal.currency)} left
                  </span>
                </div>
              </div>

              {/* Goal Info */}
              <div className="space-y-2 text-sm text-gray-600">
                {goal.target_date && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                    </div>
                    {goal.days_left !== undefined && goal.days_left >= 0 && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{goal.days_left} days left</span>
                      </div>
                    )}
                  </div>
                )}
                
                {goal.monthly_contribution_needed && goal.monthly_contribution_needed > 0 && (
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span>
                      Need {formatCurrency(goal.monthly_contribution_needed, goal.currency)}/month
                    </span>
                  </div>
                )}
                
                {goal.contributions.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Last contribution: {formatCurrency(goal.contributions[0].amount, goal.currency)} on{' '}
                    {new Date(goal.contributions[0].date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals found</h3>
          <p className="text-gray-500 mb-4">
            {Object.keys(filters).some(key => filters[key as keyof GoalFilters] && key !== 'limit' && key !== 'offset' && key !== 'sort' && key !== 'order')
              ? "Try adjusting your filters or create a new goal."
              : "Set your first financial goal and start tracking your progress."
            }
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddGoalForm
          onSuccess={handleGoalCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingGoal && (
        <EditGoalForm
          goal={editingGoal}
          onSuccess={handleGoalUpdated}
          onClose={() => setEditingGoal(null)}
        />
      )}

      {showContributionModal && (
        <ContributionForm
          goal={showContributionModal}
          onSuccess={() => {
            setShowContributionModal(null);
            fetchGoals(); // Refresh goals to update progress
          }}
          onClose={() => setShowContributionModal(null)}
        />
      )}
    </div>
  );
};

export default GoalsList;