"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Role {
  id: number;
  name: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [role_name, setNewRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRoles() {
    try {
      setError(null);
      console.log("Fetching roles...");
      const res = await api.get("/roles");
      console.log("Roles response:", res.data);
      setRoles(res.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error fetching roles:", errorMessage);
      setError(`Failed to fetch roles: ${errorMessage}`);
    }
  }

  async function addRole() {
    if (!role_name) return;
    setLoading(true);
    try {
      const res = await api.post("/roles", { name: role_name });
      setRoles((prev) => [...prev, res.data]);
      setNewRole("");
    } catch (error: any) {
      console.error(
        "Error creating role:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRole(id: number) {
    try {
      setError(null);
      console.log("Deleting role:", id);
      await api.delete(`/roles/${id}`);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Error deleting role:", errorMessage);
      setError(`Failed to delete role: ${errorMessage}`);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-bold">Roles</h1>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New Role"
              value={role_name}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addRole();
                }
              }}
            />
            <Button onClick={addRole} disabled={loading || !role_name.trim()}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>

          <ul className="space-y-2">
            {roles.map((role) => (
              <li
                key={role.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <span>{role.name}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRole(role.id)}
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
