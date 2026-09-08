import { BloodGroup, LocationCoords, MatchCandidate, DonorProfile } from '../types';
import { isBloodCompatible } from './compatibility';
import { calculateHaversineDistance } from './haversine';
import { calculateDonorEligibility } from './eligibility';

export interface MatchingCriteria {
  bloodGroup: BloodGroup;
  location: LocationCoords;
  searchRadiusKm: number;
}

export function findAndRankDonors(
  criteria: MatchingCriteria,
  donors: DonorProfile[]
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];

  for (const donor of donors) {
    // 1. Availability Check
    if (!donor.isAvailable) {
      continue;
    }

    // 2. Eligibility Check (Rule: 90 days interval)
    const eligibility = calculateDonorEligibility(donor.lastDonationDate);
    if (!eligibility.isEligible) {
      continue;
    }

    // 3. Compatibility Check (Who can donate to criteria.bloodGroup)
    if (!isBloodCompatible(donor.bloodGroup, criteria.bloodGroup)) {
      continue;
    }

    // 4. Distance Calculation via Haversine
    const distanceKm = calculateHaversineDistance(criteria.location, donor.location);
    if (distanceKm > criteria.searchRadiusKm) {
      continue;
    }

    // 5. Ranking & Scoring
    // Distance weight: 70%
    const distanceScore = Math.max(0, 1 - distanceKm / criteria.searchRadiusKm);
    // Compatibility weight: 20% (exact match = 1.0, alternative universal match = 0.85)
    const compScore = donor.bloodGroup === criteria.bloodGroup ? 1.0 : 0.85;
    // Experience bonus: 10%
    const expScore = Math.min(1.0, (donor.donationCount || 0) / 5);

    const totalScore = Math.round((distanceScore * 0.7 + compScore * 0.2 + expScore * 0.1) * 100) / 100;

    candidates.push({
      donorId: donor.id,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      phone: donor.phone,
      distanceKm,
      score: totalScore,
      status: 'NOTIFIED',
      notifiedAt: new Date().toISOString(),
    });
  }

  // Sort descending by score (highest score first)
  return candidates.sort((a, b) => b.score - a.score);
}
