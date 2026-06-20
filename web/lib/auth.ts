import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton browser client — safe to call multiple times
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}

export type SupabaseClient = ReturnType<typeof createClient>;