"use client";

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useRef,
  useMemo,
} from "react";
import { api } from "@/utils/api";
import { ArrowLeft, Shield, Key } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Role {
  id: number;
  name: string;
}

interface Permission {
  id: number;
  name: string;
}

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function getGroupKey(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const parts = trimmed.split(" ");
  // If the permission is like "create book" => resource is the last word
  // If it's a standalone like "books" => resource is the word itself
  const base = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  // Normalize plural (very simple heuristic for words ending with 's')
  return base.endsWith("s") ? base.slice(0, -1) : base;
}

export type GroupedPermissions = Record<string, Permission[]>;

function AssignPermissionsToRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  );

  const roleIdFromUrl = searchParams.get("roleId");
  const permissionIdFromUrl = searchParams.get("permissionId");

  const groupedPermissions: GroupedPermissions = useMemo(() => {
    const groups: GroupedPermissions = {};
    permissions.forEach((p) => {
      const key = getGroupKey(p.name);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    // Sort each group by name asc then id
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    });
    return groups;
  }, [permissions]);

  const fetchRoles = useCallback(async () => {
    try {
      setFetching(true);
      const response = await api.get("/roles");
      const res = response.data;

      if (Array.isArray(res)) {
        setRoles(res);
      } else if (res.data && Array.isArray(res.data)) {
        setRoles(res.data);
      } else if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch roles:", err);
      toast({
        title: "Failed to load roles",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const fetchPermissions = useCallback(async () => {
    try {
      setFetching(true);
      const response = await api.get("/permissions");
      const res = response.data;

      if (Array.isArray(res)) {
        setPermissions(res);
      } else if (res.data && Array.isArray(res.data)) {
        setPermissions(res.data);
      } else if (res.success && Array.isArray(res.data)) {
        setPermissions(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch permissions:", err);
      toast({
        title: "Failed to load permissions",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const fetchRolePermissions = useCallback(async (roleId: string) => {
    if (!roleId) return;

    try {
      setFetching(true);
      const response = await api.get(`/roles/${roleId}/permissions`);

      if (response.data.success) {
        const rolePermissions = response.data.data.map((p: Permission) => p.id);
        setSelectedPermissionIds(rolePermissions);
      }
    } catch (err: any) {
      console.error("Failed to fetch role permissions:", err);
      setSelectedPermissionIds([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (roleIdFromUrl) {
      setSelectedRoleId(roleIdFromUrl);
      fetchRolePermissions(roleIdFromUrl);
    }
  }, [roleIdFromUrl, fetchRolePermissions]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    } else {
      setSelectedPermissionIds([]);
    }
  }, [selectedRoleId, fetchRolePermissions]);

  useEffect(() => {
    if (permissionIdFromUrl && permissions.length > 0) {
      const permissionId = parseInt(permissionIdFromUrl);
      if (!selectedPermissionIds.includes(permissionId)) {
        setSelectedPermissionIds((prev) => [...prev, permissionId]);
      }
    }
  }, [permissionIdFromUrl, permissions, selectedPermissionIds]);

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPermissionIds.length === permissions.length) {
      setSelectedPermissionIds([]);
    } else {
      setSelectedPermissionIds(permissions.map((p) => p.id));
    }
  };

  const handleSelectAllInGroup = (groupKey: string) => {
    const ids = (groupedPermissions[groupKey] || []).map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !ids.includes(id))
      );
    } else {
      setSelectedPermissionIds((prev) =>
        Array.from(new Set([...prev, ...ids]))
      );
    }
  };

  const onSubmit = async () => {
    if (!selectedRoleId) {
      toast({
        title: "Role required",
        description: "Please select a role first",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/roles/${selectedRoleId}/permissions`, {
        permission_ids: selectedPermissionIds,
      });

      if (response.data.success) {
        toast({
          title: "Permissions assigned",
          description: "Permissions have been assigned to role successfully",
          type: "success",
          duration: 3000,
        });

        router.push("/dashboard/roles");
      }
    } catch (error: any) {
      console.error("Failed to assign permissions:", error);
      toast({
        title: "Operation failed",
        description: error.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const groupKeys = useMemo(
    () => Object.keys(groupedPermissions).sort(),
    [groupedPermissions]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">
              Assign Permissions to Role
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Select Role *</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                  disabled={fetching}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="--Select Role--" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleId && (
                <div className="flex items-end">
                  <Badge variant="secondary" className="text-sm">
                    {selectedPermissionIds.length} permission(s) selected
                  </Badge>
                </div>
              )}
            </div>

            {selectedRoleId && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedPermissionIds.length === permissions.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>

                <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto space-y-6">
                  {groupKeys.map((gk) => {
                    const group = groupedPermissions[gk];
                    const groupTitle = toTitle(gk);
                    const ids = group.map((p) => p.id);
                    const allInGroup = ids.every((id) =>
                      selectedPermissionIds.includes(id)
                    );
                    const someInGroup =
                      !allInGroup &&
                      ids.some((id) => selectedPermissionIds.includes(id));
                    return (
                      <div key={gk} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label className="font-semibold">
                              {groupTitle}
                            </Label>
                            <Badge variant="secondary" className="text-xs">
                              {group.length}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAllInGroup(gk)}
                          >
                            {allInGroup ? "Deselect Group" : "Select Group"}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={`permission-${permission.id}`}
                                checked={selectedPermissionIds.includes(
                                  permission.id
                                )}
                                onCheckedChange={() =>
                                  togglePermission(permission.id)
                                }
                              />
                              <Label
                                htmlFor={`permission-${permission.id}`}
                                className="flex items-center gap-2 cursor-pointer flex-1"
                              >
                                <Key className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  [{permission.id}] {permission.name}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                        {someInGroup && !allInGroup ? (
                          <div className="text-xs text-muted-foreground">
                            Some selected
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={loading || !selectedRoleId}
                className="min-w-24"
              >
                {loading ? (
                  <>
                    <Loader />
                    Assigning...
                  </>
                ) : (
                  "Assign Permissions"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        {fetching || loading ? <Loader /> : null}
      </Card>
    </div>
  );
}

export default function AssignPermissionsToRole() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssignPermissionsToRoleContent />
    </Suspense>
  );
}
