import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { donorRepository, requestRepository } from '../repositories';
import { calculateDonorEligibility } from '../services/eligibility';
import { validateAndTransition } from '../services/stateMachine';
import { DonorProfile } from '../types';

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

// POST /api/donors/respond
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
          (c) => c.donorId === donor.id && c.status === 'CONFIRMED'
        );
        if (alreadyCommitted) {
          res.status(409).json({ error: 'You have already confirmed acceptance for this request' });
          return;
        }

        // Call AFGC Engine closed-loop recalculation
        afgcEngine.onDonorAccepted(requestId, donor.id);
        const updated = requestRepository.findById(requestId)!;

        // Maintain ACCEPTED status for client navigation and backward compatibility
        updated.status = 'ACCEPTED';
        requestRepository.save(updated);

        res.json({
          message:
            updated.remainingGap === 0
              ? 'Request accepted successfully. Full quota fulfilled! Additional donor dispatch stopped.'
              : `Request accepted successfully. Gap reduced to ${updated.remainingGap} unit(s).`,
          request: updated,
        });
      } else {
        afgcEngine.onDonorDeclined(requestId, donor.id);
        const updated = requestRepository.findById(requestId)!;

        // Check if all notified donors declined
        const allDeclined = updated.matchedCandidates.every(
          (c) => c.status === 'DECLINED' || c.status === 'TIMEOUT' || c.status === 'CANCELLED_GAP_FULFILLED'
        );
        if (allDeclined && (updated.remainingGap || 0) > 0 && (updated.confirmedDonorCount || 0) === 0) {
          updated.status = 'DECLINED';
          requestRepository.save(updated);
        }

        res.json({
          message: 'Request declined.',
          request: updated,
        });
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
        message: `Commitment cancelled. Requirement gap re-opened to ${telemetry.remainingGap} unit(s). Candidate dispatch re-activated.`,
        telemetry,
        request: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to cancel commitment' });
    }
  }
);
