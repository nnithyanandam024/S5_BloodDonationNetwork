import { afgcEngine } from '../src/services/afgcEngine';
import { storage } from '../src/services/storage';
import { inventoryService } from '../src/services/inventoryService';

describe('Adaptive Fulfillment Gap Controller (AFGC Engine)', () => {
  beforeEach(() => {
    storage.clearAllRequests();
    inventoryService.seedInventory();
  });

  test('calculates fulfillment gap formula G = max(0, Q - I_R - D_C)', () => {
    expect(afgcEngine.calculateGap(4, 2, 0)).toBe(2);
    expect(afgcEngine.calculateGap(4, 2, 1)).toBe(1);
    expect(afgcEngine.calculateGap(4, 2, 2)).toBe(0);
    expect(afgcEngine.calculateGap(4, 5, 0)).toBe(0); // surplus inventory
  });

  test('Patent Scenario: Dual-source reservation and dynamic gap recalculation loop', () => {
    // 1. Hospital requests 4 units of B+, authorized inventory supplies 2 compatible units
    const req = afgcEngine.initializeEmergencyRequest({
      hospitalId: 'hospital-city-001',
      hospitalName: 'City Care Super Specialty Hospital',
      hospitalPhone: '+91 80 2345 6789',
      bloodGroup: 'B+',
      component: 'RED_BLOOD_CELLS',
      unitsRequired: 4,
      searchRadiusKm: 15,
      location: { latitude: 12.975, longitude: 77.599 },
      autoReserveInventory: 2, // Exactly 2 compatible units reserved from inventory
    });

    // 2. Initial state verification:
    // Q = 4, I_R = 2, D_C = 0 => Initial Gap G = 2
    expect(req.unitsRequired).toBe(4);
    expect(req.reservedInventoryUnits).toBe(2);
    expect(req.remainingGap).toBe(2);

    // Tier 1 is sized only for the unresolved 2-unit gap:
    // For Gap = 2, tier size = ceil(2.5 * 2) = 5 (capped by available candidates)
    expect(req.dispatchTiers?.length).toBeGreaterThanOrEqual(1);
    expect(req.dispatchTiers![0].targetGap).toBe(2);

    // 3. First donor accepts
    const activeTier = req.dispatchTiers![0];
    const donor1Id = activeTier.invitedDonorIds[0];
    const telemetryAfterDonor1 = afgcEngine.onDonorAccepted(req.id, donor1Id);

    // Gap should recalculate to: 4 - 2 - 1 = 1
    expect(telemetryAfterDonor1.confirmedDonorCount).toBe(1);
    expect(telemetryAfterDonor1.remainingGap).toBe(1);
    expect(telemetryAfterDonor1.status).toBe('PARTIALLY_FULFILLED');

    // 4. Second donor accepts
    const donor2Id = activeTier.invitedDonorIds[1];
    const telemetryAfterDonor2 = afgcEngine.onDonorAccepted(req.id, donor2Id);

    // Gap should recalculate to: 4 - 2 - 2 = 0
    expect(telemetryAfterDonor2.confirmedDonorCount).toBe(2);
    expect(telemetryAfterDonor2.remainingGap).toBe(0);
    expect(telemetryAfterDonor2.status).toBe('FULFILLED');

    // 5. Automatic termination verification:
    // Any remaining invited donors in Tier 1 should now be CANCELLED_GAP_FULFILLED!
    const updatedReq = storage.getBloodRequestById(req.id)!;
    const remainingCandidates = updatedReq.matchedCandidates.filter(
      (c) => c.donorId !== donor1Id && c.donorId !== donor2Id && c.tierNumber === 1
    );

    expect(remainingCandidates.length).toBeGreaterThan(0);
    expect(
      remainingCandidates.every((c) => c.status === 'CANCELLED_GAP_FULFILLED')
    ).toBe(true);
    expect(telemetryAfterDonor2.activeInvitationsCount).toBe(0);
  });

  test('Donor cancellation event re-opens gap and triggers fallback dispatch', () => {
    const req = afgcEngine.initializeEmergencyRequest({
      hospitalId: 'hospital-city-001',
      hospitalName: 'City Care Hospital',
      hospitalPhone: '123456',
      bloodGroup: 'O+',
      unitsRequired: 2,
      location: { latitude: 12.975, longitude: 77.599 },
      autoReserveInventory: false, // Force all 2 units to come from donors
    });

    expect(req.remainingGap).toBe(2);

    const activeTier = req.dispatchTiers![0];
    const donor1 = activeTier.invitedDonorIds[0];
    const donor2 = activeTier.invitedDonorIds[1];

    // Donors accept -> Gap reaches 0
    afgcEngine.onDonorAccepted(req.id, donor1);
    const telFulfilled = afgcEngine.onDonorAccepted(req.id, donor2);
    expect(telFulfilled.remainingGap).toBe(0);
    expect(telFulfilled.status).toBe('FULFILLED');

    // Now Donor 1 cancels!
    const telAfterCancel = afgcEngine.onDonorCancelled(req.id, donor1);

    // Gap must dynamically re-open: 2 - 0 - 1 = 1
    expect(telAfterCancel.remainingGap).toBe(1);
    expect(telAfterCancel.confirmedDonorCount).toBe(1);
    // Request status transitions out of FULFILLED back to active matching/notified
    expect(telAfterCancel.status).not.toBe('FULFILLED');
  });

  test('Suppresses voluntary donor dispatch entirely when inventory fulfills full quantity Q', () => {
    // Hospital needs 2 units of O+, blood bank has 8 available
    const req = afgcEngine.initializeEmergencyRequest({
      hospitalId: 'hospital-city-001',
      hospitalName: 'City Care Hospital',
      hospitalPhone: '123456',
      bloodGroup: 'O+',
      unitsRequired: 2,
      location: { latitude: 12.975, longitude: 77.599 },
      autoReserveInventory: true,
    });

    // Gap must be 0 immediately: 2 - 2 - 0 = 0
    expect(req.reservedInventoryUnits).toBe(2);
    expect(req.remainingGap).toBe(0);
    expect(req.status).toBe('FULFILLED');
    // ZERO donor invitations sent
    expect(req.matchedCandidates.filter((c) => c.status === 'NOTIFIED').length).toBe(0);
  });
});
