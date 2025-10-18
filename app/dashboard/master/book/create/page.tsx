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
import { ImagePreview } from "@/components/ui/ImagePreview";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";
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
  book_code: z
    .string()
    .min(1, "Book code is required")
    .regex(/^BK\d{3,}$/, "Code must follow the format BK001"),
  title: z.string().min(1, "Book title is required"),
  isbn: z.string().optional(),
  publish_year: z.string().optional(),
  book_type: z.string().min(1, "Book type is required"),
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
  publisher: z.string().min(1, "Publisher is required"),
  supplier: z.string().min(1, "Supplier is required"),
  author: z.string().min(1, "Author is required"),
  // TODO: Fix decimal & integer validations
  pack_size: z.string().optional(),
  alert_qty: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  depth: z.string().optional(),
  weight: z.string().optional(),
  pages: z.string().optional(),
  barcode: z.string().optional(),
  images: z.array(z.any()).optional(),
  cover_image: z.any().optional(),
  description: z.string().optional(),
});

const bookSchemaResolver = zodResolver(
  bookSchema.transform((data) => {
    const subCategoryValue =
      typeof data.sub_category === "object" && data.sub_category !== null
        ? data.sub_category.scat_code
        : data.sub_category;
    return { ...data, sub_category: subCategoryValue };
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
interface Publisher {
  pub_code: string;
  pub_name: string;
}
interface Supplier {
  sup_code: string;
  sup_name: string;
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
  const book_code = searchParams.get("book_code");
  const [activeTab, setActiveTab] = useState("general");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // States for dropdown data
  const [authors, setAuthors] = useState<Author[]>([]);
  const [bookTypes, setBookTypes] = useState<BookType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [images, setImages] = useState<UploadState[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [fetchingSubCategories, setFetchingSubCategories] = useState(false);
  const [editingTarget, setEditingTarget] = useState<
    "cover_image" | "images" | null
  >(null);
  const [coverImage, setCoverImage] = useState<UploadState>({
    preview: "",
    file: null,
  });
  const initialCodesRef = useRef<{ dep?: string; cat?: string; sub?: string }>(
    {}
  );

  const form = useForm<FormData>({
    resolver: bookSchemaResolver,
    defaultValues: {
      book_code: "",
      title: "",
      isbn: "",
      publish_year: "",
      book_type: "",
      department: "",
      category: "",
      sub_category: "",
      publisher: "",
      supplier: "",
      author: "",
      pack_size: "",
      alert_qty: "",
      width: "",
      height: "",
      depth: "",
      weight: "",
      pages: "",
      barcode: "",
      images: [],
      cover_image: null,
      description: "",
    },
  });

  const departmentValue = form.watch("department");
  const categoryValue = form.watch("category");

  const isEditing = !!book_code;

  const fetchDropdownData = useCallback(async () => {
    setFetching(true);
    try {
      const [
        bookTypesRes,
        departmentsRes,
        publishersRes,
        suppliersRes,
        authorsRes,
      ] = await Promise.all([
        api.get("/book-types"),
        api.get("/departments"),
        api.get("/publishers"),
        api.get("/suppliers"),
        api.get("/authors"),
      ]);

      if (bookTypesRes.data.success) setBookTypes(bookTypesRes.data.data);
      if (departmentsRes.data.success) setDepartments(departmentsRes.data.data);
      if (publishersRes.data.success) setPublishers(publishersRes.data.data);
      if (suppliersRes.data.success) setSuppliers(suppliersRes.data.data);
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

        initialCodesRef.current = { dep, cat, sub };

        await Promise.all([fetchCategories(dep), fetchSubCategories(cat)]);

        form.reset({
          ...book,
          department: dep,
          category: cat,
          sub_category: sub,
        });

        if (book?.cover_image_url) {
          setCoverImage({ preview: book.cover_image_url, file: null });
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
    try {
      setFetching(true);
      const { data: res } = await api.get("/books/generate-code");

      if (res.success) {
        form.setValue("book_code", res.code);
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

    if (isEditing && book_code) {
      fetchBook(book_code);
    } else {
      generateBookCode();
      fetchDropdownData();
    }
  }, [isEditing, book_code, fetchBook, generateBookCode, fetchDropdownData]);

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

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "cover_image" | "images"
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setEditingTarget(target);

    if (target === "cover_image") {
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
    if (editingTarget === "cover_image") {
      const previewUrl = URL.createObjectURL(file);
      if (coverImage.preview) URL.revokeObjectURL(coverImage.preview);
      setCoverImage({ preview: previewUrl, file });
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
        if (key === "cover_image" || key === "images") return;
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      if (coverImage.file) {
        formDataToSend.append("cover_image", coverImage.file);
      }

      images.forEach((imageState) => {
        if (imageState.file) {
          formDataToSend.append("images[]", imageState.file);
        }
      });

      const response = isEditing
        ? await api.post(`/books/${book_code}`, formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
            params: { _method: "PUT" },
          })
        : await api.post("/books", formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      if (response.status < 300) {
        toast({
          title: `Book ${isEditing ? "updated" : "created"} successfully`,
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
    if (coverImage.preview) URL.revokeObjectURL(coverImage.preview);
    setCoverImage({ preview: "", file: null });
  }, [form, coverImage.preview]);

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
            onClick={() => router.back()}
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
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="book_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Book Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter book code (e.g., BK001)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
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
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="book_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Book Type</FormLabel>
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
                            <FormLabel>Department</FormLabel>
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
                            <FormLabel>Category</FormLabel>
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
                            <FormLabel>Sub Category</FormLabel>
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
                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="publisher"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publisher</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select publisher" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {publishers.map((pub) => (
                                  <SelectItem
                                    key={pub.pub_code}
                                    value={pub.pub_code}
                                  >
                                    {pub.pub_name}
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
                        name="supplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers.map((sup) => (
                                  <SelectItem
                                    key={sup.sup_code}
                                    value={sup.sup_code}
                                  >
                                    {sup.sup_name}
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
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select author" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {authors.map((auth) => (
                                  <SelectItem
                                    key={auth.auth_code}
                                    value={auth.auth_code}
                                  >
                                    {auth.auth_name}
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
                        name="pack_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pack Size</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter pack size"
                                {...field}
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
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              + Upload Images
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Cover Image</Label>
                      <div>
                        <input
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, "cover_image")}
                        />
                        <label
                          htmlFor="cover-upload"
                          className="block w-36 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden"
                        >
                          {coverImage.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coverImage.preview}
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

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                {(activeTab === "details" || activeTab === "other") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setActiveTab(
                        activeTab === "details" ? "general" : "details"
                      )
                    }
                  >
                    Previous
                  </Button>
                )}

                {activeTab === "general" && (
                  <Button type="button" onClick={() => setActiveTab("details")}>
                    Next
                  </Button>
                )}
                {activeTab === "details" && (
                  <Button type="button" onClick={() => setActiveTab("other")}>
                    Next
                  </Button>
                )}

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
                      {loading ? "Saving..." : isEditing ? "Update" : "Submit"}
                    </Button>
                  </>
                )}
              </div>
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
