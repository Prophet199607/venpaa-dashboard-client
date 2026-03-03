"use client";

import * as z from "zod";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  scat_l2_code: z.string().min(1, "Code is required"),
  scat_l2_name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  cat_code: z.string().min(1, "Category is required"),
  scat_code: z.string().min(1, "Sub Category is required"),
  status: z.number().default(1),
});

type FormValues = z.infer<typeof formSchema>;

interface SubCategoryL2FormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subCategoryL2?: any;
  onSuccess: () => void;
}

export function SubCategoryL2Form({
  open,
  onOpenChange,
  subCategoryL2,
  onSuccess,
}: SubCategoryL2FormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      scat_l2_code: "",
      scat_l2_name: "",
      department: "",
      cat_code: "",
      scat_code: "",
      status: 1,
    },
  });

  const selectedDepartment = form.watch("department");
  const selectedCategory = form.watch("cat_code");

  const fetchDepartments = useCallback(async () => {
    try {
      const { data: res } = await api.get("/departments");
      setDepartments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  }, []);

  const fetchCategories = useCallback(async (depCode: string) => {
    try {
      const { data: res } = await api.get(`/departments/${depCode}/categories`);
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  const fetchSubCategories = useCallback(async (catCode: string) => {
    try {
      const { data: res } = await api.get(
        `/categories/${catCode}/sub-categories`,
      );
      setSubCategories(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sub categories", err);
    }
  }, []);

  const generateCode = useCallback(async () => {
    try {
      const { data: res } = await api.get("/sub-categories-l2/generate-code");
      if (res.success) {
        form.setValue("scat_l2_code", res.code);
      }
    } catch (err) {
      console.error("Failed to generate code", err);
    }
  }, [form]);

  useEffect(() => {
    if (open) {
      fetchDepartments();
      if (!subCategoryL2) {
        generateCode();
        form.reset({
          scat_l2_code: "",
          scat_l2_name: "",
          department: "",
          cat_code: "",
          scat_code: "",
          status: 1,
        });
      } else {
        form.reset({
          scat_l2_code: subCategoryL2.scat_l2_code,
          scat_l2_name: subCategoryL2.scat_l2_name,
          department: subCategoryL2.department,
          cat_code: subCategoryL2.cat_code,
          scat_code: subCategoryL2.scat_code,
          status: subCategoryL2.status || 1,
        });
        fetchCategories(subCategoryL2.department);
        fetchSubCategories(subCategoryL2.cat_code);
      }
    }
  }, [
    open,
    subCategoryL2,
    fetchDepartments,
    generateCode,
    form,
    fetchCategories,
    fetchSubCategories,
  ]);

  useEffect(() => {
    if (selectedDepartment && open) {
      fetchCategories(selectedDepartment);
      if (!subCategoryL2 || selectedDepartment !== subCategoryL2.department) {
      }
    } else {
      setCategories([]);
    }
  }, [selectedDepartment, fetchCategories, open, subCategoryL2]);

  useEffect(() => {
    if (selectedCategory && open) {
      fetchSubCategories(selectedCategory);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory, fetchSubCategories, open]);

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);
      if (subCategoryL2) {
        await api.put(
          `/sub-categories-l2/${subCategoryL2.scat_l2_code}`,
          values,
        );
        toast({
          title: "Success",
          description: "Sub Category L2 updated successfully",
          type: "success",
        });
      } else {
        await api.post("/sub-categories-l2", values);
        toast({
          title: "Success",
          description: "Sub Category L2 created successfully",
          type: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>
            {subCategoryL2 ? "Edit Sub Category L2" : "Add New Sub Category L2"}
          </SheetTitle>
          <SheetDescription>
            {subCategoryL2
              ? "Update the details of the sub category level 2."
              : "Create a new sub category level 2 to organize your products."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="scat_l2_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly placeholder="Generating..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scat_l2_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue("cat_code", "");
                      form.setValue("scat_code", "");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dep) => (
                        <SelectItem key={dep.dep_code} value={dep.dep_code}>
                          {dep.dep_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cat_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue("scat_code", "");
                    }}
                    value={field.value}
                    disabled={!selectedDepartment}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.cat_code} value={cat.cat_code}>
                          {cat.cat_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scat_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCategory}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subCategories.map((scat) => (
                        <SelectItem key={scat.scat_code} value={scat.scat_code}>
                          {scat.scat_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
