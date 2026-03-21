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
import { ArrowLeft, Key, ShieldCheck } from "lucide-react";
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

const MASTER_FILES = [
  "department",
  "supplier",
  "location",
  "product",
  "customer",
  "price-level",
  "publisher",
  "author",
  "book",
  "magazine",
  "book-type",
  "category",
  "sub-category",
  "sub-category-l2",
  "language",
  "bin-card",
];

const TRANSACTIONS = [
  "item-request",
  "pending-item-request",
  "purchase-order",
  "good-receive-note",
  "supplier-return-note",
  "stock-adjustment",
  "transfer-good-note",
  "accept-good-note",
  "transfer-good-return",
  "product-discard",
  "invoice",
  "open-stock",
];

const PAYMENTS = ["advance-payment", "customer-receipt", "payment-voucher"];

const USER_MANAGEMENT = ["user", "role", "permission", "permission assign"];

const SALES_OPERATIONS = ["cashier", "salesman", "manage discount"];

const REPORTS = [
  "pos-sales-summary-report",
  "daily-collection-report",
  "current-stock-report",
];

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

const ACTION_ORDER: Record<string, number> = {
  view: 1,
  create: 2,
  edit: 3,
  print: 4,
  export: 5,
};

function sortPermissions(perms: Permission[]) {
  return [...perms].sort((a, b) => {
    const aParts = a.name.split(" ");
    const bParts = b.name.split(" ");
    const aAction = aParts[0].toLowerCase();
    const bAction = bParts[0].toLowerCase();
    const aEntity = aParts.slice(1).join(" ").toLowerCase();
    const bEntity = bParts.slice(1).join(" ").toLowerCase();

    if (aEntity !== bEntity) {
      return aEntity.localeCompare(bEntity);
    }

    const aScore = ACTION_ORDER[aAction] || 99;
    const bScore = ACTION_ORDER[bAction] || 99;

    if (aScore !== bScore) {
      return aScore - bScore;
    }

    return a.name.localeCompare(b.name);
  });
}

function getGroupKey(name: string): string {
  const trimmed = name.trim().toLowerCase();

  // Handle specific cases first
  if (trimmed.includes("dashboard stats")) return "dashboard stats";
  if (trimmed.includes("permission assign")) return "permission";
  if (trimmed.includes("manage discount")) return "manage discount";
  if (trimmed.includes("process day-end")) return "process day-end";

  const allModules = [
    ...MASTER_FILES,
    ...TRANSACTIONS,
    ...PAYMENTS,
    ...USER_MANAGEMENT,
    ...SALES_OPERATIONS,
    ...REPORTS,
  ].sort((a, b) => b.length - a.length);

  // Check if it's one of our known modules (longest match first)
  for (const m of allModules) {
    if (trimmed.includes(m)) {
      if (m === "book-type") return "book";
      if (m === "sub-category" || m === "sub-category-l2") return "category";
      if (m === "permission assign") return "permission";
      return m;
    }
  }

  const parts = trimmed.split(" ");
  // Usually the last word is the module (e.g., "view location")
  const base = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return base.endsWith("s") ? base.slice(0, -1) : base;
}

function getSuperGroup(module: string): string {
  if (MASTER_FILES.includes(module)) return "Master File";
  if (TRANSACTIONS.includes(module)) return "Transactions";
  if (PAYMENTS.includes(module)) return "Payments";
  if (USER_MANAGEMENT.includes(module)) return "User Management";
  if (SALES_OPERATIONS.includes(module)) return "Sales Operations";
  if (REPORTS.some((r) => module.includes(r))) return "Reports";
  return "System / Other";
}

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
    () => Object.keys(nestedPermissions).sort(),
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
                        <div className="border-b pb-1">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            {sgk}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 ml-1">
                          {moduleKeys.map((mk) => {
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
                          })}
                        </div>
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
