"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { nodeApi } from "@/utils/api-node";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { UserCircle, Loader2, ShoppingBag, History } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { encodeId } from "@/lib/utils";

interface Customer {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  auth_provider: string;
  platform: string;
  status: number;
  total_orders: number;
  total_checkouts: number;
  total_pick_and_collects: number;
  last_order_at: string;
  last_order_status: string;
  has_success_payment: boolean;
}

function CustomersPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetchedRef = useRef(false);
  const [allUsers, setAllUsers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await nodeApi.get("/customers");
      const list = Array.isArray(data)
        ? data
        : (data?.users ?? data?.data ?? []);
      setAllUsers(list);
    } catch (err: any) {
      toast({
        title: "Failed to fetch customers",
        description: err.response?.data?.message || err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchCustomers();
  }, [fetchCustomers]);

  const customers = useMemo(
    () =>
      (showAll ? allUsers : allUsers.filter((c) => c.has_success_payment)).map(
        (c) => ({
          ...c,
          fullName: `${c.fname} ${c.lname}`.toLowerCase(),
        }),
      ),
    [allUsers, showAll],
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const customerColumns: ColumnDef<Customer>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => <div>{row.index + 1}</div>,
      size: 50,
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.fname} {row.original.lname}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "total_orders",
      header: "Orders",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{row.original.total_orders}</span>
        </div>
      ),
    },
    {
      accessorKey: "last_order_at",
      header: "Last Order",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <History className="w-3 h-3" />
          {formatDate(row.original.last_order_at)}
        </div>
      ),
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => {
        const platform =
          row.original.platform === "1"
            ? "Android"
            : row.original.platform === "2"
              ? "iOS"
              : row.original.platform === "3"
                ? "Web"
                : "-";

        return (
          <Badge variant="outline" className="capitalize">
            {platform}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
          <UserCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Customer Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage customers registered on the website.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="showAll"
                checked={showAll}
                onCheckedChange={(checked) => setShowAll(!!checked)}
              />
              <label
                htmlFor="showAll"
                className="text-sm cursor-pointer select-none"
              >
                Show all customers ({allUsers.length})
              </label>
            </div>
            {/* <div className="text-xs text-muted-foreground">
              Showing {customers.length} customer
              {customers.length !== 1 ? "s" : ""}
              {!showAll && " with successful payments"}
            </div> */}
          </div>

          {loading && allUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin opacity-40" />
              <p className="text-sm">Loading customers...</p>
            </div>
          ) : (
            <DataTable
              columns={customerColumns}
              data={customers}

              onRowClick={(row) =>
                router.push(
                  `/dashboard/website/customers/${encodeId(row.id)}`,
                )
              }
            />
          )}
        </CardContent>
      </Card>

    </div>
  );
}

export default function CustomersPage() {
  return (
    <div className="p-2">
      <CustomersPageContent />
    </div>
  );
}
