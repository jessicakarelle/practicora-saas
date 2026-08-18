"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthState } from "@/lib/auth";
import {
  resolveWorkspaceContext,
  setLastWorkspace,
  type PracticoraWorkspace,
  type WorkspaceContext,
} from "@/lib/organization";

const emptyContext: WorkspaceContext = {
  profile: null,
  workspaces: [],
  recommendedWorkspaceId: "personal",
  platform: {
    membershipId: "",
    status: "revoked",
    roles: [],
    permissions: [],
    accountStatus: "active",
  },
};

type WorkspaceContextValue = {
  loading: boolean;
  context: WorkspaceContext;
  activeWorkspace: PracticoraWorkspace | null;
  refresh: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasPlatformPermission: (permission: string) => boolean;
  isPlatformMember: boolean;
};

const Context = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ locale, children }: { locale: string; children: ReactNode }) {
  const auth = useAuthState();
  const [context, setContext] = useState<WorkspaceContext>(emptyContext);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("personal");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await resolveWorkspaceContext(locale);
    setContext(next);
    const stored = typeof window !== "undefined" ? localStorage.getItem("practicora:active-workspace") : null;
    const selected = next.workspaces.some((workspace) => workspace.id === stored)
      ? stored!
      : next.recommendedWorkspaceId;
    setActiveWorkspaceId(selected);
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    if (auth.loading) return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [auth.loading, auth.user?.id, refresh]);

  const activeWorkspace = useMemo(
    () => context.workspaces.find((workspace) => workspace.id === activeWorkspaceId) || context.workspaces[0] || null,
    [activeWorkspaceId, context.workspaces],
  );

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const workspace = context.workspaces.find((item) => item.id === workspaceId);
      if (!workspace) return;
      setActiveWorkspaceId(workspace.id);
      await setLastWorkspace(workspace);
    },
    [context.workspaces],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      loading,
      context,
      activeWorkspace,
      refresh,
      switchWorkspace,
      hasPermission: (permission) =>
        activeWorkspace?.kind === "personal" || Boolean(activeWorkspace?.permissions.includes(permission)),
      hasPlatformPermission: (permission) => context.platform.permissions.includes(permission),
      isPlatformMember: context.platform.status === "active" && context.platform.roles.length > 0,
    }),
    [activeWorkspace, context, loading, refresh, switchWorkspace],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return value;
}
