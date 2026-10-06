import { DonorProfile, BloodRequest } from '../types';
import { storage } from '../services/storage';

export interface IDonorRepository {
  findAllDonors(): DonorProfile[];
  findDonorById(id: string): DonorProfile | undefined;
  updateDonor(id: string, updates: Partial<DonorProfile>): DonorProfile;
  getIncomingRequestsForDonor(donorId: string): BloodRequest[];
}

export class InMemoryDonorRepository implements IDonorRepository {
  public findAllDonors(): DonorProfile[] {
    return storage.getAllDonors();
  }

  public findDonorById(id: string): DonorProfile | undefined {
    const user = storage.getUserById(id);
    if (user && user.role === 'DONOR') {
      return user as DonorProfile;
    }
    return undefined;
  }

  public updateDonor(id: string, updates: Partial<DonorProfile>): DonorProfile {
    return storage.updateDonor(id, updates);
  }

  public getIncomingRequestsForDonor(donorId: string): BloodRequest[] {
    return storage.getIncomingRequestsForDonor(donorId);
  }
}

export const donorRepository = new InMemoryDonorRepository();
