import { supabase } from '../config/supabase';
import {
  BaseUser,
  DonorProfile,
  HospitalProfile,
  BloodRequest,
  InventoryUnit,
  BloodGroup,
  ComponentType,
} from '../types';
import { IUserRepository } from './userRepository';
import { IDonorRepository } from './donorRepository';
import { IInventoryRepository } from './inventoryRepository';
import { IRequestRepository } from './requestRepository';
import {
  profileToUser,
  userToProfileRow,
  inventoryRowToUnit,
  requestRowToBloodRequest,
  bloodRequestToRow,
} from './supabaseMappers';
import { storage } from '../services/storage';
import { inventoryService } from '../services/inventoryService';

/**
 * Supabase-backed User Repository with write-through local cache.
 */
export class SupabaseUserRepository implements IUserRepository {
  private userCache: Map<string, BaseUser | DonorProfile | HospitalProfile> = new Map();

  constructor() {
    this.hydrateFromSupabase();
  }

  public async hydrateFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        for (const row of data) {
          const user = profileToUser(row);
          this.userCache.set(user.id, user);
          this.userCache.set(user.email.toLowerCase(), user);
          if (user.googleUid) {
            this.userCache.set(`google:${user.googleUid}`, user);
          }
          storage.saveUser(user);
        }
      }
    } catch (err: any) {
      console.warn('[SupabaseUserRepository] Hydration notice:', err.message);
    }
  }

  public findById(id: string): (BaseUser | DonorProfile | HospitalProfile) | undefined {
    return this.userCache.get(id) || storage.getUserById(id);
  }

  public findByEmail(email: string): (BaseUser | DonorProfile | HospitalProfile) | undefined {
    return this.userCache.get(email.trim().toLowerCase()) || storage.getUserByEmail(email);
  }

  public findByGoogleUid(googleUid: string): (BaseUser | DonorProfile | HospitalProfile) | undefined {
    return this.userCache.get(`google:${googleUid}`) || storage.getUserByGoogleUid(googleUid);
  }

  public save(user: BaseUser | DonorProfile | HospitalProfile): void {
    // 1. Update local cache & storage immediately
    this.userCache.set(user.id, user);
    this.userCache.set(user.email.toLowerCase(), user);
    if (user.googleUid) {
      this.userCache.set(`google:${user.googleUid}`, user);
    }
    storage.saveUser(user);

    // 2. Asynchronously persist to Supabase
    const row = userToProfileRow(user);
    supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('[SupabaseUserRepository] Save error:', error.message);
      });
  }
}

/**
 * Supabase-backed Donor Repository
 */
export class SupabaseDonorRepository implements IDonorRepository {
  public findAllDonors(): DonorProfile[] {
    return storage.getAllDonors();
  }

  public findDonorById(id: string): DonorProfile | undefined {
    const user = storage.getUserById(id);
    return user && user.role === 'DONOR' ? (user as DonorProfile) : undefined;
  }

  public updateDonor(id: string, updates: Partial<DonorProfile>): DonorProfile {
    const updated = storage.updateDonor(id, updates);

    // Sync to Supabase
    const rowUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.isAvailable !== undefined) rowUpdates.is_available = updates.isAvailable;
    if (updates.donationCount !== undefined) rowUpdates.donation_count = updates.donationCount;
    if (updates.lastDonationDate !== undefined) rowUpdates.last_donation_date = updates.lastDonationDate;
    if (updates.location) {
      rowUpdates.latitude = updates.location.latitude;
      rowUpdates.longitude = updates.location.longitude;
      rowUpdates.city = updates.location.city;
      rowUpdates.address = updates.location.address;
    }

    supabase
      .from('profiles')
      .update(rowUpdates)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('[SupabaseDonorRepository] Update error:', error.message);
      });

    return updated;
  }

  public getIncomingRequestsForDonor(donorId: string): BloodRequest[] {
    return storage.getIncomingRequestsForDonor(donorId);
  }
}

/**
 * Supabase-backed Inventory Repository
 * Delegates state to inventoryService and writes through to Supabase
 */
export class SupabaseInventoryRepository implements IInventoryRepository {
  constructor() {
    this.hydrateFromSupabase();
  }

