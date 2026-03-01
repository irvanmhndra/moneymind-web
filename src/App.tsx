import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Error Boundary components
import ErrorBoundary from './components/error/ErrorBoundary';
import AsyncErrorBoundary from './components/error/AsyncErrorBoundary';



// Layout components
import Layout from './components/layout/Layout';

// Page components (we'll create these)
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ExpensesList from './pages/expenses/ExpensesList';
import CategoriesList from './pages/categories/CategoriesList';
import AccountsList from './pages/accounts/AccountsList';
import BudgetsList from './pages/budgets/BudgetsList';
import GoalsList from './pages/goals/GoalsList';
import SplitExpensesList from './pages/split-expenses/SplitExpensesList';
import Analytics from './pages/Analytics';
import Settings from './pages/settings/Settings';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Simple Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary level="critical">
      <QueryClientProvider client={queryClient}>
        <AsyncErrorBoundary showNotification={true} autoRetry={false}>
          <Router>
              <div className="App">
              <Routes>
                {/* Auth routes */}
                <Route
                  path="/auth/login"
                  element={
                    <ErrorBoundary level="page">
                      <Login />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/auth/register"
                  element={
                    <ErrorBoundary level="page">
                      <Register />
                    </ErrorBoundary>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ErrorBoundary level="page">
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                >
                  <Route
                    index
                    element={
                      <ErrorBoundary level="component">
                        <Dashboard />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="expenses"
                    element={
                      <ErrorBoundary level="component">
                        <ExpensesList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="expenses/new"
                    element={
                      <ErrorBoundary level="component">
                        <ExpensesList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="expenses/:id/edit"
                    element={
                      <ErrorBoundary level="component">
                        <ExpensesList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="categories"
                    element={
                      <ErrorBoundary level="component">
                        <CategoriesList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="categories/new"
                    element={
                      <ErrorBoundary level="component">
                        <CategoriesList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="accounts"
                    element={
                      <ErrorBoundary level="component">
                        <AccountsList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="accounts/new"
                    element={
                      <ErrorBoundary level="component">
                        <AccountsList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="budgets"
                    element={
                      <ErrorBoundary level="component">
                        <BudgetsList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="budgets/new"
                    element={
                      <ErrorBoundary level="component">
                        <BudgetsList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="goals"
                    element={
                      <ErrorBoundary level="component">
                        <GoalsList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="goals/new"
                    element={
                      <ErrorBoundary level="component">
                        <GoalsList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="split-expenses"
                    element={
                      <ErrorBoundary level="component">
                        <SplitExpensesList />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="analytics"
                    element={
                      <ErrorBoundary level="component">
                        <Analytics />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <ErrorBoundary level="component">
                        <Settings />
                      </ErrorBoundary>
                    }
                  />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>

          {/* React Query Dev Tools */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </AsyncErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;