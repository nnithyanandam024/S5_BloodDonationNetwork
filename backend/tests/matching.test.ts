import { findAndRankDonors } from '../src/services/matching';
import { storage } from '../src/services/storage';

describe('Donor Matching Engine', () => {
  test('matches and ranks eligible & compatible donors, filtering out ineligible ones', () => {
    const donors = storage.getAllDonors();
    const criteria = {
      bloodGroup: 'O+' as const,
      location: { latitude: 12.975, longitude: 77.599 }, // City Care Hospital
      searchRadiusKm: 10,
    };

    const candidates = findAndRankDonors(criteria, donors);

    expect(candidates.length).toBeGreaterThanOrEqual(2);

    // John Doe should be candidate #1 because he is closest (0.6 km) and O+
    const topCandidate = candidates[0];
    expect(topCandidate.donorName).toBe('John Doe');
    expect(topCandidate.bloodGroup).toBe('O+');
    expect(topCandidate.distanceKm).toBeLessThan(1.0);
    expect(topCandidate.score).toBeGreaterThan(0.8);

    // Priya Sharma (O-) is compatible universal donor within radius
    const priya = candidates.find((c) => c.donorName === 'Priya Sharma');
    expect(priya).toBeDefined();

    // Rahul Verma donated 20 days ago -> MUST be filtered out as ineligible
    const rahul = candidates.find((c) => c.donorName === 'Rahul Verma');
    expect(rahul).toBeUndefined();
  });

  test('returns empty candidate list if search radius is too small', () => {
    const donors = storage.getAllDonors();
    const criteria = {
      bloodGroup: 'O+' as const,
      location: { latitude: 12.975, longitude: 77.599 },
      searchRadiusKm: 0.1, // 100 meters - no one is this close
    };

    const candidates = findAndRankDonors(criteria, donors);
    expect(candidates.length).toBe(0);
  });
});
