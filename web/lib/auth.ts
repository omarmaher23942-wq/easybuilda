import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getUser() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function getSession() {
  const sb = createClient();
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

export async function signOut() {
  const sb = createClient();
  await sb.auth.signOut();
  window.location.href = "/auth/login";
}