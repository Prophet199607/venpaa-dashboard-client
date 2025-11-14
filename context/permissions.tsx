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
};

const PermissionsContext = createContext<PermissionsContextValue>({
	loading: true,
	permissions: [],
	roles: [],
	error: null,
	hasPermission: () => false,
	hasRole: () => false,
	refresh: async () => {},
});

type MeResponse = {
	user?: Record<string, unknown>;
	roles?: string[];
	permissions?: string[];
};

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
	const [loading, setLoading] = useState(true);
	const [permissions, setPermissions] = useState<string[]>([]);
	const [roles, setRoles] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const fetchPermissions = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await api.get<MeResponse>("/me");
			const perms = response.data?.permissions ?? [];
			const roleNames = response.data?.roles ?? [];
			setPermissions(Array.isArray(perms) ? perms : []);
			setRoles(Array.isArray(roleNames) ? roleNames : []);
		} catch (err) {
			console.error("Failed to load permissions", err);
			setPermissions([]);
			setRoles([]);
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
			if (!permission) return false;
			return permissions.includes(permission);
		};
		const hasRole = (role: string) => {
			if (!role) return false;
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
		};
	}, [loading, permissions, roles, error, fetchPermissions]);

	return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
	return useContext(PermissionsContext);
}




