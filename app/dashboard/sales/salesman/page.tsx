"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SalesmanForm } from "./salesman-form";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical, Pencil, Plus, UserSearch } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Salesman {
  id: number;
  sales_code: string;
  sales_name: string;
  sales_email: string | null;
  sales_phone: string | null;
  sales_address: string | null;
  sales_status: number;
}

export default function SalesmanPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);

  const fetchSalesmen = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/salesmen");
      setSalesmen(data);
    } catch (err: any) {
      console.error("Failed to fetch salesmen:", err);
      toast({
        title: "Error",
        description: "Failed to fetch salesmen list",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!fetched.current) {
      fetchSalesmen();
      fetched.current = true;
    }
  }, [fetchSalesmen]);

  const columns: ColumnDef<Salesman>[] = [
    {
      accessorKey: "sales_code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.sales_code}</span>
      ),
    },
    {
      accessorKey: "sales_name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.sales_name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.sales_email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "sales_phone",
      header: "Phone",
    },
    {
      accessorKey: "sales_address",
      header: "Address",
      cell: ({ row }) => row.original.sales_address || "-",
    },
    {
      accessorKey: "sales_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.sales_status === 1 ? "secondary" : "default"}
        >
          {row.original.sales_status === 1 ? "Active" : "Inactive"}
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
                  setEditingSalesman(row.original);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Salesmen</h1>
          <p className="text-xs text-muted-foreground">
            Manage your sales team and their contact information.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSalesman(null);
            setFormOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Salesman
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <UserSearch className="h-5 w-5 text-primary" />
            <span className="font-semibold">Team Directory</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={salesmen} />
        </CardContent>
        {loading && <Loader />}
      </Card>

      <SalesmanForm
        open={formOpen}
        onOpenChange={setFormOpen}
        salesman={editingSalesman}
        onSuccess={() => {
          fetchSalesmen();
          setFormOpen(false);
        }}
      />
    </div>
  );
}
