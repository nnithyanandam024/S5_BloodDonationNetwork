import { supabase } from '../../config/supabase';
import { BloodRequest, RequestState, FulfillmentTelemetry, InventoryUnit, DonationRecord } from '../../types';
import { CreateRequestParams } from '../api/requests';
import { mapBloodRequestRow, mapInventoryUnitRow } from './supabaseMappers';
import { supabaseAuthService } from './supabaseAuth';

export const supabaseRequestsService = {
  async createRequest(params: CreateRequestParams): Promise<{ message: string; request: BloodRequest }> {
    const user = supabaseAuthService.getCurrentUser();
    const hospitalId = user?.id || (await supabaseAuthService.getMe()).user.id;

    const { data: newReq, error } = await supabase
      .from('blood_requests')
      .insert({
        hospital_id: hospitalId,
        blood_group: params.bloodGroup,
        component: params.component || 'WHOLE_BLOOD',
        units_required: params.unitsRequired,
        urgency: params.urgency || 'NORMAL',
        search_radius_km: params.searchRadiusKm || 15,
        notes: params.notes,
        status: 'matching',
        latitude: user?.location?.latitude ?? 12.975,
        longitude: user?.location?.longitude ?? 77.599,
      })
      .select('*, profiles:hospital_id(*)')
      .single();

    if (error || !newReq) {
      throw new Error(error?.message || 'Failed to create blood request in Supabase.');
    }

    // Attempt to invoke the automated AFGC matching trigger/RPC in Supabase Cloud
    try {
      await supabase.rpc('afgc_match_candidates', { p_request_id: newReq.id });
    } catch {
      // Trigger may have already handled this
    }

    // Auto reserve inventory if requested
    if (params.autoReserveInventory) {
      const reserveCount = typeof params.autoReserveInventory === 'number' ? params.autoReserveInventory : 1;
      try {
        await supabase.rpc('afgc_reserve_inventory_units', {
          p_request_id: newReq.id,
          p_count: reserveCount,
        });
      } catch {
        // Fallback or ignore
      }
    }

    const fullReq = await this.getRequestById(newReq.id);
    return {
      message: 'Emergency request created successfully in Supabase Cloud',
      request: fullReq.request,
    };
  },

  async getHospitalRequests(): Promise<{ requests: BloodRequest[] }> {
    const { data: rows, error } = await supabase
      .from('blood_requests')
      .select('*, profiles:hospital_id(*)')
      .order('created_at', { ascending: false });

    if (error || !rows) {
      return { requests: [] };
    }

    // Enrich requests with their invitations & commitments
    const requests = await Promise.all(
      rows.map(async (row) => {
        const { data: invs } = await supabase
          .from('candidate_invitations')
          .select('*, profiles:donor_id(*)')
          .eq('request_id', row.id);

        const { data: comms } = await supabase
          .from('donor_commitments')
          .select('*, profiles:donor_id(*)')
          .eq('request_id', row.id);

        const { data: dons } = await supabase
          .from('donation_records')
          .select('*, donor:donor_id(*), hospital:hospital_id(*)')
          .eq('request_id', row.id);

        const { data: invUnits } = await supabase
          .from('inventory_units')
          .select('*')
          .eq('request_id', row.id);

        return mapBloodRequestRow(row, invs || [], comms || [], dons || [], invUnits || []);
      })
    );

    return { requests };
  },

  async getRequestById(id: string): Promise<{ request: BloodRequest }> {
    const { data: row, error } = await supabase
      .from('blood_requests')
      .select('*, profiles:hospital_id(*)')
      .eq('id', id)
      .single();

    if (error || !row) {
      throw new Error(`Request with ID ${id} not found.`);
    }

    const { data: invs } = await supabase
      .from('candidate_invitations')
      .select('*, profiles:donor_id(*)')
      .eq('request_id', id);

    const { data: comms } = await supabase
      .from('donor_commitments')
      .select('*, profiles:donor_id(*)')
      .eq('request_id', id);

    const { data: dons } = await supabase
      .from('donation_records')
      .select('*, donor:donor_id(*), hospital:hospital_id(*)')
      .eq('request_id', id);

    const { data: invUnits } = await supabase
      .from('inventory_units')
      .select('*')
      .eq('request_id', id);

    const request = mapBloodRequestRow(row, invs || [], comms || [], dons || [], invUnits || []);
    return { request };
  },

  async getTelemetry(id: string): Promise<{ telemetry: FulfillmentTelemetry }> {
    const { request } = await this.getRequestById(id);

    const q = request.unitsRequired || 1;
    const ir = request.reservedInventoryUnits || 0;
    const dc = request.confirmedDonorCount || 0;
    const gap = Math.max(0, q - ir - dc);

    const telemetry: FulfillmentTelemetry = {
      requestId: id,
      requiredQuantity: q,
      reservedInventoryUnits: ir,
      confirmedDonorCount: dc,
      remainingGap: gap,
      currentTier: 1,
      totalTiers: 3,
      activeInvitationsCount: request.matchedCandidates.length,
      cancelledInvitationsCount: 0,
      status: request.status,
      dispatchEfficiency: request.matchedCandidates.length > 0 ? Math.round((dc / request.matchedCandidates.length) * 100) / 100 : 1.0,
      updatedAt: new Date().toISOString(),
    };

    return { telemetry };
  },

  async reserveInventory(
    id: string,
    count: number = 1
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    try {
      await supabase.rpc('afgc_reserve_inventory_units', {
        p_request_id: id,
        p_count: count,
      });
    } catch {
      // Direct update fallback
      const { data: units } = await supabase
        .from('inventory_units')
        .select('id')
        .eq('status', 'available')
        .limit(count);

      if (units && units.length > 0) {
        await supabase
          .from('inventory_units')
          .update({ status: 'reserved', request_id: id })
          .in('id', units.map((u) => u.id));
      }
    }

    const { request } = await this.getRequestById(id);
    const { telemetry } = await this.getTelemetry(id);

    return {
      message: `Reserved ${count} unit(s) from blood bank inventory`,
      telemetry,
      request,
    };
  },

  async releaseInventory(
    id: string,
    unitIds?: string[]
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    try {
      await supabase.rpc('afgc_release_inventory_units', { p_request_id: id });
    } catch {
      let query = supabase.from('inventory_units').update({ status: 'available', request_id: null });
      if (unitIds && unitIds.length > 0) {
        await query.in('id', unitIds);
      } else {
        await query.eq('request_id', id);
      }
    }

    const { request } = await this.getRequestById(id);
    const { telemetry } = await this.getTelemetry(id);

    return {
      message: 'Released inventory units successfully',
      telemetry,
      request,
    };
  },

  async getAllInventory(): Promise<{ units: InventoryUnit[] }> {
    const { data: rows, error } = await supabase
      .from('inventory_units')
      .select('*, profiles:hospital_id(*)');

    if (error || !rows) {
      return { units: [] };
    }

    return { units: rows.map(mapInventoryUnitRow) };
  },

  async simulateDonorAccept(
    id: string
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    // Find first notified donor invitation
    const { data: invs } = await supabase
      .from('candidate_invitations')
      .select('*')
      .eq('request_id', id)
      .eq('status', 'notified')
      .limit(1);

    if (invs && invs.length > 0) {
      const inv = invs[0];
      await supabase
        .from('candidate_invitations')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', inv.id);

      await supabase.from('donor_commitments').insert({
        request_id: id,
        donor_id: inv.donor_id,
        units_committed: 1,
        status: 'confirmed',
      });
    }

    const { request } = await this.getRequestById(id);
    const { telemetry } = await this.getTelemetry(id);

    return {
      message: 'Simulated donor acceptance in Supabase Cloud',
      telemetry,
      request,
    };
  },

  async simulateDonorCancel(
    id: string
  ): Promise<{ message: string; telemetry: FulfillmentTelemetry; request: BloodRequest }> {
    const { data: comms } = await supabase
      .from('donor_commitments')
      .select('*')
      .eq('request_id', id)
      .eq('status', 'confirmed')
      .limit(1);

    if (comms && comms.length > 0) {
      await supabase
        .from('donor_commitments')
        .update({ status: 'cancelled' })
        .eq('id', comms[0].id);
    }

    const { request } = await this.getRequestById(id);
    const { telemetry } = await this.getTelemetry(id);

    return {
      message: 'Simulated donor cancellation',
      telemetry,
      request,
    };
  },

  async updateRequestStatus(
    id: string,
    status: RequestState
  ): Promise<{ message: string; request: BloodRequest }> {
    await supabase
      .from('blood_requests')
      .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', id);

    const { request } = await this.getRequestById(id);
    return {
      message: `Request status updated to ${status}`,
      request,
    };
  },

  async confirmReceipt(
    requestId: string,
    donorId: string
  ): Promise<{ message: string; donationRecord: DonationRecord; request: BloodRequest }> {
    try {
      await supabase.rpc('afgc_confirm_donation_receipt', {
        p_request_id: requestId,
        p_donor_id: donorId,
        p_units: 1,
      });
    } catch {
      // Direct insertion fallback
      const { request } = await this.getRequestById(requestId);
      await supabase.from('donation_records').insert({
        request_id: requestId,
        donor_id: donorId,
        hospital_id: request.hospitalId,
        blood_group: request.bloodGroup,
        units: 1,
      });
      await supabase.from('donor_commitments').update({ status: 'completed' }).match({ request_id: requestId, donor_id: donorId });
    }

    const { request } = await this.getRequestById(requestId);
    const lastRecord = request.donationRecords?.[request.donationRecords.length - 1];

    const donationRecord: DonationRecord = lastRecord || {
      id: `don-${Date.now()}`,
      requestId,
      hospitalId: request.hospitalId,
      hospitalName: request.hospitalName,
      donorId,
      donorName: 'Donor',
      donorPhone: '',
      bloodGroup: request.bloodGroup,
      component: request.component,
      donatedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      unitsGiven: 1,
    };

    return {
      message: 'Blood receipt confirmed and recorded in Supabase Cloud',
      donationRecord,
      request,
    };
  },

  async getDonationRecords(): Promise<{ records: DonationRecord[]; totalReceived: number }> {
    const { data: rows } = await supabase
      .from('donation_records')
      .select('*, donor:donor_id(*), hospital:hospital_id(*)');

    if (!rows) {
      return { records: [], totalReceived: 0 };
    }

    const records: DonationRecord[] = rows.map((d) => ({
      id: d.id,
      requestId: d.request_id,
      hospitalId: d.hospital_id,
      hospitalName: d.hospital?.hospital_name || d.hospital?.name || 'Hospital',
      donorId: d.donor_id,
      donorName: d.donor?.name || 'Anonymous Donor',
      donorPhone: d.donor?.phone || '',
      bloodGroup: d.blood_group,
      component: d.component || 'WHOLE_BLOOD',
      donatedAt: d.donation_date || d.created_at,
      receivedAt: d.donation_date || d.created_at,
      unitsGiven: d.units || 1,
    }));

    return {
      records,
      totalReceived: records.reduce((sum, r) => sum + r.unitsGiven, 0),
    };
  },
};
