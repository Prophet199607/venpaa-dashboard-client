"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ViewModal } from "@/components/model/view-dialog";
import { MoreVertical, Pencil, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { set } from "zod";

interface Author {
  auth_code: string;
  auth_name: string;
  auth_name_tamil: string;
  auth_image: string;
  auth_image_url: string;
  description: string;
}

export default function Author() {
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authors, setAthours] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  // Fetch authors
  const fetchAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/authors");

      if (!res.success) {
        throw new Error(res.message);
      }

      setAthours(res.data);
    } catch (err: any) {
      console.error("Failed to fetch authors:", err);
      toast({
        title: "Failed to fetch authors",
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
      fetchAuthors();
      fetched.current = true;
    }
  }, [fetchAuthors]);

  // Author columns
  const authorColumns: ColumnDef<Author>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "auth_image_url",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl =
          row.original.auth_image_url || "/images/Placeholder.jpg";
        return (
          <div className="relative w-28 h-20">
            <div className="absolute inset-0" />
            <div className="w-full h-full overflow-hidden relative">
              <Image
                src={imageUrl}
                alt={row.original.auth_name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "auth_name",
      header: "Author",
      cell: ({ row }) => {
        return (
          <div>
            <div>{row.original.auth_name}</div>
            <div className="text-xs text-gray-500">
              {row.original.auth_code}
            </div>
          </div>
        );
      },
    },
    { accessorKey: "auth_name_tamil", header: "Tamil" },
    { accessorKey: "description", header: "Description" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const author = row.original;
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
                    setSelectedAuthor(author);
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
                      `/dashboard/master/author/create?auth_code=${author.auth_code}`
                    );
                    setOpen(false);
                  }}
                >
                  <Pencil className="w-4 h-4" />
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
          <div className="text-lg font-semibold">Authors</div>
          <Link href="/dashboard/master/author/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={authorColumns} data={authors} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>

      {/* View Card Modal */}
      {selectedAuthor && (
        <ViewModal
          isOpen={!!selectedAuthor}
          onClose={() => setSelectedAuthor(null)}
          data={selectedAuthor}
          type="author"
        />
      )}
    </div>
  );
}
