"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Plus } from "lucide-react";
import { books, bookTypes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState, Suspense } from "react";
import { DataTable } from "@/components/ui/data-table";
import BookTypeDialog from "@/components/model/BookType";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Book = (typeof books)[number];
type BookType = (typeof bookTypes)[number];

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
      <Edit className="h-4 w-4" />
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

const bookTypeColumns: ColumnDef<BookType>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "bookCode", header: "Book Type Code" },
  { accessorKey: "bookName", header: "Book Type" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const bookType = row.original;
      return <BookTypeDialog bookType={bookType} variant="edit" />;
    },
  },
];

function BooksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "books"
  );

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
                <BookTypeDialog variant="add" />
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
        </Card>
      </Tabs>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BooksPageContent />
    </Suspense>
  );
}
