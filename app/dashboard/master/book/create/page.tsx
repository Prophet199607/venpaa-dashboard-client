"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePreview } from "@/components/ui/ImagePreview";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";
import { useSearchParams, useRouter } from "next/navigation";
import { books } from "@/lib/data";

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


export default function CreateBookPage() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

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
    
  });

  const [isEditing, setIsEditing] = useState(false);
  const bookToEdit = id ? books.find((c) => c.code=== id) : null;

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
        
      });

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
      
    });
    setIsEditing(false);

    if (isEditing) {
      router.push("/dashboard/master/book/create");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<"cover" | "images" | null>(
    null
  );

  const [cover, setCover] = useState<UploadState>({ preview: "", file: null });
  const [images, setImages] = useState<UploadState[]>([]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add New Book</h1>
        <Link href="/dashboard/master/book">
          <Button variant="outline">Back to List</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                
                  placeholder="Book name"
                  value={formData.name}
                  required
                />
              </div>

              <div>
                <Label>Code</Label>
                <Input 
                 value={formData.code}
                 placeholder="Book Code" />
              </div>

              <div>
                <Label>Slug</Label>
                <Input value={formData.author} placeholder="Book Slug" />
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
                <Input value={formData.isbn} placeholder="ISBN" />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} placeholder="Book Description" rows={4} />
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
                <Input value={formData.alertQty} placeholder="Alert quantity" type="number" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width</Label>
                  <Input value={formData.width} placeholder="Width" type="number" />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input value={formData.height} placeholder="Height" type="number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Depth</Label>
                  <Input placeholder="Depth" type="number" />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input placeholder="Weight" type="number" />
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

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Save Book
                </Button>
                <Link href="/dashboard/master/book" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
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
