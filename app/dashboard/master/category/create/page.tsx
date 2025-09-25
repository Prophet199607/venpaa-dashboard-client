"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { categories, subCategories } from "@/lib/data";
import { ArrowLeft } from "lucide-react";

interface Category {
  id: number;
  catCode: string;
  catName: string;
  slug: string;
  subCategories: string;
}

interface SubCategory {
  id: number;
  subCatCode: string;
  subCatName: string;
}

function CategoryFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [formData, setFormData] = useState({
    catCode: "",
    catName: "",
    slug: "",
    subCategories: "",
  });
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  );
  const [isEditing, setIsEditing] = useState(false);

  // Find the category to edit
  const categoryToEdit = id ? categories.find((c) => c.catCode === id) : null;

  const handleReset = useCallback(() => {
    setFormData({
      catCode: "",
      catName: "",
      slug: "",
      subCategories: "",
    });
    setSelectedSubCategories([]);
    setIsEditing(false);

    if (isEditing) {
      router.push("/dashboard/master/category/create");
    }
  }, [isEditing, router]);

  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        catCode: categoryToEdit.catCode,
        catName: categoryToEdit.catName,
        slug: categoryToEdit.slug,
        subCategories: categoryToEdit.subCategories,
      });

      // Parse existing subcategories from the category
      const existingSubCats = categoryToEdit.subCategories
        .split(", ")
        .filter(Boolean);
      setSelectedSubCategories(existingSubCats);
      setIsEditing(true);
    } else {
      handleReset();
    }
  }, [categoryToEdit, handleReset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubCategoryToggle = (subCatName: string) => {
    setSelectedSubCategories((prev) => {
      if (prev.includes(subCatName)) {
        return prev.filter((name) => name !== subCatName);
      } else {
        return [...prev, subCatName];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update formData with selected subcategories
    const updatedFormData = {
      ...formData,
      subCategories: selectedSubCategories.join(", "),
    };

    if (isEditing) {
      console.log("Updating category:", updatedFormData);
      alert(`Category ${updatedFormData.catCode} updated successfully!`);
    } else {
      console.log("Creating category:", updatedFormData);
      alert(`Category ${updatedFormData.catCode} created successfully!`);
    }

    router.push("/dashboard/master/category");
  };

  const isSubCategorySelected = (subCatName: string) => {
    return selectedSubCategories.includes(subCatName);
  };

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
                <Label htmlFor="catCode">Category Code</Label>
                <Input
                  id="catCode"
                  placeholder="e.g., C0001"
                  value={formData.catCode}
                  onChange={handleChange}
                  required
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catName">Category Name</Label>
                <Input
                  id="catName"
                  placeholder="E.g., Fiction"
                  value={formData.catName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="E.g., fiction"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Sub Categories Section - Full width */}
              <div className="md:col-span-3 space-y-4">
                <Label className="text-base font-medium">Sub Categories</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
                  {subCategories.map((subCat) => (
                    <div
                      key={subCat.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`subcat-${subCat.id}`}
                        checked={isSubCategorySelected(subCat.subCatName)}
                        onCheckedChange={() =>
                          handleSubCategoryToggle(subCat.subCatName)
                        }
                      />
                      <Label
                        htmlFor={`subcat-${subCat.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {subCat.subCatName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3 flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Clear
                </Button>
                <Button type="submit">{isEditing ? "Update" : "Submit"}</Button>
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
