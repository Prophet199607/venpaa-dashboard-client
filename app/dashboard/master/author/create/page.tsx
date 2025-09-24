"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";

export default function CreateAuthorPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInitialImage(reader.result as string);
      setDialogOpen(true);
    };
    reader.readAsDataURL(file);
    try { e.currentTarget.value = ""; } catch {}
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
    <div>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Add a New Author</h1>
          <Link href="/dashboard/master/author">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Author Name</Label>
                  <Input id="name" name="name" placeholder="Author name" />
                </div>

                <div>
                  <Label htmlFor="nameTamil">Name in Tamil</Label>
                  <Input id="nameTamil" name="nameTamil" placeholder="Name in Tamil" />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" placeholder="slug" />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" placeholder="description" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
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
                        <img src={imagePreview} alt="Author image preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>+ Upload</span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit">Add Author</Button>
                  <Link href="/dashboard/master/author">
                    <Button variant="ghost">Cancel</Button>
                  </Link>
                </div>
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
      </section>
    </div>
  );
}


