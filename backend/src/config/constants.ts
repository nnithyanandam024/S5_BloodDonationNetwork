export const AFGC_CONSTANTS = {
  // Tier Sizing & Response Ratio
  DEFAULT_TIER_EXPANSION_FACTOR: 2.5, // Tk = min(ceil(2.5 * G), Navail)
  MIN_TIER_EXPANSION_FACTOR: 1.5,
  MAX_TIER_EXPANSION_FACTOR: 4.0,

  // Ephemeral Proximity Tokens
  EPHEMERAL_CREDENTIAL_TTL_MINUTES: 15,
  EPHEMERAL_SECRET_KEY: 'bloodlink-ephemeral-secret-key-2026',

  // Geospatial Search & Privacy Quantization
  DEFAULT_SEARCH_RADIUS_KM: 15,
  MAX_SEARCH_RADIUS_KM: 50,
  DISTANCE_BANDS_KM: [2.0, 5.0, 10.0, 15.0, 25.0],

  // Clinical Donation Parameters
  MIN_DONATION_INTERVAL_DAYS: 90, // Safe whole blood donation interval
  BLOOD_COMPONENT_EXPIRY_DAYS: 35, // RBC storage life

  // Candidate Scoring Weights
  WEIGHT_DISTANCE: 0.70,
  WEIGHT_COMPATIBILITY: 0.20,
  WEIGHT_EXPERIENCE: 0.10,
};

export const API_ROUTES = {
  HEALTH: '/api/health',
  AUTH: '/api/auth',
  DONORS: '/api/donors',
  REQUESTS: '/api/requests',
  MATCHING: '/api/matching',
  EXPERIMENTS: '/api/experiments',
};
