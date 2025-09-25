"use client";

import Link from "next/link";
import { books } from "@/lib/data";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type B = (typeof books)[number];

const columns: ColumnDef<B>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "author", header: "Author" },
  { accessorKey: "bookTypes", header: "Book Types" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const book = row.original;
      const router = useRouter();

      const handleEdit = () => {
        router.push(`/dashboard/master/book/create?id=${book.code}`);
      };
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      );
    },
  },
];

export default function Book() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Books</div>
          <Link href="/dashboard/master/book/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={books} />
        </CardContent>
      </Card>
    </div>
  );
}
