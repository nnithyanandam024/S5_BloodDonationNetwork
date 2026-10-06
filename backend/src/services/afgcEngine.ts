import {
  BloodRequest,
  BloodGroup,
  ComponentType,
  UrgencyLevel,
  LocationCoords,
  FulfillmentTelemetry,
  DonorCommitment,
  MatchCandidate,
} from '../types';
import { requestRepository, donorRepository, inventoryRepository } from '../repositories';
import { tieredDispatchService } from './tieredDispatch';
import { proximityCredentialService } from './proximityCredential';
import { findAndRankDonors } from './matching';
import { validateAndTransition } from './stateMachine';
import { AFGC_CONSTANTS } from '../config/constants';

export interface InitializeRequestParams {
  hospitalId: string;
  hospitalName: string;
  hospitalPhone: string;
  bloodGroup: BloodGroup;
  component?: ComponentType;
  unitsRequired: number;
  urgency?: UrgencyLevel;
  searchRadiusKm?: number;
  location: LocationCoords;
  requiredBy?: string;
  notes?: string;
  autoReserveInventory?: boolean | number; // true (reserve up to Q), false (reserve 0), or number (reserve up to N units)
}

export class AFGCEngine {
  /**
   * Primary mathematical formulation:
   * G = max(0, Q - I_R - D_C)
   */
  public calculateGap(
    requiredQuantity: number,
    reservedInventory: number,
    confirmedDonors: number
  ): number {
    return Math.max(0, requiredQuantity - reservedInventory - confirmedDonors);
  }

