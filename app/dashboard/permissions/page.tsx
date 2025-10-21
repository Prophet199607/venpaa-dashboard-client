"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Permission {
  id: number;
  name: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newPermission, setNewPermission] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchPermissions() {
    try {
      const res = await api.get("/permissions");
      setPermissions(res.data);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  }

  async function addPermission() {
    if (!newPermission) return;
    setLoading(true);
    try {
      const res = await api.post("/permissions", { name: newPermission });
      setPermissions((prev) => [...prev, res.data]);
      setNewPermission("");
    } catch (error) {
      console.error("Error creating permission:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePermission(id: number) {
    try {
      await api.delete(`/permissions/${id}`);
      setPermissions((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting permission:", error);
    }
  }

  useEffect(() => {
    fetchPermissions();
  }, []);

  return (
    <div className="p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-bold">Permissions</h1>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New Permission"
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
            />
            <Button onClick={addPermission} disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>

          <ul className="space-y-2">
            {permissions.map((permission) => (
              <li
                key={permission.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                {permission.name}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePermission(permission.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
