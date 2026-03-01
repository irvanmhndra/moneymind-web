import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Bell,
  Globe,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Settings as SettingsIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Database,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    budgetAlerts: true,
    expenseReminders: true,
    goalProgress: true
  });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    currency: 'USD',
    timezone: 'America/New_York'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    // Load user data from localStorage or API
    loadUserData();
  }, []);

  const loadUserData = () => {
    // In a real app, this would fetch from an API
    const savedData = localStorage.getItem('userProfile');
    if (savedData) {
      setProfileData(JSON.parse(savedData));
    }

    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme));
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setSaveStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem('userProfile', JSON.stringify(profileData));
      setSaveStatus('Profile saved successfully!');

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: unknown) {
      setSaveStatus('Failed to save profile. Please try again.');
      console.error('Profile save error:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    setSaveStatus(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      localStorage.setItem('notificationSettings', JSON.stringify(notifications));
      setSaveStatus('Notification preferences saved!');

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: unknown) {
      setSaveStatus('Failed to save preferences. Please try again.');
      console.error('Notification save error:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveStatus('Passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setSaveStatus('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setSaveStatus(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveStatus('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: unknown) {
      setSaveStatus('Failed to change password. Please try again.');
      console.error('Password change error:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('darkMode', JSON.stringify(newTheme));
    setSaveStatus(`Switched to ${newTheme ? 'dark' : 'light'} mode!`);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 1500));

      const data = {
        profile: profileData,
        settings: { notifications, darkMode: isDarkMode },
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moneymind-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveStatus('Data exported successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: unknown) {
      setSaveStatus('Failed to export data.');
      console.error('Data export error:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.'
    );

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'This is your final warning. Deleting your account will permanently remove all your expenses, budgets, goals, and split expenses. Type "DELETE" in the next prompt to confirm.'
      );

      if (doubleConfirmed) {
        const typed = prompt('Please type "DELETE" to confirm account deletion:');
        if (typed === 'DELETE') {
          // In a real app, this would call an API
          setSaveStatus('Account deletion initiated. You will receive an email confirmation.');
        }
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'data', label: 'Data & Privacy', icon: Database }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {saveStatus && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            saveStatus.includes('successfully') || saveStatus.includes('saved') || saveStatus.includes('Switched')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {saveStatus}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Currency
                  </label>
                  <select
                    value={profileData.currency}
                    onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <Shield className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Password Security
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.email ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.push ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Budget Alerts</h3>
                      <p className="text-sm text-gray-500">Get notified when you're close to budget limits</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, budgetAlerts: !prev.budgetAlerts }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notifications.budgetAlerts ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.budgetAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Expense Reminders</h3>
                      <p className="text-sm text-gray-500">Reminders to track daily expenses</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, expenseReminders: !prev.expenseReminders }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notifications.expenseReminders ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.expenseReminders ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <SettingsIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Goal Progress</h3>
                      <p className="text-sm text-gray-500">Updates on your financial goal progress</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, goalProgress: !prev.goalProgress }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notifications.goalProgress ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.goalProgress ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotifications}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">App Preferences</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isDarkMode ? <Moon className="w-5 h-5 text-gray-400 mr-3" /> : <Sun className="w-5 h-5 text-gray-400 mr-3" />}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Dark Mode</h3>
                      <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isDarkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Timezone
                  </label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <SettingsIcon className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        More preferences coming soon!
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>We're working on adding more customization options including language settings, date formats, and number formats.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Data & Privacy</h2>

              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Your privacy is important
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>We never sell your data and only use it to provide you with a better experience.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Export Your Data</h3>
                    <p className="text-sm text-gray-500 mb-4">Download a copy of all your data in JSON format</p>
                    <button
                      onClick={handleExportData}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Export Data
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Import Data</h3>
                    <p className="text-sm text-gray-500 mb-4">Import data from a previously exported file</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import Data
                    </button>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-600 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;