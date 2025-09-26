"use client";

import Link from "next/link";
import Image from "next/image";
import { suppliers } from "@/lib/data";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type S = (typeof suppliers)[number];

export default function SupplierTable() {
  const router = useRouter();

  const columns: ColumnDef<S>[] = [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.original.image || "/images/Placeholder.jpg";
        return (
          <Image
            src={imageUrl}
            alt={row.original.supName}
            width={60}
            height={60}
            className="rounded-md object-cover"
          />
        );
      },
    },
    { accessorKey: "supName", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    { accessorKey: "telephone", header: "Telephone" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const supplier = row.original;

        const handleEdit = () => {
          router.push(
            `/dashboard/master/supplier/create?id=${supplier.supCode}`
          );
        };

        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
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
          <DataTable columns={columns} data={suppliers} />
        </CardContent>
      </Card>
    </div>
  );
}
