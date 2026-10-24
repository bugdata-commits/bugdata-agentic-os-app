import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import type { Request } from "express";
import type { AppUser } from "@shared/types";

function getConfig() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_KEY ?? "";
  if (!url || !key) return null;
  return { url, key };
}

export function getSupabaseAccessToken(req: Request) {
  const header = req.headers.authorization;
  return typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : null;
}

function mapUser(user: SupabaseUser): AppUser {
  const metadata = user.user_metadata ?? {};
  const name = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : null;
  return {
    id: user.id,
    openId: user.id,
    name,
    email: user.email ?? null,
    role: user.app_metadata?.role === "admin" ? "admin" : "user",
  };
}

export async function authenticateSupabaseRequest(req: Request): Promise<AppUser | null> {
  const config = getConfig();
  const token = getSupabaseAccessToken(req);
  if (!config || !token) return null;

  const client = createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return mapUser(data.user);
}

export function supabaseAuthConfigured() {
  return Boolean(getConfig());
}
