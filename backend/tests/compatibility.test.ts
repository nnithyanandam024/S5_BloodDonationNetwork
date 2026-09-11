import { isBloodCompatible, getCompatibleDonors } from '../src/services/compatibility';

describe('Blood Compatibility Matrix', () => {
  test('O- should be universal donor (can donate to all)', () => {
    const allGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
    for (const recipient of allGroups) {
      expect(isBloodCompatible('O-', recipient)).toBe(true);
    }
  });

  test('AB+ should be universal recipient (can receive from all)', () => {
    const allGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
    for (const donor of allGroups) {
      expect(isBloodCompatible(donor, 'AB+')).toBe(true);
    }
  });

  test('O- recipient can ONLY receive from O-', () => {
    expect(getCompatibleDonors('O-')).toEqual(['O-']);
    expect(isBloodCompatible('O+', 'O-')).toBe(false);
    expect(isBloodCompatible('A+', 'O-')).toBe(false);
  });

  test('A+ recipient can receive from O-, O+, A-, A+', () => {
    expect(isBloodCompatible('O-', 'A+')).toBe(true);
    expect(isBloodCompatible('O+', 'A+')).toBe(true);
    expect(isBloodCompatible('A-', 'A+')).toBe(true);
    expect(isBloodCompatible('A+', 'A+')).toBe(true);
    expect(isBloodCompatible('B+', 'A+')).toBe(false);
    expect(isBloodCompatible('AB+', 'A+')).toBe(false);
  });

  test('B+ recipient can receive from O-, O+, B-, B+', () => {
    expect(isBloodCompatible('B+', 'B+')).toBe(true);
    expect(isBloodCompatible('B-', 'B+')).toBe(true);
    expect(isBloodCompatible('O+', 'B+')).toBe(true);
    expect(isBloodCompatible('A+', 'B+')).toBe(false);
  });
});
