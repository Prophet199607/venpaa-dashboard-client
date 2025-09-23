"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/ui/imageUploader";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function CreateBookPage() {
  const handleSave = (file: File) => {
    console.log("Final cropped image file:", file);
    // 👉 you can upload this to your API, Supabase, S3, etc.
  };

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
                  <Label>Name</Label>
                  <Input placeholder="Book name" />
                </div>

                <div>
                  <Label>Name</Label>
                  <Input placeholder="Book name" />
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
                  <div className="w-36 h-36 border-dashed border-2 border-neutral-200 rounded flex items-center justify-center text-sm text-neutral-500">
                    + Upload
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
                  {/* <div className="w-24 h-24 border-dashed border-2 border-neutral-200 rounded flex items-center justify-center text-sm text-neutral-500">
                    + Upload
                  </div> */}
                  <ImageUploader onImageSave={handleSave} />
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
      </section>
    </div>
  );
}
