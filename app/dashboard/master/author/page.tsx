"use client";

import Link from "next/link";
import { authors } from "@/lib/data";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type A = (typeof authors)[number];

function ActionsCell({ row }: { row: { original: A } }) {
  const router = useRouter();
  const auther = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(`/dashboard/master/author/create?id=${auther.authCode}`)
      }
    >
      <Edit className="h-4 w-4" />
      <span className="sr-only">Edit</span>
    </Button>
  );
}

const columns: ColumnDef<A>[] = [
  { accessorKey: "", header: "Image" },
  { accessorKey: "authName", header: "Author Name" },
  { accessorKey: "authNameTamil", header: "Author Name Tamil" },
  { accessorKey: "slug", header: "Slug" },
  { accessorKey: "description", header: "Description" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row as any} />,
  },
];

export default function Author() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Authors</div>
          <Link href="/dashboard/master/author/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={authors} />
        </CardContent>
      </Card>
    </div>
  );
}
