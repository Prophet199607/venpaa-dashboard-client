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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const departmentSchema = z.object({
  dep_code: z
    .string()
    .min(1, "Department code is required")
    .regex(/^DEP\d{3,}$/, "Code must follow the format DEP001"),
  dep_name: z.string().min(1, "Department name is required"),
});

type FormData = z.infer<typeof departmentSchema> & {
  dep_image?: File | null;
};

interface UploadState {
  preview: string;
  file: File | null;
}

function DepartmentFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const dep_code = searchParams.get("dep_code");
  const activeTab = searchParams.get("tab") || "departments";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      dep_code: "",
      dep_name: "",
      dep_image: null,
    },
  });
  const [imagePreview, setImagePreview] = useState<UploadState>({
    preview: "",
    file: null,
  });

  const isEditing = !!dep_code;

  const fetchDepartment = useCallback(
    async (code: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(`/departments/${code}`);

        if (res.success) {
          const department = res.data;
          form.reset({
            dep_code: department.dep_code,
            dep_name: department.dep_name,
            dep_image: null,
          });

          if (department.dep_image_url) {
            setImagePreview({
              preview: department.dep_image_url,
              file: null,
            });
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch department:", err);
        toast({
          title: "Failed to load department",
          description: err.response?.data?.message || "Please try again",
          type: "error",
          duration: 3000,
        });
      } finally {
        setFetching(false);
      }
    },
    [toast, form]
  );

  const generateDepartmentCode = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/departments/generate-code");

      if (res.success) {
        form.setValue("dep_code", res.code);
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

    if (isEditing && dep_code) {
      fetchDepartment(dep_code);
    } else {
      generateDepartmentCode();
    }
  }, [isEditing, dep_code, fetchDepartment, generateDepartmentCode]);

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

    form.setValue("dep_image", file);

    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
    setImagePreview({ preview: "", file: null });
    form.setValue("dep_image", null);
  };

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("dep_code", values.dep_code);
      formDataToSend.append("dep_name", values.dep_name);

      if (values.dep_image) {
        formDataToSend.append("dep_image", values.dep_image);
      }

      let response;
      if (isEditing && dep_code) {
        formDataToSend.append("_method", "PUT");
        response = await api.post(`/departments/${dep_code}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/departments", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Department updated" : "Department created",
          description: `Department ${values.dep_name} ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });

        router.push(`/dashboard/master/department?tab=departments`);
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
    const currentDepCode = form.getValues("dep_code");
    form.reset({
      dep_code: currentDepCode,
      dep_name: "",
      dep_image: null,
    });
    setImagePreview({ preview: "", file: null });

    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
  }, [form, imagePreview.preview]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Department" : "Create Department"}
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="dep_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter department code (e.g., DEP001)"
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
                      name="dep_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter department name (e.g., Books, etc...)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Department Image</Label>
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
                            alt="Department preview"
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
                            Upload Department Image
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

export default function CreateForm() {
  return (
    <Suspense fallback={<Loader />}>
      <DepartmentFormContent />
    </Suspense>
  );
}