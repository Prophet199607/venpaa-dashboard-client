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
import { ViewModal } from "@/components/model/view-dialog";
import { MoreVertical, Pencil, Plus, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2 } from "lucide-react";

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

  // Import State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      const { data: res } = await api.post("/publishers/import", formData, {
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
        fetchPublishers();
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
          "Failed to import publishers",
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
      const response = await api.get("/publishers/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "publishers.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Publishers exported successfully",
        type: "success",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export publishers",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        const { pub_image_url } = row.original;
        const placeholder = "/images/Placeholder.jpg";

        // Check if the URL is valid and not just a base path
        const isValidUrl =
          pub_image_url && pub_image_url.split("/").pop()?.includes(".");

        const imageUrl = isValidUrl ? pub_image_url : placeholder;
        return (
          <div className="relative w-28 h-20">
            <div className="absolute inset-0" />
            <div className="w-full h-full overflow-hidden relative">
              <Image
                src={imageUrl}
                alt={row.original.pub_name}
                fill
                className="object-contain"
              />
            </div>
          </div>
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
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Import Publishers</SheetTitle>
                  <SheetDescription>
                    Upload an Excel sheet to import publishers.
                    <div className="mt-2 text-xs bg-muted p-2 rounded-md">
                      <strong>Required Columns:</strong>
                      <ul className="list-disc list-inside mt-1">
                        <li>Publisher Name</li>
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
            <Link href="/dashboard/master/publisher/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </Link>
          </div>
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
