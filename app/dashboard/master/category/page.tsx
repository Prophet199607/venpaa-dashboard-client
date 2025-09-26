"use client";

import { categories, subCategories } from "@/lib/data";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = (typeof categories)[number];
type SubCategory = (typeof subCategories)[number];

function CategoryActionsCell({ row }: { row: { original: Category } }) {
  const router = useRouter();
  const category = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(`/dashboard/master/category/create?id=${category.catCode}`)
      }
    >
      <Edit className="h-4 w-4" />
    </Button>
  );
}

function SubCategoryActionsCell({ row }: { row: { original: SubCategory } }) {
  const router = useRouter();
  const subCategory = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(
          `/dashboard/master/category/sub-category/create?id=${subCategory.subCatCode}`
        )
      }
    >
      <Edit className="h-4 w-4" />
    </Button>
  );
}

const categoryColumns: ColumnDef<Category>[] = [
  { accessorKey: "catCode", header: "Category Code" },
  { accessorKey: "catName", header: "Category Name" },
  { accessorKey: "subCategories", header: "Sub Categories" },
  { accessorKey: "slug", header: "Slug" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <CategoryActionsCell row={row} />,
  },
];

const subCategoryColumns: ColumnDef<SubCategory>[] = [
  { accessorKey: "subCatCode", header: "Sub Category Code" },
  { accessorKey: "subCatName", header: "Sub Category Name" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <SubCategoryActionsCell row={row} />,
  },
];

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <TabsList>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="subcategories">Sub Categories</TabsTrigger>
            </TabsList>

            <div>
              <TabsContent value="categories" className="mt-0">
                <Link href="/dashboard/master/category/create">
                  <Button type="button" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Category
                  </Button>
                </Link>
              </TabsContent>
              <TabsContent value="subcategories" className="mt-0">
                <Link href="/dashboard/master/category/sub-category/create">
                  <Button type="button" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Sub Category
                  </Button>
                </Link>
              </TabsContent>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value="categories" className="mt-0">
              <DataTable columns={categoryColumns} data={categories} />
            </TabsContent>
            <TabsContent value="subcategories" className="mt-0">
              <DataTable columns={subCategoryColumns} data={subCategories} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
