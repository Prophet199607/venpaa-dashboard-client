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
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface RoleType {
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

function AssignPermissionsToRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    [],
  );

  const roleIdFromUrl = searchParams.get("roleId");

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
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchRolePermissions = useCallback(async (roleId: string) => {
    if (!roleId) return;

    try {
      setFetching(true);
      const response = await api.get(`/roles/${roleId}/permissions`);

      if (response.data.success) {
        const payload: Permission[] = response.data.data;
        if (Array.isArray(payload)) {
          setSelectedPermissionIds(payload.map((p) => p.id));
        }
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

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleSelectAll = () => {
    if (selectedPermissionIds.length === permissions.length) {
      setSelectedPermissionIds([]);
    } else {
      setSelectedPermissionIds(permissions.map((p) => p.id));
    }
  };

  const handleSelectAllInModule = (modulePermissions: Permission[]) => {
    const ids = modulePermissions.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !ids.includes(id)),
      );
    } else {
      setSelectedPermissionIds((prev) => [...new Set([...prev, ...ids])]);
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

        router.push("/dashboard/roles/assign-permissions");
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

  const superGroupKeys = useMemo(
    () => Object.keys(nestedPermissions).sort(),
    [nestedPermissions],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
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
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-4">
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
                            const ids = modulePerms.map((p) => p.id);
                            const allInModuleSelected = ids.every((id) =>
                              selectedPermissionIds.includes(id),
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
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={() =>
                                      handleSelectAllInModule(modulePerms)
                                    }
                                  >
                                    {allInModuleSelected
                                      ? "Deselect All"
                                      : "Select All"}
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-1 ml-1">
                                  {modulePerms.map((permission) => (
                                    <div
                                      key={permission.id}
                                      className="flex items-center space-x-2 p-1 rounded-md transition-all border border-transparent hover:bg-muted/40 hover:border-muted"
                                    >
                                      <Checkbox
                                        id={`permission-${permission.id}`}
                                        checked={selectedPermissionIds.includes(
                                          permission.id,
                                        )}
                                        onCheckedChange={() =>
                                          togglePermission(permission.id)
                                        }
                                        className="h-4 w-4"
                                      />
                                      <Label
                                        htmlFor={`permission-${permission.id}`}
                                        className="cursor-pointer flex-1 text-[11px] font-medium leading-tight"
                                      >
                                        {toTitle(permission.name)}
                                      </Label>
                                    </div>
                                  ))}
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
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
