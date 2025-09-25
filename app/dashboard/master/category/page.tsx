"use client";

import { categories } from "@/lib/data";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type C = (typeof categories)[number];

function ActionsCell({ row }: { row: { original: C } }) {
  const router = useRouter();
  const category = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(`/dashboard/master/category/create?id=${category.catCode}`)
      }
    >
      <Edit className="h-4 w-4" />
      <span className="sr-only">Edit</span>
    </Button>
  );
}

const columns: ColumnDef<C>[] = [
  { accessorKey: "image", header: "Image" },
  { accessorKey: "catCode", header: "Category Code" },
  { accessorKey: "catName", header: "Category Name" },
  { accessorKey: "subCategories", header: "Sub Categories" },
  { accessorKey: "slug", header: "Slug" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row as any} />,
  },
];

export default function Category() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Categories</div>
          <Link href="/dashboard/master/category/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
