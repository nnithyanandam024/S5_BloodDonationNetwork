export type UserRole = 'DONOR' | 'HOSPITAL' | 'BLOOD_BANK' | 'ADMIN';

export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export type ComponentType = 'WHOLE_BLOOD' | 'RED_BLOOD_CELLS' | 'PLATELETS' | 'PLASMA';

export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'NORMAL';

export type RequestState =
  | 'CREATED'
  | 'MATCHING'
  | 'NOTIFIED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

export interface DonorProfile extends BaseUser {
  role: 'DONOR';
  bloodGroup: BloodGroup;
  dateOfBirth: string;
  location: LocationCoords;
  isAvailable: boolean;
  lastDonationDate?: string;
  donationCount: number;
}

export interface HospitalProfile extends BaseUser {
  role: 'HOSPITAL';
  hospitalName: string;
  licenseNumber: string;
  location: LocationCoords;
}

export interface MatchCandidate {
  donorId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  phone: string;
  distanceKm: number;
  score: number;
  status: 'NOTIFIED' | 'ACCEPTED' | 'DECLINED' | 'TIMEOUT';
  notifiedAt: string;
  respondedAt?: string;
}

export interface BloodRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalPhone: string;
  bloodGroup: BloodGroup;
  component: ComponentType;
  unitsRequired: number;
  urgency: UrgencyLevel;
  requiredBy: string;
  searchRadiusKm: number;
  notes?: string;
  location: LocationCoords;
  status: RequestState;
  createdAt: string;
  updatedAt: string;
  matchedCandidates: MatchCandidate[];
  acceptedDonorId?: string;
  acceptedDonorName?: string;
  acceptedDonorPhone?: string;
  acceptedAt?: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  lastDonationDate?: string;
  nextEligibleDate?: string;
  daysRemaining: number;
  reason?: string;
}
