import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calculator,
  X,
  User
} from 'lucide-react';
import { splitExpenseService, type SplitExpense, type SplitExpenseFilters } from '../../services/splitExpenses';
import AddSplitExpenseForm from '../../components/split-expenses/AddSplitExpenseForm';

const SplitExpensesList: React.FC = () => {
  const [splitExpenses, setSplitExpenses] = useState<SplitExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SplitExpenseFilters>({});
  const [selectedType, setSelectedType] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSplitExpense, setEditingSplitExpense] = useState<SplitExpense | null>(null);
  const [selectedSplitExpense, setSelectedSplitExpense] = useState<SplitExpense | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchSplitExpenses();
  }, [filters]);

  const fetchSplitExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await splitExpenseService.getSplitExpenses(filters);
      setSplitExpenses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch split expenses');
      setSplitExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this split expense?')) {
      return;
    }

    try {
      await splitExpenseService.deleteSplitExpense(id);
      fetchSplitExpenses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete split expense');
    }
  };

  const getSplitTypeIcon = (type: string) => {
    switch (type) {
      case 'equal':
        return <Users className="w-4 h-4" />;
      case 'percentage':
        return <DollarSign className="w-4 h-4" />;
      case 'amount':
        return <Calculator className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getSplitTypeLabel = (type: string) => {
    switch (type) {
      case 'equal':
        return 'Equal Split';
      case 'percentage':
        return 'Percentage Split';
      case 'amount':
        return 'Amount Split';
      default:
        return 'Unknown';
    }
  };

  const getSettlementStatus = (splitExpense: SplitExpense) => {
    if (!splitExpense.participants) return { icon: AlertCircle, label: 'Unknown', color: 'text-gray-500' };
    
    const totalParticipants = splitExpense.participants.length;
    const settledParticipants = splitExpense.participants.filter((p) => p.is_settled).length;

    if (settledParticipants === totalParticipants) {
      return { icon: CheckCircle, label: 'Fully Settled', color: 'text-green-600' };
    } else if (settledParticipants > 0) {
      return { icon: AlertCircle, label: `${settledParticipants}/${totalParticipants} Settled`, color: 'text-yellow-600' };
    } else {
      return { icon: XCircle, label: 'Not Settled', color: 'text-red-600' };
    }
  };

  const filteredSplitExpenses = splitExpenses.filter(splitExpense => {
    const matchesType = !selectedType || splitExpense.split_type === selectedType;
    return matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Split Expenses</h1>
          <p className="text-gray-600">Manage shared expenses with friends and family</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Split Expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 items-center">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Split Types</option>
            <option value="equal">Equal Split</option>
            <option value="percentage">Percentage Split</option>
            <option value="amount">Amount Split</option>
          </select>

          <button
            onClick={() => {
              setSelectedType('');
              setFilters({});
            }}
            className="text-blue-600 hover:text-blue-800 px-3 py-2"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Split Expenses List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredSplitExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No split expenses found</p>
            <p className="mb-4">Create your first split expense to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create Split Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSplitExpenses.map((splitExpense) => {
              const StatusIcon = getSettlementStatus(splitExpense).icon;
              const statusColor = getSettlementStatus(splitExpense).color;
              const statusLabel = getSettlementStatus(splitExpense).label;

              return (
                <div key={splitExpense.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getSplitTypeIcon(splitExpense.split_type)}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {splitExpense.expense?.description || splitExpense.description}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getSplitTypeLabel(splitExpense.split_type)} • {splitExpense.participants?.length || 0} participants
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${splitExpense.total_amount.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(splitExpense.created_at).toLocaleDateString()}
                        </span>
                        <span className={`flex items-center gap-1 ${statusColor}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedSplitExpense(splitExpense);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSplitExpense(splitExpense)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(splitExpense.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Split Expenses</p>
              <p className="text-xl font-semibold text-gray-900">{filteredSplitExpenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fully Settled</p>
              <p className="text-xl font-semibold text-gray-900">
                {filteredSplitExpenses.filter(se =>
                  se.participants?.every((p) => p.is_settled)
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-semibold text-gray-900">
                ${filteredSplitExpenses.reduce((sum, se) => sum + se.total_amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Split Expense Modal */}
      {showAddModal && (
        <AddSplitExpenseForm
          onSuccess={() => {
            setShowAddModal(false);
            fetchSplitExpenses();
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Split Expense Modal */}
      {editingSplitExpense && (
        <AddSplitExpenseForm
          onSuccess={() => {
            setEditingSplitExpense(null);
            fetchSplitExpenses();
          }}
          onClose={() => setEditingSplitExpense(null)}
          expenseId={editingSplitExpense.expense_id}
        />
      )}

      {/* Split Expense Details Modal */}
      {showDetailsModal && selectedSplitExpense && (
        <SplitExpenseDetailsModal
          splitExpense={selectedSplitExpense}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSplitExpense(null);
          }}
          onEdit={(splitExpense) => {
            setShowDetailsModal(false);
            setSelectedSplitExpense(null);
            setEditingSplitExpense(splitExpense);
          }}
          onRefresh={fetchSplitExpenses}
        />
      )}
    </div>
  );
};

// Split Expense Details Modal Component
const SplitExpenseDetailsModal: React.FC<{
  splitExpense: SplitExpense;
  onClose: () => void;
  onEdit: (splitExpense: SplitExpense) => void;
  onRefresh: () => void;
}> = ({ splitExpense, onClose, onEdit, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const handleMarkSettled = async (participantId: number) => {
    try {
      setLoading(true);
      await splitExpenseService.markParticipantSettled(splitExpense.id, participantId);
      onRefresh();
    } catch (error) {
      console.error('Failed to mark participant as settled:', error);
      alert('Failed to mark as settled. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusColor = (isSettled: boolean) => {
    return isSettled ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Split Expense Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="font-medium">{splitExpense.expense?.description || splitExpense.description}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Amount:</span>
                <p className="font-medium text-green-600">{formatCurrency(splitExpense.total_amount)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Split Type:</span>
                <p className="font-medium">{splitExpense.split_type === 'equal' ? 'Equal Split' : splitExpense.split_type === 'percentage' ? 'Percentage Split' : 'Custom Amount'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <p className="font-medium">{new Date(splitExpense.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Participants ({splitExpense.participants?.length || 0})</h3>
              <button
                onClick={() => onEdit(splitExpense)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit Split
              </button>
            </div>

            <div className="space-y-3">
              {splitExpense.participants?.map((participant, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{participant.name}</p>
                          <p className="text-sm text-gray-600">{participant.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Amount: <strong>{formatCurrency(participant.amount_owed)}</strong></span>
                        {splitExpense.split_type === 'percentage' && (
                          <span>({participant.percentage}%)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(participant.is_settled)}`}>
                        {participant.is_settled ? 'Settled' : 'Pending'}
                      </span>
                      {!participant.is_settled && (
                        <button
                          onClick={() => handleMarkSettled(participant.id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                        >
                          Mark Settled
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No participants found</p>
              )}
            </div>
          </div>

          {/* Settlement Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Settlement Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-blue-700">Total Participants:</span>
                <p className="text-xl font-bold text-blue-900">{splitExpense.participants?.length || 0}</p>
              </div>
              <div>
                <span className="text-sm text-blue-700">Settled:</span>
                <p className="text-xl font-bold text-green-600">
                  {splitExpense.participants?.filter((p) => p.is_settled).length || 0}
                </p>
              </div>
              <div>
                <span className="text-sm text-blue-700">Pending:</span>
                <p className="text-xl font-bold text-red-600">
                  {splitExpense.participants?.filter((p) => !p.is_settled).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(splitExpense)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Edit Split
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitExpensesList;