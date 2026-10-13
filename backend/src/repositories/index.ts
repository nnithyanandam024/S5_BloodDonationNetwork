import { IUserRepository, InMemoryUserRepository } from './userRepository';
import { IDonorRepository, InMemoryDonorRepository } from './donorRepository';
import { IRequestRepository, InMemoryRequestRepository } from './requestRepository';
import { IInventoryRepository, InMemoryInventoryRepository } from './inventoryRepository';
import {
  SupabaseUserRepository,
  SupabaseDonorRepository,
  SupabaseInventoryRepository,
  SupabaseRequestRepository,
} from './supabaseRepositories';

export * from './supabaseMappers';
export * from './supabaseRepositories';
export { IUserRepository, InMemoryUserRepository } from './userRepository';
export { IDonorRepository, InMemoryDonorRepository } from './donorRepository';
export { IRequestRepository, InMemoryRequestRepository } from './requestRepository';
export { IInventoryRepository, InMemoryInventoryRepository } from './inventoryRepository';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
const isSupabaseEnabled =
  !isTestEnv &&
  (process.env.DATA_SOURCE === 'supabase' ||
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.DATA_SOURCE !== 'memory'));

if (isSupabaseEnabled) {
  console.log('⚡ [Repositories] Connecting to Supabase PostgreSQL at https://eutzmjxwfxzkwfsegwjx.supabase.co');
} else {
  console.log('💾 [Repositories] Running with in-memory persistence layer');
}

export const userRepository: IUserRepository = isSupabaseEnabled
  ? new SupabaseUserRepository()
  : new InMemoryUserRepository();

export const donorRepository: IDonorRepository = isSupabaseEnabled
  ? new SupabaseDonorRepository()
  : new InMemoryDonorRepository();

export const inventoryRepository: IInventoryRepository = isSupabaseEnabled
  ? new SupabaseInventoryRepository()
  : new InMemoryInventoryRepository();

export const requestRepository: IRequestRepository = isSupabaseEnabled
  ? new SupabaseRequestRepository()
  : new InMemoryRequestRepository();
