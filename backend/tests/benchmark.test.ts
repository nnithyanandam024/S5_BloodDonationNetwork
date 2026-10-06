import request from 'supertest';
import { app } from '../src/server';
import { benchmarkService } from '../src/services/benchmarkService';

describe('Benchmark & Policy Simulation Service', () => {
  test('evaluates comparative metrics between Broadcast, Nearest-N, and AFGC', () => {
    const report = benchmarkService.runSimulation({
      requestedUnits: 4,
      bloodGroup: 'B+',
      donorPoolSize: 20,
      donorAcceptanceRate: 0.4,
      availableInventoryUnits: 2,
    });

    expect(report.timestamp).toBeDefined();
    expect(report.policies.broadcast.notificationsSent).toBe(20);
    expect(report.policies.nearestN.notificationsSent).toBeLessThan(20);

    // AFGC only notifies for remaining gap (4 - 2 = 2 => 5 candidates)
    expect(report.policies.afgc.notificationsSent).toBe(5);
    expect(report.policies.afgc.inventoryReserved).toBe(2);
    expect(report.policies.afgc.redundantOverDispatched).toBe(0);

    // Dispatch efficiency of AFGC must surpass legacy broadcast
    expect(report.policies.afgc.dispatchEfficiency).toBeGreaterThan(
      report.policies.broadcast.dispatchEfficiency
    );

    // Traffic reduction should be 75%
    expect(report.comparativeAdvantage.notificationReductionPercent).toBe(75);
    expect(report.policies.afgc.ephemeralTokenSecurity).toBe(true);
  });

  test('POST /api/experiments/benchmark returns comprehensive simulation data', async () => {
    const res = await request(app)
      .post('/api/experiments/benchmark')
      .send({
        requestedUnits: 6,
        availableInventoryUnits: 3,
        donorPoolSize: 30,
      });

    expect(res.status).toBe(200);
    expect(res.body.report).toBeDefined();
    expect(res.body.report.scenario.requestedUnits).toBe(6);
    expect(res.body.report.policies.afgc.inventoryReserved).toBe(3);
    expect(res.body.report.comparativeAdvantage.efficiencyGainFactor).toBeGreaterThan(1);
  });
});
