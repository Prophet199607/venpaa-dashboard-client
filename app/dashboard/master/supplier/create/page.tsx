"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const supplierSchema = z.object({
  sup_code: z
    .string()
    .min(1, "Supplier code is required")
    .regex(/^SUP\d{3,}$/, "Code must follow the format SUP001"),
  sup_name: z.string().min(1, "Supplier name is required"),
  company: z.string().optional(),
  address: z.string().optional(),
  mobile: z.string().optional(),
  telephone: z.string().optional(),
  email: z
    .union([z.string().email("Invalid email address"), z.literal("")])
    .optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof supplierSchema> & {
  sup_image?: File | null;
};

interface UploadState {
  preview: string;
  file: File | null;
}

function SupplierFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const sup_code = searchParams.get("sup_code");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      sup_code: "",
      sup_name: "",
      company: "",
      address: "",
      mobile: "",
      telephone: "",
      email: "",
      description: "",
      sup_image: null,
    },
  });

  const [imagePreview, setImagePreview] = useState<UploadState>({
    preview: "",
    file: null,
  });

  const isEditing = !!sup_code;

  const generateSupplierCode = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("suppliers/generate-code");

      if (res.success) {
        form.setValue("sup_code", res.code);
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

  const fetchSupplier = useCallback(
    async (code: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(`suppliers/${code}`);

        if (res.success) {
          const supplier = res.data;
          form.reset({
            sup_code: supplier.sup_code,
            sup_name: supplier.sup_name,
            company: supplier.company || "",
            address: supplier.address || "",
            mobile: supplier.mobile || "",
            telephone: supplier.telephone || "",
            email: supplier.email || "",
            description: supplier.description || "",
            sup_image: null,
          });

          if (supplier.sup_image_url) {
            setImagePreview({
              preview: supplier.sup_image_url,
              file: null,
            });
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch supplier:", err);
        toast({
          title: "Failed to fetch supplier",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast, form]
  );

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (isEditing && sup_code) {
      fetchSupplier(sup_code);
    } else {
      generateSupplierCode();
    }
  }, [isEditing, sup_code, fetchSupplier, generateSupplierCode]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        type: "error",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        type: "error",
      });
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);

    // Clean up previous preview if exists
    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }

    setImagePreview({
      preview: previewUrl,
      file: file,
    });

    form.setValue("sup_image", file);

    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
    setImagePreview({ preview: "", file: null });
    form.setValue("sup_image", null);
  };

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("sup_code", values.sup_code);
      formDataToSend.append("sup_name", values.sup_name);
      formDataToSend.append("company", values.company || "");
      formDataToSend.append("address", values.address || "");
      formDataToSend.append("mobile", values.mobile || "");
      formDataToSend.append("telephone", values.telephone || "");
      formDataToSend.append("email", values.email || "");
      formDataToSend.append("description", values.description || "");

      if (imagePreview.file) {
        formDataToSend.append("sup_image", imagePreview.file);
      }

      let response;
      if (isEditing && sup_code) {
        formDataToSend.append("_method", "PUT");
        response = await api.post(`/suppliers/${sup_code}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/suppliers", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Supplier updated" : "Supplier created",
          description: `Supplier ${values.sup_name} ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });

        router.push("/dashboard/master/supplier");
      }
    } catch (error: any) {
      console.error("Failed to submit form:", error);

      // Show validation errors if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((key) => {
          form.setError(key as any, {
            type: "manual",
            message: errors[key][0],
          });
          toast({
            title: "Validation Error",
            description: errors[key][0],
            type: "error",
            duration: 5000,
          });
        });
      } else {
        toast({
          title: "Operation failed",
          description: error.response?.data?.message || "Please try again",
          type: "error",
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    form.reset({
      sup_code: "",
      sup_name: "",
      company: "",
      address: "",
      mobile: "",
      telephone: "",
      email: "",
      description: "",
      sup_image: null,
    });

    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
    setImagePreview({ preview: "", file: null });
  }, [form, imagePreview.preview]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Supplier" : "Create Supplier"}
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
                    name="sup_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter supplier code (e.g., SUP001)"
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
                    name="sup_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter supplier name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile No</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mobile no" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telephone No</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter telephone no" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
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

                <div className="space-y-4 md:col-span-2">
                  <Label>Supplier Image</Label>
                  <div className="space-y-3">
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <label
                      htmlFor="image-upload"
                      className="block w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden"
                    >
                      {imagePreview.preview ? (
                        <div className="relative w-full h-full group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreview.preview}
                            alt="Publisher preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              Change Image
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <div className="text-2xl mb-2">+</div>
                          <div className="text-sm text-center px-2">
                            Upload Supplier Image
                          </div>
                        </div>
                      )}
                    </label>

                    {imagePreview.preview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={removeImage}
                        className="w-fit mt-2"
                      >
                        Remove Image
                      </Button>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Supported formats: JPEG, PNG, GIF, WebP • Max size: 2MB
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
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

export default function SupplierForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupplierFormContent />
    </Suspense>
  );
}
