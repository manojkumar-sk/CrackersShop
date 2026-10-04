import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with the service-role key.
 * Server-only. Never import this from a client component, browser helper,
 * or storefront module. The key bypasses RLS, so call it only after the
 * signed-in user has been confirmed as a platform admin.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
