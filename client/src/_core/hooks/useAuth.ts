import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import type { AuthError, Session } from "@supabase/supabase-js";
import type { AppUser } from "@shared/types";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(_options?: UseAuthOptions) {
  const staticPages = typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
  const utils = trpc.useUtils();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | Error | null>(null);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error);
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
      if (!nextSession) utils.auth.me.setData(undefined, null);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [utils]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(session) && !staticPages,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthError(new Error("Your session expired. Please sign in again."));
      void supabase.auth.signOut();
    };
    window.addEventListener("bugdata:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("bugdata:auth-expired", handleAuthExpired);
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    utils.auth.me.setData(undefined, null);
  }, [utils]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setAuthError(result.error);
      throw result.error;
    }
    setSession(result.data.session);
    return result.data;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setAuthError(null);
    const result = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (result.error) {
      setAuthError(result.error);
      throw result.error;
    }
    setSession(result.data.session);
    return result.data;
  }, []);

  const staticUser: AppUser | null = session?.user ? {
    id: session.user.id,
    openId: session.user.id,
    name: typeof session.user.user_metadata?.full_name === "string" ? session.user.user_metadata.full_name : session.user.email ?? null,
    email: session.user.email ?? null,
    role: session.user.app_metadata?.role === "admin" ? "admin" : "user",
  } : null;

  return useMemo(() => ({
    user: meQuery.data ?? (staticPages ? staticUser : null),
    loading: sessionLoading || (!staticPages && Boolean(session && meQuery.isLoading)),
    error: authError ?? meQuery.error ?? null,
    isAuthenticated: Boolean(session && (staticPages ? staticUser : meQuery.data)),
    signIn,
    signUp,
    logout,
    refresh: () => meQuery.refetch(),
  }), [authError, logout, meQuery.data, meQuery.error, meQuery.isLoading, meQuery.refetch, session, sessionLoading, signIn, signUp, staticPages, staticUser]);
}
