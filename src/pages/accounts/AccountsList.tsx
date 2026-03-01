import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  Banknote,
  TrendingUp,
  Eye,
  EyeOff,
  MoreVertical,
  DollarSign
} from 'lucide-react';
import { accountService, type Account } from '../../services/accounts';
import AddAccountForm from '../../components/accounts/AddAccountForm';
import EditAccountForm from '../../components/accounts/EditAccountForm';

const AccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  const accountTypes = [
    { value: 'checking', label: 'Checking', icon: Building2, color: 'text-blue-600' },
    { value: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-green-600' },
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard, color: 'text-purple-600' },
    { value: 'cash', label: 'Cash', icon: Banknote, color: 'text-yellow-600' },
    { value: 'investment', label: 'Investment', icon: TrendingUp, color: 'text-indigo-600' },
    { value: 'other', label: 'Other', icon: Wallet, color: 'text-gray-600' }
  ];

  useEffect(() => {
    fetchAccounts();
  }, [showInactive]);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await accountService.getAccounts(showInactive);
      setAccounts(data);
    } catch (err: unknown) {
      setError('Failed to load accounts');
      console.error('Accounts error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;
    
    try {
      await accountService.deleteAccount(id);
      setAccounts(accounts.filter(account => account.id !== id));
    } catch (err: unknown) {
      alert('Failed to delete account');
      console.error('Delete account error:', err);
    }
  };

  const toggleAccountStatus = async (account: Account) => {
    try {
      const updatedAccount = await accountService.updateAccount(account.id, { 
        is_active: !account.is_active 
      });
      setAccounts(accounts.map(a => a.id === account.id ? updatedAccount : a));
    } catch (err: unknown) {
      alert('Failed to update account status');
      console.error('Update account error:', err);
    }
  };

  const getAccountTypeInfo = (type: string) => {
    return accountTypes.find(t => t.value === type) || accountTypes.find(t => t.value === 'other')!;
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getBalanceColor = (balance: number, type: string) => {
    if (type === 'credit_card') {
      // For credit cards, negative balance is good (you owe less)
      return balance <= 0 ? 'text-green-600' : 'text-red-600';
    }
    // For other accounts, positive balance is good
    return balance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleAccountCreated = () => {
    setShowAddModal(false);
    fetchAccounts();
  };

  const handleAccountUpdated = () => {
    setEditingAccount(null);
    fetchAccounts();
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || account.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalBalance = filteredAccounts
    .filter(account => account.is_active && account.type !== 'credit_card')
    .reduce((sum, account) => sum + account.balance, 0);

  const totalDebt = filteredAccounts
    .filter(account => account.is_active && account.type === 'credit_card')
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchAccounts} 
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
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Debt</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDebt)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Accounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {accounts.filter(a => a.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Worth</p>
              <p className={`text-2xl font-bold ${getBalanceColor(totalBalance - totalDebt, 'other')}`}>
                {formatCurrency(totalBalance - totalDebt)}
              </p>
            </div>
          </div>
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
              placeholder="Search accounts..."
              className="input pl-10 w-64"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            {accountTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
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

        <span className="text-sm text-gray-500">
          {filteredAccounts.length} account{filteredAccounts.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Accounts List */}
      {filteredAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => {
            const typeInfo = getAccountTypeInfo(account.type);
            const IconComponent = typeInfo.icon;

            return (
              <div
                key={account.id}
                className={`card relative group hover:shadow-md transition-shadow ${
                  !account.is_active ? 'opacity-75 bg-gray-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-gray-100 ${typeInfo.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{typeInfo.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="p-1 text-gray-400 hover:text-primary-600 rounded"
                      title="Edit Account"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <div className="relative group/menu">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md border py-1 z-10 hidden group-hover/menu:block min-w-[120px]">
                        <button
                          onClick={() => toggleAccountStatus(account)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          {account.is_active ? (
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
                          onClick={() => handleDeleteAccount(account.id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Balance</p>
                  <p className={`text-2xl font-bold ${getBalanceColor(account.balance, account.type)}`}>
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  {account.type === 'credit_card' && account.balance > 0 && (
                    <p className="text-xs text-red-600 mt-1">Outstanding debt</p>
                  )}
                </div>

                {account.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{account.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>
                    {account.currency}
                  </span>
                  {!account.is_active && (
                    <span className="text-red-500 font-medium">Inactive</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedType ? 'No accounts found' : 'No accounts yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedType
              ? "No accounts match your current filters. Try adjusting your search or filters."
              : "Add your first account to start tracking your finances across different banks and payment methods."
            }
          </p>
          {!searchTerm && !selectedType && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddAccountForm
          onSuccess={handleAccountCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingAccount && (
        <EditAccountForm
          account={editingAccount}
          onSuccess={handleAccountUpdated}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
};

export default AccountsList;