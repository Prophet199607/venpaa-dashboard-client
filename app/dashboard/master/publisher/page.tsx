"use client";

import Link from "next/link";
import Image from "next/image";
import { publishers } from "@/lib/data";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type P = (typeof publishers)[number];

function ActionsCell({ row }: { row: { original: P } }) {
  const router = useRouter();
  const publisher = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(
          `/dashboard/master/publisher/create?id=${publisher.pubCode}`
        )
      }
    >
      <Edit className="h-4 w-4" />
    </Button>
  );
}

const columns: ColumnDef<P>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image || "/images/Placeholder.jpg";
      return (
        <Image
          src={imageUrl}
          alt={row.original.pubName}
          width={60}
          height={60}
          className="rounded-md object-cover"
        />
      );
    },
  },
  { accessorKey: "pubName", header: "Name" },
  { accessorKey: "slug", header: "Slug" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "contact", header: "Contact" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row as any} />,
  },
];

export default function Publisher() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Publishers</div>
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
