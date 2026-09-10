import { apiClient } from './client';
import { BloodRequest, RequestState } from '../../types';

export interface CreateRequestParams {
  bloodGroup: string;
  component?: string;
  unitsRequired: number;
  urgency?: string;
  searchRadiusKm?: number;
  notes?: string;
  requiredBy?: string;
}

export const requestsApi = {
  async createRequest(
    params: CreateRequestParams
  ): Promise<{ message: string; request: BloodRequest }> {
    return apiClient.post<{ message: string; request: BloodRequest }>('/requests', params);
  },

  async getHospitalRequests(): Promise<{ requests: BloodRequest[] }> {
    return apiClient.get<{ requests: BloodRequest[] }>('/requests/hospital');
  },

  async getRequestById(id: string): Promise<{ request: BloodRequest }> {
    return apiClient.get<{ request: BloodRequest }>(`/requests/${id}`);
  },

  async updateRequestStatus(
    id: string,
    status: RequestState
  ): Promise<{ message: string; request: BloodRequest }> {
    return apiClient.put<{ message: string; request: BloodRequest }>(`/requests/${id}/status`, {
      status,
    });
  },
};
