"use client";

import { ArrowLeft } from "lucide-react";
import { suppliers } from "@/lib/data";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";

interface Supplier {
  id: number;
  supCode: string;
  supName: string;
  company: string;
  address: string;
  mobile: string;
  telephone: string;
  email: string;
  note?: string;
  image?: string;
}

export default function SupplierForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    supCode: "",
    supName: "",
    company: "",
    address: "",
    mobile: "",
    telephone: "",
    email: "",
    note: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Find the suppler to edit
  const SupplierToEdit = id ? suppliers.find((sc) => sc.supCode === id) : null;

  useEffect(() => {
    if (SupplierToEdit) {
      setFormData({
        supCode: SupplierToEdit.supCode,
        supName: SupplierToEdit.supName,
        company: SupplierToEdit.company,
        address: SupplierToEdit.address,
        mobile: SupplierToEdit.mobile,
        telephone: SupplierToEdit.telephone,
        email: SupplierToEdit.email,
        note: SupplierToEdit.note ?? "",
      });
      setIsEditing(true);
    } else {
      handleReset();
    }
  }, [SupplierToEdit]);

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

  const handleReset = () => {
    setFormData({
      supCode: "",
      supName: "",
      company: "",
      address: "",
      mobile: "",
      telephone: "",
      email: "",
      note: "",
    });
    setIsEditing(false);

    if (isEditing) {
      router.push("/dashboard/master/supplier/create");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Supplier" : "Create Supplier"}
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
              <Label htmlFor="supCode">Supplier Code</Label>
              <Input
                name="supCode"
                placeholder="e.g., S0001"
                value={formData.supCode}
                onChange={handleChange}
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supName">Supplier Name</Label>
              <Input
                name="supName"
                placeholder="EnterSupplier Name"
                value={formData.supName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                name="company"
                placeholder="Company Name"
                value={formData.company}
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
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                name="mobile"
                placeholder="ex : +94712345678"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone</Label>
              <Input
                name="telephone"
                placeholder="ex : +9412341440"
                value={formData.telephone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                name="note"
                placeholder="Note"
                value={formData.note}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
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
                    <img
                      src={imagePreview}
                      alt="Supplier image preview"
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
