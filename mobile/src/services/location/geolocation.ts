import { PermissionsAndroid, Platform } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
  city?: string;
}

export class GeolocationService {
  /**
   * Request location runtime permissions on Android / iOS.
   */
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'BloodLink needs access to your location to match nearby emergency blood requests without logging your continuous route.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('[Geolocation] Permission request error:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Get approximate / privacy-preserving coordinates.
   * Quantizes coordinates to ~1km precision to safeguard donor residence privacy
   * in alignment with the Privacy-Preserving Dispatch protocol.
   */
  public getCoarseCoordinates(coords: Coordinates, precisionDecimals: number = 2): Coordinates {
    const factor = Math.pow(10, precisionDecimals);
    return {
      latitude: Math.round(coords.latitude * factor) / factor,
      longitude: Math.round(coords.longitude * factor) / factor,
      city: coords.city,
    };
  }

  /**
   * Compute Haversine distance between two coordinates in kilometers.
   */
  public calculateDistanceKm(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(to.latitude - from.latitude);
    const dLon = this.deg2rad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.latitude)) *
        Math.cos(this.deg2rad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const geolocationService = new GeolocationService();
