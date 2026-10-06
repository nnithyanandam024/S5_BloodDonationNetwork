import { tieredDispatchService } from '../src/services/tieredDispatch';
import { BloodRequest, MatchCandidate } from '../src/types';

describe('Tiered Dispatch Service', () => {
  const mockCandidates: MatchCandidate[] = [
    { donorId: 'd1', donorName: 'Donor 1', bloodGroup: 'O+', phone: '111', distanceKm: 2.1, score: 90, status: 'NOTIFIED', notifiedAt: '' },
    { donorId: 'd2', donorName: 'Donor 2', bloodGroup: 'O+', phone: '222', distanceKm: 3.5, score: 85, status: 'NOTIFIED', notifiedAt: '' },
    { donorId: 'd3', donorName: 'Donor 3', bloodGroup: 'O+', phone: '333', distanceKm: 4.8, score: 80, status: 'NOTIFIED', notifiedAt: '' },
    { donorId: 'd4', donorName: 'Donor 4', bloodGroup: 'O+', phone: '444', distanceKm: 5.2, score: 75, status: 'NOTIFIED', notifiedAt: '' },
    { donorId: 'd5', donorName: 'Donor 5', bloodGroup: 'O+', phone: '555', distanceKm: 6.0, score: 70, status: 'NOTIFIED', notifiedAt: '' },
    { donorId: 'd6', donorName: 'Donor 6', bloodGroup: 'O+', phone: '666', distanceKm: 7.1, score: 65, status: 'NOTIFIED', notifiedAt: '' },
  ];

  test('dynamically sizes candidate tier based on remaining gap G', () => {
    // Gap = 1, alpha = 2.5 -> ceil(2.5 * 1) = 3
    expect(tieredDispatchService.calculateTierSize(1, 10)).toBe(3);

    // Gap = 2, alpha = 2.5 -> ceil(2.5 * 2) = 5
    expect(tieredDispatchService.calculateTierSize(2, 10)).toBe(5);

    // When candidates available < calculated size, caps to available
    expect(tieredDispatchService.calculateTierSize(2, 4)).toBe(4);

    // Gap = 0 returns 0
    expect(tieredDispatchService.calculateTierSize(0, 10)).toBe(0);
  });

  test('creates Tier 1 with ephemeral credentials and bounded candidate count', () => {
    const mockRequest: BloodRequest = {
      id: 'REQ-TIER-001',
      hospitalId: 'hosp-1',
      hospitalName: 'Hospital 1',
      hospitalPhone: '999',
      bloodGroup: 'O+',
      component: 'RED_BLOOD_CELLS',
      unitsRequired: 2,
      remainingGap: 2,
      urgency: 'URGENT',
      requiredBy: new Date().toISOString(),
      searchRadiusKm: 15,
      location: { latitude: 12.9, longitude: 77.6 },
      status: 'NOTIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      matchedCandidates: JSON.parse(JSON.stringify(mockCandidates)),
    };

    const tier = tieredDispatchService.createAndActivateTier(
      mockRequest,
      mockRequest.matchedCandidates,
      2
    );

    expect(tier).not.toBeNull();
    expect(tier?.tierNumber).toBe(1);
    expect(tier?.invitedDonorIds.length).toBe(5); // ceil(2.5 * 2) = 5
    expect(mockRequest.currentTier).toBe(1);

    // Check that invited candidates have assigned tierNumber and ephemeralToken
    const firstCand = mockRequest.matchedCandidates[0];
    expect(firstCand.tierNumber).toBe(1);
    expect(firstCand.ephemeralToken).toBeDefined();
  });

  test('terminates all unaccepted invitations when fulfillment gap reaches 0', () => {
    const mockRequest: BloodRequest = {
      id: 'REQ-TIER-002',
      hospitalId: 'hosp-1',
      hospitalName: 'Hospital 1',
      hospitalPhone: '999',
      bloodGroup: 'O+',
      component: 'RED_BLOOD_CELLS',
      unitsRequired: 1,
      remainingGap: 0,
      urgency: 'URGENT',
      requiredBy: new Date().toISOString(),
      searchRadiusKm: 15,
      location: { latitude: 12.9, longitude: 77.6 },
      status: 'NOTIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      matchedCandidates: [
        { donorId: 'd1', donorName: 'D1', bloodGroup: 'O+', phone: '1', distanceKm: 1, score: 90, status: 'ACCEPTED', tierNumber: 1, notifiedAt: '' },
        { donorId: 'd2', donorName: 'D2', bloodGroup: 'O+', phone: '2', distanceKm: 2, score: 80, status: 'NOTIFIED', tierNumber: 1, notifiedAt: '' },
        { donorId: 'd3', donorName: 'D3', bloodGroup: 'O+', phone: '3', distanceKm: 3, score: 70, status: 'NOTIFIED', tierNumber: 1, notifiedAt: '' },
      ],
      dispatchTiers: [{
        tierNumber: 1,
        targetGap: 1,
        invitedDonorIds: ['d1', 'd2', 'd3'],
        status: 'ACTIVE',
        dispatchedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      }],
    };

    const cancelledCount = tieredDispatchService.terminateUnacceptedInvitations(mockRequest);
    expect(cancelledCount).toBe(2);

    expect(mockRequest.matchedCandidates[0].status).toBe('ACCEPTED');
    expect(mockRequest.matchedCandidates[1].status).toBe('CANCELLED_GAP_FULFILLED');
    expect(mockRequest.matchedCandidates[2].status).toBe('CANCELLED_GAP_FULFILLED');
    expect(mockRequest.dispatchTiers![0].status).toBe('FULFILLED');
  });
});
