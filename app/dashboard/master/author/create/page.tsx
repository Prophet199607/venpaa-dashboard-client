"use client";

import Link from "next/link";
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

const authorSchema = z.object({
  auth_code: z
    .string()
    .min(1, "Author code is required")
    .regex(/^AUT\d{3,}$/, "Code must follow the format AUT001"),
  auth_name: z.string().min(1, "Author name is required"),
  auth_name_tamil: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof authorSchema> & {
  auth_image?: File | null;
};

interface UploadState {
  preview: string;
  file: File | null;
}

function AuthorFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const auth_code = searchParams.get("auth_code");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      auth_code: "",
      auth_name: "",
      auth_name_tamil: "",
      description: "",
      auth_image: null,
    },
  });

  const [imagePreview, setImagePreview] = useState<UploadState>({
    preview: "",
    file: null,
  });

  const isEditing = !!auth_code;

  const generateAuthorCode = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/authors/generate-code");

      if (res.success) {
        form.setValue("auth_code", res.code);
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

  const fetchAuthor = useCallback(
    async (code: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(`/authors/${code}`);

        if (res.success) {
          const author = res.data;
          form.reset({
            auth_code: author.auth_code,
            auth_name: author.auth_name,
            auth_name_tamil: author.auth_name_tamil || "",
            description: author.description || "",
            auth_image: null,
          });

          if (author.auth_image_url) {
            setImagePreview({
              preview: author.auth_image_url,
              file: null,
            });
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch author:", err);
        toast({
          title: "Failed to load author",
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

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (isEditing && auth_code) {
      fetchAuthor(auth_code);
    } else {
      generateAuthorCode();
    }
  }, [isEditing, auth_code, fetchAuthor, generateAuthorCode]);

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

    form.setValue("auth_image", file);

    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
    setImagePreview({ preview: "", file: null });
    form.setValue("auth_image", null);
  };

  const onSubmit = (values: FormData) => {
    const submit = async () => {
      setLoading(true);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("auth_code", values.auth_code);
        formDataToSend.append("auth_name", values.auth_name);
        formDataToSend.append("auth_name_tamil", values.auth_name_tamil || "");
        formDataToSend.append("description", values.description || "");

        if (imagePreview.file) {
          formDataToSend.append("auth_image", imagePreview.file);
        }

        let response;
        if (isEditing && auth_code) {
          formDataToSend.append("_method", "PUT");
          response = await api.post(`/authors/${auth_code}`, formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          response = await api.post("/authors", formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        if (response.data.success) {
          toast({
            title: isEditing ? "Author updated" : "Author created",
            description: `Author ${values.auth_name} ${
              isEditing ? "updated" : "created"
            } successfully`,
            type: "success",
            duration: 3000,
          });

          router.push("/dashboard/master/author");
        }
      } catch (error: any) {
        console.error("Failed to submit form:", error);

        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          Object.keys(errors).forEach((key) => {
            form.setError(key as any, {
              type: "manual",
              message: errors[key][0],
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
    submit();
  };

  const handleReset = useCallback(() => {
    form.reset({
      auth_code: "",
      auth_name: "",
      auth_name_tamil: "",
      description: "",
      auth_image: null,
    });

    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
    setImagePreview({ preview: "", file: null });
  }, [form, imagePreview.preview]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Author" : "Create Author"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 self-start md:self-auto"
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
                    name="auth_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Author code (e.g., AUT001)"
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
                    name="auth_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter author name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="auth_name_tamil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name in Tamil</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Author name in Tamil"
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
                  <Label>Author Image</Label>
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
                            alt="Author preview"
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
                            Upload Author Image
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

export default function AuthorForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthorFormContent />
    </Suspense>
  );
}
