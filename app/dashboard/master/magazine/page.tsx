"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical, Plus, Pencil, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Magazine {
  prod_code: string;
  prod_name: string;
  prod_image: string;
  prod_image_url: string;
  publisher?: { pub_name?: string } | string;
  tamil_description?: string;
  title_in_other_language?: string;
  department?: { dep_name?: string } | string;
  category?: { cat_name?: string } | string;
  sub_category?: { scat_name?: string } | string;
  publish_year?: string | number;
  issue_date?: string;
  current_stock?: number;
  unit?: { unit_type?: string };
}

function MagazinePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const hasFetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [magazines, setMagazines] = useState<Magazine[]>([]);

  const fetchMagazines = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/magazines");

      if (!res.success) {
        throw new Error(res.message);
      }

      setMagazines(res.data);
    } catch (err: any) {
      console.error("Failed to fetch magazines:", err);
      toast({
        title: "Failed to fetch magazines",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchMagazines();
      hasFetched.current = true;
    }
  }, [fetchMagazines]);

  const magazineColumns: ColumnDef<Magazine>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => <div>{row.index + 1}</div>,
      size: 50,
    },
    {
      accessorKey: "prod_image_url",
      header: "Image",
      cell: ({ row }) => {
        const { prod_image_url } = row.original;
        const placeholder = "/images/Placeholder.jpg";

        const isValidUrl =
          prod_image_url && prod_image_url.split("/").pop()?.includes(".");

        const imageUrl = isValidUrl ? prod_image_url : placeholder;
        return (
          <Image
            src={imageUrl}
            alt={row.original.prod_name}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        );
      },
    },
    {
      accessorKey: "prod_name",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-base">{row.original.prod_name}</div>
          <div className="text-xs text-gray-500">{row.original.prod_code}</div>
        </div>
      ),
    },
    {
      accessorKey: "publish_year",
      header: "Year",
      cell: ({ row }) =>
        row.original.publish_year ? String(row.original.publish_year) : "-",
    },
    {
      accessorKey: "issue_date",
      header: "Issue Date",
      cell: ({ row }) =>
        row.original.issue_date ? row.original.issue_date : "-",
    },
    {
      accessorKey: "current_stock",
      header: "Cur. Stock",
      cell: ({ row }) => {
        const stock = row.original.current_stock || 0;
        const unitType = row.original.unit?.unit_type;
        return (
          <div className="font-bold text-center text-primary">
            {unitType === "WHOLE" ? Math.round(stock) : stock}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const magazine = row.original;
        const [open, setOpen] = useState(false);

        return (
          <div className="text-right">
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[100px]">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push(
                        `/dashboard/master/magazine/create?prod_code=${magazine.prod_code}`,
                      );
                      setOpen(false);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      const url = `/dashboard/master/magazine/bin-card?prod_code=${encodeURIComponent(magazine.prod_code)}`;
                      window.location.href = url;
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Bin Card
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Magazines</div>
          <Link href={`/dashboard/master/magazine/create`}>
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Magazine
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={magazineColumns} data={magazines} />
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>
    </div>
  );
}

export default function MagazinePage() {
  return (
    <Suspense fallback={<Loader />}>
      <MagazinePageContent />
    </Suspense>
  );
}
