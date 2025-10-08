"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { Edit, Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Department {
  dep_code: string;
  dep_name: string;
  dep_image: string;
  dep_image_url: string;
}

interface Category {
  cat_code: string;
  cat_name: string;
  cat_slug: string;
  cat_image: string;
  cat_image_url: string;
}

interface SubCategory {
  scat_code: string;
  scat_name: string;
}

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

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

  // Fetch departments
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

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/categories");

      if (!res.success) {
        throw new Error(res.message);
      }

      setCategories(res.data);
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      toast({
        title: "Failed to fetch categories",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch subcategories
  const fetchSubCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/sub-categories");

      if (!res.success) {
        throw new Error(res.message);
      }

      setSubCategories(res.data);
    } catch (err: any) {
      console.error("Failed to fetch subcategories:", err);
      toast({
        title: "Failed to fetch subcategories",
        description: err.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Department columns
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
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const department = row.original;
        const [open, setOpen] = useState(false);

        return (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                {/* Edit action */}
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/master/department/create?dep_code=${department.dep_code}&tab=departments`
                    );
                    setOpen(false);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Category columns
  const categoryColumns: ColumnDef<Category>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "cat_image_url",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl =
          row.original.cat_image_url || "/images/Placeholder.jpg";
        return (
          <Image
            src={imageUrl}
            alt={row.original.cat_name}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        );
      },
    },
    { accessorKey: "cat_code", header: "Code" },
    { accessorKey: "cat_name", header: "Name" },
    { accessorKey: "cat_slug", header: "Slug" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const category = row.original;
        const [open, setOpen] = useState(false);

        return (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                {/* Edit action */}
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/master/department/category/create?cat_code=${category.cat_code}&tab=categories`
                    );
                    setOpen(false);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Subcategory columns
  const subCategoryColumns: ColumnDef<SubCategory>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    { accessorKey: "scat_code", header: "Sub Category Code" },
    { accessorKey: "scat_name", header: "Sub Category Name" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const subCategory = row.original;
        const [open, setOpen] = useState(false);

        return (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                {/* Edit action */}
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/master/department/sub-category/create?scat_code=${subCategory.scat_code}&tab=subcategories`
                    );
                    setOpen(false);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Fetch data based on active tab
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (activeTab === "departments") {
      fetchDepartments();
    } else if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "subcategories") {
      fetchSubCategories();
    }
  }, [activeTab, fetchDepartments, fetchCategories, fetchSubCategories]);

  if (loading) {
    if (
      activeTab === "departments" ||
      activeTab === "categories" ||
      activeTab === "subcategories"
    ) {
      return <Loader />;
    }
  }

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
                  href={`/dashboard/master/department/category/create?tab=categories`}
                >
                  <Button type="button" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Category
                  </Button>
                </Link>
              </TabsContent>
              <TabsContent value="subcategories" className="mt-0">
                <Link
                  href={`/dashboard/master/department/sub-category/create?tab=subcategories`}
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
