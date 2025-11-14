"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { UserPlus, MoreVertical, Pencil, Eye, Trash2, Key } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import UserDialog from "@/components/model/user-dialog";
import { UserViewDialog } from "@/components/model/user-view-dialog";

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/users");

      if (res.success) {
        setUsers(res.data);
      } else {
        throw new Error(res.message || "Failed to fetch users");
      }
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      toast({
        title: "Failed to fetch users",
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
      fetchUsers();
      fetched.current = true;
    }
  }, [fetchUsers]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const { data: res } = await api.delete(`/users/${id}`);

      if (res.success) {
        toast({
          title: "User deleted",
          description: "User has been deleted successfully",
          type: "success",
          duration: 3000,
        });
        fetchUsers();
      }
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      toast({
        title: "Failed to delete user",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    }
  };

  // User columns
  const userColumns: ColumnDef<User>[] = [
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
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "roles",
      header: "Role",
      cell: ({ row }) => {
        const roles = row.original.roles;
        return (
          <div className="flex gap-1 flex-wrap">
            {roles && roles.length > 0 ? (
              roles.map((role, index) => (
                <Badge key={index} variant="secondary">
                  {role}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No role</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const user = row.original;
        const isProtectedUser =
          user.roles?.some((role) => role.toLowerCase() === "admin") ?? false;

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
                    router.push(`/dashboard/users/assign-permissions?userId=${user.id}`);
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Assign Permissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setViewingUser(user);
                    setOpenView(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditingUser(user);
                    setOpenEdit(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleDelete(user.id)}
                  className={`text-red-600 focus:text-red-600 ${
                    isProtectedUser ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isProtectedUser}
                  title={
                    isProtectedUser
                      ? "Admin user cannot be deleted"
                      : undefined
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
          <div className="text-lg font-semibold">Users</div>
          <Button type="button" className="flex items-center gap-2" onClick={() => setOpenAdd(true)}>
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={userColumns} data={users} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>

      <UserDialog open={openAdd} onOpenChange={setOpenAdd} onSuccess={fetchUsers} mode="create" />
      <UserDialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSuccess={() => {
          setOpenEdit(false);
          setEditingUser(null);
          fetchUsers();
        }}
        mode="edit"
        user={
          editingUser
            ? {
                id: editingUser.id,
                name: editingUser.name,
                email: editingUser.email,
                roles: editingUser.roles,
              }
            : null
        }
      />
      <UserViewDialog
        isOpen={openView}
        onClose={() => {
          setOpenView(false);
          setViewingUser(null);
        }}
        user={viewingUser}
      />
    </div>
  );
}
