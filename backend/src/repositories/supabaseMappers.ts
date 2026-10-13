import {
  BaseUser,
  DonorProfile,
  HospitalProfile,
  InventoryUnit,
  BloodRequest,
  DonorCommitment,
  MatchCandidate,
  DonationRecord,
  CandidateInvitationStatus,
} from '../types';

export const profileToUser = (row: any): BaseUser | DonorProfile | HospitalProfile => {
  const base = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    passwordHash: row.password_hash,
    authProvider: row.auth_provider || 'LOCAL',
    googleUid: row.google_uid,
    photoUrl: row.photo_url,
    createdAt: row.created_at || new Date().toISOString(),
  };

  if (row.role === 'DONOR') {
    return {
      ...base,
      role: 'DONOR',
      bloodGroup: row.blood_group || 'O+',
      dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : '2000-01-01',
      isAvailable: row.is_available ?? true,
      lastDonationDate: row.last_donation_date || undefined,
      donationCount: row.donation_count || 0,
      location: {
        latitude: row.latitude ?? 12.9716,
        longitude: row.longitude ?? 77.5946,
        address: row.address,
        city: row.city || 'Bengaluru',
      },
    } as DonorProfile;
  }

  if (row.role === 'HOSPITAL') {
    return {
      ...base,
      role: 'HOSPITAL',
      hospitalName: row.hospital_name || row.name,
      licenseNumber: row.license_number || 'LIC-PENDING',
      location: {
        latitude: row.latitude ?? 12.975,
        longitude: row.longitude ?? 77.599,
        address: row.address,
        city: row.city || 'Bengaluru',
      },
    } as HospitalProfile;
  }

  return base as BaseUser;
};

export const userToProfileRow = (user: BaseUser | DonorProfile | HospitalProfile): any => {
  const row: any = {
    id: user.id,
    email: user.email.toLowerCase(),
    password_hash: user.passwordHash,
    name: user.name,
    phone: user.phone,
    role: user.role,
    auth_provider: user.authProvider || 'LOCAL',
    google_uid: user.googleUid,
    photo_url: user.photoUrl,
    created_at: user.createdAt,
    updated_at: new Date().toISOString(),
  };

  if (user.role === 'DONOR') {
    const d = user as DonorProfile;
    row.blood_group = d.bloodGroup;
    row.date_of_birth = d.dateOfBirth;
    row.is_available = d.isAvailable;
    row.last_donation_date = d.lastDonationDate;
    row.donation_count = d.donationCount;
    row.latitude = d.location?.latitude ?? 12.9716;
    row.longitude = d.location?.longitude ?? 77.5946;
    row.address = d.location?.address;
    row.city = d.location?.city || 'Bengaluru';
  } else if (user.role === 'HOSPITAL') {
    const h = user as HospitalProfile;
    row.hospital_name = h.hospitalName;
    row.license_number = h.licenseNumber;
    row.latitude = h.location?.latitude ?? 12.975;
    row.longitude = h.location?.longitude ?? 77.599;
    row.address = h.location?.address;
    row.city = h.location?.city || 'Bengaluru';
  }

  return row;
};

export const inventoryRowToUnit = (row: any): InventoryUnit => {
  return {
    id: row.id,
    bloodBankId: row.blood_bank_id,
    bloodBankName: row.blood_bank_name,
    bloodGroup: row.blood_group,
    component: row.component,
    units: row.units || 1,
    status: row.status,
    storageLocation: {
      latitude: row.latitude ?? 12.975,
      longitude: row.longitude ?? 77.599,
      address: row.storage_address,
      city: 'Bengaluru',
    },
    expiryDate: row.expiry_date,
    reservedForRequestId: row.reserved_for_request_id || undefined,
    reservedAt: row.reserved_at || undefined,
  };
};

export const unitToInventoryRow = (unit: InventoryUnit): any => {
  return {
    id: unit.id,
    blood_bank_id: unit.bloodBankId,
    blood_bank_name: unit.bloodBankName,
    blood_group: unit.bloodGroup,
    component: unit.component,
    units: unit.units,
    status: unit.status,
    latitude: unit.storageLocation?.latitude ?? 12.975,
    longitude: unit.storageLocation?.longitude ?? 77.599,
    storage_address: unit.storageLocation?.address,
    expiry_date: unit.expiryDate,
    reserved_for_request_id: unit.reservedForRequestId || null,
    reserved_at: unit.reservedAt || null,
  };
};

export const requestRowToBloodRequest = (
  row: any,
  matchedCandidates: MatchCandidate[] = [],
  donorCommitments: DonorCommitment[] = [],
  donationRecords: DonationRecord[] = []
): BloodRequest => {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    hospitalPhone: row.hospital_phone,
    bloodGroup: row.blood_group,
    component: row.component,
    unitsRequired: row.units_required,
    requiredQuantity: row.required_quantity ?? row.units_required,
    reservedInventoryUnits: row.initial_inventory_reserved || 0,
    remainingGap: row.initial_gap ?? undefined,
    urgency: row.urgency || 'URGENT',
    requiredBy: row.required_by || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    searchRadiusKm: row.search_radius_km || 15,
    status: row.status,
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
      city: row.city || 'Bengaluru',
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentTier: row.current_tier || 1,
    matchedCandidates,
    donorCommitments,
    donationRecords,
    acceptedDonorId: row.accepted_donor_id || undefined,
    acceptedDonorName: row.accepted_donor_name || undefined,
    acceptedDonorPhone: row.accepted_donor_phone || undefined,
    acceptedAt: row.accepted_at || undefined,
  };
};

export const bloodRequestToRow = (req: BloodRequest): any => {
  return {
    id: req.id,
    hospital_id: req.hospitalId,
    hospital_name: req.hospitalName,
    hospital_phone: req.hospitalPhone,
    blood_group: req.bloodGroup,
    component: req.component,
    units_required: req.unitsRequired,
    required_quantity: req.requiredQuantity ?? req.unitsRequired,
    urgency: req.urgency,
    status: req.status,
    latitude: req.location.latitude,
    longitude: req.location.longitude,
    city: req.location.city || 'Bengaluru',
    dual_source_enabled: true,
    initial_inventory_reserved: req.reservedInventoryUnits || 0,
    initial_gap: req.remainingGap ?? null,
    current_tier: req.currentTier || 1,
    total_tiers: req.dispatchTiers?.length || 1,
    accepted_donor_id: req.acceptedDonorId || null,
    accepted_donor_name: req.acceptedDonorName || null,
    accepted_donor_phone: req.acceptedDonorPhone || null,
    accepted_at: req.acceptedAt || null,
    created_at: req.createdAt,
    updated_at: new Date().toISOString(),
  };
};
