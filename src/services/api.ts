import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        // Enhanced error logging
        console.group('🌐 API Error');
        console.error('Error config:', error.config);
        console.error('Error response:', error.response);
        console.error('Error response data:', error.response?.data);
        console.error('Error response status:', error.response?.status);
        console.error('Error response headers:', error.response?.headers);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Request URL:', error.config?.url);
        console.error('Request method:', error.config?.method);
        console.error('Request headers:', error.config?.headers);
        console.error('Request params:', error.config?.params);
        console.error('Request data:', error.config?.data);
        console.groupEnd();

        if (error.response?.status === 401) {
          // Clear any existing tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');

          console.log('401 Unauthorized - tokens cleared, redirecting to login');

          // Force redirect to login page
          if (window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login';
          }

          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // For file uploads
  async upload<T = unknown>(url: string, formData: FormData, onUploadProgress?: (progress: number) => void): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onUploadProgress(Math.round(progress));
        }
      },
    });
    return response.data.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;