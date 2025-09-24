import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { books } from "@/lib/data";
import { ColumnDef } from "@tanstack/react-table";
import { Edit } from "lucide-react";

type U = (typeof books)[number];

const columns: ColumnDef<U>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "image", header: "Image" },
  { accessorKey: "author", header: "Name" },
  { accessorKey: "bookTypes", header: "Book Types" },
  {  header: "Actions" , cell:<Edit/>},

];

export default function book() {
  return (
    <div>
      <section className="space-y-2">
        <div className="text-lg font-semibold">Books</div>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="text-sm font-medium">Book List</div>
            <Link href="/dashboard/master/author/create">
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
