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
  cat_code: string;
  cat_name: string;
  department: string;
  cat_slug: string;
  cat_image: File | null;
}

interface UploadState {
  preview: string;
  file: File | null;
}

function CategoryFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const cat_code = searchParams.get("cat_code");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState<Category>({
    cat_code: "",
    cat_name: "",
    department: "",
    cat_slug: "",
    cat_image: null,
  });

  const [imagePreview, setImagePreview] = useState<{
    preview: string;
    file: File | null;
  }>({
    preview: "",
    file: null,
  });

  const isEditing = !!cat_code;

  const fetchDepartments = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/departments");

      if (!res.success) throw new Error(res.message);

      // Example API response shape adjustment
      const mapped = res.data.map((dep: any) => ({
        id: dep.id,
        dep_code: dep.dep_code,
        dep_name: dep.dep_name,
      }));

      setDepartments(mapped);
    } catch (err: any) {
      console.error("Failed to fetch departments:", err);
      toast({
        title: "Failed to load departments",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const fetchCategory = useCallback(
    async (code: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(`/categories/${code}`);

        if (res.success) {
          const categories = res.data;
          setFormData({
            cat_code: categories.cat_code,
            cat_name: categories.cat_name,
            department: categories.department,
            cat_slug: categories.cat_slug,
            cat_image: null,
          });

          if (categories.cat_image_url) {
            setImagePreview({
              preview: categories.cat_image_url,
              file: null,
            });
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch category:", err);
        toast({
          title: "Failed to load category",
          description: err.response?.data?.message || "Please try again",
          type: "error",
          duration: 3000,
        });
      } finally {
        setFetching(false);
      }
    },
    [toast]
  );

  const generateCategoryCode = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/categories/generate-code");

      if (res.success) {
        setFormData((prev) => ({
          ...prev,
          cat_code: res.code,
        }));
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
  }, [toast]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchDepartments();

    if (isEditing && cat_code) {
      fetchCategory(cat_code);
    } else {
      generateCategoryCode();
    }
  }, [
    isEditing,
    cat_code,
    fetchCategory,
    generateCategoryCode,
    fetchDepartments,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }));
  };

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

    setFormData((prev) => ({
      ...prev,
      cat_image: file,
    }));

    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
    setImagePreview({ preview: "", file: null });
    setFormData((prev) => ({
      ...prev,
      cat_image: null,
    }));
  };

  const handleReset = useCallback(() => {
    setFormData({
      cat_code: "",
      cat_name: "",
      department: "",
      cat_slug: "",
      cat_image: null,
    });
    setImagePreview({ preview: "", file: null });

    if (imagePreview.preview) {
      URL.revokeObjectURL(imagePreview.preview);
    }
  }, [imagePreview.preview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("cat_code", formData.cat_code);
      formDataToSend.append("cat_name", formData.cat_name);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("cat_slug", formData.cat_slug);

      if (formData.cat_image) {
        formDataToSend.append("cat_image", formData.cat_image);
      }

      let response;
      if (isEditing && cat_code) {
        formDataToSend.append("_method", "PUT");
        response = await api.post(`/categories/${cat_code}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/categories", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Category updated" : "Category created",
          description: `Category ${formData.cat_name} ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });

        router.push(`/dashboard/master/department?tab=categories`);
      }
    } catch (error: any) {
      console.error("Failed to submit form:", error);

      // Show validation errors if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((key) => {
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

  if (fetching) return <Loader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Category" : "Create Category"}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cat_code">Category Code</Label>
                <Input
                  name="cat_code"
                  placeholder="e.g., C0001"
                  value={formData.cat_code}
                  onChange={handleChange}
                  required
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat_name">Category Name</Label>
                <Input
                  name="cat_name"
                  placeholder="E.g., Fiction"
                  value={formData.cat_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat_slug">Slug</Label>
                <Input
                  name="cat_slug"
                  placeholder="E.g., fiction"
                  value={formData.cat_slug}
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

              <div className="space-y-4">
                <Label>Category Image</Label>
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
                          alt="Category preview"
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
                          Upload Category Image
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CategoryForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoryFormContent />
    </Suspense>
  );
}
