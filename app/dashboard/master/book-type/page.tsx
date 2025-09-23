"use client";

import { bookTypes } from "@/lib/data";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import BookTypeDialog from "@/components/model/BookType";

type B = (typeof bookTypes)[number];

const columns: ColumnDef<B>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "bookCode", header: "Book Type Code" },
  { accessorKey: "bookName", header: "Book Type" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const bookType = row.original;
      return <BookTypeDialog bookType={bookType} variant="edit" />;
    },
  },
];

export default function BookType() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Book Types</div>
          <BookTypeDialog variant="add" />
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={bookTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
