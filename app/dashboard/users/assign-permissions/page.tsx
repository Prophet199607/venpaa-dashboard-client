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
import { ArrowLeft, User, Key } from "lucide-react";
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

interface UserType {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

interface Permission {
  id: number;
  name: string;
}

interface UserPermissionPayload {
  permissions?: Array<
    Permission & {
      source?: "direct" | "role";
      roles?: string[];
    }
  >;
  direct_permission_ids?: number[];
  inherited_permission_ids?: number[];
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
  const base = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return base.endsWith("s") ? base.slice(0, -1) : base;
}

export type GroupedPermissions = Record<string, Permission[]>;

function AssignPermissionsToUserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  );
  const [inheritedPermissionIds, setInheritedPermissionIds] = useState<
    number[]
  >([]);

  const userIdFromUrl = searchParams.get("userId");
  const permissionIdFromUrl = searchParams.get("permissionId");

  const groupedPermissions: GroupedPermissions = useMemo(() => {
    const groups: GroupedPermissions = {};
    permissions.forEach((p) => {
      const key = getGroupKey(p.name);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    });
    return groups;
  }, [permissions]);

  const fetchUsers = useCallback(async () => {
    try {
      setFetching(true);
      const response = await api.get("/users");

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      toast({
        title: "Failed to load users",
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

  const fetchUserPermissions = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      setFetching(true);
      const response = await api.get(`/users/${userId}/permissions`);

      if (response.data.success) {
        const payload: UserPermissionPayload | Permission[] =
          response.data.data;

        if (Array.isArray(payload)) {
          const userPermissions = payload.map((p: Permission) => p.id);
          setSelectedPermissionIds(userPermissions);
          setInheritedPermissionIds([]);
        } else {
          setSelectedPermissionIds(payload.direct_permission_ids ?? []);
          setInheritedPermissionIds(payload.inherited_permission_ids ?? []);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch user permissions:", err);
      setSelectedPermissionIds([]);
      setInheritedPermissionIds([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchUsers();
    fetchPermissions();
  }, [fetchUsers, fetchPermissions]);

  useEffect(() => {
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
      fetchUserPermissions(userIdFromUrl);
    }
  }, [userIdFromUrl, fetchUserPermissions]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    } else {
      setSelectedPermissionIds([]);
      setInheritedPermissionIds([]);
    }
  }, [selectedUserId, fetchUserPermissions]);

  const isInheritedPermission = useCallback(
    (permissionId: number) => inheritedPermissionIds.includes(permissionId),
    [inheritedPermissionIds]
  );

  useEffect(() => {
    if (!permissionIdFromUrl || permissions.length === 0) {
      return;
    }

    const permissionId = Number(permissionIdFromUrl);
    if (Number.isNaN(permissionId)) {
      return;
    }

    if (!permissions.some((permission) => permission.id === permissionId)) {
      return;
    }

    if (isInheritedPermission(permissionId)) {
      return;
    }

    setSelectedPermissionIds((prev) => {
      if (prev.includes(permissionId)) {
        return prev;
      }
      return [...prev, permissionId];
    });
  }, [permissionIdFromUrl, permissions, isInheritedPermission]);

  const togglePermission = (permissionId: number) => {
    if (isInheritedPermission(permissionId)) {
      return;
    }

    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    const assignableIds = permissions
      .map((p) => p.id)
      .filter((id) => !isInheritedPermission(id));

    const allAssignableSelected = assignableIds.every((id) =>
      selectedPermissionIds.includes(id)
    );

    setSelectedPermissionIds(allAssignableSelected ? [] : assignableIds);
  };

  const handleSelectAllInGroup = (groupKey: string) => {
    const ids = (groupedPermissions[groupKey] || [])
      .map((p) => p.id)
      .filter((id) => !isInheritedPermission(id));

    if (ids.length === 0) {
      return;
    }

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
    if (!selectedUserId) {
      toast({
        title: "User required",
        description: "Please select a user first",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/users/${selectedUserId}/permissions`, {
        permission_ids: selectedPermissionIds,
      });

      if (response.data.success) {
        toast({
          title: "Permissions assigned",
          description: "Permissions have been assigned to user successfully",
          type: "success",
          duration: 3000,
        });

        router.push("/dashboard/users");
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

  const selectedUser = users.find((u) => u.id.toString() === selectedUserId);
  const groupKeys = useMemo(
    () => Object.keys(groupedPermissions).sort(),
    [groupedPermissions]
  );
  const totalSelectedCount =
    selectedPermissionIds.length + inheritedPermissionIds.length;
  const assignablePermissionCount = permissions.filter(
    (permission) => !isInheritedPermission(permission.id)
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <div className="text-lg font-semibold">
              Assign Permissions to User
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
                <Label>Select User *</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={fetching}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="--Select User--" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="space-y-2">
                  <Label>Current Roles</Label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedUser.roles && selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role, index) => (
                        <Badge key={index} variant="secondary">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No roles assigned
                      </span>
                    )}
                  </div>
                </div>
              )}

              {selectedUserId && (
                <div className="flex items-end md:col-span-2">
                  <Badge variant="secondary" className="text-sm">
                    {totalSelectedCount} permission(s) selected
                  </Badge>
                </div>
              )}
            </div>

            {selectedUserId && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={assignablePermissionCount === 0}
                  >
                    {assignablePermissionCount === 0
                      ? "Select All"
                      : selectedPermissionIds.length ===
                        assignablePermissionCount
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                {inheritedPermissionIds.length > 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Permissions inherited from roles are locked and cannot be
                    modified here.
                  </div>
                ) : null}

                <div className="border rounded-lg p-4 max-h=[600px] overflow-y-auto space-y-6">
                  {groupKeys.map((gk) => {
                    const group = groupedPermissions[gk];
                    const groupTitle = toTitle(gk);
                    const ids = group.map((p) => p.id);
                    const allInGroup = ids.every(
                      (id) =>
                        selectedPermissionIds.includes(id) ||
                        isInheritedPermission(id)
                    );
                    const someInGroup =
                      !allInGroup &&
                      ids.some(
                        (id) =>
                          selectedPermissionIds.includes(id) ||
                          isInheritedPermission(id)
                      );
                    const assignableIdsInGroup = ids.filter(
                      (id) => !isInheritedPermission(id)
                    );
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
                            disabled={assignableIdsInGroup.length === 0}
                          >
                            {assignableIdsInGroup.length === 0
                              ? "Select Group"
                              : allInGroup
                              ? "Deselect Group"
                              : "Select Group"}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.map((permission) => {
                            const inherited = isInheritedPermission(
                              permission.id
                            );
                            const checked =
                              inherited ||
                              selectedPermissionIds.includes(permission.id);

                            return (
                              <div
                                key={permission.id}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={checked}
                                  onCheckedChange={() =>
                                    togglePermission(permission.id)
                                  }
                                  disabled={inherited}
                                />
                                <Label
                                  htmlFor={`permission-${permission.id}`}
                                  className={`flex items-center gap-2 flex-1 ${
                                    inherited
                                      ? "cursor-not-allowed text-muted-foreground"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  {/* <Key className="h-4 w-4 text-muted-foreground" /> */}
                                  <span className="text-sm">
                                    [{permission.id}] {permission.name}
                                  </span>
                                  {inherited ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] uppercase"
                                    >
                                      Inherited
                                    </Badge>
                                  ) : null}
                                </Label>
                              </div>
                            );
                          })}
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
                disabled={loading || !selectedUserId}
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

export default function AssignPermissionsToUser() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssignPermissionsToUserContent />
    </Suspense>
  );
}
