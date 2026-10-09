"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { ColumnDef } from "@tanstack/react-table";
import { usePermissions } from "@/context/permissions";
import { DataTable } from "@/components/ui/data-table";
import { AccessDenied } from "@/components/shared/access-denied";
import { MoreVertical, Plus, Pencil, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const [loading, setLoading] = useState(false);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Raw input is debounced before it reaches the API.
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  // Tracks the in-flight magazines request. Used to (a) drop duplicate
  // concurrent calls (e.g. React StrictMode double-invoking the mount effect)
  // and (b) abort a stale request when the search term changes.
  const magazinesRequestRef = useRef<{
    key: string;
    controller: AbortController;
  } | null>(null);

  const fetchMagazines = useCallback(async () => {
    const requestKey = debouncedSearch;

    // Same request already in flight -> ignore the duplicate call.
    if (magazinesRequestRef.current?.key === requestKey) return;

    // Term changed -> cancel the previous request so its (stale) response can
    // never overwrite the newer one.
    magazinesRequestRef.current?.controller.abort();
    const controller = new AbortController();
    magazinesRequestRef.current = { key: requestKey, controller };

    try {
      setLoading(true);
      const { data: res } = await api.get("/magazines", {
        params: { search: debouncedSearch || undefined },
        signal: controller.signal,
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      setMagazines(res.data);
    } catch (err: any) {
      // A cancelled (superseded) request is not an error.
      if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;

      console.error("Failed to fetch magazines:", err);
      toast({
        title: "Failed to fetch magazines",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      // Only the latest request may clear the loader / release the ref.
      if (magazinesRequestRef.current?.controller === controller) {
        magazinesRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [toast, debouncedSearch]);

  useEffect(() => {
    fetchMagazines();
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
                  {hasPermission("edit magazine") && (
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
                  )}
                  {hasPermission("view bin-card") && (
                    <DropdownMenuItem
                      onSelect={() => {
                        const url = `/dashboard/master/magazine/bin-card?prod_code=${encodeURIComponent(magazine.prod_code)}`;
                        window.location.href = url;
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Bin Card
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (!permissionsLoading && !hasPermission("view magazine")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Magazines</div>
          {hasPermission("create magazine") && (
            <Link href={`/dashboard/master/magazine/create`}>
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Magazine
              </Button>
            </Link>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          <SearchInput
            placeholder="Search by code, name, barcode, ISBN or title..."
            value={searchInput}
            onChange={setSearchInput}
          />
          <DataTable
            columns={magazineColumns}
            data={magazines}
            searchValue={searchInput}
          />
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
