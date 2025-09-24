"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/ui/imageUploader";
import ImageUploadDialog from "@/components/model/ImageUploadDialog";
import { useState } from "react";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function CreateBookPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInitial, setEditingInitial] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<"cover" | "images" | null>(
    null
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  function handleFileSelection(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "cover" | "images"
  ) {
    console.log('handleFileSelection called with target:', target);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const first = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      console.log('Setting editingTarget to:', target);
      setEditingInitial(reader.result as string);
      setEditingTarget(target);
      setDialogOpen(true);
    };
    reader.readAsDataURL(first);

    if (target === "images" && files.length > 1) {
      // add remaining files as previews
      const urls: string[] = [];
      const fileArr: File[] = [];
      for (let i = 1; i < files.length; i++) {
        const f = files[i];
        fileArr.push(f);
        urls.push(URL.createObjectURL(f));
      }
      setImageFiles((prev) => prev.concat(fileArr));
      setImagesPreviews((prev) => prev.concat(urls));
    }
    // clear input
    try {
      e.currentTarget.value = "";
    } catch {}
  }

  function handleDialogSave(file: File) {
    console.log('handleDialogSave called with file:', file);
    console.log('editingTarget:', editingTarget);
    const url = URL.createObjectURL(file);
    if (editingTarget === "cover") {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverFile(file);
      setCoverPreview(url);
    } else if (editingTarget === "images") {
      console.log('Adding image to images array');
      console.log('Current imagesPreviews:', imagesPreviews);
      setImageFiles((prev) => {
        const newFiles = prev.concat([file]);
        console.log('New imageFiles:', newFiles);
        return newFiles;
      });
      setImagesPreviews((prev) => {
        const newPreviews = prev.concat([url]);
        console.log('New imagesPreviews:', newPreviews);
        return newPreviews;
      });
    }
    setDialogOpen(false);
    setEditingInitial(null);
    setEditingTarget(null);
  }

  return (
    <div>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Add a New Book</h1>
          <Link href="/dashboard/master/book">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card>
          <CardContent>
            <form className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Book Types</Label>
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
                  <Input placeholder="Book name" />
                </div>

                <div>
                  <Label>Code</Label>
                  <Input placeholder="Book Code" />
                </div>

                <div>
                  <Label>Slug</Label>
                  <Input placeholder="Book Slug. -- Auto filled if left empty" />
                </div>

                <div>
                  <Label>Publisher</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pub1">Publisher 1</SelectItem>
                      <SelectItem value="pub2">Publisher 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>ISBN</Label>
                  <Input placeholder="ISBN" />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Book Description" />
                </div>

                <div>
                  <Label>Categories</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat1">Category 1</SelectItem>
                      <SelectItem value="cat2">Category 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Filter Options</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="f1">Option 1</SelectItem>
                      <SelectItem value="f2">Option 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Authors</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a1">Author 1</SelectItem>
                      <SelectItem value="a2">Author 2</SelectItem>
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
                      onChange={(e) => handleFileSelection(e, "cover")}
                    />
                    <label
                      htmlFor="cover-upload"
                      className="relative w-36 h-36 border-dashed border-2 border-neutral-200 rounded flex items-center justify-center text-sm text-neutral-500 cursor-pointer overflow-hidden"
                    >
                      {coverPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>+ Upload</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Alert Qty</Label>
                  <Input placeholder="alert Quantity" />
                </div>

                <div>
                  <Label>Width</Label>
                  <Input placeholder="Width" />
                </div>

                <div>
                  <Label>Height</Label>
                  <Input placeholder="height" />
                </div>

                <div>
                  <Label>Depth</Label>
                  <Input placeholder="depth" />
                </div>

                <div>
                  <Label>Weight</Label>
                  <Input placeholder="weight" />
                </div>

                <div>
                  <Label>Pages</Label>
                  <Input placeholder="pages" />
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
                      onChange={(e) => handleFileSelection(e, "images")}
                    />
                    <label
                      htmlFor="images-upload"
                      className="w-full min-h-[6rem] border-dashed border-2 border-neutral-200 rounded flex items-center justify-center text-sm text-neutral-500 cursor-pointer gap-2 p-2"
                    >
                      {imagesPreviews.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto">
                          {imagesPreviews.map((src, idx) => {
                            console.log('Rendering image:', src, 'at index:', idx);
                            return (
                              <div key={idx} className="relative group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={src}
                                  alt={`img-${idx}`}
                                  className="w-20 h-20 object-cover rounded"
                                />
                                {/* Overlay with buttons */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded">
                                  {/* Preview button - top left */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Preview functionality - you can implement a modal or lightbox here
                                      console.log('Preview image:', src);
                                      // For now, just open in new tab
                                      window.open(src, '_blank');
                                    }}
                                    className="absolute top-1 left-1 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded text-xs shadow-lg"
                                    title="Preview"
                                  >
                                    👁️
                                  </button>
                                  {/* Close button - top right */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Remove image
                                      setImagesPreviews(prev => prev.filter((_, i) => i !== idx));
                                      setImageFiles(prev => prev.filter((_, i) => i !== idx));
                                      // Revoke the object URL to free memory
                                      URL.revokeObjectURL(src);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs shadow-lg"
                                    title="Remove"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span>+ Upload</span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit">Save</Button>
                  <Link href="/dashboard/master/book">
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
            if (!o) {
              setEditingInitial(null);
              setEditingTarget(null);
            }
          }}
          initialImage={editingInitial}
          onSave={(file: File) => handleDialogSave(file)}
        />
      </section>
    </div>
  );
}
