"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { CashierForm } from "./cashier-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Pencil, Plus, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Cashier {
  id: number;
  emp_code: string;
  emp_name: string;
  username: string;
  mobile_number: string | null;
  cashier_loca: string;
  loca_name: string | null;
  disables: boolean;
  sec_level: number | null;
}

export default function CashierPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);

  const fetchCashiers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/cashiers");
      setCashiers(response.data.data || []);
    } catch (err: any) {
      console.error("Failed to fetch cashiers:", err);
      toast({
        title: "Error",
        description: "Failed to fetch cashiers list",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!fetched.current) {
      fetchCashiers();
      fetched.current = true;
    }
  }, [fetchCashiers]);

  const columns: ColumnDef<Cashier>[] = [
    {
      accessorKey: "emp_code",
      header: "Cashier Code",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.emp_code}</span>
      ),
    },
    {
      accessorKey: "emp_name",
      header: "Cashier Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.emp_name}</span>
          <span className="text-xs text-muted-foreground">
            @{row.original.username}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "cashier_loca",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span>{row.original.loca_name || row.original.cashier_loca}</span>
        </div>
      ),
    },
    {
      accessorKey: "mobile_number",
      header: "Contact",
      cell: ({ row }) => row.original.mobile_number || "-",
    },
    {
      accessorKey: "disables",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={!row.original.disables ? "secondary" : "default"}>
          {!row.original.disables ? "Active" : "Disabled"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  setEditingCashier(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Cashier Management
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditingCashier(null);
            setFormOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Cashier
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0 relative">
          <DataTable columns={columns} data={cashiers} />
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-200">
              <Loader />
            </div>
          )}
        </CardContent>
      </Card>

      <CashierForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cashier={editingCashier}
        onSuccess={() => {
          fetchCashiers();
          setFormOpen(false);
        }}
      />
    </div>
  );
}
