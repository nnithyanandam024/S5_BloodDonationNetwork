import { BloodGroup } from '../types';

/**
 * Compatibility table defining which donor blood groups can give to which recipient blood groups.
 * (Based on red blood cell antigen/antibody compatibility).
 */
export const COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  // Recipient : Allowed Donors
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

/**
 * Checks whether a donor's blood group is compatible with a requested recipient blood group.
 */
export function isBloodCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  const allowedDonors = COMPATIBILITY_MAP[recipientGroup];
  if (!allowedDonors) return false;
  return allowedDonors.includes(donorGroup);
}

/**
 * Returns all compatible donor blood groups for a given recipient.
 */
export function getCompatibleDonors(recipientGroup: BloodGroup): BloodGroup[] {
  return COMPATIBILITY_MAP[recipientGroup] || [];
}
