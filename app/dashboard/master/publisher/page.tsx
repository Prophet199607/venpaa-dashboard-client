"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ViewModal } from "@/components/model/ViewDialog";
import { MoreVertical, Pencil, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Publisher {
  pub_code: string;
  pub_name: string;
  website: string;
  contact: string;
  email: string;
  pub_image: string;
  pub_image_url: string;
  description: string;
}
export default function Publisher() {
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(
    null
  );

  // Fetch publishers
  const fetchPublishers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/publishers");

      if (!res.success) {
        throw new Error(res.message);
      }

      setPublishers(res.data);
    } catch (err: any) {
      console.error("Failed to fetch publishers:", err);
      toast({
        title: "Failed to fetch publishers",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!fetched.current) {
      fetchPublishers();
      fetched.current = true;
    }
  }, [fetchPublishers]);

  // Publisher columns
  const publisherColumns: ColumnDef<Publisher>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "pub_image_url",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl =
          row.original.pub_image_url || "/images/Placeholder.jpg";
        return (
          <Image
            src={imageUrl}
            alt={row.original.pub_name}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        );
      },
    },
    {
      accessorKey: "pub_name",
      header: "Publisher",
      cell: ({ row }) => {
        return (
          <div>
            <div>{row.original.pub_name}</div>
            <div className="text-xs text-gray-500">{row.original.pub_code}</div>
          </div>
        );
      },
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "contact", header: "Contact" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const publisher = row.original;
        const [open, setOpen] = useState(false);

        return (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuGroup>
                {/* View action */}
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedPublisher(publisher);
                    setOpen(false);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                {/* Edit action */}
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/master/publisher/create?pub_code=${publisher.pub_code}`
                    );
                    setOpen(false);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
          <DataTable columns={publisherColumns} data={publishers} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>

      {/* View Card Modal */}
      {selectedPublisher && (
        <ViewModal
          isOpen={!!selectedPublisher}
          onClose={() => setSelectedPublisher(null)}
          data={selectedPublisher}
          type="publisher"
        />
      )}
    </div>
  );
}
