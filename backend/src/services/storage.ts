import bcrypt from 'bcryptjs';
import {
  BaseUser,
  DonorProfile,
  HospitalProfile,
  BloodRequest,
  MatchCandidate,
} from '../types';

export class StorageService {
  private users: Map<string, BaseUser | DonorProfile | HospitalProfile> = new Map();
  private requests: Map<string, BloodRequest> = new Map();
  private requestListeners: Map<string, Set<(request: BloodRequest) => void>> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const passwordHash = bcrypt.hashSync('Password123!', 8);

    // Seed Demo Donor 1 (John Doe - O+, near City Hospital)
    const donor1: DonorProfile = {
      id: 'donor-john-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91 98765 43210',
      role: 'DONOR',
      passwordHash,
      createdAt: new Date().toISOString(),
      bloodGroup: 'O+',
      dateOfBirth: '1998-05-14',
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road, Central Bengaluru',
        city: 'Bengaluru',
      },
      isAvailable: true,
      donationCount: 4,
      lastDonationDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(), // 110 days ago (eligible)
    };

    // Seed Demo Donor 2 (Priya Sharma - O-, universal donor, 2.5 km away)
    const donor2: DonorProfile = {
      id: 'donor-priya-002',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98765 43211',
      role: 'DONOR',
      passwordHash,
      createdAt: new Date().toISOString(),
      bloodGroup: 'O-',
      dateOfBirth: '2000-08-22',
      location: {
        latitude: 12.978,
        longitude: 77.601,
        address: 'Indiranagar 100ft Rd',
        city: 'Bengaluru',
      },
      isAvailable: true,
      donationCount: 2,
      lastDonationDate: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Seed Demo Donor 3 (Ineligible donor - recent donation 20 days ago)
    const donor3: DonorProfile = {
      id: 'donor-rahul-003',
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      phone: '+91 98765 43212',
      role: 'DONOR',
      passwordHash,
      createdAt: new Date().toISOString(),
      bloodGroup: 'O+',
      dateOfBirth: '1995-12-05',
      location: {
        latitude: 12.972,
        longitude: 77.595,
        address: 'Brigade Road',
        city: 'Bengaluru',
      },
      isAvailable: true,
      donationCount: 6,
      lastDonationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // Ineligible (must be filtered out!)
    };

    // Seed Demo Donor 4 (Ananya Iyer - O+, 3.1 km)
    const donor4: DonorProfile = {
      id: 'donor-ananya-004',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      phone: '+91 98765 43213',
      role: 'DONOR',
      passwordHash,
      createdAt: new Date().toISOString(),
      bloodGroup: 'O+',
      dateOfBirth: '1999-03-12',
      location: {
        latitude: 12.982,
        longitude: 77.608,
        address: 'Koramangala 4th Block',
        city: 'Bengaluru',
      },
      isAvailable: true,
      donationCount: 3,
      lastDonationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Seed Demo Donor 5 (Karthik Nair - O+, 4.2 km)
    const donor5: DonorProfile = {
      id: 'donor-karthik-005',
      name: 'Karthik Nair',
      email: 'karthik.nair@example.com',
      phone: '+91 98765 43214',
      role: 'DONOR',
      passwordHash,
      createdAt: new Date().toISOString(),
      bloodGroup: 'O+',
      dateOfBirth: '1997-11-20',
      location: {
        latitude: 12.989,
        longitude: 77.615,
        address: 'Ulsoor Lake Road',
        city: 'Bengaluru',
      },
      isAvailable: true,
      donationCount: 5,
      lastDonationDate: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Seed Demo Donor 6 (Sneha Roy - O-, 2.8 km)
    const donor6: DonorProfile = {
      id: 'donor-sneha-006',
      name: 'Sneha Roy',
      email: 'sneha.roy@example.com',
      phone: '+91 98765 43215',
      role: 'DONOR',
      passwordHash,
      createdAt: new Date().toISOString(),
      bloodGroup: 'O-',
      dateOfBirth: '2001-07-19',
      location: {
        latitude: 12.968,
        longitude: 77.589,
        address: 'Richmond Town',
        city: 'Bengaluru',
      },
      isAvailable: true,
      donationCount: 1,
      lastDonationDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Seed Demo Donor 7 (Arjun Menon - B+, 1.9 km)
    const donor7: DonorProfile = {
      id: 'donor-arjun-007',
      name: 'Arjun Menon',
      email: 'arjun.menon@example.com',
      phone: '+91 98765 43216',
      role: 'DONOR',
      passwordHash,
      createdAt: new Date().toISOString(),
      bloodGroup: 'B+',
      dateOfBirth: '1996-04-18',
      location: {
        latitude: 12.973,
        longitude: 77.592,
        address: 'Cubbon Park Road',
        city: 'Bengaluru',
      },
      isAvailable: true,
      donationCount: 4,
      lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Seed Demo Hospital (City Care Hospital)
    const hospital: HospitalProfile = {
      id: 'hospital-city-001',
      name: 'Dr. Ramesh Rao',
      email: 'hospital@citycare.org',
      phone: '+91 80 2345 6789',
      role: 'HOSPITAL',
      passwordHash,
      createdAt: new Date().toISOString(),
      hospitalName: 'City Care Super Specialty Hospital',
      licenseNumber: 'HOSP-BLR-2024-889',
      location: {
        latitude: 12.975,
        longitude: 77.599,
        address: 'Residency Road, Bengaluru',
        city: 'Bengaluru',
      },
    };

    this.users.set(donor1.email.toLowerCase(), donor1);
    this.users.set(donor1.id, donor1);

    this.users.set(donor2.email.toLowerCase(), donor2);
    this.users.set(donor2.id, donor2);

    this.users.set(donor3.email.toLowerCase(), donor3);
    this.users.set(donor3.id, donor3);

    this.users.set(donor4.email.toLowerCase(), donor4);
    this.users.set(donor4.id, donor4);

    this.users.set(donor5.email.toLowerCase(), donor5);
    this.users.set(donor5.id, donor5);

    this.users.set(donor6.email.toLowerCase(), donor6);
    this.users.set(donor6.id, donor6);

    this.users.set(donor7.email.toLowerCase(), donor7);
    this.users.set(donor7.id, donor7);

    this.users.set(hospital.email.toLowerCase(), hospital);
    this.users.set(hospital.id, hospital);
  }

  public getUserByEmail(email: string): (BaseUser | DonorProfile | HospitalProfile) | undefined {
    return this.users.get(email.trim().toLowerCase());
  }

  public getUserById(id: string): (BaseUser | DonorProfile | HospitalProfile) | undefined {
    return this.users.get(id);
  }

  public saveUser(user: BaseUser | DonorProfile | HospitalProfile): void {
    this.users.set(user.email.trim().toLowerCase(), user);
    this.users.set(user.id, user);
  }

  public getAllDonors(): DonorProfile[] {
    const donors: DonorProfile[] = [];
    for (const [key, user] of this.users.entries()) {
      if (key.startsWith('donor-') && user.role === 'DONOR') {
        donors.push(user as DonorProfile);
      }
    }
    return donors;
  }

  public updateDonor(id: string, updates: Partial<DonorProfile>): DonorProfile {
    const user = this.users.get(id) as DonorProfile | undefined;
    if (!user || user.role !== 'DONOR') {
      throw new Error(`Donor with id ${id} not found.`);
    }
    const updated = { ...user, ...updates };
    this.users.set(user.email.toLowerCase(), updated);
    this.users.set(user.id, updated);
    return updated;
  }

  public saveBloodRequest(request: BloodRequest): void {
    this.requests.set(request.id, request);
    this.notifyRequestListeners(request);
  }

  public getBloodRequestById(id: string): BloodRequest | undefined {
    return this.requests.get(id);
  }

  public getAllBloodRequests(): BloodRequest[] {
    return Array.from(this.requests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getRequestsByHospital(hospitalId: string): BloodRequest[] {
    return this.getAllBloodRequests().filter((r) => r.hospitalId === hospitalId);
  }

  public clearAllRequests(): void {
    this.requests.clear();
  }

  public getIncomingRequestsForDonor(donorId: string): BloodRequest[] {
    return this.getAllBloodRequests().filter(
      (r) =>
        r.status === 'NOTIFIED' &&
        r.matchedCandidates.some((c) => c.donorId === donorId && c.status === 'NOTIFIED')
    );
  }

  public subscribeToRequest(requestId: string, listener: (request: BloodRequest) => void): () => void {
    if (!this.requestListeners.has(requestId)) {
      this.requestListeners.set(requestId, new Set());
    }
    this.requestListeners.get(requestId)!.add(listener);

    return () => {
      this.requestListeners.get(requestId)?.delete(listener);
    };
  }

  private notifyRequestListeners(request: BloodRequest): void {
    const listeners = this.requestListeners.get(request.id);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(request);
        } catch (err) {
          console.error('Error notifying request listener:', err);
        }
      }
    }
  }
}

export const storage = new StorageService();
