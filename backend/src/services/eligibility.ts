import { EligibilityResult } from '../types';

// Standard whole blood donation policy interval: 90 days (configurable via env)
export const DEFAULT_ELIGIBILITY_INTERVAL_DAYS = parseInt(
  process.env.DONATION_INTERVAL_DAYS || '90',
  10
);

/**
 * Calculates a donor's eligibility based on their last donation date and configured policy.
 */
export function calculateDonorEligibility(
  lastDonationDateStr?: string,
  intervalDays: number = DEFAULT_ELIGIBILITY_INTERVAL_DAYS
): EligibilityResult {
  if (!lastDonationDateStr) {
    // First-time donor or no record of prior donation
    return {
      isEligible: true,
      daysRemaining: 0,
      reason: 'No previous donation record. Eligible to donate immediately.',
    };
  }

  const lastDate = new Date(lastDonationDateStr);
  if (isNaN(lastDate.getTime())) {
    return {
      isEligible: true,
      daysRemaining: 0,
      reason: 'Invalid donation date recorded. Marked as eligible.',
    };
  }

  const nextEligibleDate = new Date(lastDate);
  nextEligibleDate.setDate(nextEligibleDate.getDate() + intervalDays);

  const now = new Date();
  const diffMs = nextEligibleDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return {
      isEligible: true,
      lastDonationDate: lastDate.toISOString(),
      nextEligibleDate: nextEligibleDate.toISOString(),
      daysRemaining: 0,
      reason: 'Eligible to donate blood.',
    };
  }

  return {
    isEligible: false,
    lastDonationDate: lastDate.toISOString(),
    nextEligibleDate: nextEligibleDate.toISOString(),
    daysRemaining,
    reason: `Must wait ${daysRemaining} more days before next donation (policy: ${intervalDays} days interval).`,
  };
}
