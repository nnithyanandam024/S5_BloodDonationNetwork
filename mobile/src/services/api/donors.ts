import { apiClient } from './client';
import { User, BloodRequest, EligibilityResult, DonationRecord } from '../../types';

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

  /** Returns requests where the donor has an active CONFIRMED/DONATED commitment */
  async getActiveCommitments(): Promise<{ requests: BloodRequest[] }> {
    return apiClient.get<{ requests: BloodRequest[] }>('/donors/active-commitments');
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

  async cancelCommitment(
    requestId: string
  ): Promise<{ message: string; request: BloodRequest }> {
    return apiClient.post<{ message: string; request: BloodRequest }>('/donors/cancel', {
      requestId,
    });
  },

  /**
   * Donor marks that they physically donated blood at the hospital.
   * This sets commitment to DONATED status but does NOT finalize the record.
   * The hospital must call confirmReceipt to create the official DonationRecord.
   */
  async markAsDonated(
    requestId: string
  ): Promise<{ message: string; commitment: any; request: BloodRequest }> {
    return apiClient.post<{ message: string; commitment: any; request: BloodRequest }>(
      '/donors/mark-donated',
      { requestId }
    );
  },

  /**
   * Returns the donor's real finalized donation history.
   * Only records where the hospital has confirmed receipt appear here.
   */
  async getDonationHistory(): Promise<{ records: DonationRecord[]; totalDonations: number }> {
    return apiClient.get<{ records: DonationRecord[]; totalDonations: number }>(
      '/donors/donation-history'
    );
  },
};
