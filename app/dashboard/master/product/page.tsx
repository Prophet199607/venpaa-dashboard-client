"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { MoreVertical, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  prod_code: string;
  prod_name: string;
  prod_image: string;
  prod_image_url: string;
  department?: { dep_name?: string } | string;
  category?: { cat_name?: string } | string;
  sub_category?: { scat_name?: string } | string;
  suppliers?: Array<{ value: string; label: string }>;
  supplier?: { sup_code: string; sup_name: string };
  pack_size?: number;
}

function ProductPageContent() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/products");

      if (!res.success) {
        throw new Error(res.message);
      }
      setProducts(res.data);
    } catch (error: any) {
      toast({
        title: "Failed to load products",
        description: error.message,
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const columns: ColumnDef<Product>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => <div>{row.index + 1}</div>,
      size: 50,
    },
    {
      accessorKey: "prod_image_url",
      header: "Image",
      cell: ({ row }) => {
        const { prod_image_url } = row.original;
        const placeholder = "/images/Placeholder.jpg";

        // Check if the URL is valid and not just a base path
        const isValidUrl =
          prod_image_url && prod_image_url.split("/").pop()?.includes(".");

        const imageUrl = isValidUrl ? prod_image_url : placeholder;
        return (
          <Image
            src={imageUrl}
            alt={row.original.prod_name}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        );
      },
    },
    {
      accessorKey: "prod_name",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <div className="font-base">{row.original.prod_name}</div>
          <div className="text-xs text-gray-500">{row.original.prod_code}</div>
        </div>
      ),
    },
    {
      accessorKey: "suppliers",
      header: "Suppliers",
      cell: ({ row }) => {
        const suppliers = row.original.suppliers;

        // Handle multiple suppliers from BookResource
        if (Array.isArray(suppliers) && suppliers.length > 0) {
          return (
            <div className="space-y-1">
              {suppliers.map((supplier, index) => (
                <div key={supplier.value || index}>
                  <div className="font-base">{supplier.label}</div>
                  <div className="text-xs text-gray-500">{supplier.value}</div>
                </div>
              ))}
            </div>
          );
        }

        // Handle single supplier object (backward compatibility)
        const supplier = row.original.supplier;
        if (typeof supplier === "object" && supplier) {
          return (
            <div>
              <div className="font-base">{supplier.sup_name}</div>
              <div className="text-xs text-gray-500">{supplier.sup_code}</div>
            </div>
          );
        }

        return "-";
      },
    },
    {
      accessorKey: "pack_size",
      header: "Pack Size",
      cell: ({ row }) =>
        row.original.pack_size ? row.original.pack_size : "-",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const product = row.original;
        const [open, setOpen] = useState(false);

        return (
          <div className="text-right">
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[100px]">
                <DropdownMenuGroup>
                  {/* Edit action */}
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push(
                        `/dashboard/master/product/create?prod_code=${product.prod_code}`
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
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    if (!fetched.current) {
      fetchProducts();
      fetched.current = true;
    }
  }, [fetchProducts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Products</div>
          <Link href="/dashboard/master/product/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={products} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ProductPageContent />
    </Suspense>
  );
}
