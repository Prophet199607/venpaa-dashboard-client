"use client";

import Link from "next/link";
import { publishers } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";

interface Publisher {
  id: number;
  pubCode: string;
  pubName: string;
  slug: string;
  description: string;
  contact: string;
  email: string;
  website: string;
  image?: string;
}

export default function PublisherForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [initialImage, setInitialImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    pubCode: "",
    pubName: "",
    slug: "",
    description: "",
    contact: "",
    email: "",
    website: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Find the publisher to edit
  const publisherToEdit = id
    ? publishers.find((pub) => pub.pubCode === id)
    : null;

  useEffect(() => {
    if (publisherToEdit) {
      setFormData({
        pubCode: publisherToEdit.pubCode,
        pubName: publisherToEdit.pubName,
        slug: publisherToEdit.slug,
        description: publisherToEdit.description,
        contact: publisherToEdit.contact,
        email: publisherToEdit.email,
        website: publisherToEdit.website,
      });
      setIsEditing(true);
    } else {
      handleReset();
    }
  }, [publisherToEdit]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function handleLogoInputChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(url);
    setDialogOpen(false);
    setInitialImage(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // Example: collect values; wire to API as needed
    const payload = {
      name: form.get("name") as string,
      slug: form.get("slug") as string,
      description: form.get("description") as string,
      contact: form.get("contact") as string,
      email: form.get("email") as string,
      website: form.get("website") as string,
      logoFile,
    };
    console.log("Submit publisher:", payload);
  }

  const handleReset = () => {
    setFormData({
      pubCode: "",
      pubName: "",
      slug: "",
      description: "",
      contact: "",
      email: "",
      website: "",
    });
    setIsEditing(false);

    if (isEditing) {
      router.push("/dashboard/master/publisher/create");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Publisher" : "Create Publisher"}
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
              <Label htmlFor="pubCode">Publisher Code</Label>
              <Input
                name="pubCode"
                placeholder="e.g., P0001"
                value={formData.pubCode}
                onChange={handleChange}
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pubName">Publisher Name</Label>
              <Input
                name="pubName"
                placeholder="Enter Publisher Name"
                value={formData.pubName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">slug</Label>
              <Input
                name="slug"
                placeholder="Enter slug"
                value={formData.slug}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                name="website"
                placeholder="Website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <Input
                name="contact"
                placeholder="ex : +94712345678"
                value={formData.contact}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                name="description"
                placeholder="Publisher description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div>
                <input
                  id="publisher-logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoInputChange}
                />
                <label
                  htmlFor="publisher-logo"
                  className="relative w-56 h-40 border-dashed border-2 border-neutral-200 rounded flex items-center justify-center text-sm text-neutral-500 cursor-pointer overflow-hidden"
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>+ Upload</span>
                  )}
                </label>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end pt-4 border-t">
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
