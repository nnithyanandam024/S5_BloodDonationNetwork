import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireRole } from '../middleware/auth';
import { requestRepository, userRepository, inventoryRepository } from '../repositories';
import { findAndRankDonors } from '../services/matching';
import { validateAndTransition } from '../services/stateMachine';
import { BloodRequest, HospitalProfile, RequestState } from '../types';

import { afgcEngine } from '../services/afgcEngine';

export const requestsRouter = Router();

// GET /api/requests/inventory/all - View all blood bank inventory
requestsRouter.get(
  '/inventory/all',
  requireAuth,
  (req: Request, res: Response): void => {
    const units = inventoryRepository.findAll();
    res.json({ units });
  }
);

// POST /api/requests - Hospital creates an emergency request using AFGC
requestsRouter.post(
  '/',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    try {
      const hospital = userRepository.findById(req.user!.userId) as HospitalProfile | undefined;
      if (!hospital) {
        res.status(404).json({ error: 'Hospital profile not found' });
        return;
      }

      const {
        bloodGroup,
        component,
        unitsRequired,
        urgency,
        searchRadiusKm,
        notes,
        requiredBy,
        autoReserveInventory,
      } = req.body;

      if (!bloodGroup || !unitsRequired) {
        res.status(400).json({ error: 'Blood group and units required are mandatory' });
        return;
      }

      const radius = Number(searchRadiusKm) || 15;

      // Use AFGC Engine for closed-loop dual-source fulfillment
      const newRequest = afgcEngine.initializeEmergencyRequest({
        hospitalId: hospital.id,
        hospitalName: hospital.hospitalName || hospital.name,
        hospitalPhone: hospital.phone,
        bloodGroup,
        component: component || 'RED_BLOOD_CELLS',
        unitsRequired: Number(unitsRequired),
        urgency: urgency || 'URGENT',
        requiredBy: requiredBy || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        searchRadiusKm: radius,
        notes: notes || '',
        location: hospital.location,
        autoReserveInventory: autoReserveInventory !== undefined ? autoReserveInventory : true,
      });

      const notifiedCount = newRequest.matchedCandidates.filter((c) => c.status === 'NOTIFIED').length;

      res.status(201).json({
        message:
          newRequest.remainingGap === 0
            ? `Emergency request fulfilled directly by authorized blood bank inventory (${newRequest.reservedInventoryUnits} units). Voluntary donor dispatch suppressed.`
            : `Emergency request created. AFGC reserved ${newRequest.reservedInventoryUnits || 0} unit(s) from inventory; Tier 1 dispatched for remaining ${newRequest.remainingGap} unit gap (${notifiedCount} candidate(s) invited).`,
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
    const requests = requestRepository.findByHospitalId(req.user!.userId);
    res.json({ requests });
  }
);

// GET /api/requests/:id - View specific request
requestsRouter.get(
  '/:id',
  requireAuth,
  (req: Request, res: Response): void => {
    const requestId = String(req.params.id);
    const request = requestRepository.findById(requestId);
    if (!request) {
      res.status(404).json({ error: 'Blood request not found' });
      return;
    }
    res.json({ request });
  }
);

// GET /api/requests/:id/afgc-telemetry - Real-time AFGC gap and dispatch telemetry
requestsRouter.get(
  '/:id/afgc-telemetry',
  requireAuth,
  (req: Request, res: Response): void => {
    try {
      const requestId = String(req.params.id);
      const telemetry = afgcEngine.getTelemetry(requestId);
      res.json({ telemetry });
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Request not found' });
    }
  }
);

// POST /api/requests/:id/inventory/reserve - Reserve compatible blood bank units for active request
requestsRouter.post(
  '/:id/inventory/reserve',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    try {
      const requestId = String(req.params.id);
      const { count } = req.body;
      const numUnits = Number(count) || 1;

      const telemetry = afgcEngine.onInventoryReserved(requestId, numUnits);
      const updated = requestRepository.findById(requestId);

      res.json({
        message: `Reserved ${numUnits} unit(s) from inventory. Remaining gap is now ${telemetry.remainingGap}.`,
        telemetry,
        request: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to reserve inventory' });
    }
  }
);

// POST /api/requests/:id/inventory/release - Release reserved units back to inventory
requestsRouter.post(
  '/:id/inventory/release',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    try {
      const requestId = String(req.params.id);
      const { unitIds } = req.body;

      const telemetry = afgcEngine.onInventoryReleased(requestId, unitIds);
      const updated = requestRepository.findById(requestId);

      res.json({
        message: `Released inventory units. Remaining gap is now ${telemetry.remainingGap}.`,
        telemetry,
        request: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to release inventory' });
    }
  }
);

// POST /api/requests/:id/simulate/donor-accept - Live demo: simulate next notified candidate accepting
requestsRouter.post(
  '/:id/simulate/donor-accept',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    try {
      const requestId = String(req.params.id);
      const request = requestRepository.findById(requestId);
      if (!request) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      const candidate = request.matchedCandidates.find((c) => c.status === 'NOTIFIED');
      if (!candidate) {
        res.status(400).json({ error: 'No active notified candidates available to simulate acceptance' });
        return;
      }

      const telemetry = afgcEngine.onDonorAccepted(requestId, candidate.donorId);
      const updated = requestRepository.findById(requestId);

      res.json({
        message: `Simulated donor acceptance by ${candidate.donorName}. Remaining gap is now ${telemetry.remainingGap}.`,
        telemetry,
        request: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Simulation error' });
    }
  }
);

// POST /api/requests/:id/simulate/donor-cancel - Live demo: simulate a confirmed donor cancelling
requestsRouter.post(
  '/:id/simulate/donor-cancel',
  requireAuth,
  requireRole(['HOSPITAL']),
  (req: Request, res: Response): void => {
    try {
      const requestId = String(req.params.id);
      const request = requestRepository.findById(requestId);
      if (!request) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      const confirmedCommitment = (request.donorCommitments || []).find((c) => c.status === 'CONFIRMED');
      if (!confirmedCommitment) {
        res.status(400).json({ error: 'No active confirmed donor commitment to cancel' });
        return;
      }

      const telemetry = afgcEngine.onDonorCancelled(requestId, confirmedCommitment.donorId);
      const updated = requestRepository.findById(requestId);

      res.json({
        message: `Simulated cancellation by ${confirmedCommitment.donorName}. Gap re-opened to ${telemetry.remainingGap}.`,
        telemetry,
        request: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Simulation error' });
    }
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
      const request = requestRepository.findById(requestId);
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
      requestRepository.save(request);

      res.json({ message: `Request state updated to ${targetState}`, request });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// GET /api/requests/:id/live - Server-Sent Events (SSE) for Real-Time Updates
requestsRouter.get('/:id/live', (req: Request, res: Response): void => {
  const requestId = String(req.params.id);
  const request = requestRepository.findById(requestId);

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
  const unsubscribe = requestRepository.subscribe(requestId, (updated) => {
    res.write(`data: ${JSON.stringify(updated)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});
