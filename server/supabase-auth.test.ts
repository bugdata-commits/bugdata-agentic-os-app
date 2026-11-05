import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { authenticateSupabaseRequest } from "./_core/supabaseAuth";

const envKeys = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"] as const;
let savedEnv: Partial<Record<(typeof envKeys)[number], string | undefined>>;

function requestWithBearer(authorization?: string) {
  return { headers: authorization ? { authorization } : {} } as unknown as Request;
}

beforeEach(() => {
  savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  for (const key of envKeys) delete process.env[key];
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of envKeys) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Supabase request authentication", () => {
  it("validates the bearer token and returns only the mapped app identity", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => Promise.resolve(new Response(JSON.stringify({
      id: "9ff3f299-5335-483e-96c4-01f7b363bf3c",
      aud: "authenticated",
      role: "authenticated",
      email: "owner@example.com",
      user_metadata: { full_name: "BUGDATA Owner" },
      app_metadata: {},
      created_at: "2026-01-01T00:00:00.000Z",
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    vi.stubGlobal("fetch", fetchMock);

    const user = await authenticateSupabaseRequest(requestWithBearer("Bearer valid-token"));

    expect(user).toEqual({
      id: "9ff3f299-5335-483e-96c4-01f7b363bf3c",
      openId: "9ff3f299-5335-483e-96c4-01f7b363bf3c",
      name: "BUGDATA Owner",
      email: "owner@example.com",
      role: "user",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("maadakjelhkbqgkbwxsy.supabase.co/auth/v1/user");
    expect(new Headers(options?.headers).get("authorization")).toBe("Bearer valid-token");
  });

  it("does not call Supabase Auth when no bearer token is present", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => Promise.resolve(new Response(null, { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    const user = await authenticateSupabaseRequest(requestWithBearer());

    expect(user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when Supabase Auth rejects a token", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => Promise.resolve(new Response(JSON.stringify({ code: "bad_jwt", message: "invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })));
    vi.stubGlobal("fetch", fetchMock);

    const user = await authenticateSupabaseRequest(requestWithBearer("Bearer invalid-token"));

    expect(user).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
