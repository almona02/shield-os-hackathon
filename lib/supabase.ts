import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe anon client for the append-only ledger.
 * UPDATE/DELETE are blocked by Postgres trigger regardless of key.
 */
export function createShieldSupabase(): SupabaseClient | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  // Prefer server-only keys on API routes; NEXT_PUBLIC_* kept for local demos.
  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
