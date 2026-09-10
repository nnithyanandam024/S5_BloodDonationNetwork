import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { storage } from '../services/storage';
import { calculateDonorEligibility } from '../services/eligibility';
import { validateAndTransition } from '../services/stateMachine';
import { DonorProfile } from '../types';

export const donorsRouter = Router();

// GET /api/donors/profile
donorsRouter.get(
  '/profile',
  requireAuth,
  requireRole(['DONOR']),
  (req: Request, res: Response): void => {
    const donor = storage.getUserById(req.user!.userId) as DonorProfile | undefined;
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
      const updated = storage.updateDonor(req.user!.userId, { isAvailable });
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
    const donor = storage.getUserById(req.user!.userId) as DonorProfile | undefined;
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
    const requests = storage.getIncomingRequestsForDonor(donorId);
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

      const donor = storage.getUserById(req.user!.userId) as DonorProfile | undefined;
      if (!donor) {
        res.status(404).json({ error: 'Donor profile not found' });
        return;
      }

      const request = storage.getBloodRequestById(requestId);
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
        // Prevent duplicate acceptance if already accepted by someone else
        if (request.status === 'ACCEPTED') {
          res.status(409).json({ error: 'Request has already been accepted by another donor' });
          return;
        }

        // Validate state machine transition
        validateAndTransition(request.status, 'ACCEPTED');

        request.status = 'ACCEPTED';
        request.acceptedDonorId = donor.id;
        request.acceptedDonorName = donor.name;
        request.acceptedDonorPhone = donor.phone;
        request.acceptedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();
        request.matchedCandidates[candidateIndex].status = 'ACCEPTED';
        request.matchedCandidates[candidateIndex].respondedAt = new Date().toISOString();

        storage.saveBloodRequest(request);

        res.json({
          message: 'Request accepted successfully. Hospital has been notified.',
          request,
        });
      } else {
        request.matchedCandidates[candidateIndex].status = 'DECLINED';
        request.matchedCandidates[candidateIndex].respondedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();

        // Check if all notified donors declined
        const allDeclined = request.matchedCandidates.every(
          (c) => c.status === 'DECLINED' || c.status === 'TIMEOUT'
        );
        if (allDeclined) {
          request.status = 'DECLINED';
        }

        storage.saveBloodRequest(request);

        res.json({
          message: 'Request declined.',
          request,
        });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to respond to request' });
    }
  }
);
