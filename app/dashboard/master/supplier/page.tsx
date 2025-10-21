"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ViewModal } from "@/components/model/ViewDialog";
import { MoreVertical, Pencil, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Supplier {
  sup_code: string;
  sup_name: string;
  company: string;
  address: string;
  mobile: string;
  telephone: string;
  email: string;
  sup_image: string;
  sup_image_url: string;
  description: string;
}

export default function Supplier() {
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/suppliers");

      if (!res.success) {
        throw new Error(res.message);
      }

      setSuppliers(res.data);
    } catch (err: any) {
      console.error("Failed to fetch suppliers:", err);
      toast({
        title: "Failed to fetch suppliers",
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
      fetchSuppliers();
      fetched.current = true;
    }
  }, [fetchSuppliers]);

  // Supplier columns
  const supplierColumns: ColumnDef<Supplier>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "sup_image_url",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl =
          row.original.sup_image_url || "/images/Placeholder.jpg";
        return (
          <div className="relative w-28 h-20">
            <div className="absolute inset-0" />
            <div className="w-full h-full overflow-hidden relative">
              <Image
                src={imageUrl}
                alt={row.original.sup_name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "sup_name",
      header: "Supplier",
      cell: ({ row }) => {
        return (
          <div>
            <div>{row.original.sup_name}</div>
            <div className="text-xs text-gray-500">{row.original.sup_code}</div>
          </div>
        );
      },
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    { accessorKey: "telephone", header: "Telephone" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const supplier = row.original;
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
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedSupplier(supplier);
                    setOpen(false);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                {/* Edit action */}
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/master/supplier/create?sup_code=${supplier.sup_code}`
                    );
                    setOpen(false);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
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
          <div className="text-lg font-semibold">Suppliers</div>
          <Link href="/dashboard/master/supplier/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <DataTable columns={supplierColumns} data={suppliers} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>

      {/* View Card Modal */}
      {selectedSupplier && (
        <ViewModal
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          data={selectedSupplier}
          type="supplier"
        />
      )}
    </div>
  );
}
