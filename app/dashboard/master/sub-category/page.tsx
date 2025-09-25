"use client";

import { subCategories } from "@/lib/data";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SC = (typeof subCategories)[number];

function ActionsCell({ row }: { row: { original: SC } }) {
  const router = useRouter();
  const subCategory = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(
          `/dashboard/master/sub-category/create?id=${subCategory.subCatCode}`
        )
      }
    >
      <Edit className="h-4 w-4" />
    </Button>
  );
}

const columns: ColumnDef<SC>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "subCatCode", header: "Sub Category Code" },
  { accessorKey: "subCatName", header: "Sub Category Name" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row as any} />,
  },
];

export default function SubCategory() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Sub Categories</div>
          <Link href="/dashboard/master/sub-category/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={subCategories} />
        </CardContent>
      </Card>
    </div>
  );
}
