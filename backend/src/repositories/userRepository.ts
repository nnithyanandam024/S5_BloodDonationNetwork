import { BaseUser, DonorProfile, HospitalProfile } from '../types';
import { storage } from '../services/storage';

export interface IUserRepository {
  findById(id: string): (BaseUser | DonorProfile | HospitalProfile) | undefined;
  findByEmail(email: string): (BaseUser | DonorProfile | HospitalProfile) | undefined;
  save(user: BaseUser | DonorProfile | HospitalProfile): void;
}

export class InMemoryUserRepository implements IUserRepository {
  public findById(id: string): (BaseUser | DonorProfile | HospitalProfile) | undefined {
    return storage.getUserById(id);
  }

  public findByEmail(email: string): (BaseUser | DonorProfile | HospitalProfile) | undefined {
    return storage.getUserByEmail(email);
  }

  public save(user: BaseUser | DonorProfile | HospitalProfile): void {
    storage.saveUser(user);
  }
}

export const userRepository = new InMemoryUserRepository();
