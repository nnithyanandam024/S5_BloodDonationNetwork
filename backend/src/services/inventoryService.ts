import { v4 as uuidv4 } from 'uuid';
import { InventoryUnit, BloodGroup, ComponentType, InventoryStatus } from '../types';
import { isBloodCompatible } from './compatibility';

export class InventoryService {
  private units: Map<string, InventoryUnit> = new Map();

  constructor() {
    this.seedInventory();
  }

  /**
   * Seed authorized blood bank inventory reserves with realistic blood group quantities.
   */
  public seedInventory(): void {
    this.units.clear();

    const sampleBanks = [
      {
        id: 'bank-central-001',
        name: 'Bengaluru Central Blood Bank',
        location: { latitude: 12.974, longitude: 77.596, city: 'Bengaluru', address: 'MG Road' },
      },
      {
        id: 'bank-redcross-002',
        name: 'Red Cross Regional Blood Center',
        location: { latitude: 12.981, longitude: 77.605, city: 'Bengaluru', address: 'Indiranagar' },
      },
    ];

    const stockProfiles: { group: BloodGroup; count: number; bankIdx: number }[] = [
      { group: 'O+', count: 8, bankIdx: 0 },
      { group: 'O-', count: 3, bankIdx: 0 },
      { group: 'A+', count: 6, bankIdx: 0 },
      { group: 'A-', count: 2, bankIdx: 1 },
      { group: 'B+', count: 5, bankIdx: 1 },
      { group: 'B-', count: 2, bankIdx: 1 },
      { group: 'AB+', count: 4, bankIdx: 0 },
      { group: 'AB-', count: 1, bankIdx: 1 },
    ];

    const expiryInDays = 35; // Standard RBC shelf life
    const expiryDate = new Date(Date.now() + expiryInDays * 24 * 60 * 60 * 1000).toISOString();

    let seq = 1;
    for (const item of stockProfiles) {
      const bank = sampleBanks[item.bankIdx];
      for (let i = 0; i < item.count; i++) {
        const id = `INV-${item.group.replace('+', 'POS').replace('-', 'NEG')}-${seq.toString().padStart(4, '0')}`;
        seq++;
        const unit: InventoryUnit = {
          id,
          bloodBankId: bank.id,
          bloodBankName: bank.name,
          bloodGroup: item.group,
          component: 'RED_BLOOD_CELLS',
          units: 1,
          status: 'AVAILABLE',
          storageLocation: bank.location,
          expiryDate,
        };
        this.units.set(unit.id, unit);
      }
    }
  }

  public getAllUnits(): InventoryUnit[] {
    return Array.from(this.units.values());
  }

  public getAvailableUnits(): InventoryUnit[] {
    return this.getAllUnits().filter((u) => u.status === 'AVAILABLE');
  }

  /**
   * Returns available inventory units that are ABO/Rh compatible with the requested group.
   */
  public getCompatibleAvailableUnits(
    recipientGroup: BloodGroup,
    component: ComponentType = 'RED_BLOOD_CELLS'
  ): InventoryUnit[] {
    return this.getAvailableUnits().filter(
      (u) => u.component === component && isBloodCompatible(u.bloodGroup, recipientGroup)
    );
  }

  /**
   * Atomically reserve up to `count` compatible units for an emergency request.
   */
  public reserveCompatibleUnits(
    requestId: string,
    recipientGroup: BloodGroup,
    count: number,
    component: ComponentType = 'RED_BLOOD_CELLS'
  ): InventoryUnit[] {
    if (count <= 0) return [];

    const compatible = this.getCompatibleAvailableUnits(recipientGroup, component);
    const toReserve = compatible.slice(0, count);
    const now = new Date().toISOString();

    for (const unit of toReserve) {
      unit.status = 'RESERVED';
      unit.reservedForRequestId = requestId;
      unit.reservedAt = now;
      this.units.set(unit.id, unit);
    }

    return toReserve;
  }

  /**
   * Release reserved inventory units for a request (e.g. when cancelled or fulfilled elsewhere).
   */
  public releaseUnitsForRequest(requestId: string, unitIds?: string[]): InventoryUnit[] {
    const released: InventoryUnit[] = [];

    for (const unit of this.units.values()) {
      if (unit.reservedForRequestId === requestId) {
        if (!unitIds || unitIds.includes(unit.id)) {
          unit.status = 'AVAILABLE';
          unit.reservedForRequestId = undefined;
          unit.reservedAt = undefined;
          this.units.set(unit.id, unit);
          released.push(unit);
        }
      }
    }

    return released;
  }

  public getUnitsReservedForRequest(requestId: string): InventoryUnit[] {
    return this.getAllUnits().filter((u) => u.reservedForRequestId === requestId);
  }

  public addInventoryUnit(
    data: Omit<InventoryUnit, 'id' | 'status'> & { id?: string; status?: InventoryStatus }
  ): InventoryUnit {
    const id = data.id || `INV-${uuidv4().slice(0, 8)}`;
    const unit: InventoryUnit = {
      ...data,
      id,
      status: data.status || 'AVAILABLE',
    };
    this.units.set(unit.id, unit);
    return unit;
  }
}

export const inventoryService = new InventoryService();
