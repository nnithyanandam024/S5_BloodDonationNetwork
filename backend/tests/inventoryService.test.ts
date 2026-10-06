import { inventoryService } from '../src/services/inventoryService';

describe('Inventory Service (Dual-Source Reserves)', () => {
  beforeEach(() => {
    inventoryService.seedInventory();
  });

  test('seeds available units across all 8 blood groups', () => {
    const all = inventoryService.getAllUnits();
    expect(all.length).toBeGreaterThan(25);

    const available = inventoryService.getAvailableUnits();
    expect(available.length).toBe(all.length);
  });

  test('correctly filters compatible inventory according to ABO/Rh rules', () => {
    // For O- recipient: only O- is compatible
    const compatONeg = inventoryService.getCompatibleAvailableUnits('O-');
    expect(compatONeg.every((u) => u.bloodGroup === 'O-')).toBe(true);
    expect(compatONeg.length).toBe(3);

    // For AB+ recipient: all groups are compatible
    const compatABPos = inventoryService.getCompatibleAvailableUnits('AB+');
    expect(compatABPos.length).toBe(inventoryService.getAvailableUnits().length);

    // For B+ recipient: O-, O+, B-, B+ are compatible
    const compatBPos = inventoryService.getCompatibleAvailableUnits('B+');
    expect(compatBPos.every((u) => ['O-', 'O+', 'B-', 'B+'].includes(u.bloodGroup))).toBe(true);
  });

  test('atomically reserves compatible units and marks them RESERVED', () => {
    const reqId = 'REQ-TEST-001';
    const reserved = inventoryService.reserveCompatibleUnits(reqId, 'B+', 2);

    expect(reserved.length).toBe(2);
    expect(reserved.every((u) => u.status === 'RESERVED')).toBe(true);
    expect(reserved.every((u) => u.reservedForRequestId === reqId)).toBe(true);

    // Available count should decrease by 2
    const remainingCompat = inventoryService.getCompatibleAvailableUnits('B+');
    const totalOriginally = 3 + 8 + 2 + 5; // O-(3) + O+(8) + B-(2) + B+(5) = 18
    expect(remainingCompat.length).toBe(totalOriginally - 2);
  });

  test('releases reserved units back to AVAILABLE status', () => {
    const reqId = 'REQ-TEST-002';
    const reserved = inventoryService.reserveCompatibleUnits(reqId, 'O+', 3);
    expect(reserved.length).toBe(3);

    const released = inventoryService.releaseUnitsForRequest(reqId);
    expect(released.length).toBe(3);
    expect(released.every((u) => u.status === 'AVAILABLE')).toBe(true);
    expect(released.every((u) => u.reservedForRequestId === undefined)).toBe(true);
  });
});
