"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { api } from "@/utils/api";
import { ArrowLeft } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: number;
  dep_code: string;
  dep_name: string;
}

interface Category {
  id: number;
  cat_code: string;
  cat_name: string;
  department: string;
}

interface SubCategory {
  scat_code: string;
  scat_name: string;
  department: string;
  cat_code: string;
}

function SubCategoryFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const scat_code = searchParams.get("scat_code");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchingCategories, setFetchingCategories] = useState(false);

  const [formData, setFormData] = useState<SubCategory>({
    scat_code: "",
    scat_name: "",
    department: "",
    cat_code: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const isEditing = !!scat_code;

  const fetchDepartments = useCallback(async () => {
    try {
      const { data: res } = await api.get("/departments");
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch departments:", err);
      toast({
        title: "Failed to load departments",
        description: err.message,
        type: "error",
      });
    }
  }, [toast]);

  const fetchCategories = useCallback(
    async (depCode: string) => {
      if (!depCode) return;
      try {
        setFetchingCategories(true);
        const { data: res } = await api.get(
          `/departments/${depCode}/categories`
        );
        if (res.success) {
          setCategories(res.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch categories:", err);
        toast({
          title: "Failed to load categories",
          description: err.message,
          type: "error",
        });
      } finally {
        setFetchingCategories(false);
      }
    },
    [toast]
  );

  const fetchSubcategory = useCallback(
    async (code: string) => {
      try {
        const { data: res } = await api.get(`/sub-categories/${code}`);
        if (res.success) {
          const { scat_code, scat_name, department, cat_code, category } =
            res.data;

          setFormData({
            scat_code,
            scat_name,
            department: department || category?.department,
            cat_code,
          });

          // Fetch categories for the department to populate the dropdown
          if (department || category?.department) {
            fetchCategories(department || category.department);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch sub category:", err);
        toast({
          title: "Failed to load sub category",
          description: err.message,
          type: "error",
        });
      }
    },
    [toast, fetchCategories]
  );

  const generateSubCategoryCode = useCallback(async () => {
    try {
      const { data: res } = await api.get("/sub-categories/generate-code");
      if (res.success) {
        setFormData((prev) => ({ ...prev, scat_code: res.code }));
      }
    } catch (err: any) {
      console.error("Failed to generate code:", err);
      toast({
        title: "Failed to generate code",
        description: err.message,
        type: "error",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const initializeData = async () => {
      setFetching(true);
      try {
        await fetchDepartments();
        if (isEditing && scat_code) {
          await fetchSubcategory(scat_code);
        } else {
          await generateSubCategoryCode();
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setFetching(false);
      }
    };

    initializeData();
  }, [
    isEditing,
    scat_code,
    fetchSubcategory,
    generateSubCategoryCode,
    fetchDepartments,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value, cat_code: "" }));
    setCategories([]);
    fetchCategories(value);
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, cat_code: value }));
  };

  const handleReset = useCallback(() => {
    setFormData({ scat_code: "", scat_name: "", department: "", cat_code: "" });
    setCategories([]);
    if (!isEditing) {
      generateSubCategoryCode();
    }
  }, [isEditing, generateSubCategoryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { scat_code, scat_name, cat_code, department } = formData;
      const data = {
        scat_code,
        scat_name,
        cat_code,
        department,
      };

      const response = isEditing
        ? await api.put(`/sub-categories/${formData.scat_code}`, data)
        : await api.post("/sub-categories", data);

      if (response.data.success) {
        toast({
          title: isEditing ? "Sub category updated" : "Sub category created",
          description: `Sub category ${
            formData.scat_name
          } has been successfully ${isEditing ? "updated" : "created"}.`,
          type: "success",
        });
        router.push(`/dashboard/master/department?tab=subcategories`);
      }
    } catch (error: any) {
      console.error("Failed to submit form:", error);
      toast({
        title: "Operation failed",
        description: error.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Loader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Sub Category" : "Create Sub Category"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="scat_code">Sub Category Code</Label>
                <Input
                  name="scat_code"
                  placeholder="e.g., SC0001"
                  value={formData.scat_code}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scat_name">Sub Category Name</Label>
                <Input
                  name="scat_name"
                  placeholder="Enter sub category name"
                  value={formData.scat_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={handleDepartmentChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="--Choose Department--" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dep) => (
                      <SelectItem key={dep.id} value={dep.dep_code}>
                        {dep.dep_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat_code">Category</Label>
                <Select
                  value={formData.cat_code}
                  onValueChange={handleCategoryChange}
                  required
                  disabled={!formData.department || fetchingCategories}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        fetchingCategories
                          ? "Loading categories..."
                          : "--Choose Category--"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.cat_code}>
                        {cat.cat_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Clear
              </Button>
              <Button type="submit" disabled={loading} className="min-w-24">
                {loading ? (
                  <>
                    <Loader />
                    {isEditing ? "Updating..." : "Submitting..."}
                  </>
                ) : isEditing ? (
                  "Update"
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubCategoryForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubCategoryFormContent />
    </Suspense>
  );
}
