import { Router, Request, Response } from 'express';
import { benchmarkService } from '../services/benchmarkService';

export const experimentsRouter = Router();

// POST /api/experiments/benchmark - Run comparative policy simulation
experimentsRouter.post('/benchmark', (req: Request, res: Response): void => {
  try {
    const { requestedUnits, bloodGroup, donorPoolSize, donorAcceptanceRate, availableInventoryUnits } =
      req.body;

    const report = benchmarkService.runSimulation({
      requestedUnits: requestedUnits ? Number(requestedUnits) : undefined,
      bloodGroup: bloodGroup || undefined,
      donorPoolSize: donorPoolSize ? Number(donorPoolSize) : undefined,
      donorAcceptanceRate: donorAcceptanceRate ? Number(donorAcceptanceRate) : undefined,
      availableInventoryUnits:
        availableInventoryUnits !== undefined ? Number(availableInventoryUnits) : undefined,
    });

    res.json({
      message: 'Benchmark simulation completed successfully.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Benchmark execution failed' });
  }
});

// GET /api/experiments/latest - Returns a standard default benchmark comparison
experimentsRouter.get('/latest', (req: Request, res: Response): void => {
  const report = benchmarkService.runSimulation();
  res.json({ report });
});
