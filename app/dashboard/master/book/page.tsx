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
import BookTypeDialog from "@/components/model/book-type";
import { MoreVertical, Plus, Pencil } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Book {
  prod_code: string;
  prod_name: string;
  prod_image: string;
  prod_image_url: string;
  isbn?: string;
  authors?: Array<{ value: string; label: string }>;
  author?: { auth_code: string; auth_name: string };
  publisher?: { pub_name?: string } | string;
  book_type?: { bkt_name?: string } | string;
  department?: { dep_name?: string } | string;
  category?: { cat_name?: string } | string;
  sub_category?: { scat_name?: string } | string;
  publish_year?: string | number;
}
interface BookType {
  bkt_code: string;
  bkt_name: string;
}

function BookPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "books"
  );
  const [loading, setLoading] = useState(false);
  const fetchedTab = useRef<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [bookTypes, setBookTypes] = useState<BookType[]>([]);
  const [dialogVariant, setDialogVariant] = useState<"add" | "edit">("add");
  const [selectedBookType, setSelectedBookType] = useState<
    BookType | undefined
  >(undefined);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/master/book?tab=${value}`);
  };

  // Update active tab from URL on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/books");

      if (!res.success) {
        throw new Error(res.message);
      }

      setBooks(res.data);
    } catch (err: any) {
      console.error("Failed to fetch books:", err);
      toast({
        title: "Failed to fetch books",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchBookTypes = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/book-types");

      if (!res.success) {
        throw new Error(res.message);
      }

      const mapped: BookType[] = res.data.map((loc: BookType) => ({
        bkt_code: loc.bkt_code,
        bkt_name: loc.bkt_name,
      }));

      setBookTypes(mapped);
    } catch (err: any) {
      console.error("Failed to fetch book types:", err);
      toast({
        title: "Failed to fetch book types",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleAddNew = async () => {
    setIsPreparing(true);
    try {
      const { data: res } = await api.get("/book-types/generate-code");
      if (res.success) {
        setSelectedBookType({
          bkt_code: res.code,
          bkt_name: "",
        });
        setDialogVariant("add");
        setDialogOpen(true);
      } else {
        throw new Error(res.message || "Failed to generate book type code.");
      }
    } catch (error) {
      console.error("Failed to prepare for add:", error);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleEdit = async (bookType: BookType) => {
    setIsPreparing(true);
    try {
      const { data: res } = await api.get(`/book-types/${bookType.bkt_code}`);
      if (res.success) {
        setSelectedBookType(res.data);
        setDialogVariant("edit");
        setDialogOpen(true);
      } else {
        throw new Error(res.message || "Failed to fetch book type details.");
      }
    } catch (error) {
      console.error("Failed to prepare for edit:", error);
    } finally {
      setIsPreparing(false);
    }
  };

  const bookColumns: ColumnDef<Book>[] = [
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

        // Check if the URL is valid and not just a base path
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
      accessorKey: "authors",
      header: "Authors",
      cell: ({ row }) => {
        const authors = row.original.authors;

        // Handle multiple authors from BookResource
        if (Array.isArray(authors) && authors.length > 0) {
          return (
            <div className="space-y-1">
              {authors.map((author, index) => (
                <div key={author.value || index}>
                  <div className="font-base">{author.label}</div>
                  <div className="text-xs text-gray-500">{author.value}</div>
                </div>
              ))}
            </div>
          );
        }

        // Handle single author object (backward compatibility)
        const author = row.original.author;
        if (typeof author === "object" && author) {
          return (
            <div>
              <div className="font-base">{author.auth_name}</div>
              <div className="text-xs text-gray-500">{author.auth_code}</div>
            </div>
          );
        }

        return "-";
      },
    },
    {
      accessorKey: "publish_year",
      header: "Year",
      cell: ({ row }) =>
        row.original.publish_year ? String(row.original.publish_year) : "-",
    },
    {
      accessorKey: "isbn",
      header: "ISBN",
      cell: ({ row }) => (row.original.isbn ? row.original.isbn : "-"),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const book = row.original;
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
                  {/* Edit action */}
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push(
                        `/dashboard/master/book/create?prod_code=${book.prod_code}&tab=books`
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
          </div>
        );
      },
    },
  ];

  const bookTypeColumns: ColumnDef<BookType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "bkt_name",
      header: "Book Type",
      cell: ({ row }) => {
        return (
          <div>
            <div>{row.original.bkt_name}</div>
            <div className="text-xs text-gray-500">{row.original.bkt_code}</div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: function ActionCell({ row }) {
        const bookType = row.original;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isPreparing}>
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-[100px]">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleEdit(bookType);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Fetch data based on active tab
  useEffect(() => {
    if (fetchedTab.current === activeTab) {
      return;
    }

    if (activeTab === "books") {
      fetchBooks();
    } else if (activeTab === "book-types") {
      fetchBookTypes();
    }

    fetchedTab.current = activeTab;
  }, [activeTab, fetchBooks, fetchBookTypes]);

  return (
    <div className="space-y-6">
      <Card>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <TabsList>
              <TabsTrigger value="books">Books</TabsTrigger>
              <TabsTrigger value="book-types">Book Types</TabsTrigger>
            </TabsList>

            <div>
              <TabsContent value="books" className="mt-0">
                <Link href={`/dashboard/master/book/create?tab=books`}>
                  <Button type="button" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Book
                  </Button>
                </Link>
              </TabsContent>
              <TabsContent value="book-types" className="mt-0">
                <Button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={handleAddNew}
                  disabled={isPreparing}
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </TabsContent>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value="books" className="mt-0">
              <DataTable columns={bookColumns} data={books} />
            </TabsContent>
            <TabsContent value="book-types" className="mt-0">
              <DataTable columns={bookTypeColumns} data={bookTypes} />
            </TabsContent>
          </CardContent>
        </Tabs>
        {loading || isPreparing ? <Loader /> : null}
      </Card>

      <BookTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        variant={dialogVariant}
        bookType={selectedBookType}
        onSuccess={fetchBookTypes}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<Loader />}>
      <BookPageContent />
    </Suspense>
  );
}
