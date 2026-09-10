import { apiClient } from './client';
import { User, BloodRequest, EligibilityResult } from '../../types';

export const donorsApi = {
  async getProfile(): Promise<{ profile: User }> {
    return apiClient.get<{ profile: User }>('/donors/profile');
  },

  async updateAvailability(isAvailable: boolean): Promise<{ profile: User }> {
    return apiClient.put<{ profile: User }>('/donors/availability', { isAvailable });
  },

  async getEligibility(): Promise<EligibilityResult> {
    return apiClient.get<EligibilityResult>('/donors/eligibility');
  },

  async getIncomingRequests(): Promise<{ requests: BloodRequest[] }> {
    return apiClient.get<{ requests: BloodRequest[] }>('/donors/incoming-requests');
  },

  async respondToRequest(
    requestId: string,
    action: 'ACCEPT' | 'DECLINE'
  ): Promise<{ message: string; request: BloodRequest }> {
    return apiClient.post<{ message: string; request: BloodRequest }>('/donors/respond', {
      requestId,
      action,
    });
  },
};
