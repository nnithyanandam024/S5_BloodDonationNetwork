import { BloodRequest } from '../types';
import { storage } from '../services/storage';

export interface IRequestRepository {
  findById(id: string): BloodRequest | undefined;
  findAll(): BloodRequest[];
  findByHospitalId(hospitalId: string): BloodRequest[];
  save(request: BloodRequest): void;
  subscribe(id: string, listener: (request: BloodRequest) => void): () => void;
  clearAll(): void;
}

export class InMemoryRequestRepository implements IRequestRepository {
  public findById(id: string): BloodRequest | undefined {
    return storage.getBloodRequestById(id);
  }

  public findAll(): BloodRequest[] {
    return storage.getAllBloodRequests();
  }

  public findByHospitalId(hospitalId: string): BloodRequest[] {
    return storage.getRequestsByHospital(hospitalId);
  }

  public save(request: BloodRequest): void {
    storage.saveBloodRequest(request);
  }

  public subscribe(id: string, listener: (request: BloodRequest) => void): () => void {
    return storage.subscribeToRequest(id, listener);
  }

  public clearAll(): void {
    storage.clearAllRequests();
  }
}

export const requestRepository = new InMemoryRequestRepository();
