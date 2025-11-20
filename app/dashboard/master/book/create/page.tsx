"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { MultiSelect } from "@/components/ui/multi-select";
import { useSearchParams, useRouter } from "next/navigation";
import { ImagePreview } from "@/components/shared/image-preview";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SupplierSearch } from "@/components/shared/supplier-search";
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

const bookSchema = z.object({
  prod_code: z.string().min(1, "Book code is required"),
  prod_name: z.string().min(1, "Book name is required"),
  short_description: z.string().optional().nullable(),
  department: z.string().min(1, "Department is required"),
  category: z.string().min(1, "Category is required"),
  sub_category: z.any().refine(
    (value) => {
      const code =
        typeof value === "object" && value !== null ? value.scat_code : value;
      return typeof code === "string" && code.length > 0;
    },
    { message: "Sub category is required" }
  ),
  supplier: z.string().min(1, "Supplier is required"),
  purchase_price: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) > 0, "Purchase price is required"),
  selling_price: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) > 0, "Selling price is required"),
  marked_price: z.union([z.string(), z.number()]).optional(),
  wholesale_price: z.union([z.string(), z.number()]).optional(),
  title_in_other_language: z.string().optional(),
  book_type: z.string().optional(),
  publisher: z.string().optional(),
  author: z.array(z.any()).optional(),
  isbn: z.string().optional(),
  publish_year: z.string().optional(),
  pack_size: z.union([z.string(), z.number()]).optional(),
  alert_qty: z.union([z.string(), z.number()]).optional(),
  width: z.union([z.string(), z.number()]).optional().nullable(),
  height: z.union([z.string(), z.number()]).optional().nullable(),
  depth: z.union([z.string(), z.number()]).optional().nullable(),
  weight: z.union([z.string(), z.number()]).optional().nullable(),
  pages: z.union([z.string(), z.number()]).optional().nullable(),
  barcode: z.string().optional().nullable(),
  images: z.array(z.any()).optional(),
  prod_image: z.any().optional(),
  description: z.string().optional(),
});

const bookSchemaResolver = zodResolver(
  bookSchema.transform((data) => {
    const subCategoryValue =
      typeof data.sub_category === "object" && data.sub_category !== null
        ? data.sub_category.scat_code
        : data.sub_category;
    const transformToString = (val: any) => (val ? String(val) : "");
    const transformToNumber = (val: any) => (val === "" ? 0 : Number(val));
    return {
      ...data,
      sub_category: subCategoryValue,
      alert_qty: transformToString(data.alert_qty),
      width: transformToString(data.width),
      height: transformToString(data.height),
      depth: transformToString(data.depth),
      weight: transformToString(data.weight),
      pages: transformToString(data.pages),
      purchase_price: transformToNumber(data.purchase_price),
      selling_price: transformToNumber(data.selling_price),
      marked_price: transformToNumber(data.marked_price),
      wholesale_price: transformToNumber(data.wholesale_price),
    };
  })
);

type FormData = z.infer<typeof bookSchema>;

interface UploadState {
  preview: string;
  file: File | null;
}
interface BookType {
  bkt_code: string;
  bkt_name: string;
}
interface Department {
  dep_code: string;
  dep_name: string;
}
interface Category {
  cat_code: string;
  cat_name: string;
}
interface SubCategory {
  scat_code: string;
  scat_name: string;
}
interface Author {
  auth_code: string;
  auth_name: string;
}

function BookFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const prod_code = searchParams.get("prod_code");
  const [activeTab, setActiveTab] = useState("general");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // States for dropdown data
  const [authors, setAuthors] = useState<Author[]>([]);
  const [bookTypes, setBookTypes] = useState<BookType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [images, setImages] = useState<UploadState[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [fetchingSubCategories, setFetchingSubCategories] = useState(false);
  const [editingTarget, setEditingTarget] = useState<
    "prod_image" | "images" | null
  >(null);
  const [productImage, setProductImage] = useState<UploadState>({
    preview: "",
    file: null,
  });
  const initialCodesRef = useRef<{ dep?: string; cat?: string; sub?: string }>(
    {}
  );

  const form = useForm<FormData>({
    resolver: bookSchemaResolver,
    defaultValues: {
      prod_code: "",
      prod_name: "",
      short_description: "",
      isbn: "",
      publish_year: "",
      title_in_other_language: "",
      book_type: "",
      department: "",
      category: "",
      sub_category: "",
      purchase_price: "",
      marked_price: "",
      selling_price: "",
      wholesale_price: "",
      publisher: "",
      supplier: "",
      author: [],
      pack_size: "",
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
      const [bookTypesRes, departmentsRes, authorsRes] = await Promise.all([
        api.get("/book-types"),
        api.get("/departments"),
        api.get("/authors"),
      ]);

      if (bookTypesRes.data.success) setBookTypes(bookTypesRes.data.data);
      if (departmentsRes.data.success) setDepartments(departmentsRes.data.data);
      if (authorsRes.data.success) setAuthors(authorsRes.data.data);
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
    [toast]
  );

  const fetchSubCategories = useCallback(async (categoryCode: string) => {
    if (!categoryCode) return;
    try {
      setFetchingSubCategories(true);
      const { data: res } = await api.get(
        `/categories/${categoryCode}/sub-categories`
      );

      if (res.success && Array.isArray(res.data)) {
        setSubCategories(res.data);
      } else {
        setSubCategories([]);
      }
    } catch (err) {
      console.error("Failed to fetch sub-categories:", err);
      setSubCategories([]);
    } finally {
      setFetchingSubCategories(false);
    }
  }, []);

  const fetchBook = useCallback(
    async (code: string) => {
      setFetching(true);
      try {
        await fetchDropdownData();

        const { data: res } = await api.get(`/books/${code}`);
        if (!res?.success)
          throw new Error(res?.message || "Failed to load book");
        const book = res.data;

        const dep = String(
          book?.sub_category?.category?.department?.dep_code ??
            book?.department ??
            ""
        );
        const cat = String(
          book?.sub_category?.category?.cat_code ?? book?.category ?? ""
        );
        const sub = String(
          book?.sub_category?.scat_code ?? book?.sub_category ?? ""
        );

        // Handle authors data - try multiple possible formats
        let auth = [];
        if (Array.isArray(book.authors)) {
          auth = book.authors;
        } else if (Array.isArray(book.author)) {
          auth = book.author;
        } else if (book.authors && typeof book.authors === "object") {
          auth = Object.values(book.authors);
        }

        auth = auth.map((author: any) => ({
          value: author.value || author.auth_code || author.id || "",
          label:
            author.label || author.auth_name || author.name || "Unknown Author",
        }));

        initialCodesRef.current = { dep, cat, sub };
        await Promise.all([fetchCategories(dep), fetchSubCategories(cat)]);

        form.reset({
          ...book,
          department: dep,
          category: cat,
          sub_category: sub,
          author: auth,
        });

        if (book?.prod_image_url) {
          setProductImage({ preview: book.prod_image_url, file: null });
        }
        if (Array.isArray(book?.image_urls)) {
          setImages(
            book.image_urls.map((url: string) => ({ preview: url, file: null }))
          );
        }
      } catch (error: any) {
        toast({
          title: "Failed to fetch book details",
          description: error?.message || "Please try again.",
          type: "error",
          duration: 3000,
        });
      } finally {
        setFetching(false);
      }
    },
    [toast, form, fetchDropdownData, fetchCategories, fetchSubCategories]
  );

  const generateBookCode = useCallback(async () => {
    setFetching(true);
    try {
      setFetching(true);
      const { data: res } = await api.get("/books/generate-code");

      if (res.success) {
        form.setValue("prod_code", res.code);
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
      fetchBook(prod_code);
    } else {
      generateBookCode();
      fetchDropdownData();
    }
  }, [isEditing, prod_code, fetchBook, generateBookCode, fetchDropdownData]);

  useEffect(() => {
    if (departmentValue) {
      fetchCategories(departmentValue);
    }
    if (categoryValue) {
      fetchSubCategories(categoryValue);
    }
  }, [departmentValue, fetchCategories, categoryValue, fetchSubCategories]);

  useEffect(() => {
    if (!isEditing) return;
    const target = initialCodesRef.current?.sub;
    if (!target) return;

    if (
      subCategories.length > 0 &&
      subCategories.some((s) => s.scat_code === target)
    ) {
      const cur = form.getValues("sub_category");
      if (cur !== target) {
        form.setValue("sub_category", target, {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
    }
  }, [isEditing, subCategories, form]);

  const handleThousandParameter = (
    value: string | number | null | undefined
  ) => {
    if (value === null || value === undefined || value === "") return "";
    const num = value.toString().replace(/,/g, "");
    if (isNaN(Number(num))) return value;
    return Number(num).toLocaleString("en-US");
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "prod_image" | "images"
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setEditingTarget(target);

    if (target === "prod_image") {
      const file = selectedFiles[0];
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

      // Append all form values
      Object.entries(values).forEach(([key, value]) => {
        if (key === "author" && Array.isArray(value)) {
          const authorCodes = value.map((v: any) => v.value).join(",");
          formDataToSend.append(key, authorCodes);
          return;
        }
        if (key === "prod_image" || key === "images") return;
        if (value !== null && value !== undefined) {
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
        ? await api.post(`/books/${prod_code}`, formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
            params: { _method: "PUT" },
          })
        : await api.post("/books", formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      if (response.status < 300) {
        toast({
          title: `Book ${isEditing ? "updated" : "created"} successfully`,
          description: `Book ${values.prod_name} ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });
        router.push("/dashboard/master/book");
      } else {
        toast({
          title: "Failed to save book",
          description: response.data.message,
          type: "error",
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.response?.data?.message || "Something went wrong",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    form.reset();
    if (productImage.preview) URL.revokeObjectURL(productImage.preview);
    setProductImage({ preview: "", file: null });
  }, [form, productImage.preview]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Book" : "Create Book"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/master/book?tab=books")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="prices">Prices</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="prod_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Book Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter book code" {...field} />
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
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter book title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isbn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ISBN</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter ISBN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="publish_year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publish Year</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter publish year"
                                {...field}
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
                            <FormLabel>Ttile in Other Language</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter title in other language"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="book_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Book Type *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select book type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {bookTypes.map((type) => (
                                  <SelectItem
                                    key={type.bkt_code}
                                    value={type.bkt_code}
                                  >
                                    {type.bkt_name}
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
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department *</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue("category", "");
                                form.setValue("sub_category", "");
                                setCategories([]);
                                setSubCategories([]);
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
                                    value={dep.dep_code}
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
                                form.setValue("sub_category", "");
                                setSubCategories([]);
                              }}
                              value={field.value}
                              disabled={!departmentValue || fetchingCategories}
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
                                    value={cat.cat_code}
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
                            <Select
                              onValueChange={field.onChange}
                              value={
                                typeof field.value === "object" &&
                                field.value !== null
                                  ? field.value.scat_code
                                  : field.value
                              }
                              disabled={!categoryValue || fetchingSubCategories}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      fetchingSubCategories
                                        ? "Loading..."
                                        : "Select sub category"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subCategories.map((sub) => (
                                  <SelectItem
                                    key={sub.scat_code}
                                    value={sub.scat_code}
                                  >
                                    {sub.scat_name}
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
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter purchase price"
                                value={handleThousandParameter(field.value)}
                                onChange={(e) => field.onChange(e.target.value)}
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
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter marked price"
                                value={handleThousandParameter(field.value)}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
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
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter selling price"
                                value={handleThousandParameter(field.value)}
                                onChange={(e) => field.onChange(e.target.value)}
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
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter wholesale price"
                                value={handleThousandParameter(field.value)}
                                onChange={(e) => field.onChange(e.target.value)}
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
                            <FormLabel>Supplier *</FormLabel>
                            <FormControl>
                              <SupplierSearch
                                value={field.value}
                                onValueChange={field.onChange}
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Authors *</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={[]}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Search authors"
                                fetchOptions={async (query) => {
                                  const res = await api.get(
                                    `/authors/search?query=${query}`
                                  );

                                  if (!res.data.success) return [];

                                  return res.data.data.map((a: Author) => ({
                                    value: a.auth_code,
                                    label: a.auth_name,
                                  }));
                                }}
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
                            <FormLabel>Pack Size</FormLabel>
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
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="width"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Width</FormLabel>
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
                              <FormLabel>Height</FormLabel>
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
                              <FormLabel>Weight</FormLabel>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="other" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                                className="h-36"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <Label>Images</Label>
                      <div>
                        <input
                          id="images-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, "images")}
                        />
                        <label
                          htmlFor="images-upload"
                          className="block min-h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-4"
                        >
                          {images.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {images.map((image, index) => (
                                <ImagePreview
                                  key={index}
                                  src={image.preview}
                                  alt={`Image ${index + 1}`}
                                  onRemove={() => removeImage(index)}
                                  onPreview={() => previewImage(image.preview)}
                                />
                              ))}
                              <div className="w-20 h-20 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                                + Add More
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-28 text-gray-500 dark:text-gray-400">
                              <span className="mx-auto my-auto">
                                + Upload Images
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
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
                              <p className="text-sm text-muted-foreground text-left">
                                This is use for recipt
                              </p>
                              <p className="text-sm text-muted-foreground text-right">
                                {shortDescriptionValue.length} / {maxLength}
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <Label>Cover Image</Label>
                      <div>
                        <input
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, "prod_image")}
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
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                              + Upload Cover Image
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Navigation Button Handler */}
              {(() => {
                const tabs = ["general", "prices", "details", "other"];
                const currentIndex = tabs.indexOf(activeTab);
                return (
                  <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                    {/* Previous Button */}
                    {currentIndex > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab(tabs[currentIndex - 1])}
                      >
                        Previous
                      </Button>
                    )}

                    {/* Next Button */}
                    {currentIndex < tabs.length - 1 && (
                      <Button
                        type="button"
                        onClick={() => setActiveTab(tabs[currentIndex + 1])}
                      >
                        Next
                      </Button>
                    )}

                    {/* Submit/Clear Buttons on "other" tab */}
                    {activeTab === "other" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleReset}
                        >
                          Clear
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading
                            ? "Saving..."
                            : isEditing
                            ? "Update"
                            : "Submit"}
                        </Button>
                      </>
                    )}
                  </div>
                );
              })()}
            </form>
          </Form>
        </CardContent>
        {fetching ? <Loader /> : null}
      </Card>

      <ImageUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleDialogSave}
        initialImage={editingImage}
        aspectRatio={14 / 20}
      />
    </div>
  );
}

export default function BookForm() {
  return (
    <Suspense fallback={<Loader />}>
      <BookFormContent />
    </Suspense>
  );
}
