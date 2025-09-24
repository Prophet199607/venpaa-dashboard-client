import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { authors } from "@/lib/data";
import { ColumnDef } from "@tanstack/react-table";
import { Edit } from "lucide-react";

type U = (typeof authors)[number];

const columns: ColumnDef<U>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "name", header: "Author Name" },
  { accessorKey: "slug", header: "Slug" },
  { accessorKey: "Description", header: "Description" },
  {  header: "Actions" , cell:<Edit/>},

];

export default function author() {
  return (
    <div>
      <section className="space-y-2">
        <div className="text-lg font-semibold">Authors</div>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="text-sm font-medium">Author List</div>
            <Link href="/dashboard/master/author/create">
              <Button>Create New</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={authors} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
