import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/auth';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Verify token is still valid by making a test API call
        try {
          await authService.getProfile();
        } catch (error) {
          console.log('Token validation failed, clearing auth state');
          clearAuthState();
        }
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);

      // Store tokens and user data
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      clearAuthState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Call backend logout if token exists
      const token = localStorage.getItem('access_token');
      if (token) {
        authService.logout().catch(console.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);

      // Update tokens
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthState();
      throw error;
    }
  };

  const clearAuthState = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};