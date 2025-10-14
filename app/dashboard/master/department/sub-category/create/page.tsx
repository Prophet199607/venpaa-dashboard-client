"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const subCategorySchema = z.object({
  scat_code: z
    .string()
    .min(1, "Sub category code is required")
    .regex(/^SC\d{3,}$/, "Code must follow the format SC001"),
  scat_name: z.string().min(1, "Sub category name is required"),
  department: z.string().min(1, "Department is required"),
  cat_code: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof subCategorySchema>;

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

function SubCategoryFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const scat_code = searchParams.get("scat_code");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(subCategorySchema),
    defaultValues: {
      scat_code: "",
      scat_name: "",
      department: "",
      cat_code: "",
    },
  });

  const departmentValue = form.watch("department");

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
        setFetching(true);
        const { data: res } = await api.get(`/sub-categories/${code}`);
        if (res.success) {
          const { scat_code, scat_name, department, cat_code, category } =
            res.data;

          const initialDepartment = department || category?.department;

          // Fetch categories for the department
          if (initialDepartment) {
            await fetchCategories(initialDepartment);
          }

          setTimeout(() => {
            form.reset({
              scat_code,
              scat_name,
              department: initialDepartment,
              cat_code: cat_code,
            });
          }, 100);
        }
      } catch (err: any) {
        console.error("Failed to fetch sub category:", err);
        toast({
          title: "Failed to load sub category",
          description: err.message,
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [form, toast, fetchCategories]
  );

  const generateSubCategoryCode = useCallback(async () => {
    try {
      const { data: res } = await api.get("/sub-categories/generate-code");
      if (res.success) {
        form.setValue("scat_code", res.code);
      }
    } catch (err: any) {
      console.error("Failed to generate code:", err);
      toast({
        title: "Failed to generate code",
        description: err.message,
        type: "error",
      });
    }
  }, [toast, form]);

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

  const onSubmit = async (values: FormData) => {
    setLoading(true);

    try {
      const { scat_code, scat_name, cat_code, department } = values;
      const data = {
        scat_code,
        scat_name,
        cat_code,
        department,
      };

      const response = isEditing
        ? await api.put(`/sub-categories/${values.scat_code}`, data)
        : await api.post("/sub-categories", data);

      if (response.data.success) {
        toast({
          title: isEditing ? "Sub category updated" : "Sub category created",
          description: `Sub category ${
            values.scat_name
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

  const handleReset = useCallback(() => {
    form.reset({ scat_code: "", scat_name: "", department: "", cat_code: "" });
    setCategories([]);
    if (!isEditing) {
      generateSubCategoryCode();
    }
  }, [isEditing, generateSubCategoryCode, form]);

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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="scat_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub Category Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter sub-category code (e.g., SC0001)"
                            disabled
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="scat_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub Category Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter sub category name (e.g., Historical Fiction)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("cat_code", "");
                            setCategories([]);
                            fetchCategories(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="--Choose Department--" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dep) => (
                              <SelectItem key={dep.id} value={dep.dep_code}>
                                {dep.dep_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="cat_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!departmentValue || fetchingCategories}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  fetchingCategories
                                    ? "Loading categories..."
                                    : "--Choose Category--"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.cat_code}>
                                {cat.cat_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
          </Form>
        </CardContent>
        {fetching || loading ? <Loader /> : null};
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
