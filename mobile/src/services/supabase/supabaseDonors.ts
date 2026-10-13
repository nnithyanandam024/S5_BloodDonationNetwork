import { supabase } from '../../config/supabase';
import { User, BloodRequest, EligibilityResult, DonationRecord } from '../../types';
import { supabaseAuthService } from './supabaseAuth';
import { supabaseRequestsService } from './supabaseRequests';
import { mapProfileToUser } from './supabaseMappers';

export const supabaseDonorsService = {
  async getProfile(): Promise<{ profile: User }> {
    const me = await supabaseAuthService.getMe();
    return { profile: me.user };
  },

  async updateAvailability(isAvailable: boolean): Promise<{ profile: User }> {
    const me = await supabaseAuthService.getMe();

    const { data: updated } = await supabase
      .from('profiles')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('id', me.user.id)
      .select()
      .single();

    const profile = updated ? mapProfileToUser(updated) : { ...me.user, isAvailable };
    supabaseAuthService.setCurrentUser(profile);
    return { profile };
  },

  async getEligibility(): Promise<EligibilityResult> {
    const me = await supabaseAuthService.getMe();
    const lastDonation = me.user.lastDonationDate;

    if (!lastDonation) {
      return {
        isEligible: true,
        daysRemaining: 0,
        reason: 'Ready to donate! No previous donation recorded within 90 days.',
      };
    }

    const lastDate = new Date(lastDonation);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 90 - daysSince);

    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 90);

    return {
      isEligible: daysRemaining === 0,
      lastDonationDate: lastDonation,
      nextEligibleDate: nextDate.toISOString().split('T')[0],
      daysRemaining,
      reason:
        daysRemaining === 0
          ? 'Eligible to donate today.'
          : `Recovery interval required: ${daysRemaining} day(s) until next eligible date.`,
    };
  },

  async getIncomingRequests(): Promise<{ requests: BloodRequest[] }> {
    const me = await supabaseAuthService.getMe();

    // Query candidate_invitations for this donor
    const { data: invs, error } = await supabase
      .from('candidate_invitations')
      .select('request_id')
      .eq('donor_id', me.user.id);

    if (error || !invs || invs.length === 0) {
      // If none explicitly targeted to user, return active matching requests
      const { requests } = await supabaseRequestsService.getHospitalRequests();
      return { requests: requests.slice(0, 3) };
    }

    const requestIds = invs.map((i) => i.request_id);
    const requests: BloodRequest[] = [];

    for (const reqId of requestIds) {
      try {
        const { request } = await supabaseRequestsService.getRequestById(reqId);
        requests.push(request);
      } catch {
        // ignore missing
      }
    }

    return { requests };
  },

  async getActiveCommitments(): Promise<{ requests: BloodRequest[] }> {
    const me = await supabaseAuthService.getMe();

    const { data: comms } = await supabase
      .from('donor_commitments')
      .select('request_id')
      .eq('donor_id', me.user.id)
      .in('status', ['confirmed', 'arrived', 'donated']);

    if (!comms || comms.length === 0) {
      return { requests: [] };
    }

    const requests: BloodRequest[] = [];
    for (const c of comms) {
      try {
        const { request } = await supabaseRequestsService.getRequestById(c.request_id);
        requests.push(request);
      } catch {
        // ignore
      }
    }

    return { requests };
  },

  async respondToRequest(
    requestId: string,
    action: 'ACCEPT' | 'DECLINE'
  ): Promise<{ message: string; request: BloodRequest }> {
    const me = await supabaseAuthService.getMe();

    if (action === 'ACCEPT') {
      await supabase
        .from('candidate_invitations')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .match({ request_id: requestId, donor_id: me.user.id });

      await supabase.from('donor_commitments').upsert({
        request_id: requestId,
        donor_id: me.user.id,
        units_committed: 1,
        status: 'confirmed',
      });
    } else {
      await supabase
        .from('candidate_invitations')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .match({ request_id: requestId, donor_id: me.user.id });
    }

    const { request } = await supabaseRequestsService.getRequestById(requestId);
    return {
      message: `Successfully responded ${action} in Supabase Cloud`,
      request,
    };
  },

  async cancelCommitment(
    requestId: string
  ): Promise<{ message: string; request: BloodRequest }> {
    const me = await supabaseAuthService.getMe();

    await supabase
      .from('donor_commitments')
      .update({ status: 'cancelled' })
      .match({ request_id: requestId, donor_id: me.user.id });

    const { request } = await supabaseRequestsService.getRequestById(requestId);
    return {
      message: 'Commitment cancelled in Supabase Cloud',
      request,
    };
  },

  async markAsDonated(
    requestId: string
  ): Promise<{ message: string; commitment: any; request: BloodRequest }> {
    const me = await supabaseAuthService.getMe();

    await supabase
      .from('donor_commitments')
      .update({ status: 'donated', donated_at: new Date().toISOString() })
      .match({ request_id: requestId, donor_id: me.user.id });

    const { request } = await supabaseRequestsService.getRequestById(requestId);
    return {
      message: 'Marked as physically donated. Awaiting hospital confirmation.',
      commitment: { status: 'DONATED' },
      request,
    };
  },

  async getDonationHistory(): Promise<{ records: DonationRecord[]; totalDonations: number }> {
    const me = await supabaseAuthService.getMe();

    const { data: rows } = await supabase
      .from('donation_records')
      .select('*, hospital:hospital_id(*)')
      .eq('donor_id', me.user.id);

    if (!rows) {
      return { records: [], totalDonations: 0 };
    }

    const records: DonationRecord[] = rows.map((d) => ({
      id: d.id,
      requestId: d.request_id,
      hospitalId: d.hospital_id,
      hospitalName: d.hospital?.hospital_name || d.hospital?.name || 'Hospital',
      donorId: d.donor_id,
      donorName: me.user.name,
      donorPhone: me.user.phone,
      bloodGroup: d.blood_group,
      component: d.component || 'WHOLE_BLOOD',
      donatedAt: d.donation_date || d.created_at,
      receivedAt: d.donation_date || d.created_at,
      unitsGiven: d.units || 1,
    }));

    return {
      records,
      totalDonations: records.reduce((s, r) => s + r.unitsGiven, 0),
    };
  },
};