  public async hydrateFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabase.from('inventory_units').select('*');
      if (!error && data && data.length > 0) {
        // If Supabase has data, ensure inventoryService is seeded with them
        for (const row of data) {
          const unit = inventoryRowToUnit(row);
          (inventoryService as any).units?.set(unit.id, unit);
        }
      }
    } catch (err: any) {
      console.warn('[SupabaseInventoryRepository] Hydration notice:', err.message);
    }
  }

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
    const reserved = inventoryService.reserveCompatibleUnits(requestId, recipientGroup, count, component);
    const now = new Date().toISOString();

    for (const unit of reserved) {
      supabase
        .from('inventory_units')
        .update({
          status: 'RESERVED',
          reserved_for_request_id: requestId,
          reserved_at: now,
        })
        .eq('id', unit.id)
        .then(({ error }) => {
          if (error) console.error('[SupabaseInventory] Reserve error:', error.message);
        });
    }

    return reserved;
  }

  public releaseForRequest(requestId: string, unitIds?: string[]): InventoryUnit[] {
    const released = inventoryService.releaseUnitsForRequest(requestId, unitIds);

    for (const unit of released) {
      supabase
        .from('inventory_units')
        .update({
          status: 'AVAILABLE',
          reserved_for_request_id: null,
          reserved_at: null,
        })
        .eq('id', unit.id)
        .then(({ error }) => {
          if (error) console.error('[SupabaseInventory] Release error:', error.message);
        });
    }

    return released;
  }

  public findReservedForRequest(requestId: string): InventoryUnit[] {
    return inventoryService.getUnitsReservedForRequest(requestId);
  }

  public resetSeed(): void {
    inventoryService.seedInventory();
  }
}

/**
 * Supabase-backed Request Repository with Realtime streaming integration
 */
export class SupabaseRequestRepository implements IRequestRepository {
  private requests: Map<string, BloodRequest> = new Map();
  private listeners: Map<string, Set<(request: BloodRequest) => void>> = new Map();

  constructor() {
    this.hydrateFromSupabase();
  }

  public async hydrateFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabase.from('blood_requests').select('*');
      if (!error && data) {
        for (const row of data) {
          const req = requestRowToBloodRequest(row);
          this.requests.set(req.id, req);
          storage.saveBloodRequest(req);
        }
      }
    } catch (err: any) {
      console.warn('[SupabaseRequestRepository] Hydration notice:', err.message);
    }
  }

  public findById(id: string): BloodRequest | undefined {
    return this.requests.get(id) || storage.getBloodRequestById(id);
  }

  public findAll(): BloodRequest[] {
    return Array.from(this.requests.values()).length > 0
      ? Array.from(this.requests.values())
      : storage.getAllBloodRequests();
  }

  public findByHospitalId(hospitalId: string): BloodRequest[] {
    return this.findAll().filter((r) => r.hospitalId === hospitalId);
  }

  public save(request: BloodRequest): void {
    // 1. Update in-memory state & notify subscribers immediately
    this.requests.set(request.id, request);
    storage.saveBloodRequest(request);

    const set = this.listeners.get(request.id);
    if (set) {
      for (const listener of set) {
        try {
          listener(request);
        } catch (err) {
          console.error('[RequestRepository] Listener error:', err);
        }
      }
    }

    // 2. Persist Request to Supabase
    const row = bloodRequestToRow(request);
    supabase
      .from('blood_requests')
      .upsert(row, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('[SupabaseRequestRepository] Save request error:', error.message);
      });

    // 3. Persist Candidate Dispatches
    if (request.matchedCandidates && request.matchedCandidates.length > 0) {
      const candidateRows = request.matchedCandidates.map((c) => ({
        request_id: request.id,
        donor_id: c.donorId,
        donor_name: c.donorName,
        blood_group: c.bloodGroup,
        phone: c.phone,
        distance_km: c.distanceKm,
        score: c.score,
        status: c.status,
        tier_number: c.tierNumber || 1,
        ephemeral_token: c.ephemeralToken,
        notified_at: c.notifiedAt,
        responded_at: c.respondedAt,
      }));

      // Delete old invitations for request and re-insert
      supabase
        .from('candidate_invitations')
        .delete()
        .eq('request_id', request.id)
        .then(() => {
          supabase.from('candidate_invitations').insert(candidateRows).then();
        });
    }

    // 4. Persist Donor Commitments
    if (request.donorCommitments && request.donorCommitments.length > 0) {
      const commitmentRows = request.donorCommitments.map((comm) => ({
        id: comm.id,
        request_id: request.id,
        donor_id: comm.donorId,
        donor_name: comm.donorName,
        donor_phone: comm.donorPhone,
        blood_group: comm.bloodGroup,
        status: comm.status,
        committed_at: comm.committedAt,
        arrived_at: comm.arrivedAt,
        donated_at: comm.donatedAt,
        received_at: comm.receivedAt,
        cancelled_at: comm.cancelledAt,
        ephemeral_token: comm.ephemeralToken,
      }));

      supabase
        .from('donor_commitments')
        .upsert(commitmentRows, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('[SupabaseRequestRepository] Commitment upsert error:', error.message);
        });
    }
  }

  public subscribe(id: string, listener: (request: BloodRequest) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    const set = this.listeners.get(id)!;
    set.add(listener);

    // Also register Supabase Realtime channel subscription for PostgreSQL updates
    const channel = supabase
      .channel(`realtime-request-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_requests', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new) {
            const updated = requestRowToBloodRequest(payload.new);
            listener(updated);
          }
        }
      )
      .subscribe();

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(id);
      }
      channel.unsubscribe();
    };
  }

  public clearAll(): void {
    this.requests.clear();
    this.listeners.clear();
    storage.clearAllRequests();
  }
}
