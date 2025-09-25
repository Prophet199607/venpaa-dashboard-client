"use client";

import Link from "next/link";
import { suppliers } from "@/lib/data";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type S = (typeof suppliers)[number];

const columns: ColumnDef<S>[] = [
  { accessorKey: "", header: "Image" },
  { accessorKey: "supName", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "mobile", header: "Mobile" },
  { accessorKey: "telephone", header: "Telephone" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const supplier = row.original;
      const router = useRouter();

      const handleEdit = () => {
        router.push(`/dashboard/master/supplier/create?id=${supplier.supCode}`);
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

export default function Supplier() {
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
