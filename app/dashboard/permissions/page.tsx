"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Key, Plus, MoreVertical, Pencil, Trash2, User, Shield } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PermissionDialog from "@/components/model/permission-dialog";

interface Permission {
  id: number;
  name: string;
}

export default function PermissionsPage() {
  const router = useRouter();
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [openAdd, setOpenAdd] = useState(false);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
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
        title: "Failed to fetch permissions",
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
      fetchPermissions();
      fetched.current = true;
    }
  }, [fetchPermissions]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this permission?")) {
      return;
    }

    try {
      await api.delete(`/permissions/${id}`);

      toast({
        title: "Permission deleted",
        description: "Permission has been deleted successfully",
        type: "success",
        duration: 3000,
      });
      fetchPermissions();
    } catch (err: any) {
      console.error("Failed to delete permission:", err);
      toast({
        title: "Failed to delete permission",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    }
  };

  // Permission columns
  const permissionColumns: ColumnDef<Permission>[] = [
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
      header: "Permission Name",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const permission = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(`/dashboard/users/assign-permissions?permissionId=${permission.id}`);
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Assign to User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(`/dashboard/roles/assign-permissions?permissionId=${permission.id}`);
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Assign to Role
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    // TODO: Implement edit permission functionality
                    toast({
                      title: "Edit Permission",
                      description: `Editing permission: ${permission.name}`,
                      type: "info",
                    });
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleDelete(permission.id)}
                  className="text-red-600 focus:text-red-600"
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
          <div className="text-lg font-semibold">Permissions</div>
          <Button type="button" className="flex items-center gap-2" onClick={() => setOpenAdd(true)}>
            <Plus className="h-4 w-4" />
            Add New Permission
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={permissionColumns} data={permissions} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>

      <PermissionDialog open={openAdd} onOpenChange={setOpenAdd} onSuccess={fetchPermissions} />
    </div>
  );
}
