import {
  User,
  BloodGroup,
  ComponentType,
  UrgencyLevel,
  RequestState,
  BloodRequest,
  InventoryUnit,
  MatchCandidate,
  DonorCommitment,
  DonationRecord,
  CandidateInvitationStatus,
} from '../../types';

export const mapProfileToUser = (row: any): User => {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role?.toUpperCase() || 'DONOR',
    authProvider: row.auth_provider?.toUpperCase() || 'LOCAL',
    googleUid: row.google_uid,
    photoUrl: row.photo_url,
    createdAt: row.created_at || new Date().toISOString(),
    bloodGroup: (row.blood_group as BloodGroup) || undefined,
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : undefined,
    isAvailable: row.is_available ?? true,
    lastDonationDate: row.last_donation_date || undefined,
    donationCount: row.total_donations ?? row.donation_count ?? 0,
    hospitalName: row.hospital_name || (row.role?.toUpperCase() === 'HOSPITAL' ? row.name : undefined),
    licenseNumber: row.license_number || undefined,
    location: {
      latitude: row.latitude ?? 12.9716,
      longitude: row.longitude ?? 77.5946,
      address: row.address,
      city: row.city || 'Bengaluru',
    },
  };
};

export const mapBloodRequestRow = (
  reqRow: any,
  invitations: any[] = [],
  commitments: any[] = [],
  donationRows: any[] = [],
  inventoryUnits: any[] = []
): BloodRequest => {
  const matchedCandidates: MatchCandidate[] = invitations.map((inv) => {
    const donorProfile = inv.profiles || inv.donor || {};
    return {
      donorId: inv.donor_id,
      donorName: donorProfile.name || 'Anonymous Donor',
      bloodGroup: (donorProfile.blood_group || reqRow.blood_group) as BloodGroup,
      phone: donorProfile.phone || '',
      distanceKm: inv.distance_km ?? 2.5,
      score: inv.score ?? 0.85,
      status: (inv.status?.toUpperCase() || 'NOTIFIED') as CandidateInvitationStatus,
      notifiedAt: inv.notified_at || inv.created_at || new Date().toISOString(),
      respondedAt: inv.responded_at,
    };
  });

  const donorCommitments: DonorCommitment[] = commitments.map((c) => {
    const donorProfile = c.profiles || c.donor || {};
    return {
      id: c.id,
      donorId: c.donor_id,
      donorName: donorProfile.name || 'Anonymous Donor',
      donorPhone: donorProfile.phone || '',
      bloodGroup: (donorProfile.blood_group || reqRow.blood_group) as BloodGroup,
      status: (c.status?.toUpperCase() || 'CONFIRMED') as any,
      committedAt: c.created_at || new Date().toISOString(),
      arrivedAt: c.arrived_at,
      donatedAt: c.donated_at,
      receivedAt: c.received_at,
    };
  });

  const donationRecords: DonationRecord[] = donationRows.map((d) => {
    const donorProfile = d.donor || {};
    const hospProfile = d.hospital || {};
    return {
      id: d.id,
      requestId: d.request_id,
      hospitalId: d.hospital_id,
      hospitalName: hospProfile.hospital_name || hospProfile.name || 'Hospital',
      donorId: d.donor_id,
      donorName: donorProfile.name || 'Anonymous Donor',
      donorPhone: donorProfile.phone || '',
      bloodGroup: (d.blood_group || reqRow.blood_group) as BloodGroup,
      component: (d.component || reqRow.component || 'WHOLE_BLOOD') as ComponentType,
      donatedAt: d.donation_date || d.created_at || new Date().toISOString(),
      receivedAt: d.donation_date || d.created_at || new Date().toISOString(),
      unitsGiven: d.units || 1,
    };
  });

  const reservedInventoryUnitIds = inventoryUnits
    .filter((u) => u.request_id === reqRow.id || u.status === 'reserved')
    .map((u) => u.id);

  const unitsRequired = reqRow.units_required || 1;
  const reservedInventoryUnits = reservedInventoryUnitIds.length;
  const confirmedDonorCount = donorCommitments.filter(
    (c) => c.status === 'CONFIRMED' || c.status === 'ARRIVED' || c.status === 'DONATED' || c.status === 'RECEIVED'
  ).length;

  const remainingGap = Math.max(0, unitsRequired - reservedInventoryUnits - confirmedDonorCount);

  return {
    id: reqRow.id,
    hospitalId: reqRow.hospital_id,
    hospitalName: reqRow.profiles?.hospital_name || reqRow.profiles?.name || 'City Hospital',
    hospitalPhone: reqRow.profiles?.phone || '+91 80 2222 3333',
    bloodGroup: (reqRow.blood_group as BloodGroup) || 'O+',
    component: (reqRow.component?.toUpperCase() || 'WHOLE_BLOOD') as ComponentType,
    unitsRequired,
    requiredQuantity: unitsRequired,
    reservedInventoryUnits,
    confirmedDonorCount,
    remainingGap,
    reservedInventoryUnitIds,
    donorCommitments,
    urgency: (reqRow.urgency?.toUpperCase() || 'NORMAL') as UrgencyLevel,
    requiredBy: reqRow.required_by || new Date(Date.now() + 86400000).toISOString(),
    searchRadiusKm: reqRow.search_radius_km || 10,
    notes: reqRow.notes,
    location: {
      latitude: reqRow.latitude ?? 12.975,
      longitude: reqRow.longitude ?? 77.599,
      city: reqRow.city || 'Bengaluru',
    },
    status: (reqRow.status?.toUpperCase() || 'MATCHING') as RequestState,
    createdAt: reqRow.created_at || new Date().toISOString(),
    updatedAt: reqRow.updated_at || new Date().toISOString(),
    matchedCandidates,
    donationRecords,
  };
};

export const mapInventoryUnitRow = (row: any): InventoryUnit => {
  return {
    id: row.id,
    bloodBankId: row.hospital_id,
    bloodBankName: row.profiles?.hospital_name || row.profiles?.name || 'City Central Blood Bank',
    bloodGroup: row.blood_group as BloodGroup,
    component: (row.component?.toUpperCase() || 'WHOLE_BLOOD') as ComponentType,
    units: 1,
    status: (row.status?.toUpperCase() || 'AVAILABLE') as any,
    storageLocation: {
      latitude: row.profiles?.latitude ?? 12.9716,
      longitude: row.profiles?.longitude ?? 77.5946,
      city: row.storage_location || 'Bengaluru',
    },
    expiryDate: row.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString(),
    reservedForRequestId: row.request_id || undefined,
  };
};