  /**
   * Initializes emergency blood request with closed-loop dual-source fulfillment.
   * Step 1: Interrogate authorized inventory & reserve compatible units.
   * Step 2: Calculate fulfillment gap G.
   * Step 3: Dispatch donor tier only for the unresolved gap G.
   */
  public initializeEmergencyRequest(params: InitializeRequestParams): BloodRequest {
    const requestId = `REQ-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const Q = Number(params.unitsRequired);
    const component = params.component || 'RED_BLOOD_CELLS';

    // Step 1: Query authorized inventory and reserve compatible units up to Q (or max specified)
    let reservedUnits = 0;
    let reservedIds: string[] = [];
    if (params.autoReserveInventory !== false) {
      const maxToReserve =
        typeof params.autoReserveInventory === 'number'
          ? Math.min(Q, params.autoReserveInventory)
          : Q;

      const reserved = inventoryRepository.reserveCompatible(
        requestId,
        params.bloodGroup,
        maxToReserve,
        component
      );
      reservedUnits = reserved.length;
      reservedIds = reserved.map((u) => u.id);
    }

    // Step 2: Compute initial fulfillment gap
    const initialGap = this.calculateGap(Q, reservedUnits, 0);

    // Prepare candidate pool
    const allDonors = donorRepository.findAllDonors();
    const radius = Number(params.searchRadiusKm) || 15;
    const rankedCandidates = findAndRankDonors(
      {
        bloodGroup: params.bloodGroup,
        location: params.location,
        searchRadiusKm: radius,
      },
      allDonors
    );

    const initialStatus = initialGap === 0 ? 'FULFILLED' : 'NOTIFIED';

    const bloodRequest: BloodRequest = {
      id: requestId,
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
      hospitalPhone: params.hospitalPhone,
      bloodGroup: params.bloodGroup,
      component,
      unitsRequired: Q,
      requiredQuantity: Q,
      reservedInventoryUnits: reservedUnits,
      confirmedDonorCount: 0,
      remainingGap: initialGap,
      reservedInventoryUnitIds: reservedIds,
      donorCommitments: [],
      dispatchTiers: [],
      currentTier: 0,
      urgency: params.urgency || 'URGENT',
      requiredBy: params.requiredBy || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      searchRadiusKm: radius,
      notes: params.notes || '',
      location: params.location,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
      matchedCandidates: rankedCandidates.map((c) => ({
        ...c,
        status: 'PENDING' as const,
        tierNumber: undefined,
        ephemeralToken: undefined,
      })),
    };

    // Step 3: If gap > 0, activate Tier 1 dispatch only for the remaining gap
    if (initialGap > 0 && bloodRequest.matchedCandidates.length > 0) {
      tieredDispatchService.createAndActivateTier(
        bloodRequest,
        bloodRequest.matchedCandidates,
        initialGap
      );
    }

    requestRepository.save(bloodRequest);
    return bloodRequest;
  }

  /**
   * Event 1: Additional inventory secured/reserved for request.
   */
  public onInventoryReserved(requestId: string, count: number): FulfillmentTelemetry {
    const request = requestRepository.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    const reserved = inventoryRepository.reserveCompatible(
      requestId,
      request.bloodGroup,
      count,
      request.component
    );

    const prevReserved = request.reservedInventoryUnits || 0;
    const newReserved = prevReserved + reserved.length;
    request.reservedInventoryUnits = newReserved;
    request.reservedInventoryUnitIds = [
      ...(request.reservedInventoryUnitIds || []),
      ...reserved.map((u) => u.id),
    ];

    return this.recalculateAndUpdate(request, 'INVENTORY_RESERVED');
  }

  /**
   * Event 2: Inventory released or unit compromised.
   */
  public onInventoryReleased(requestId: string, unitIds?: string[]): FulfillmentTelemetry {
    const request = requestRepository.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    const released = inventoryRepository.releaseForRequest(requestId, unitIds);
    const prevReserved = request.reservedInventoryUnits || 0;
    request.reservedInventoryUnits = Math.max(0, prevReserved - released.length);

    if (request.reservedInventoryUnitIds) {
      const releasedSet = new Set(released.map((r) => r.id));
      request.reservedInventoryUnitIds = request.reservedInventoryUnitIds.filter(
        (id) => !releasedSet.has(id)
      );
    }

    return this.recalculateAndUpdate(request, 'INVENTORY_RELEASED');
  }

  /**
   * Event 3: Candidate donor confirms acceptance.
   * Central Patent Step: Converts to commitment, recalculates G, and auto-kills remaining invites if G = 0.
   */
  public onDonorAccepted(requestId: string, donorId: string): FulfillmentTelemetry {
    const request = requestRepository.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    const candidate = request.matchedCandidates.find((c) => c.donorId === donorId);
    if (!candidate) throw new Error(`Donor ${donorId} not found in candidate pool`);

    if (candidate.status === 'ACCEPTED') {
      return this.getTelemetry(requestId);
    }

    candidate.status = 'ACCEPTED';
    candidate.respondedAt = new Date().toISOString();

    const commitment: DonorCommitment = {
      id: `COMM-${Date.now().toString().slice(-6)}`,
      donorId: candidate.donorId,
      donorName: candidate.donorName,
      donorPhone: candidate.phone,
      bloodGroup: candidate.bloodGroup,
      status: 'CONFIRMED',
      committedAt: new Date().toISOString(),
      ephemeralToken: candidate.ephemeralToken,
    };

    if (!request.donorCommitments) {
      request.donorCommitments = [];
    }
    request.donorCommitments.push(commitment);
    request.confirmedDonorCount = request.donorCommitments.filter((c) => c.status === 'CONFIRMED').length;

    // Backward-compatibility references
    request.acceptedDonorId = candidate.donorId;
    request.acceptedDonorName = candidate.donorName;
    request.acceptedDonorPhone = candidate.phone;
    request.acceptedAt = commitment.committedAt;

    return this.recalculateAndUpdate(request, 'DONOR_ACCEPTED');
  }

  /**
   * Event 4: Committed donor cancels.
   * Central Patent Step: Gap re-opens, trigger fallback tier dispatch.
   */
  public onDonorCancelled(requestId: string, donorId: string): FulfillmentTelemetry {
    const request = requestRepository.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    if (request.donorCommitments) {
      const commitment = request.donorCommitments.find(
        (c) => c.donorId === donorId && c.status === 'CONFIRMED'
      );
      if (commitment) {
        commitment.status = 'CANCELLED';
        commitment.cancelledAt = new Date().toISOString();
      }
    }

    request.confirmedDonorCount = (request.donorCommitments || []).filter(
      (c) => c.status === 'CONFIRMED'
    ).length;

    const candidate = request.matchedCandidates.find((c) => c.donorId === donorId);
    if (candidate) {
      candidate.status = 'DECLINED';
    }

    return this.recalculateAndUpdate(request, 'DONOR_CANCELLED');
  }

  /**
   * Event 5: Candidate declines invitation.
   */
  public onDonorDeclined(requestId: string, donorId: string): FulfillmentTelemetry {
    const request = requestRepository.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    const candidate = request.matchedCandidates.find((c) => c.donorId === donorId);
    if (candidate) {
      candidate.status = 'DECLINED';
      candidate.respondedAt = new Date().toISOString();
    }

    return this.recalculateAndUpdate(request, 'DONOR_DECLINED');
  }

  /**
   * Event 6: Tier timeout expired.
   */
  public onTierTimeout(requestId: string): FulfillmentTelemetry {
    const request = requestRepository.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    return this.recalculateAndUpdate(request, 'TIER_TIMEOUT');
  }

  /**
   * Core closed-loop recalculation procedure.
   */
  private recalculateAndUpdate(
    request: BloodRequest,
    event: 'INVENTORY_RESERVED' | 'INVENTORY_RELEASED' | 'DONOR_ACCEPTED' | 'DONOR_CANCELLED' | 'DONOR_DECLINED' | 'TIER_TIMEOUT'
  ): FulfillmentTelemetry {
    const Q = request.requiredQuantity || request.unitsRequired;
    const IR = request.reservedInventoryUnits || 0;
    const DC = request.confirmedDonorCount || 0;

    const previousGap = request.remainingGap !== undefined ? request.remainingGap : Q;
    const newGap = this.calculateGap(Q, IR, DC);
    request.remainingGap = newGap;
    request.updatedAt = new Date().toISOString();

    if (newGap === 0) {
      // TARGET MET: Abort active dispatch, auto-cancel pending invitations
      tieredDispatchService.terminateUnacceptedInvitations(request);
      request.status = 'FULFILLED';
    } else {
      // GAP REMAINS > 0
      if (DC > 0 || IR > 0) {
        request.status = 'PARTIALLY_FULFILLED';
      } else {
        request.status = 'NOTIFIED';
      }

      // Check if we need to promote to next dispatch tier
      const unnotified = request.matchedCandidates.filter((c) => c.tierNumber === undefined);
      const activeTier = request.dispatchTiers?.find((t) => t.status === 'ACTIVE');

      const shouldAdvanceTier =
        !activeTier ||
        event === 'TIER_TIMEOUT' ||
        event === 'DONOR_CANCELLED' ||
        event === 'INVENTORY_RELEASED' ||
        activeTier.invitedDonorIds.every((id) => {
          const cand = request.matchedCandidates.find((c) => c.donorId === id);
          return cand?.status === 'ACCEPTED' || cand?.status === 'DECLINED' || cand?.status === 'TIMEOUT';
        });

      if (shouldAdvanceTier && unnotified.length > 0) {
        if (activeTier) {
          activeTier.status = 'TIMED_OUT';
        }
        tieredDispatchService.createAndActivateTier(request, unnotified, newGap);
      }
    }

    requestRepository.save(request);
    return this.getTelemetry(request.id);
  }

  /**
   * Telemetry summary for live hospital monitor & benchmark comparisons.
   */
  public getTelemetry(requestId: string): FulfillmentTelemetry {
    const request = requestRepository.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    const Q = request.requiredQuantity || request.unitsRequired;
    const IR = request.reservedInventoryUnits || 0;
    const DC = request.confirmedDonorCount || 0;
    const G = request.remainingGap !== undefined ? request.remainingGap : this.calculateGap(Q, IR, DC);

    const activeInvites = request.matchedCandidates.filter((c) => c.status === 'NOTIFIED').length;
    const cancelledInvites = request.matchedCandidates.filter(
      (c) => c.status === 'CANCELLED_GAP_FULFILLED'
    ).length;

    const efficiency = tieredDispatchService.calculateDispatchEfficiency(request);

    return {
      requestId: request.id,
      requiredQuantity: Q,
      reservedInventoryUnits: IR,
      confirmedDonorCount: DC,
      remainingGap: G,
      currentTier: request.currentTier || 0,
      totalTiers: request.dispatchTiers?.length || 0,
      activeInvitationsCount: activeInvites,
      cancelledInvitationsCount: cancelledInvites,
      status: request.status,
      dispatchEfficiency: efficiency,
      updatedAt: request.updatedAt,
    };
  }
}

export const afgcEngine = new AFGCEngine();
