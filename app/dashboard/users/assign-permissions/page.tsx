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
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Key,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

import {
  FLAT_SUPER_GROUPS,
  SUPER_GROUP_ORDER,
  getGroupKey,
  getSuperGroup,
  sortPermissions,
  toTitle,
} from "@/lib/permission-groups";

type NestedGroupedPermissions = Record<string, Record<string, Permission[]>>;

function AssignPermissionsToUserContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    [],
  );
  const [inheritedPermissionIds, setInheritedPermissionIds] = useState<
    number[]
  >([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const userIdFromUrl = searchParams.get("userId");

  const nestedPermissions = useMemo(() => {
    const nested: NestedGroupedPermissions = {};
    permissions.forEach((p) => {
      const moduleName = getGroupKey(p.name);
      const superGroup = getSuperGroup(moduleName);

      if (!nested[superGroup]) nested[superGroup] = {};
      if (!nested[superGroup][moduleName]) nested[superGroup][moduleName] = [];

      nested[superGroup][moduleName].push(p);
    });

    // Sort the permissions in each module
    Object.keys(nested).forEach((sgk) => {
      Object.keys(nested[sgk]).forEach((mk) => {
        nested[sgk][mk] = sortPermissions(nested[sgk][mk]);
      });
    });

    return nested;
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
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      setFetching(true);
      const response = await api.get("/permissions");
      const res = response.data;
      if (res.success && Array.isArray(res.data)) {
        setPermissions(res.data);
      } else if (Array.isArray(res)) {
        setPermissions(res);
      }
    } catch (err: any) {
      console.error("Failed to fetch permissions:", err);
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchUserPermissions = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      setFetching(true);
      const response = await api.get(`/users/${userId}/permissions`);
      if (response.data.success) {
        const payload: UserPermissionPayload = response.data.data;
        setSelectedPermissionIds(payload.direct_permission_ids ?? []);
        setInheritedPermissionIds(payload.inherited_permission_ids ?? []);
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
    }
  }, [userIdFromUrl]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    } else {
      setSelectedPermissionIds([]);
      setInheritedPermissionIds([]);
    }
  }, [selectedUserId, fetchUserPermissions]);

  const isInherited = useCallback(
    (id: number) => inheritedPermissionIds.includes(id),
    [inheritedPermissionIds],
  );

  const togglePermission = (id: number) => {
    if (isInherited(id)) return;
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleSelectAll = () => {
    const assignableIds = permissions
      .filter((p) => !isInherited(p.id))
      .map((p) => p.id);

    if (selectedPermissionIds.length === assignableIds.length) {
      setSelectedPermissionIds([]);
    } else {
      setSelectedPermissionIds(assignableIds);
    }
  };

  const handleSelectAllInModule = (modulePermissions: Permission[]) => {
    const assignable = modulePermissions.filter((p) => !isInherited(p.id));
    const assignableIds = assignable.map((p) => p.id);

    const allInModuleSelected = assignableIds.every((id) =>
      selectedPermissionIds.includes(id),
    );

    if (allInModuleSelected) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !assignableIds.includes(id)),
      );
    } else {
      setSelectedPermissionIds((prev) => [
        ...new Set([...prev, ...assignableIds]),
      ]);
    }
  };

  const onSubmit = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const response = await api.post(`/users/${selectedUserId}/permissions`, {
        permission_ids: selectedPermissionIds,
      });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "User permissions updated successfully",
          type: "success",
        });
        router.push(
          "/dashboard/users/assign-permissions?userId=" + selectedUserId,
        );
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id.toString() === selectedUserId);
  const superGroupKeys = useMemo(
    () =>
      Object.keys(nestedPermissions).sort((a, b) => {
        const aIndex = SUPER_GROUP_ORDER.indexOf(a);
        const bIndex = SUPER_GROUP_ORDER.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      }),
    [nestedPermissions],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <div className="text-lg font-semibold">
              Assign Permissions to User
            </div>
          </div>
          <Button
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
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {selectedUser.roles?.map((r, i) => (
                      <Badge key={i} variant="secondary">
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        {r}
                      </Badge>
                    )) || (
                      <span className="text-sm text-muted-foreground">
                        No roles
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedUserId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">
                      Permissions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {selectedPermissionIds.length} direct +{" "}
                      {inheritedPermissionIds.length} inherited
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All Assignable
                  </Button>
                </div>

                <div className="border rounded-lg p-3 max-h-[700px] overflow-y-auto space-y-6">
                  {superGroupKeys.map((sgk) => {
                    const modules = nestedPermissions[sgk];
                    const moduleKeys = Object.keys(modules).sort();

                    return (
                      <div key={sgk} className="space-y-3">
                        <div
                          className="border-b pb-1 flex items-center justify-between cursor-pointer group"
                          onClick={() => toggleGroup(sgk)}
                        >
                          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            {sgk}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(sgk);
                            }}
                          >
                            {expandedGroups[sgk] ? (
                              <ChevronUp className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        </div>

                        {expandedGroups[sgk] && (
                          <div className="grid grid-cols-1 gap-4 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {FLAT_SUPER_GROUPS.includes(sgk) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-1 ml-1">
                                {Object.values(modules)
                                  .flat()
                                  .map((p) => {
                                    const inherited = isInherited(p.id);
                                    const active =
                                      inherited ||
                                      selectedPermissionIds.includes(p.id);
                                    return (
                                      <div
                                        key={p.id}
                                        className={`flex items-center space-x-2 p-1 rounded-md transition-all border border-transparent ${
                                          inherited
                                            ? "bg-muted/10 opacity-70"
                                            : "hover:bg-muted/40 hover:border-muted"
                                        }`}
                                      >
                                        <Checkbox
                                          id={`p-${p.id}`}
                                          checked={active}
                                          onCheckedChange={() =>
                                            togglePermission(p.id)
                                          }
                                          disabled={inherited}
                                          className="h-4 w-4"
                                        />
                                        <Label
                                          htmlFor={`p-${p.id}`}
                                          className={`flex-1 text-[11px] cursor-pointer leading-tight ${
                                            inherited
                                              ? "text-muted-foreground italic"
                                              : "font-medium"
                                          }`}
                                        >
                                          {toTitle(p.name)}
                                          {inherited && (
                                            <Badge
                                              variant="outline"
                                              className="ml-2 scale-[0.7] origin-left bg-blue-500/10 text-blue-600 border-blue-200"
                                            >
                                              Inherited
                                            </Badge>
                                          )}
                                        </Label>
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              moduleKeys.map((mk) => {
                                const modulePerms = modules[mk];
                                const moduleTitle = toTitle(mk);
                                const assignable = modulePerms.filter(
                                  (p) => !isInherited(p.id),
                                );
                                const allSelected =
                                  assignable.length > 0 &&
                                  assignable.every((p) =>
                                    selectedPermissionIds.includes(p.id),
                                  );

                                return (
                                  <div key={mk} className="space-y-2">
                                    <div className="flex items-center justify-between bg-muted/20 p-1.5 px-2 rounded-md border border-muted">
                                      <div className="flex items-center gap-2">
                                        <Label className="font-semibold text-xs">
                                          {moduleTitle}
                                        </Label>
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] h-4"
                                        >
                                          {modulePerms.length}
                                        </Badge>
                                      </div>
                                      {assignable.length > 0 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-[10px] px-2 hover:bg-primary/10 hover:text-primary transition-colors"
                                          onClick={() =>
                                            handleSelectAllInModule(modulePerms)
                                          }
                                        >
                                          {allSelected
                                            ? "Deselect All"
                                            : "Select All"}
                                        </Button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-1 ml-1">
                                      {modulePerms.map((p) => {
                                        const inherited = isInherited(p.id);
                                        const active =
                                          inherited ||
                                          selectedPermissionIds.includes(p.id);
                                        return (
                                          <div
                                            key={p.id}
                                            className={`flex items-center space-x-2 p-1 rounded-md transition-all border border-transparent ${
                                              inherited
                                                ? "bg-muted/10 opacity-70"
                                                : "hover:bg-muted/40 hover:border-muted"
                                            }`}
                                          >
                                            <Checkbox
                                              id={`p-${p.id}`}
                                              checked={active}
                                              onCheckedChange={() =>
                                                togglePermission(p.id)
                                              }
                                              disabled={inherited}
                                              className="h-4 w-4"
                                            />
                                            <Label
                                              htmlFor={`p-${p.id}`}
                                              className={`flex-1 text-[11px] cursor-pointer leading-tight ${
                                                inherited
                                                  ? "text-muted-foreground italic"
                                                  : "font-medium"
                                              }`}
                                            >
                                              {toTitle(p.name)}
                                              {inherited && (
                                                <Badge
                                                  variant="outline"
                                                  className="ml-2 scale-[0.7] origin-left bg-blue-500/10 text-blue-600 border-blue-200"
                                                >
                                                  Inherited
                                                </Badge>
                                              )}
                                            </Label>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={loading || !selectedUserId}
                className="min-w-[140px]"
              >
                {loading ? <Loader /> : "Save Permissions"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {fetching && <Loader />}
    </div>
  );
}

export default function AssignPermissionsToUser() {
  return (
    <Suspense fallback={<Loader />}>
      <AssignPermissionsToUserContent />
    </Suspense>
  );
}
