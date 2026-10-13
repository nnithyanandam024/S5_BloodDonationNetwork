import { supabaseAuthService } from '../supabase/supabaseAuth';
import { supabaseRequestsService } from '../supabase/supabaseRequests';
import { supabaseDonorsService } from '../supabase/supabaseDonors';
import { authApi as localAuthApi, RegisterParams, AuthResponse, GoogleAuthParams, GoogleAuthResponse } from './auth';
import { requestsApi as localRequestsApi, CreateRequestParams } from './requests';
import { donorsApi as localDonorsApi } from './donors';

/**
 * ARCHITECTURE CONFIGURATION:
 * USE_CLOUD_SUPABASE = true  -> Option 2: 100% Serverless Cloud Supabase (no local terminal needed).
 * USE_CLOUD_SUPABASE = false -> Local Express backend on localhost:5000.
 */
export const USE_CLOUD_SUPABASE = true;

export const authApi = USE_CLOUD_SUPABASE ? (supabaseAuthService as any) : localAuthApi;
export const requestsApi = USE_CLOUD_SUPABASE ? (supabaseRequestsService as any) : localRequestsApi;
export const donorsApi = USE_CLOUD_SUPABASE ? (supabaseDonorsService as any) : localDonorsApi;

export type { RegisterParams, AuthResponse, GoogleAuthParams, GoogleAuthResponse, CreateRequestParams };
export * from './client';
export * from '../supabase';
