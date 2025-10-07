"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { Edit, Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { categories, subCategories } from "@/lib/data";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = (typeof categories)[number];
type SubCategory = (typeof subCategories)[number];

interface Department {
  dep_code: string;
  dep_name: string;
  dep_image: string;
  dep_image_url: string;
}

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

function DepartmentsPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "departments"
  );
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);

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

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/departments");

      if (!res.success) {
        throw new Error(res.message);
      }

      setDepartments(res.data);
    } catch (err: any) {
      console.error("Failed to fetch departments:", err);
      toast({
        title: "Failed to fetch departments",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleEdit = (department: Department) => {
    router.push(
      `/dashboard/master/department/create?dep_code=${department.dep_code}&tab=departments`
    );
  };

  const departmentColumns: ColumnDef<Department>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "dep_image_url",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl =
          row.original.dep_image_url || "/images/Placeholder.jpg";
        return (
          <Image
            src={imageUrl}
            alt={row.original.dep_name}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        );
      },
    },
    { accessorKey: "dep_code", header: "Department Code" },
    { accessorKey: "dep_name", header: "Department Name" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(department)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (activeTab === "departments") {
      fetchDepartments();
    }
  }, [activeTab, fetchDepartments]);

  if (loading && activeTab === "departments") return <Loader />;

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
