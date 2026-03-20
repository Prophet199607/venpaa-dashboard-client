"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissions } from "@/context/permissions";
import { MultiSelect } from "@/components/ui/multi-select";
import { useSearchParams, useRouter } from "next/navigation";
import { AccessDenied } from "@/components/shared/access-denied";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PublisherSearch } from "@/components/shared/publisher-search";
import ImageUploadDialog from "@/components/model/image-upload-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
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

const magazineSchema = z.object({
  prod_code: z.string().min(1, "Magazine code is required"),
  prod_name: z.string().min(1, "Magazine name is required"),
  short_description: z.string().optional().nullable(),
  department: z.string().min(1, "Department is required"),
  category: z.string().min(1, "Category is required"),
  sub_category: z
    .array(z.any())
    .min(1, "At least one sub category is required"),
  sub_category_l2: z.array(z.any()).optional(),
  language: z.string().min(1, "Language is required"),
  supplier: z.array(z.any()).min(1, "Supplier is required"),
  purchase_price: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) > 0, "Purchase price is required"),
  selling_price: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) > 0, "Selling price is required"),
  marked_price: z.union([z.string(), z.number()]).optional(),
  wholesale_price: z.union([z.string(), z.number()]).optional(),
  title_in_other_language: z
    .string()
    .min(1, "Title in other language is required"),
  tamil_description: z.string().min(1, "Tamil description is required"),
  publisher: z.string().min(1, "Publisher is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  publish_year: z.string().optional().nullable(),
  pack_size: z.union([z.string(), z.number()]).optional().nullable(),
  alert_qty: z.union([z.string(), z.number()]).optional().nullable(),
  width: z.union([z.string(), z.number()]).optional().nullable(),
  height: z.union([z.string(), z.number()]).optional().nullable(),
  depth: z.union([z.string(), z.number()]).optional().nullable(),
  weight: z.union([z.string(), z.number()]).refine(
    (val) => {
      if (val === null || val === undefined) return false;
      const str = String(val).trim();
      return str.length > 0;
    },
    { message: "Weight is required" },
  ),
  pages: z.union([z.string(), z.number()]).optional().nullable(),
  barcode: z.string().optional().nullable(),
  images: z.array(z.any()).optional(),
  prod_image: z.any().optional(),
  description: z.string().optional().nullable(),
  unconfirmed_price: z.boolean().optional().nullable(),
});

const magazineSchemaResolver = zodResolver(magazineSchema);

type FormData = z.infer<typeof magazineSchema>;

interface UploadState {
  preview: string;
  file: File | null;
}
interface Department {
  dep_code: string;
  dep_name: string;
}
interface Category {
  department: string;
  cat_code: string;
  cat_name: string;
}
interface SubCategory {
  scat_code: string;
  scat_name: string;
}
interface Supplier {
  sup_code: string;
  sup_name: string;
}
interface Language {
  lang_code: string;
  lang_name: string;
}
interface SubCategoryL2 {
  scat_l2_code: string;
  scat_l2_name: string;
}

function MagazineFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const prod_code = searchParams.get("prod_code");
  const [activeTab, setActiveTab] = useState("general");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // States for dropdown data
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [images, setImages] = useState<UploadState[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);

  const [editingTarget, setEditingTarget] = useState<
    "prod_image" | "images" | null
  >(null);
  const [productImage, setProductImage] = useState<UploadState>({
    preview: "",
    file: null,
  });
  const [loadedPublisher, setLoadedPublisher] = useState<any>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<any[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<any[]>([]);
  const [selectedSubCategoriesL2, setSelectedSubCategoriesL2] = useState<any[]>(
    [],
  );
  const initialCodesRef = useRef<{
    dep?: string;
    cat?: string;
    sub?: any[];
    subL2?: any[];
    sup?: any[];
  }>({});

  const form = useForm<FormData>({
    resolver: magazineSchemaResolver,
    defaultValues: {
      prod_code: "",
      prod_name: "",
      short_description: "",
      issue_date: "",
      publish_year: "",
      title_in_other_language: "",
      tamil_description: "",
      department: "",
      category: "",
      sub_category: [],
      sub_category_l2: [],
      purchase_price: "",
      marked_price: "",
      selling_price: "",
      wholesale_price: "",
      publisher: "",
      language: "",
      supplier: [],
      pack_size: 1,
      alert_qty: "",
      width: "",
      height: "",
      depth: "",
      weight: "",
      pages: "",
      barcode: "",
      images: [],
      prod_image: null,
      description: "",
      unconfirmed_price: false,
    },
  });

  const departmentValue = form.watch("department");
  const categoryValue = form.watch("category");
  const shortDescriptionValue = form.watch("short_description") || "";

  const maxLength = 40;
  const isEditing = !!prod_code;

  const fetchDropdownData = useCallback(async () => {
    setFetching(true);
    try {
      const [departmentsRes, languagesRes] = await Promise.all([
        api.get("/departments"),
        api.get("/languages"),
      ]);

      if (departmentsRes.data.success) setDepartments(departmentsRes.data.data);
      if (languagesRes.data.success) setLanguages(languagesRes.data.data);
    } catch (error: any) {
      toast({
        title: "Failed to load initial data",
        description: error.message || "Could not fetch data for dropdowns.",
        type: "error",
        duration: 3000,
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const fetchCategories = useCallback(
    async (depCode: string) => {
      if (!depCode) return;
      setFetchingCategories(true);
      try {
        const res = await api.get(`/departments/${depCode}/categories`);
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error: any) {
        toast({
          title: "Failed to load categories",
          description: error.message,
          type: "error",
        });
      } finally {
        setFetchingCategories(false);
      }
    },
    [toast],
  );

  const fetchSubCategories = useCallback(
    async (query: string) => {
      if (!categoryValue) return [];
      try {
        const res = await api.get("/sub-categories/search", {
          params: { query, cat_code: categoryValue },
        });
        if (!res.data.success) return [];
        return res.data.data.map((sub: SubCategory) => ({
          value: sub.scat_code,
          label: sub.scat_name,
        }));
      } catch (error) {
        return [];
      }
    },
    [categoryValue],
  );

  const fetchSubCategoriesL2 = useCallback(
    async (query: string) => {
      if (!categoryValue || selectedSubCategories.length === 0) return [];
      try {
        const scat_codes = selectedSubCategories.map((s) => s.value);
        const res = await api.get("/sub-categories-l2/search", {
          params: { query, cat_code: categoryValue, scat_code: scat_codes },
        });
        if (!res.data.success) return [];
        return res.data.data.map((sub: SubCategoryL2) => ({
          value: sub.scat_l2_code,
          label: sub.scat_l2_name,
        }));
      } catch (error) {
        return [];
      }
    },
    [categoryValue, selectedSubCategories],
  );

  const fetchSuppliers = useCallback(async (query: string) => {
    try {
      const res = await api.get(`/suppliers/search`, { params: { query } });
      if (!res.data.success) return [];
      return res.data.data.map((s: Supplier) => ({
        value: s.sup_code,
        label: s.sup_name,
      }));
    } catch (error) {
      return [];
    }
  }, []);

  const fetchMagazine = useCallback(
    async (code: string) => {
      setInitialLoading(true);
      try {
        await fetchDropdownData();
        const res_data = await api.get(`/magazines/${code}`);

        const { data: res } = res_data;
        if (!res?.success)
          throw new Error(res?.message || "Failed to load magazine");
        const magazine = res.data;

        const dep = String(magazine?.department || "15");
        const cat = String(magazine?.category || "");

        if (Array.isArray(magazine.department_categories)) {
          setCategories(magazine.department_categories);
        }

        const subRaw = magazine.sub_categories || magazine.sub_category || [];
        const sub = (Array.isArray(subRaw) ? subRaw : []).map((s: any) => ({
          value: String(s.value || s.scat_code || s.id || ""),
          label: String(s.label || s.scat_name || "Unknown"),
        }));

        const supplierRaw = magazine.suppliers || magazine.supplier || [];
        const sup = (Array.isArray(supplierRaw) ? supplierRaw : []).map(
          (s: any) => ({
            value: String(s.value || s.sup_code || s.id || ""),
            label: String(
              s.label || s.sup_name || s.name || "Unknown Supplier",
            ),
          }),
        );

        if (magazine.publisher_data) {
          setLoadedPublisher(magazine.publisher_data);
        }

        const subRawL2 =
          magazine.sub_category_l2s || magazine.sub_category_l2 || [];
        const subL2 = (Array.isArray(subRawL2) ? subRawL2 : []).map(
          (s: any) => ({
            value: String(s.value || s.scat_l2_code || s.id || ""),
            label: String(s.label || s.scat_l2_name || "Unknown"),
          }),
        );

        setSelectedSubCategories(sub);
        setSelectedSubCategoriesL2(subL2);
        setSelectedSuppliers(sup);

        initialCodesRef.current = { dep, cat, sub, subL2, sup };

        form.reset({
          ...magazine,
          title_in_other_language: magazine.title_in_other_language ?? "",
          tamil_description: magazine.tamil_description ?? "",
          department: dep,
          category: cat,
          sub_category: sub,
          sub_category_l2: subL2,
          supplier: sup,
          unconfirmed_price: !!magazine.unconfirmed_price,
        });

        if (magazine?.prod_image_url) {
          setProductImage({ preview: magazine.prod_image_url, file: null });
        }
        if (Array.isArray(magazine?.image_urls)) {
          setImages(
            magazine.image_urls.map((url: string) => ({
              preview: url,
              file: null,
            })),
          );
        }
      } catch (error: any) {
        toast({
          title: "Failed to fetch magazine details",
          description: error?.message || "Please try again.",
          type: "error",
          duration: 3000,
        });
      } finally {
        setInitialLoading(false);
      }
    },
    [toast, form, fetchDropdownData],
  );

  const generateMagazineCode = useCallback(async () => {
    setFetching(true);
    try {
      const { data: res } = await api.get("/magazines/generate-code");

      if (res.success) {
        form.setValue("prod_code", res.code);
        form.setValue("barcode", res.code);
      }
    } catch (err: any) {
      console.error("Failed to generate code:", err);
      toast({
        title: "Failed to generate code",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast, form]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (isEditing && prod_code) {
      fetchMagazine(prod_code);
    } else {
      (async () => {
        setInitialLoading(true);
        try {
          await Promise.all([generateMagazineCode(), fetchDropdownData()]);
        } finally {
          setInitialLoading(false);
        }
      })();
    }
  }, [
    isEditing,
    prod_code,
    fetchMagazine,
    generateMagazineCode,
    fetchDropdownData,
  ]);

  const prodCodeValue = form.watch("prod_code");

  useEffect(() => {
    if (departmentValue) {
      const alreadyLoaded =
        categories.length > 0 &&
        categories.every(
          (cat) => String(cat.department) === String(departmentValue),
        );

      if (!alreadyLoaded) {
        fetchCategories(departmentValue);
      }

      if (isEditing) {
        if (initialCodesRef.current.cat) {
          form.setValue("category", String(initialCodesRef.current.cat));
        }
        if (
          initialCodesRef.current.sub &&
          initialCodesRef.current.sub.length > 0
        ) {
          setSelectedSubCategories(initialCodesRef.current.sub);
          form.setValue("sub_category", initialCodesRef.current.sub);
        }
        if (
          initialCodesRef.current.subL2 &&
          initialCodesRef.current.subL2.length > 0
        ) {
          setSelectedSubCategoriesL2(initialCodesRef.current.subL2);
          form.setValue("sub_category_l2", initialCodesRef.current.subL2);
        }
        if (
          initialCodesRef.current.sup &&
          initialCodesRef.current.sup.length > 0
        ) {
          setSelectedSuppliers(initialCodesRef.current.sup);
          form.setValue("supplier", initialCodesRef.current.sup);
        }
      }
    }
  }, [departmentValue, fetchCategories, isEditing, form, categories]);

  useEffect(() => {
    if (prodCodeValue) {
      form.setValue("barcode", prodCodeValue, { shouldDirty: true });
    }
  }, [prodCodeValue, form]);

  const handleThousandParameter = (
    value: string | number | null | undefined,
  ) => {
    if (value === null || value === undefined || value === "") return "";
    const num = value.toString().replace(/,/g, "");
    if (isNaN(Number(num))) return value;
    return Number(num).toLocaleString("en-US");
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "prod_image" | "images",
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setEditingTarget(target);

    if (target === "prod_image") {
      const file = selectedFiles[0];
      setEditingFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setEditingImage(reader.result as string);
        setDialogOpen(true);
      };
      reader.readAsDataURL(file);
    } else if (target === "images") {
      const filesArray = Array.from(selectedFiles);
      const newImages: UploadState[] = filesArray.map((file) => ({
        preview: URL.createObjectURL(file),
        file,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }

    e.target.value = "";
  };

  const handleDialogSave = (file: File) => {
    if (editingTarget === "prod_image") {
      const previewUrl = URL.createObjectURL(file);
      if (productImage.preview) URL.revokeObjectURL(productImage.preview);
      setProductImage({ preview: previewUrl, file });
    }
    setEditingImage(null);
    setEditingTarget(null);
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    URL.revokeObjectURL(imageToRemove.preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const previewImage = (previewUrl: string) => {
    window.open(previewUrl, "_blank");
  };

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();

      const transformToNumber = (val: any) => {
        if (val === "" || val === null || val === undefined) return 0;
        const cleanVal = typeof val === "string" ? val.replace(/,/g, "") : val;
        return isNaN(Number(cleanVal)) ? 0 : Number(cleanVal);
      };

      Object.entries(values).forEach(([key, value]) => {
        if (
          (key === "supplier" ||
            key === "sub_category" ||
            key === "sub_category_l2") &&
          Array.isArray(value)
        ) {
          const codes = value.map((v: any) => v.value).join(",");
          formDataToSend.append(key, codes);
          return;
        }

        if (
          [
            "purchase_price",
            "selling_price",
            "marked_price",
            "wholesale_price",
          ].includes(key)
        ) {
          formDataToSend.append(key, String(transformToNumber(value)));
          return;
        }

        if (
          [
            "alert_qty",
            "width",
            "height",
            "depth",
            "weight",
            "pages",
            "pack_size",
          ].includes(key)
        ) {
          formDataToSend.append(key, value ? String(value) : "");
          return;
        }

        if (key === "prod_image" || key === "images") return;
        if (typeof value === "boolean") {
          formDataToSend.append(key, value ? "1" : "0");
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      if (productImage.file) {
        formDataToSend.append("prod_image", productImage.file);
      }

      images.forEach((imageState) => {
        if (imageState.file) {
          formDataToSend.append("images[]", imageState.file);
        }
      });

      const response = isEditing
        ? await api.post(`/magazines/${prod_code}`, formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
            params: { _method: "PUT" },
          })
        : await api.post("/magazines", formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      if (response.status < 300) {
        toast({
          title: `Magazine ${isEditing ? "updated" : "created"} successfully`,
          description: `Magazine ${values.prod_name} ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });
        router.push("/dashboard/master/magazine");
      }
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const firstErrorKey = Object.keys(validationErrors)[0];
        const firstErrorMessage = validationErrors[firstErrorKey][0];

        Object.keys(validationErrors).forEach((key) => {
          form.setError(key as any, {
            type: "manual",
            message: validationErrors[key][0],
          });
        });

        toast({
          title: "Validation Error",
          description: firstErrorMessage,
          type: "error",
          duration: 3000,
        });
      } else {
        toast({
          title: "An error occurred",
          description: error.response?.data?.message || "Something went wrong",
          type: "error",
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!permissionsLoading) {
    if (isEditing && !hasPermission("edit magazine")) return <AccessDenied />;
    if (!isEditing && !hasPermission("create magazine"))
      return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Magazine" : "Create Magazine"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/master/magazine")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
              <Loader />
              <p className="mt-4 text-sm text-gray-500 animate-pulse">
                Initializing form data...
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  const firstErrorKey = Object.keys(errors)[0];
                  const firstError = firstErrorKey
                    ? (errors as Record<string, { message?: string }>)[
                        firstErrorKey
                      ]
                    : null;
                  const firstMessage =
                    firstError?.message ||
                    "Please fill in all required fields.";

                  toast({
                    title: "Validation Error",
                    description: firstMessage,
                    type: "error",
                    duration: 3000,
                  });
                })}
                className="space-y-6"
              >
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="prices">Prices</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  <TabsContent value="general" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="prod_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Magazine Code *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter magazine code"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="prod_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Magazine Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter magazine name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tamil_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tamil Description *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter Tamil description"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  className="font-tamil"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="title_in_other_language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title in Other Language *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter title in other language"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="publish_year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Publish Year</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="YYYY"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="issue_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Issue Date *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department *</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("category", "");
                                  form.setValue("sub_category", []);
                                  form.setValue("sub_category_l2", []);
                                  setCategories([]);
                                  setSelectedSubCategories([]);
                                  setSelectedSubCategoriesL2([]);
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
                                    <SelectItem
                                      key={dep.dep_code}
                                      value={String(dep.dep_code)}
                                    >
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
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("sub_category", []);
                                  form.setValue("sub_category_l2", []);
                                  setSelectedSubCategories([]);
                                  setSelectedSubCategoriesL2([]);
                                }}
                                value={field.value}
                                disabled={
                                  !departmentValue || fetchingCategories
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        fetchingCategories
                                          ? "Loading..."
                                          : "Select category"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem
                                      key={cat.cat_code}
                                      value={String(cat.cat_code)}
                                    >
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
                          name="sub_category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sub Category *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={[]}
                                  selected={selectedSubCategories}
                                  onChange={(val) => {
                                    setSelectedSubCategories(val);
                                    field.onChange(val);
                                    form.setValue("sub_category_l2", []);
                                    setSelectedSubCategoriesL2([]);
                                  }}
                                  placeholder="Search sub categories"
                                  disabled={!categoryValue}
                                  fetchOptions={fetchSubCategories}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="sub_category_l2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sub Category L2</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={[]}
                                  selected={selectedSubCategoriesL2}
                                  onChange={(val) => {
                                    setSelectedSubCategoriesL2(val);
                                    field.onChange(val);
                                  }}
                                  placeholder="Search sub categories L2"
                                  disabled={
                                    !categoryValue ||
                                    selectedSubCategories.length === 0
                                  }
                                  fetchOptions={fetchSubCategoriesL2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="short_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Short Description</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter short description"
                                  {...field}
                                  value={field.value ?? ""}
                                  maxLength={40}
                                />
                              </FormControl>
                              <div className="flex justify-between">
                                <p className="text-xs text-muted-foreground text-left">
                                  This is use for recipt
                                </p>
                                <p className="text-xs text-muted-foreground text-right">
                                  {shortDescriptionValue.length} / {maxLength}
                                </p>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="prices" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="purchase_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purchase Price *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0.00"
                                  {...field}
                                  value={handleThousandParameter(field.value)}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /,/g,
                                      "",
                                    );
                                    if (!isNaN(Number(val)) || val === "") {
                                      field.onChange(val);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="marked_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marked Price</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0.00"
                                  {...field}
                                  value={handleThousandParameter(field.value)}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /,/g,
                                      "",
                                    );
                                    if (!isNaN(Number(val)) || val === "") {
                                      field.onChange(val);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="unconfirmed_price"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-2">
                              <FormControl>
                                <Checkbox
                                  checked={!!field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Unconfirmed Price</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="selling_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selling Price *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0.00"
                                  {...field}
                                  value={handleThousandParameter(field.value)}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /,/g,
                                      "",
                                    );
                                    if (!isNaN(Number(val)) || val === "") {
                                      field.onChange(val);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="wholesale_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Wholesale Price</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0.00"
                                  {...field}
                                  value={handleThousandParameter(field.value)}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /,/g,
                                      "",
                                    );
                                    if (!isNaN(Number(val)) || val === "") {
                                      field.onChange(val);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="supplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Suppliers *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={[]}
                                  selected={selectedSuppliers}
                                  onChange={(val) => {
                                    setSelectedSuppliers(val);
                                    field.onChange(val);
                                  }}
                                  placeholder="Search suppliers"
                                  fetchOptions={fetchSuppliers}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="publisher"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Publisher *</FormLabel>
                              <FormControl>
                                <PublisherSearch
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  initialData={loadedPublisher}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pack_size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Pack Size (No of unit in one pack)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter pack size"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <Label>Cover Image</Label>
                          <div>
                            <input
                              id="cover-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileSelect(e, "prod_image")
                              }
                            />
                            <label
                              htmlFor="cover-upload"
                              className="block w-36 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden"
                            >
                              {productImage.preview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={productImage.preview}
                                  alt="Cover preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : isEditing ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src="/images/Placeholder.jpg"
                                  alt="Placeholder"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                                  + Upload Cover Image
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="width"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Width (Cm)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter width"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="height"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Height (Cm)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter height"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="depth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Depth</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter depth"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (g) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter weight"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="pages"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pages</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter pages"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="alert_qty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Alert Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter alert quantity"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="barcode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Barcode</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder="Enter barcode"
                                    {...field}
                                    value={field.value ?? ""}
                                    disabled
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {languages.map((lang) => (
                                      <SelectItem
                                        key={lang.lang_code}
                                        value={lang.lang_code}
                                      >
                                        {lang.lang_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter description"
                                    {...field}
                                    value={field.value ?? ""}
                                    className="h-36"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/master/magazine")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      "Update Magazine"
                    ) : (
                      "Create Magazine"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <ImageUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialImage={editingImage}
        initialFile={editingFile}
        onSave={handleDialogSave}
      />
    </div>
  );
}

export default function MagazineFormPage() {
  return (
    <Suspense fallback={<Loader />}>
      <MagazineFormContent />
    </Suspense>
  );
}
