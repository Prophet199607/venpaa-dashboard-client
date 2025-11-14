"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Shield, Plus, MoreVertical, Pencil, Trash2, Key } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RoleDialog from "@/components/model/role-dialog";

interface Role {
  id: number;
  name: string;
}

export default function RolesPage() {
  const router = useRouter();
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
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
        title: "Failed to fetch roles",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!fetched.current) {
      fetchRoles();
      fetched.current = true;
    }
  }, [fetchRoles]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      await api.delete(`/roles/${id}`);

      toast({
        title: "Role deleted",
        description: "Role has been deleted successfully",
        type: "success",
        duration: 3000,
      });
      fetchRoles();
    } catch (err: any) {
      console.error("Failed to delete role:", err);
      toast({
        title: "Failed to delete role",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    }
  };

  // Role columns
  const roleColumns: ColumnDef<Role>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "name",
      header: "Role Name",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const role = row.original;
        const isProtectedRole = role.name.toLowerCase() === "admin";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[180px]">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(`/dashboard/roles/assign-permissions?roleId=${role.id}`);
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Assign Permissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    if (isProtectedRole) return;
                    setEditingRole(role);
                    setOpenEdit(true);
                  }}
                  disabled={isProtectedRole}
                  className={isProtectedRole ? "opacity-50 cursor-not-allowed" : ""}
                  title={isProtectedRole ? "Admin role cannot be edited" : undefined}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleDelete(role.id)}
                  className={`text-red-600 focus:text-red-600 ${
                    isProtectedRole ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isProtectedRole}
                  title={
                    isProtectedRole ? "Admin role cannot be deleted" : undefined
                  }
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Roles</div>
          <Button type="button" className="flex items-center gap-2" onClick={() => setOpenAdd(true)}>
            <Plus className="h-4 w-4" />
            Add New Role
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={roleColumns} data={roles} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>

      <RoleDialog open={openAdd} onOpenChange={setOpenAdd} onSuccess={fetchRoles} mode="create" />
      <RoleDialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) {
            setEditingRole(null);
          }
        }}
        onSuccess={() => {
          setOpenEdit(false);
          setEditingRole(null);
          fetchRoles();
        }}
        role={editingRole}
        mode="edit"
      />
    </div>
  );
}
