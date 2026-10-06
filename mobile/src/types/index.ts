export type UserRole = 'DONOR' | 'HOSPITAL' | 'BLOOD_BANK' | 'ADMIN';

export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export type ComponentType = 'WHOLE_BLOOD' | 'RED_BLOOD_CELLS' | 'PLATELETS' | 'PLASMA';

export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'NORMAL';

export type RequestState =
  | 'CREATED'
  | 'MATCHING'
  | 'NOTIFIED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED';

export type InventoryStatus = 'AVAILABLE' | 'RESERVED' | 'DISPATCHED' | 'EXPIRED';

export interface InventoryUnit {
  id: string;
  bloodBankId: string;
  bloodBankName: string;
  bloodGroup: BloodGroup;
  component: ComponentType;
  units: number;
  status: InventoryStatus;
  storageLocation: LocationCoords;
  expiryDate: string;
  reservedForRequestId?: string;
  reservedAt?: string;
}

export type DonorCommitmentStatus = 'CONFIRMED' | 'ARRIVED' | 'CANCELLED';

export interface DonorCommitment {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  bloodGroup: BloodGroup;
  status: DonorCommitmentStatus;
  committedAt: string;
  arrivedAt?: string;
  cancelledAt?: string;
  ephemeralToken?: string;
}

export type TierStatus = 'ACTIVE' | 'FULFILLED' | 'TIMED_OUT' | 'CANCELLED';

export interface DispatchTier {
  tierNumber: number;
  targetGap: number;
  invitedDonorIds: string[];
  status: TierStatus;
  dispatchedAt: string;
  expiresAt: string;
}

export type CandidateInvitationStatus =
  | 'PENDING'
  | 'NOTIFIED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'TIMEOUT'
  | 'CANCELLED_GAP_FULFILLED';

export interface EphemeralProximityCredential {
  token: string;
  donorId: string;
  requestId: string;
  distanceBandKm: number;
  issuedAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

export interface FulfillmentTelemetry {
  requestId: string;
  requiredQuantity: number;        // Q
  reservedInventoryUnits: number;  // I_R
  confirmedDonorCount: number;     // D_C
  remainingGap: number;            // G = max(0, Q - I_R - D_C)
  currentTier: number;
  totalTiers: number;
  activeInvitationsCount: number;
  cancelledInvitationsCount: number;
  status: RequestState;
  dispatchEfficiency: number;      // D_C / Total Invitations Sent
  updatedAt: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  // Donor specific
  bloodGroup?: BloodGroup;
  dateOfBirth?: string;
  isAvailable?: boolean;
  lastDonationDate?: string;
  donationCount?: number;
  // Hospital specific
  hospitalName?: string;
  licenseNumber?: string;
  location?: LocationCoords;
}

export interface MatchCandidate {
  donorId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  phone: string;
  distanceKm: number;
  score: number;
  status: CandidateInvitationStatus;
  tierNumber?: number;
  ephemeralToken?: string;
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
  requiredQuantity?: number;             // Q (AFGC)
  reservedInventoryUnits?: number;       // I_R (AFGC)
  confirmedDonorCount?: number;          // D_C (AFGC)
  remainingGap?: number;                 // G = max(0, Q - I_R - D_C)
  reservedInventoryUnitIds?: string[];
  donorCommitments?: DonorCommitment[];
  dispatchTiers?: DispatchTier[];
  currentTier?: number;
  ephemeralCredentials?: Record<string, EphemeralProximityCredential>;
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

