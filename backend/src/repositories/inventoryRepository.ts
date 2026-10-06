import { InventoryUnit, BloodGroup, ComponentType } from '../types';
import { inventoryService } from '../services/inventoryService';

export interface IInventoryRepository {
  findAll(): InventoryUnit[];
  findAvailable(): InventoryUnit[];
  findCompatibleAvailable(recipientGroup: BloodGroup, component?: ComponentType): InventoryUnit[];
  reserveCompatible(requestId: string, recipientGroup: BloodGroup, count: number, component?: ComponentType): InventoryUnit[];
  releaseForRequest(requestId: string, unitIds?: string[]): InventoryUnit[];
  findReservedForRequest(requestId: string): InventoryUnit[];
  resetSeed(): void;
}

export class InMemoryInventoryRepository implements IInventoryRepository {
  public findAll(): InventoryUnit[] {
    return inventoryService.getAllUnits();
  }

  public findAvailable(): InventoryUnit[] {
    return inventoryService.getAvailableUnits();
  }

  public findCompatibleAvailable(
    recipientGroup: BloodGroup,
    component: ComponentType = 'RED_BLOOD_CELLS'
  ): InventoryUnit[] {
    return inventoryService.getCompatibleAvailableUnits(recipientGroup, component);
  }

  public reserveCompatible(
    requestId: string,
    recipientGroup: BloodGroup,
    count: number,
    component: ComponentType = 'RED_BLOOD_CELLS'
  ): InventoryUnit[] {
    return inventoryService.reserveCompatibleUnits(requestId, recipientGroup, count, component);
  }

  public releaseForRequest(requestId: string, unitIds?: string[]): InventoryUnit[] {
    return inventoryService.releaseUnitsForRequest(requestId, unitIds);
  }

  public findReservedForRequest(requestId: string): InventoryUnit[] {
    return inventoryService.getUnitsReservedForRequest(requestId);
  }

  public resetSeed(): void {
    inventoryService.seedInventory();
  }
}

export const inventoryRepository = new InMemoryInventoryRepository();
