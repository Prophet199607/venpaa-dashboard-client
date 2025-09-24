"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";

export default function CreateSupplierPage() {
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
      company: form.get("company") as string,
      address: form.get("address") as string,
      mobile: form.get("mobile") as string,
      telephone: form.get("telephone") as string,
      email: form.get("email") as string,
      note: form.get("note") as string,
      imageFile,
    };
    console.log("Submit supplier:", payload);
  }

  return (
    <div>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Add a New Supplier</h1>
          <Link href="/dashboard/master/supplier">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Supplier name" />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" placeholder="Company Name" />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" placeholder="Address" />
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input id="mobile" name="mobile" placeholder="ex : +94712345678" />
                </div>

                <div>
                  <Label htmlFor="telephone">Telephone</Label>
                  <Input id="telephone" name="telephone" placeholder="ex : +9412341440" />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Email Address" />
                </div>

                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea id="note" name="note" placeholder="Note" className="min-h-[12rem]" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Image</Label>
                  <div>
                    <input
                      id="supplier-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageInputChange}
                    />
                    <label
                      htmlFor="supplier-image"
                      className="relative w-full h-40 max-w-md border-dashed border-2 border-neutral-200 rounded flex items-center justify-center text-sm text-neutral-500 cursor-pointer overflow-hidden"
                    >
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} alt="Supplier image preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>+ Upload</span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit">Create Supplier</Button>
                  <Link href="/dashboard/master/supplier">
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


