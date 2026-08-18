"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthState = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  verified: boolean;
};

export function useAuthState(): AuthState & { refresh: () => Promise<void> } {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    if (!configured) {
      setUser(null);
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getUser();
    setUser(data.user || null);
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refresh();
    }, 0);
    if (!configured) return () => window.clearTimeout(initialRefresh);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => {
      window.clearTimeout(initialRefresh);
      data.subscription.unsubscribe();
    };
  }, [configured, refresh]);

  return {
    configured,
    loading,
    user,
    verified: Boolean(user?.email_confirmed_at),
    refresh,
  };
}

export function confirmationRedirect(locale: string, nextPath?: string) {
  if (typeof window === "undefined") return undefined;
  const url = new URL(`/${locale}/auth/confirmed`, window.location.origin);
  if (nextPath?.startsWith(`/${locale}/`)) url.searchParams.set("next", nextPath);
  return url.toString();
}
