"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Loader2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ViewModal } from "@/components/model/view-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical, Pencil, Plus, Eye, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

interface Author {
  auth_code: string;
  auth_name: string;
  auth_name_other_language: string;
  auth_image: string;
  auth_image_url: string;
  description: string;
}

export default function Author() {
  const fetched = useRef(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  // Import State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch authors
  const fetchAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/authors");

      if (!res.success) {
        throw new Error(res.message);
      }

      setAuthors(res.data);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const { data: res } = await api.post("/authors/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.success) {
        toast({
          title: "Import Successful",
          description: res.message,
          type: "success",
          duration: 3000,
        });
        setSheetOpen(false);
        setImportFile(null);
        fetchAuthors();
      } else {
        throw new Error(res.message);
      }
    } catch (error: any) {
      console.error("Import failed:", error);
      toast({
        title: "Import Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to import authors",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await api.get("/authors/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "authors.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Authors exported successfully",
        type: "success",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export authors",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        const { auth_image_url } = row.original;
        const placeholder = "/images/Placeholder.jpg";

        // Check if the URL is valid and not just a base path
        const isValidUrl =
          auth_image_url && auth_image_url.split("/").pop()?.includes(".");

        const imageUrl = isValidUrl ? auth_image_url : placeholder;
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
    {
      accessorKey: "auth_name_other_language",
      header: "Other Language Name",
      size: 180,
      cell: ({ row }) => (
        <div style={{ minWidth: 120 }}>
          {row.original.auth_name_other_language || "-"}
        </div>
      ),
    },
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
                  <Eye className="w-4 h-4" />
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
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Import Authors</SheetTitle>
                  <SheetDescription>
                    Upload an Excel sheet to import authors.
                    <div className="mt-2 text-xs bg-muted p-2 rounded-md">
                      <strong>Required Columns:</strong>
                      <ul className="list-disc list-inside mt-1">
                        <li>Author Name (or Authors Name)</li>
                      </ul>
                      <strong className="mt-2 block">Optional Columns:</strong>
                      <ul className="list-disc list-inside mt-1">
                        <li>auth_name_other_language, description</li>
                      </ul>
                    </div>
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-6">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="excel-file">Excel File</Label>
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <SheetFooter>
                  <Button
                    onClick={handleImport}
                    disabled={!importFile || isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      "Import"
                    )}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </Button>
            <Link href="/dashboard/master/author/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </Link>
          </div>
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
