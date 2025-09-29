"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState, Suspense } from "react";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { categories, subCategories, departments } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = (typeof categories)[number];
type SubCategory = (typeof subCategories)[number];
type Department = (typeof departments)[number];

function CategoryActionsCell({ row }: { row: { original: Category } }) {
  const router = useRouter();
  const category = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(
          `/dashboard/master/department/create?id=${category.catCode}&tab=categories`
        )
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
          `/dashboard/master/department/create?id=${subCategory.subCatCode}&tab=subcategories`
        )
      }
    >
      <Edit className="h-4 w-4" />
    </Button>
  );
}

function DepartmentActionsCell({ row }: { row: { original: Department } }) {
  const router = useRouter();
  const department = row.original;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() =>
        router.push(
          `/dashboard/master/department/create?id=${department.depCode}&tab=departments`
        )
      }
    >
      <Edit className="h-4 w-4" />
    </Button>
  );
}

const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image || "/images/Placeholder.jpg";
      return (
        <Image
          src={imageUrl}
          alt={row.original.catName}
          width={80}
          height={80}
          className="rounded-md object-cover"
        />
      );
    },
  },
  { accessorKey: "catName", header: "Name" },
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

const departmentColumns: ColumnDef<Department>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image || "/images/Placeholder.jpg";
      return (
        <Image
          src={imageUrl}
          alt={row.original.depName}
          width={80}
          height={80}
          className="rounded-md object-cover"
        />
      );
    },
  },
  { accessorKey: "depCode", header: "Department Code" },
  { accessorKey: "depName", header: "Department Name" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <DepartmentActionsCell row={row} />,
  },
];

function DepartmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "departments"
  );

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/master/department?tab=${value}`);
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
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="subcategories">Sub Categories</TabsTrigger>
            </TabsList>

            <div>
              <TabsContent value="departments" className="mt-0">
                <Link
                  href={`/dashboard/master/department/create?tab=departments`}
                >
                  <Button type="button" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Department
                  </Button>
                </Link>
              </TabsContent>
              <TabsContent value="categories" className="mt-0">
                <Link
                  href={`/dashboard/master/department/create?tab=categories`}
                >
                  <Button type="button" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Category
                  </Button>
                </Link>
              </TabsContent>
              <TabsContent value="subcategories" className="mt-0">
                <Link
                  href={`/dashboard/master/department/create?tab=subcategories`}
                >
                  <Button type="button" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Sub Category
                  </Button>
                </Link>
              </TabsContent>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value="departments" className="mt-0">
              <DataTable columns={departmentColumns} data={departments} />
            </TabsContent>
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

export default function DepartmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentsPageContent />
    </Suspense>
  );
}
