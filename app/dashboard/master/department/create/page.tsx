"use client";

import { ArrowLeft } from "lucide-react";
import { departments, categories, subCategories } from "@/lib/data";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Department {
  id: number;
  depCode: string;
  depName: string;
}

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

type FormType = "departments" | "categories" | "subcategories";

function CreateFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const activeTab = (searchParams.get("tab") as FormType) || "departments";

  const [departmentForm, setDepartmentForm] = useState({
    depCode: "",
    depName: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    catCode: "",
    catName: "",
    slug: "",
    subCategories: "",
  });

  const [subCategoryForm, setSubCategoryForm] = useState({
    subCatCode: "",
    subCatName: "",
  });

  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  );
  const [isEditing, setIsEditing] = useState(false);

  // Find the item to edit based on active tab
  const itemToEdit = id
    ? activeTab === "departments"
      ? departments.find((dep) => dep.depCode === id)
      : activeTab === "categories"
      ? categories.find((cat) => cat.catCode === id)
      : subCategories.find((sub) => sub.subCatCode === id)
    : null;

  const handleReset = useCallback(() => {
    // Reset form based on active tab
    if (activeTab === "departments") {
      setDepartmentForm({ depCode: "", depName: "" });
    } else if (activeTab === "categories") {
      setCategoryForm({
        catCode: "",
        catName: "",
        slug: "",
        subCategories: "",
      });
      setSelectedSubCategories([]);
    } else {
      setSubCategoryForm({ subCatCode: "", subCatName: "" });
    }

    // Only clear URL parameters if editing
    if (isEditing) {
      router.push(`/dashboard/master/department/create?tab=${activeTab}`);
    }
    setIsEditing(false);
  }, [activeTab, isEditing, router]);

  const handleBack = () => {
    router.push(`/dashboard/master/department?tab=${activeTab}`);
  };

  useEffect(() => {
    if (itemToEdit) {
      if (activeTab === "departments") {
        const dept = itemToEdit as Department;
        setDepartmentForm({
          depCode: dept.depCode,
          depName: dept.depName,
        });
      } else if (activeTab === "categories") {
        const cat = itemToEdit as Category;
        setCategoryForm({
          catCode: cat.catCode,
          catName: cat.catName,
          slug: cat.slug,
          subCategories: cat.subCategories,
        });
        const existingSubCats = cat.subCategories.split(", ").filter(Boolean);
        setSelectedSubCategories(existingSubCats);
      } else {
        const subCat = itemToEdit as SubCategory;
        setSubCategoryForm({
          subCatCode: subCat.subCatCode,
          subCatName: subCat.subCatName,
        });
      }
      setIsEditing(true);
    } else {
      handleReset();
    }
  }, [itemToEdit, activeTab, handleReset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "departments") {
      if (isEditing) {
        console.log("Updating department:", departmentForm);
        alert(`Department ${departmentForm.depCode} updated successfully!`);
      } else {
        console.log("Creating department:", departmentForm);
        alert(`Department ${departmentForm.depCode} created successfully!`);
      }
    } else if (activeTab === "categories") {
      const updatedCategoryForm = {
        ...categoryForm,
        subCategories: selectedSubCategories.join(", "),
      };
      if (isEditing) {
        console.log("Updating category:", updatedCategoryForm);
        alert(`Category ${updatedCategoryForm.catCode} updated successfully!`);
      } else {
        console.log("Creating category:", updatedCategoryForm);
        alert(`Category ${updatedCategoryForm.catCode} created successfully!`);
      }
    } else {
      if (isEditing) {
        console.log("Updating sub-category:", subCategoryForm);
        alert(
          `Sub Category ${subCategoryForm.subCatCode} updated successfully!`
        );
      } else {
        console.log("Creating sub-category:", subCategoryForm);
        alert(
          `Sub Category ${subCategoryForm.subCatCode} created successfully!`
        );
      }
    }

    router.push(`/dashboard/master/department?tab=${activeTab}`);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    formType: FormType
  ) => {
    const { id, value } = e.target;
    if (formType === "departments") {
      setDepartmentForm((prev) => ({ ...prev, [id]: value }));
    } else if (formType === "categories") {
      setCategoryForm((prev) => ({ ...prev, [id]: value }));
    } else {
      setSubCategoryForm((prev) => ({ ...prev, [id]: value }));
    }
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

  const getFormTitle = () => {
    const action = isEditing ? "Edit" : "Create";
    if (activeTab === "departments") return `${action} Department`;
    if (activeTab === "categories") return `${action} Category`;
    return `${action} Sub Category`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">{getFormTitle()}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {activeTab === "departments" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="depCode">Department Code</Label>
                  <Input
                    id="depCode"
                    placeholder="e.g., DEP0001"
                    value={departmentForm.depCode}
                    onChange={(e) => handleChange(e, "departments")}
                    required
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depName">Department Name</Label>
                  <Input
                    id="depName"
                    placeholder="Enter Department Name"
                    value={departmentForm.depName}
                    onChange={(e) => handleChange(e, "departments")}
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="catCode">Category Code</Label>
                  <Input
                    id="catCode"
                    placeholder="e.g., C0001"
                    value={categoryForm.catCode}
                    onChange={(e) => handleChange(e, "categories")}
                    required
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catName">Category Name</Label>
                  <Input
                    id="catName"
                    placeholder="E.g., Fiction"
                    value={categoryForm.catName}
                    onChange={(e) => handleChange(e, "categories")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="E.g., fiction"
                    value={categoryForm.slug}
                    onChange={(e) => handleChange(e, "categories")}
                    required
                  />
                </div>

                <div className="md:col-span-3 space-y-4">
                  <Label className="text-base font-medium">
                    Sub Categories
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
                    {subCategories.map((subCat) => (
                      <div
                        key={subCat.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`subcat-${subCat.id}`}
                          checked={selectedSubCategories.includes(
                            subCat.subCatName
                          )}
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
              </div>
            )}

            {activeTab === "subcategories" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subCatCode">Sub Category Code</Label>
                  <Input
                    id="subCatCode"
                    placeholder="e.g., SC0001"
                    value={subCategoryForm.subCatCode}
                    onChange={(e) => handleChange(e, "subcategories")}
                    required
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subCatName">Sub Category Name</Label>
                  <Input
                    id="subCatName"
                    placeholder="Enter Sub Category Name"
                    value={subCategoryForm.subCatName}
                    onChange={(e) => handleChange(e, "subcategories")}
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={handleReset}>
                Clear
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Submit"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateFormContent />
    </Suspense>
  );
}
