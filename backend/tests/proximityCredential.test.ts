import { proximityCredentialService } from '../src/services/proximityCredential';

describe('Proximity Credential Service (Privacy-Preserving Ephemeral Tokens)', () => {
  const reqId = 'REQ-TEST-PRIVACY-01';
  const donorId = 'donor-john-001';

  test('quantizes continuous distance into discrete privacy distance bands', () => {
    expect(proximityCredentialService.quantizeDistanceToBand(1.4)).toBe(2.0);
    expect(proximityCredentialService.quantizeDistanceToBand(3.8)).toBe(5.0);
    expect(proximityCredentialService.quantizeDistanceToBand(7.2)).toBe(10.0);
    expect(proximityCredentialService.quantizeDistanceToBand(13.5)).toBe(15.0);
  });

  test('generates a valid ephemeral proximity token bound to request and donor', () => {
    const cred = proximityCredentialService.generateCredential(donorId, reqId, 3.4, 15);

    expect(cred.token).toBeDefined();
    expect(cred.token.length).toBe(32);
    expect(cred.donorId).toBe(donorId);
    expect(cred.requestId).toBe(reqId);
    expect(cred.distanceBandKm).toBe(5.0);
    expect(cred.isRevoked).toBe(false);

    // Verify token
    const isValid = proximityCredentialService.verifyCredential(cred.token, donorId, reqId);
    expect(isValid).toBe(true);
  });

  test('rejects token verification for mismatched donor or request ID', () => {
    const cred = proximityCredentialService.generateCredential(donorId, reqId, 2.1, 15);

    expect(proximityCredentialService.verifyCredential(cred.token, 'wrong-donor', reqId)).toBe(false);
    expect(proximityCredentialService.verifyCredential(cred.token, donorId, 'wrong-req-id')).toBe(false);
  });

  test('revokes all credentials bound to request when fulfilled', () => {
    const cred1 = proximityCredentialService.generateCredential('donor-1', reqId, 1.2, 15);
    const cred2 = proximityCredentialService.generateCredential('donor-2', reqId, 4.5, 15);

    const revokedCount = proximityCredentialService.revokeAllForRequest(reqId);
    expect(revokedCount).toBeGreaterThanOrEqual(2);

    expect(proximityCredentialService.verifyCredential(cred1.token, 'donor-1', reqId)).toBe(false);
    expect(proximityCredentialService.verifyCredential(cred2.token, 'donor-2', reqId)).toBe(false);
  });
});
