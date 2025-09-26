"use client";

import Link from "next/link";
import Image from "next/image";
import { books } from "@/lib/data";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type B = (typeof books)[number];

function ActionsCell({ row }: { row: { original: B } }) {
  const router = useRouter();
  const book = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(`/dashboard/master/book/create?id=${book.code}`)
      }
    >
      <Edit className="h-4 w-4" />
      <span className="sr-only">Edit</span>
    </Button>
  );
}

const columns: ColumnDef<B>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image || "/images/Placeholder.jpg";
      return (
        <Image
          src={imageUrl}
          alt={row.original.name}
          width={60}
          height={60}
          className="rounded-md object-cover"
        />
      );
    },
  },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "author", header: "Author" },
  { accessorKey: "bookTypes", header: "Book Types" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row as any} />,
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
