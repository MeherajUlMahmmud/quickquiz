import { ApiHandler } from './api';
import { AuthResponse, LoginCredentials, RegisterData } from '../types/user';

const getToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await ApiHandler.sendAuthRequest('/auth/register', data);
    return response.data.data;
  },

  login: async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await ApiHandler.sendAuthRequest('/auth/login', data);
    return response.data.data;
  },

  getCurrentUser: async () => {
    const token = getToken();
    const response = await ApiHandler.sendGetRequest('/auth/me', token);
    return response.data.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

