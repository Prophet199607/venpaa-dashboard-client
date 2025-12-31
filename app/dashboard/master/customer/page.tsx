"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ViewModal } from "@/components/model/view-dialog";
import { MoreVertical, Pencil, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Customer {
  customerCode: string;
  customerName: string;
  mobile: string;
  nic: string;
  dob: string;
}

export default function Customer() {
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/customers");

      if (!res.success) {
        throw new Error(res.message);
      }

      const formattedCustomers = res.data.map((c: any) => ({
        customerCode: c.customer_code,
        customerName: c.customer_name,
        mobile: c.mobile,
        nic: c.nic,
        dob: c.dob,
      }));

      setCustomers(formattedCustomers);
    } catch (err: any) {
      console.error("Failed to fetch customers:", err);
      toast({
        title: "Failed to fetch customers",
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
      fetchCustomers();
      fetched.current = true;
    }
  }, [fetchCustomers]);

  // Customer columns
  const customerColumns: ColumnDef<Customer>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
      cell: ({ row }) => {
        return (
          <div>
            <div>{row.original.customerName}</div>
            <div className="text-xs text-gray-500">
              {row.original.customerCode}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      size: 180,
      cell: ({ row }) => (
        <div style={{ minWidth: 120 }}>{row.original.mobile || "-"}</div>
      ),
    },
    { accessorKey: "nic", header: "NIC" },
    {
      accessorKey: "dob",
      header: "DOB",
      cell: ({ row }) => {
        const dob = row.original.dob;

        if (!dob) return "-";

        return new Date(dob).toLocaleDateString();
      },
    },

    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const customer = row.original;
        const [open, setOpen] = useState(false);

        return (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuGroup>
                {/* View action */}
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedCustomer(customer);
                    setOpen(false);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  View
                </DropdownMenuItem>
                {/* Edit action */}
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/master/customer/create?customer_code=${customer.customerCode}`
                    );
                    setOpen(false);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  Edit
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
          <div className="text-lg font-semibold">customers</div>
          <Link href="/dashboard/master/customer/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={customerColumns} data={customers} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>

      {/* View Card Modal */}
      {selectedCustomer && (
        <ViewModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          data={selectedCustomer}
          type="customer"
        />
      )}
    </div>
  );
}
