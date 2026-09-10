import { apiClient } from './client';
import { User, UserRole } from '../../types';

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  bloodGroup?: string;
  dateOfBirth?: string;
  hospitalName?: string;
  licenseNumber?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    apiClient.setToken(data.token);
    return data;
  },

  async register(params: RegisterParams): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/register', params);
    apiClient.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>('/auth/me');
  },
};
