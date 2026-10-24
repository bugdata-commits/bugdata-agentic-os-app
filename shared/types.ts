/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type AppUser = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};
