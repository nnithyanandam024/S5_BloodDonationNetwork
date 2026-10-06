import { apiClient } from './client';
import { BloodRequest, RequestState, FulfillmentTelemetry, InventoryUnit } from '../../types';

export interface CreateRequestParams {
  bloodGroup: string;
  component?: string;
  unitsRequired: number;
  urgency?: string;
  searchRadiusKm?: number;
  notes?: string;
  requiredBy?: string;
  autoReserveInventory?: boolean | number;
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

  async getTelemetry(id: string): Promise<{ telemetry: FulfillmentTelemetry }> {
    return apiClient.get<{ telemetry: FulfillmentTelemetry }>(`/requests/${id}/afgc-telemetry`);
  },

  async reserveInventory(
    id: string,
    count: number = 1
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    return apiClient.post<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }>(
      `/requests/${id}/inventory/reserve`,
      { count }
    );
  },

  async releaseInventory(
    id: string,
    unitIds?: string[]
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    return apiClient.post<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }>(
      `/requests/${id}/inventory/release`,
      { unitIds }
    );
  },

  async getAllInventory(): Promise<{ units: InventoryUnit[] }> {
    return apiClient.get<{ units: InventoryUnit[] }>('/requests/inventory/all');
  },

  async simulateDonorAccept(
    id: string
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    return apiClient.post<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }>(
      `/requests/${id}/simulate/donor-accept`,
      {}
    );
  },

  async simulateDonorCancel(
    id: string
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    return apiClient.post<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }>(
      `/requests/${id}/simulate/donor-cancel`,
      {}
    );
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

