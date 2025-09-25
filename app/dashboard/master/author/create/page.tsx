"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { authors } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";

interface Author {
  id: number;
  authCode: string;
  authName: string;
  authNameTamil: string;
  slug: string;
  description: string;
}

export default function AuthorForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    authCode: "",
    authName: "",
    authNameTamil: "",
    slug: "",
    description: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Find the author to edit
  const authorToEdit = id ? authors.find((a) => a.authCode === id) : null;

  const handleReset = useCallback(() => {
    setFormData({
      authCode: "",
      authName: "",
      authNameTamil: "",
      slug: "",
      description: "",
    });
    setIsEditing(false);

    if (isEditing) {
      router.push("/dashboard/master/author/create");
    }
  }, [isEditing, router]);

  useEffect(() => {
    if (authorToEdit) {
      setFormData({
        authCode: authorToEdit.authCode,
        authName: authorToEdit.authName,
        authNameTamil: authorToEdit.authNameTamil,
        slug: authorToEdit.slug,
        description: authorToEdit.description,
      });
      setIsEditing(true);
    } else {
      handleReset();
    }
  }, [authorToEdit, handleReset]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInitialImage(reader.result as string);
      setDialogOpen(true);
    };
    reader.readAsDataURL(file);
    try {
      e.currentTarget.value = "";
    } catch {}
  }

  function handleDialogSave(file: File) {
    const url = URL.createObjectURL(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(url);
    setDialogOpen(false);
    setInitialImage(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name") as string,
      nameTamil: form.get("nameTamil") as string,
      slug: form.get("slug") as string,
      address: form.get("address") as string,
      imageFile,
    };
    console.log("Submit author:", payload);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Author" : "Create Author"}
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
              <Label htmlFor="authCode">Author Code</Label>
              <Input
                name="authCode"
                placeholder="e.g., A0001"
                value={formData.authCode}
                onChange={handleChange}
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authName">Author Name</Label>
              <Input
                name="authName"
                placeholder="EnterAuthor Name"
                value={formData.authName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authNameTamil">Name in Tamil</Label>
              <Input
                name="authNameTamil"
                placeholder="Name in Tamil"
                value={formData.authNameTamil}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                name="slug"
                placeholder="slug"
                value={formData.slug}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="description"
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div>
                <input
                  id="author-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageInputChange}
                />
                <label
                  htmlFor="author-image"
                  className="relative w-full h-40 max-w-md border-dashed border-2 border-neutral-200 rounded flex items-center justify-center text-sm text-neutral-500 cursor-pointer overflow-hidden"
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Author image preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>+ Upload</span>
                  )}
                </label>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                Clear
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Submit"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ImageUploadDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setInitialImage(null);
        }}
        initialImage={initialImage}
        onSave={(file: File) => handleDialogSave(file)}
      />
    </div>
  );
}
