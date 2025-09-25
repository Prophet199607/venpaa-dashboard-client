"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { books } from "@/lib/data";
import { ColumnDef } from "@tanstack/react-table";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function book() {
  return (
    <div>
      <section className="space-y-2">
        <div className="text-lg font-semibold">Books</div>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="text-sm font-medium">Book List</div>
            <Link href="/dashboard/master/book/create">
              <Button>Create New</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={books} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
