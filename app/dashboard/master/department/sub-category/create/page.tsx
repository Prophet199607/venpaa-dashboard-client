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

interface SubCategory {
  scat_code: string;
  scat_name: string;
}

function SubCategoryFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const scat_code = searchParams.get("scat_code");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState<SubCategory>({
    scat_code: "",
    scat_name: "",
  });

  const isEditing = !!scat_code;

  const fetchSubcategory = useCallback(
    async (code: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(`/sub-categories/${code}`);

        if (res.success) {
          const subCategories = res.data;
          setFormData({
            scat_code: subCategories.scat_code,
            scat_name: subCategories.scat_name,
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch sub category:", err);
        toast({
          title: "Failed to load sub category",
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

  const generateSubCategoryCode = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/sub-categories/generate-code");

      if (res.success) {
        setFormData((prev) => ({
          ...prev,
          scat_code: res.code,
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

  const handleReset = useCallback(() => {
    setFormData({
      scat_code: "",
      scat_name: "",
    });
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (isEditing && scat_code) {
      fetchSubcategory(scat_code);
    } else {
      generateSubCategoryCode();
    }
  }, [isEditing, scat_code, fetchSubcategory, generateSubCategoryCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("scat_code", formData.scat_code);
      formDataToSend.append("scat_name", formData.scat_name);

      let response;
      if (isEditing && scat_code) {
        formDataToSend.append("_method", "PUT");
        response = await api.post(
          `/sub-categories/${scat_code}`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        response = await api.post("/sub-categories", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Sub category updated" : "Sub category created",
          description: `Sub category ${formData.scat_name} ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });

        router.push(`/dashboard/master/department?tab=subcategories`);
      }
    } catch (error: any) {
      console.error("Failed to submit form:", error);
      if (error.response?.status === 422) {
        toast({
          title: "Validation error",
          description: error.response?.data?.message,
          type: "error",
          duration: 3000,
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
        <CardHeader className="flex items-center justify-between">
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
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-2">
              <Label htmlFor="scat_code">Sub Category Code</Label>
              <Input
                name="scat_code"
                placeholder="e.g., SC0001"
                value={formData.scat_code}
                onChange={handleChange}
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scat_name">Sub Category Name</Label>
              <Input
                name="scat_name"
                placeholder="Enter Sub Category Name"
                value={formData.scat_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end pt-6 border-t mt-6">
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
