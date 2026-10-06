import {
  MatchCandidate,
  DispatchTier,
  CandidateInvitationStatus,
  BloodRequest,
} from '../types';
import { proximityCredentialService } from './proximityCredential';

export interface TierConfig {
  expansionFactor: number; // default 2.5 (e.g. for Gap = 2, notify 5 candidates)
  tierTimeoutMs: number;   // default 5 minutes per tier window
}

export class TieredDispatchService {
  private config: TierConfig;

  constructor(config: Partial<TierConfig> = {}) {
    this.config = {
      expansionFactor: config.expansionFactor || 2.5,
      tierTimeoutMs: config.tierTimeoutMs || 5 * 60 * 1000,
    };
  }

  /**
   * Calculates the target candidate tier size for a given remaining gap G.
   * Tk = min(ceil(alpha * G), availableCandidates)
   */
  public calculateTierSize(remainingGap: number, availableCandidatesCount: number): number {
    if (remainingGap <= 0 || availableCandidatesCount <= 0) return 0;
    const computed = Math.ceil(this.config.expansionFactor * remainingGap);
    return Math.min(computed, availableCandidatesCount);
  }

  /**
   * Activates a new dispatch tier for the unresolved gap G.
   */
  public createAndActivateTier(
    request: BloodRequest,
    unnotifiedCandidates: MatchCandidate[],
    remainingGap: number
  ): DispatchTier | null {
    if (remainingGap <= 0 || unnotifiedCandidates.length === 0) {
      return null;
    }

    const tierNumber = (request.currentTier || 0) + 1;
    const tierSize = this.calculateTierSize(remainingGap, unnotifiedCandidates.length);
    const selectedForTier = unnotifiedCandidates.slice(0, tierSize);

    const now = Date.now();
    const expiresAt = new Date(now + this.config.tierTimeoutMs).toISOString();

    const invitedDonorIds: string[] = [];

    // Assign candidates to this tier and issue request-bound ephemeral proximity credentials
    for (const candidate of selectedForTier) {
      const credential = proximityCredentialService.generateCredential(
        candidate.donorId,
        request.id,
        candidate.distanceKm,
        Math.ceil(this.config.tierTimeoutMs / 60000)
      );

      candidate.status = 'NOTIFIED';
      candidate.tierNumber = tierNumber;
      candidate.ephemeralToken = credential.token;
      candidate.notifiedAt = new Date(now).toISOString();

      invitedDonorIds.push(candidate.donorId);
    }

    const newTier: DispatchTier = {
      tierNumber,
      targetGap: remainingGap,
      invitedDonorIds,
      status: 'ACTIVE',
      dispatchedAt: new Date(now).toISOString(),
      expiresAt,
    };

    if (!request.dispatchTiers) {
      request.dispatchTiers = [];
    }
    request.dispatchTiers.push(newTier);
    request.currentTier = tierNumber;

    return newTier;
  }

  /**
   * Terminates all unaccepted invitations when fulfillment gap G reaches 0.
   * This is a central inventive step of AFGC.
   */
  public terminateUnacceptedInvitations(request: BloodRequest): number {
    let cancelledCount = 0;

    for (const candidate of request.matchedCandidates) {
      if (candidate.status === 'NOTIFIED') {
        candidate.status = 'CANCELLED_GAP_FULFILLED';
        candidate.respondedAt = new Date().toISOString();
        cancelledCount++;
      }
    }

    // Revoke all active ephemeral credentials for this request
    proximityCredentialService.revokeAllForRequest(request.id);

    // Mark active tiers as FULFILLED
    if (request.dispatchTiers) {
      for (const tier of request.dispatchTiers) {
        if (tier.status === 'ACTIVE') {
          tier.status = 'FULFILLED';
        }
      }
    }

    return cancelledCount;
  }

  /**
   * Computes dispatch efficiency:
   * Efficiency = Confirmed Donors / Total Dispatched Invitations
   */
  public calculateDispatchEfficiency(request: BloodRequest): number {
    const totalNotified = request.matchedCandidates.filter(
      (c) => c.status !== undefined && c.tierNumber !== undefined
    ).length;

    if (totalNotified === 0) return 1.0;
    const confirmedCount = request.confirmedDonorCount || 0;
    return Number((confirmedCount / totalNotified).toFixed(4));
  }
}

export const tieredDispatchService = new TieredDispatchService();
