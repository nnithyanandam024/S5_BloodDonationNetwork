import { calculateHaversineDistance } from '../src/services/haversine';

describe('Haversine Distance Calculator', () => {
  test('returns 0 for identical coordinates', () => {
    const loc = { latitude: 12.9716, longitude: 77.5946 };
    expect(calculateHaversineDistance(loc, loc)).toBe(0);
  });

  test('calculates accurate distance between known Bangalore locations (~0.6 km)', () => {
    // City Hospital (12.9750, 77.5990) to John Doe (12.9716, 77.5946)
    const hosp = { latitude: 12.975, longitude: 77.599 };
    const donor = { latitude: 12.9716, longitude: 77.5946 };

    const distance = calculateHaversineDistance(hosp, donor);
    expect(distance).toBeGreaterThan(0.5);
    expect(distance).toBeLessThan(0.8);
  });

  test('calculates distance between Bangalore and Mysore (~128 km)', () => {
    const bangalore = { latitude: 12.9716, longitude: 77.5946 };
    const mysore = { latitude: 12.2958, longitude: 76.6394 };

    const distance = calculateHaversineDistance(bangalore, mysore);
    expect(distance).toBeGreaterThan(120);
    expect(distance).toBeLessThan(140);
  });
});
