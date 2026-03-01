import apiClient from './api';
import type { User, AuthResponse, UserLogin, UserRegistration } from '../types/index';

export type LoginCredentials = UserLogin;
export type RegisterData = UserRegistration;

class AuthService {
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user';

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    this.setTokens(response.access_token, response.refresh_token);
    this.setUser(response.user);
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    this.setTokens(response.access_token, response.refresh_token);
    this.setUser(response.user);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      this.clearTokens();
      this.clearUser();
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken });
    this.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async getProfile(): Promise<User> {
    return await apiClient.get('/users/profile');
  }

  async getCurrentUser(): Promise<User | null> {
    // First try to get user from localStorage
    const storedUser = this.getStoredUser();
    if (storedUser) {
      return storedUser;
    }

    // If no stored user but we have a token, fetch from API
    if (this.getToken()) {
      try {
        const response = await this.getProfile();
        this.setUser(response);
        return response;
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // If fetching user fails, clear auth data
        this.clearTokens();
        this.clearUser();
      }
    }

    return null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        this.clearUser();
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private clearUser(): void {
    localStorage.removeItem(this.userKey);
  }

  forceLogout(): void {
    console.log('Forcing logout and clearing all auth data');
    this.clearTokens();
    this.clearUser();
  }
}

export const authService = new AuthService();