import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../services/storage';
import { findAndRankDonors } from '../services/matching';

export const matchingRouter = Router();

// POST /api/matching/search - Search and preview ranked donor candidates
matchingRouter.post('/search', requireAuth, (req: Request, res: Response): void => {
  try {
    const { bloodGroup, location, searchRadiusKm } = req.body;

    if (!bloodGroup || !location || !location.latitude || !location.longitude) {
      res.status(400).json({ error: 'bloodGroup and location (lat, lon) are required' });
      return;
    }

    const radius = Number(searchRadiusKm) || 15;
    const allDonors = storage.getAllDonors();

    const candidates = findAndRankDonors(
      {
        bloodGroup,
        location,
        searchRadiusKm: radius,
      },
      allDonors
    );

    res.json({
      bloodGroup,
      searchRadiusKm: radius,
      candidatesCount: candidates.length,
      candidates,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Matching search failed' });
  }
});
