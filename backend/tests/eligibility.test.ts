import { calculateDonorEligibility } from '../src/services/eligibility';

describe('Donor Eligibility Engine', () => {
  test('first time donor with no prior donation is immediately eligible', () => {
    const result = calculateDonorEligibility(undefined);
    expect(result.isEligible).toBe(true);
    expect(result.daysRemaining).toBe(0);
  });

  test('donor who donated 110 days ago is eligible (policy: 90 days)', () => {
    const date110DaysAgo = new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateDonorEligibility(date110DaysAgo, 90);
    expect(result.isEligible).toBe(true);
    expect(result.daysRemaining).toBe(0);
  });

  test('donor who donated 20 days ago is NOT eligible and has remaining days', () => {
    const date20DaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateDonorEligibility(date20DaysAgo, 90);
    expect(result.isEligible).toBe(false);
    expect(result.daysRemaining).toBeGreaterThan(65);
    expect(result.daysRemaining).toBeLessThanOrEqual(71);
    expect(result.nextEligibleDate).toBeDefined();
  });
});
