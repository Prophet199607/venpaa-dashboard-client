"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/utils/api";

type PermissionsContextValue = {
  loading: boolean;
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refresh: () => Promise<void>;
  error: string | null;
  user: any;
};

const PermissionsContext = createContext<PermissionsContextValue>({
  loading: true,
  permissions: [],
  roles: [],
  error: null,
  hasPermission: () => false,
  hasRole: () => false,
  refresh: async () => {},
  user: null,
});

type MeResponse = {
  user?: Record<string, unknown>;
  roles?: string[];
  permissions?: string[];
};

export function PermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<MeResponse>("/me");
      const perms = response.data?.permissions ?? [];
      const roleNames = response.data?.roles ?? [];
      const userData = response.data?.user ?? null;
      setPermissions(Array.isArray(perms) ? perms : []);
      setRoles(Array.isArray(roleNames) ? roleNames : []);
      setUser(userData);
    } catch (err) {
      console.error("Failed to load permissions", err);
      setPermissions([]);
      setRoles([]);
      setUser(null);
      setError("Unable to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await fetchPermissions();
    })();
    return () => {
      active = false;
    };
  }, [fetchPermissions]);

  const value = useMemo<PermissionsContextValue>(() => {
    const hasPermission = (permission: string) => {
      if (roles.includes("super-admin")) return true;
      if (!permission) return true;
      return permissions.includes(permission);
    };
    const hasRole = (role: string) => {
      if (roles.includes("super-admin")) return true;
      if (!role) return true;
      return roles.includes(role);
    };

    return {
      loading,
      permissions,
      roles,
      error,
      hasPermission,
      hasRole,
      refresh: fetchPermissions,
      user,
    };
  }, [loading, permissions, roles, error, fetchPermissions, user]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
