import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Returns a Supabase client using the SERVICE ROLE key.
 * This bypasses RLS — only use server-side, never expose to clients.
 */
export declare function getSupabaseAdmin(): SupabaseClient;
/**
 * Creates a Supabase client authenticated as a specific user (via their JWT).
 * This respects RLS policies.
 */
export declare function getSupabaseForUser(userJwt: string): SupabaseClient;
//# sourceMappingURL=client.d.ts.map