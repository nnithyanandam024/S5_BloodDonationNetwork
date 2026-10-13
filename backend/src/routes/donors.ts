import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { donorRepository, requestRepository } from '../repositories';
import { calculateDonorEligibility } from '../services/eligibility';
import { DonorProfile } from '../types';
import { storage } from '../services/storage';
import { afgcEngine } from '../services/afgcEngine';

export const donorsRouter = Router();

// GET /api/donors/profile
donorsRouter.get(
  '/profile',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    const donor = donorRepository.findDonorById(req.user!.userId);
    if (!donor) {
      res.status(404).json({ error: 'Donor profile not found' });
      return;
    }
    const { passwordHash: _, ...safeProfile } = donor;
    res.json({ profile: safeProfile });
  }
);

// PUT /api/donors/availability
donorsRouter.put(
  '/availability',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    try {
      const { isAvailable } = req.body;
      if (typeof isAvailable !== 'boolean') {
        res.status(400).json({ error: 'isAvailable must be a boolean' });
        return;
      }
      const updated = donorRepository.updateDonor(req.user!.userId, { isAvailable });
      const { passwordHash: _, ...safeProfile } = updated;
      res.json({ profile: safeProfile });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/donors/eligibility
donorsRouter.get(
  '/eligibility',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    const donor = donorRepository.findDonorById(req.user!.userId);
    if (!donor) {
      res.status(404).json({ error: 'Donor not found' });
      return;
    }
    const result = calculateDonorEligibility(donor.lastDonationDate);
    res.json(result);
  }
);

// GET /api/donors/incoming-requests
// Returns all active blood requests where this donor is a notified/accepted candidate
donorsRouter.get(
  '/incoming-requests',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    const donorId = req.user!.userId;
    const requests = donorRepository.getIncomingRequestsForDonor(donorId);
    res.json({ requests });
  }
);

// GET /api/donors/active-commitments
// Returns all requests where the donor has an active CONFIRMED or DONATED commitment
donorsRouter.get(
  '/active-commitments',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    const donorId = req.user!.userId;
    const allRequests = storage.getAllBloodRequests();
    const committed = allRequests.filter((r) =>
      (r.donorCommitments || []).some(
        (c) => c.donorId === donorId && (c.status === 'CONFIRMED' || c.status === 'ARRIVED' || c.status === 'DONATED')
      )
    );
    res.json({ requests: committed });
  }
);

// POST /api/donors/respond - Donor accepts or declines an incoming request
donorsRouter.post(
  '/respond',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    try {
      const { requestId, action } = req.body; // action: 'ACCEPT' | 'DECLINE'
      if (!requestId || !['ACCEPT', 'DECLINE'].includes(action)) {
        res.status(400).json({ error: 'Valid requestId and action (ACCEPT or DECLINE) required' });
        return;
      }

      const donor = donorRepository.findDonorById(req.user!.userId);
      if (!donor) {
        res.status(404).json({ error: 'Donor profile not found' });
        return;
      }

      const request = requestRepository.findById(requestId);
      if (!request) {
        res.status(404).json({ error: 'Blood request not found' });
        return;
      }

      const candidateIndex = request.matchedCandidates.findIndex(
        (c) => c.donorId === donor.id
      );
      if (candidateIndex === -1) {
        res.status(403).json({ error: 'Donor was not matched for this request' });
        return;
      }

      if (action === 'ACCEPT') {
        // Prevent duplicate acceptance if already committed
        const alreadyCommitted = (request.donorCommitments || []).some(
          (c) => c.donorId === donor.id && (c.status === 'CONFIRMED' || c.status === 'DONATED')
        );
        if (alreadyCommitted) {
          res.status(409).json({ error: 'You have already confirmed acceptance for this request' });
          return;
        }

        afgcEngine.onDonorAccepted(requestId, donor.id);
        const updated = requestRepository.findById(requestId)!;
        updated.status = 'ACCEPTED';
        requestRepository.save(updated);

        res.json({
          message:
            updated.remainingGap === 0
              ? 'Request accepted. Full quota fulfilled — thank you! Proceed to the hospital to donate.'
              : `Request accepted. Please proceed to ${updated.hospitalName} to donate blood.`,
          request: updated,
        });
      } else {
        afgcEngine.onDonorDeclined(requestId, donor.id);
        const updated = requestRepository.findById(requestId)!;

        const allDeclined = updated.matchedCandidates.every(
          (c) => c.status === 'DECLINED' || c.status === 'TIMEOUT' || c.status === 'CANCELLED_GAP_FULFILLED'
        );
        if (allDeclined && (updated.remainingGap || 0) > 0 && (updated.confirmedDonorCount || 0) === 0) {
          updated.status = 'DECLINED';
          requestRepository.save(updated);
        }

        res.json({ message: 'Request declined.', request: updated });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to respond to request' });
    }
  }
);

// POST /api/donors/cancel - Donor cancels a previously confirmed commitment
donorsRouter.post(
  '/cancel',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    try {
      const { requestId } = req.body;
      if (!requestId) {
        res.status(400).json({ error: 'requestId is required' });
        return;
      }

      const donor = donorRepository.findDonorById(req.user!.userId);
      if (!donor) {
        res.status(404).json({ error: 'Donor profile not found' });
        return;
      }

      const telemetry = afgcEngine.onDonorCancelled(requestId, donor.id);
      const updated = requestRepository.findById(requestId);

      res.json({
        message: `Commitment cancelled. Remaining gap re-opened to ${telemetry.remainingGap} unit(s).`,
        telemetry,
        request: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to cancel commitment' });
    }
  }
);

/**
 * POST /api/donors/mark-donated
 * Donor physically donated blood at the hospital.
 * Sets commitment status to DONATED — this is NOT a completed donation yet.
 * The hospital must confirm receipt via POST /api/requests/:id/confirm-receipt
 * to create an official DonationRecord.
 */
donorsRouter.post(
  '/mark-donated',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    try {
      const { requestId } = req.body;
      if (!requestId) {
        res.status(400).json({ error: 'requestId is required' });
        return;
      }

      const donor = donorRepository.findDonorById(req.user!.userId);
      if (!donor) {
        res.status(404).json({ error: 'Donor profile not found' });
        return;
      }

      const request = requestRepository.findById(requestId);
      if (!request) {
        res.status(404).json({ error: 'Blood request not found' });
        return;
      }

      const commitment = (request.donorCommitments || []).find(
        (c) => c.donorId === donor.id && (c.status === 'CONFIRMED' || c.status === 'ARRIVED')
      );
      if (!commitment) {
        res.status(400).json({
          error: 'No active commitment found for this request. You must accept the request first.',
        });
        return;
      }

      // Mark as DONATED — blood physically given, awaiting hospital confirmation
      commitment.status = 'DONATED';
      commitment.donatedAt = new Date().toISOString();
      request.updatedAt = new Date().toISOString();
      requestRepository.save(request);

      res.json({
        message:
          'Thank you! Your donation has been recorded as submitted. The hospital will confirm receipt to finalize your donation record.',
        commitment,
        request,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to mark donation' });
    }
  }
);

/**
 * GET /api/donors/donation-history
 * Returns the donor's real finalized donation records (only entries where the
 * hospital confirmed receipt — i.e., DonationRecord objects created by confirm-receipt).
 */
donorsRouter.get(
  '/donation-history',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    const donorId = req.user!.userId;
    const records = storage.getDonationsByDonor(donorId);
    res.json({ records, totalDonations: records.length });
  }
);
