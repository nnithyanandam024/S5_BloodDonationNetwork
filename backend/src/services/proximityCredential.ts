import crypto from 'crypto';
import { EphemeralProximityCredential } from '../types';

export class ProximityCredentialService {
  private secretKey: string;
  private activeCredentials: Map<string, EphemeralProximityCredential> = new Map(); // token -> credential

  constructor(secretKey: string = 'bloodlink-ephemeral-secret-key-2026') {
    this.secretKey = secretKey;
  }

  /**
   * Discretizes exact distance into privacy-preserving coarse distance bands.
   * Eliminates the need to transmit or persist raw geographic coordinates.
   */
  public quantizeDistanceToBand(distanceKm: number): number {
    if (distanceKm < 2.0) return 2.0;
    if (distanceKm < 5.0) return 5.0;
    if (distanceKm < 10.0) return 10.0;
    return Math.ceil(distanceKm / 5.0) * 5.0;
  }

  /**
   * Generates a request-bound ephemeral proximity credential.
   * Valid only for the specific emergency request and short time window.
   */
  public generateCredential(
    donorId: string,
    requestId: string,
    distanceKm: number,
    validityMinutes: number = 15
  ): EphemeralProximityCredential {
    const distanceBand = this.quantizeDistanceToBand(distanceKm);
    const now = Date.now();
    const expiresAtMs = now + validityMinutes * 60 * 1000;
    const timeSlot = Math.floor(now / (validityMinutes * 60 * 1000));

    // Cryptographic HMAC token binding Request ID + Donor ID + Distance Band + Time Window
    const payload = `${requestId}:${donorId}:${distanceBand}:${timeSlot}`;
    const token = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex')
      .slice(0, 32);

    const credential: EphemeralProximityCredential = {
      token,
      donorId,
      requestId,
      distanceBandKm: distanceBand,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
      isRevoked: false,
    };

    this.activeCredentials.set(token, credential);
    return credential;
  }

  /**
   * Validates whether a proximity credential is valid, non-expired, and non-revoked.
   */
  public verifyCredential(token: string, donorId: string, requestId: string): boolean {
    const credential = this.activeCredentials.get(token);
    if (!credential) return false;
    if (credential.donorId !== donorId || credential.requestId !== requestId) return false;
    if (credential.isRevoked) return false;
    if (new Date(credential.expiresAt).getTime() < Date.now()) return false;

    return true;
  }

  /**
   * Revokes a specific credential.
   */
  public revokeCredential(token: string): boolean {
    const cred = this.activeCredentials.get(token);
    if (cred) {
      cred.isRevoked = true;
      return true;
    }
    return false;
  }

  /**
   * Revokes all ephemeral credentials associated with an emergency request (called upon G = 0).
   */
  public revokeAllForRequest(requestId: string): number {
    let count = 0;
    for (const cred of this.activeCredentials.values()) {
      if (cred.requestId === requestId && !cred.isRevoked) {
        cred.isRevoked = true;
        count++;
      }
    }
    return count;
  }

  /**
   * Clean expired credentials from memory.
   */
  public pruneExpiredCredentials(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [token, cred] of this.activeCredentials.entries()) {
      if (new Date(cred.expiresAt).getTime() < now || cred.isRevoked) {
        this.activeCredentials.delete(token);
        pruned++;
      }
    }
    return pruned;
  }

  public getActiveCredentialsForRequest(requestId: string): EphemeralProximityCredential[] {
    const now = Date.now();
    return Array.from(this.activeCredentials.values()).filter(
      (c) => c.requestId === requestId && !c.isRevoked && new Date(c.expiresAt).getTime() >= now
    );
  }
}

export const proximityCredentialService = new ProximityCredentialService();
