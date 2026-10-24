import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { AppUser } from "@shared/types";
import { authenticateSupabaseRequest, getSupabaseAccessToken } from "./supabaseAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AppUser | null;
  supabaseAccessToken: string | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: AppUser | null = null;
  try {
    user = await authenticateSupabaseRequest(opts.req);
  } catch (error) {
    console.error("[Auth] Supabase verification failed:", error);
  }
  return { req: opts.req, res: opts.res, user, supabaseAccessToken: getSupabaseAccessToken(opts.req) };
}
