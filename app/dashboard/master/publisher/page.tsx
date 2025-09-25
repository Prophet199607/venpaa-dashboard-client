"use client";

import Link from "next/link";
import { publishers } from "@/lib/data";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type P = (typeof publishers)[number];

const columns: ColumnDef<P>[] = [
  { accessorKey: "", header: "Image" },
  { accessorKey: "pubName", header: "Name" },
  { accessorKey: "slug", header: "Slug" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "contact", header: "Contact" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const publisher = row.original;
      const router = useRouter();

      const handleEdit = () => {
        router.push(
          `/dashboard/master/publisher/create?id=${publisher.pubCode}`
        );
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

export default function Publisher() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Pblishers</div>
          <Link href="/dashboard/master/publisher/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={publishers} />
        </CardContent>
      </Card>
    </div>
  );
}
