"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { books } from "@/lib/data";
import Loader from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import BookTypeDialog from "@/components/model/BookType";
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

type Book = (typeof books)[number];

interface BookType {
  bkt_code: string;
  bkt_name: string;
}

function BookActionsCell({ row }: { row: { original: Book } }) {
  const router = useRouter();
  const book = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(`/dashboard/master/book/create?id=${book.code}&tab=books`)
      }
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
}

const bookColumns: ColumnDef<Book>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image || "/images/Placeholder.jpg";
      return (
        <Image
          src={imageUrl}
          alt={row.original.name}
          width={60}
          height={60}
          className="rounded-md object-cover"
        />
      );
    },
  },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "author", header: "Author" },
  { accessorKey: "bookTypes", header: "Book Types" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <BookActionsCell row={row} />,
  },
];

export default function BookTypePage() {
  const router = useRouter();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "books"
  );
  const [loading, setLoading] = useState(true);
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

  const fetchBookTypes = async () => {
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
    } catch (err) {
      console.error("Failed to fetch book types:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const bookTypeColumns: ColumnDef<BookType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    { accessorKey: "bkt_code", header: "Book Type Code" },
    { accessorKey: "bkt_name", header: "Book Type" },
    {
      id: "actions",
      header: "Actions",
      cell: function ActionCell({ row }) {
        const bookType = row.original;

        return (
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
        );
      },
    },
  ];

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (activeTab === "book-types") {
      fetchBookTypes();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <Card>
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
          {loading || isPreparing ? <Loader /> : null}
        </Card>

        <BookTypeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          variant={dialogVariant}
          bookType={selectedBookType}
          onSuccess={fetchBookTypes}
        />
      </Tabs>
    </div>
  );
}
