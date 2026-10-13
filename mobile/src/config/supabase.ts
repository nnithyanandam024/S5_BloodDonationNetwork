import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration for React Native
 * Uses the public Anon Key designed for client-side applications.
 * Data security is enforced by PostgreSQL Row Level Security (RLS) policies.
 */
export const SUPABASE_URL = 'https://eutzmjxwfxzkwfsegwjx.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHptanh3Znh6a3dmc2Vnd2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NzY2MTEsImV4cCI6MjEwNzQ1MjYxMX0.d1Q70E0XiW0Zvrdek3WP7pgY2Myn9xOdEPcaju0dhag';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
