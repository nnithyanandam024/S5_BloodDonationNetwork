import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireRole } from '../middleware/auth';
import { storage } from '../services/storage';
import { findAndRankDonors } from '../services/matching';
import { validateAndTransition } from '../services/stateMachine';
import { BloodRequest, HospitalProfile, RequestState } from '../types';

export const requestsRouter = Router();

// POST /api/requests - Hospital creates an emergency request
requestsRouter.post(
  '/',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    try {
      const hospital = storage.getUserById(req.user!.userId) as HospitalProfile | undefined;
      if (!hospital) {
        res.status(404).json({ error: 'Hospital profile not found' });
        return;
      }

      const { bloodGroup, component, unitsRequired, urgency, searchRadiusKm, notes, requiredBy } =
        req.body;

      if (!bloodGroup || !unitsRequired) {
        res.status(400).json({ error: 'Blood group and units required are mandatory' });
        return;
      }

      const radius = Number(searchRadiusKm) || 15;
      const allDonors = storage.getAllDonors();

      // Execute matching engine
      const matchedCandidates = findAndRankDonors(
        {
          bloodGroup,
          location: hospital.location,
          searchRadiusKm: radius,
        },
        allDonors
      );

      const requestId = `REQ-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const newRequest: BloodRequest = {
        id: requestId,
        hospitalId: hospital.id,
        hospitalName: hospital.hospitalName || hospital.name,
        hospitalPhone: hospital.phone,
        bloodGroup,
        component: component || 'WHOLE_BLOOD',
        unitsRequired: Number(unitsRequired),
        urgency: urgency || 'URGENT',
        requiredBy: requiredBy || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        searchRadiusKm: radius,
        notes: notes || '',
        location: hospital.location,
        status: matchedCandidates.length > 0 ? 'NOTIFIED' : 'MATCHING',
        createdAt: now,
        updatedAt: now,
        matchedCandidates,
      };

      storage.saveBloodRequest(newRequest);

      res.status(201).json({
        message:
          matchedCandidates.length > 0
            ? `Emergency request created. ${matchedCandidates.length} eligible donor(s) notified.`
            : 'Emergency request created. Searching for eligible donors in radius.',
        request: newRequest,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create request' });
    }
  }
);

// GET /api/requests/hospital - Hospital views all its requests
requestsRouter.get(
  '/hospital',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    const requests = storage.getRequestsByHospital(req.user!.userId);
    res.json({ requests });
  }
);

// GET /api/requests/:id - View specific request
requestsRouter.get(
  '/:id',
  requireAuth,
  (req: Request, res: Response): void => {
    const requestId = String(req.params.id);
    const request = storage.getBloodRequestById(requestId);
    if (!request) {
      res.status(404).json({ error: 'Blood request not found' });
      return;
    }
    res.json({ request });
  }
);

// PUT /api/requests/:id/status - Update state machine (e.g. EN_ROUTE -> COMPLETED)
requestsRouter.put(
  '/:id/status',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    try {
      const requestId = String(req.params.id);
      const { status: targetState } = req.body as { status: RequestState };
      const request = storage.getBloodRequestById(requestId);
      if (!request) {
        res.status(404).json({ error: 'Blood request not found' });
        return;
      }

      if (request.hospitalId !== req.user!.userId) {
        res.status(403).json({ error: 'Unauthorized to modify this request' });
        return;
      }

      validateAndTransition(request.status, targetState);
      request.status = targetState;
      request.updatedAt = new Date().toISOString();
      storage.saveBloodRequest(request);

      res.json({ message: `Request state updated to ${targetState}`, request });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// GET /api/requests/:id/live - Server-Sent Events (SSE) for Real-Time Updates
requestsRouter.get('/:id/live', (req: Request, res: Response): void => {
  const requestId = String(req.params.id);
  const request = storage.getBloodRequestById(requestId);

  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial state
  res.write(`data: ${JSON.stringify(request)}\n\n`);

  // Subscribe to updates
  const unsubscribe = storage.subscribeToRequest(requestId, (updated) => {
    res.write(`data: ${JSON.stringify(updated)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});
