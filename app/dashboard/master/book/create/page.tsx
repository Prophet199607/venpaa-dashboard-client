"use client";

import { books } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ImagePreview } from "@/components/ui/ImagePreview";
import { useSearchParams, useRouter } from "next/navigation";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface UploadState {
  preview: string;
  file: File | null;
}

interface Book {
  code: string;
  name: string;
  author: string;
  bookTypes: string;
}

export default function BookForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<"cover" | "images" | null>(
    null
  );
  const [cover, setCover] = useState<UploadState>({ preview: "", file: null });
  const [images, setImages] = useState<UploadState[]>([]);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    author: "",
    bookTypes: "",
    slug: "",
    image: "",
    publisher: "",
    isbn: "",
    description: "",
    category: "",
    alertQty: 0,
    width: 0,
    height: 0,
    depth: 0,
    weight: 0,
    pages: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  const bookToEdit = id ? books.find((b) => b.code === id) : null;
  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        code: bookToEdit.code,
        name: bookToEdit.name,
        author: bookToEdit.author,
        bookTypes: bookToEdit.bookTypes,
        slug: bookToEdit.slug,
        image: bookToEdit.image,
        publisher: bookToEdit.publisher,
        isbn: bookToEdit.isbn,
        description: bookToEdit.description,
        category: bookToEdit.category,
        alertQty: bookToEdit.alertQty,
        width: bookToEdit.width,
        height: bookToEdit.height,
        depth: bookToEdit.height,
        weight: bookToEdit.height,
        pages: bookToEdit.height,
      });
      setIsEditing(true);
    } else {
      handleReset();
    }
  }, [bookToEdit]);

  const handleReset = () => {
    setFormData({
      code: "",
      name: "",
      author: "",
      bookTypes: "",
      slug: "",
      image: "",
      publisher: "",
      isbn: "",
      description: "",
      category: "",
      alertQty: 0,
      width: 0,
      height: 0,
      depth: 0,
      weight: 0,
      pages: 0,
    });
    setIsEditing(false);

    if (isEditing) {
      router.push("/dashboard/master/book/create");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "cover" | "images"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      setEditingImage(reader.result as string);
      setEditingTarget(target);
      setDialogOpen(true);
    };
    reader.readAsDataURL(file);

    // For multiple images, add remaining files directly
    if (target === "images" && files.length > 1) {
      const newImages: UploadState[] = [];
      for (let i = 1; i < files.length; i++) {
        const file = files[i];
        newImages.push({
          preview: URL.createObjectURL(file),
          file,
        });
      }
      setImages((prev) => [...prev, ...newImages]);
    }

    e.target.value = "";
  };

  const handleDialogSave = (file: File) => {
    const previewUrl = URL.createObjectURL(file);

    if (editingTarget === "cover") {
      if (cover.preview) URL.revokeObjectURL(cover.preview);
      setCover({ preview: previewUrl, file });
    } else if (editingTarget === "images") {
      setImages((prev) => [...prev, { preview: previewUrl, file }]);
    }

    setEditingImage(null);
    setEditingTarget(null);
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    URL.revokeObjectURL(imageToRemove.preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const previewImage = (previewUrl: string) => {
    window.open(previewUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Book" : "Create Book"}
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
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label>Book Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select book type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardcover">Hardcover</SelectItem>
                    <SelectItem value="paperback">Paperback</SelectItem>
                    <SelectItem value="ebook">E-Book</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Name</Label>
                <Input
                  name="name"
                  onChange={handleChange}
                  placeholder="Book name"
                  value={formData.name}
                  required
                />
              </div>

              <div>
                <Label>Code</Label>
                <Input
                  name="code"
                  value={formData.code}
                  placeholder="Book Code"
                />
              </div>

              <div>
                <Label>Slug</Label>
                <Input
                  name="slug"
                  onChange={handleChange}
                  value={formData.slug}
                  placeholder="Book Slug"
                />
              </div>

              <div>
                <Label>Publisher</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select publisher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pub1">Publisher 1</SelectItem>
                    <SelectItem value="pub2">Publisher 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ISBN</Label>
                <Input name="isbn" value={formData.isbn} placeholder="ISBN" />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  placeholder="Book Description"
                  rows={4}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat1">Category 1</SelectItem>
                    <SelectItem value="cat2">Category 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cover Image</Label>
                <div>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "cover")}
                  />
                  <label
                    htmlFor="cover-upload"
                    className="block w-36 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden"
                  >
                    {cover.preview ? (
                      <img
                        src={cover.preview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        + Upload Cover
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label>Alert Quantity</Label>
                <Input
                  name="alertQty"
                  onChange={handleChange}
                  value={formData.alertQty}
                  placeholder="Alert quantity"
                  type="number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width</Label>
                  <Input
                    onChange={handleChange}
                    value={formData.width}
                    placeholder="Width"
                    type="number"
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    onChange={handleChange}
                    value={formData.height}
                    placeholder="Height"
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Depth</Label>
                  <Input
                    onChange={handleChange}
                    placeholder="Depth"
                    type="number"
                  />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input
                    onChange={handleChange}
                    placeholder="Weight"
                    type="number"
                  />
                </div>
              </div>

              <div>
                <Label>Pages</Label>
                <Input placeholder="Pages" type="number" />
              </div>

              <div>
                <Label>Images</Label>
                <div>
                  <input
                    id="images-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "images")}
                  />
                  <label
                    htmlFor="images-upload"
                    className="block min-h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-4"
                  >
                    {images.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {images.map((image, index) => (
                          <ImagePreview
                            key={index}
                            src={image.preview}
                            alt={`Image ${index + 1}`}
                            onRemove={() => removeImage(index)}
                            onPreview={() => previewImage(image.preview)}
                          />
                        ))}
                        <div className="w-20 h-20 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                          + Add More
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        + Upload Images
                      </div>
                    )}
                  </label>
                </div>
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
        onOpenChange={setDialogOpen}
        onSave={handleDialogSave}
        initialImage={editingImage}
      />
    </div>
  );
}
