"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Edit, Plus } from "lucide-react";
import type { BookType } from "@/lib/data";

interface BookTypeDialogProps {
  bookType?: BookType;
  variant?: "add" | "edit";
}

export default function BookTypeDialog({
  bookType,
  variant = "add",
}: BookTypeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [bookCode, setBookCode] = React.useState("");
  const [bookName, setBookName] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (variant === "edit" && bookType) {
        setBookCode(bookType.bookCode);
        setBookName(bookType.bookName);
        setIsEditing(true);
      } else {
        handleReset();
      }
    }
  }, [open, bookType, variant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      // Update logic here
      console.log("Updating book type:", {
        id: bookType?.id,
        bookCode,
        bookName,
      });
      // Add your update API call here
    } else {
      // Create logic here
      console.log("Creating book type:", { bookCode, bookName });
      // Add your create API call here
    }

    setOpen(false);
    handleReset();
  };

  const handleReset = () => {
    setBookCode("");
    setBookName("");
    setIsEditing(false);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setTimeout(handleReset, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === "edit" ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        ) : (
          <Button type="button" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Book Type" : "Add New Book Type"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the book type details below."
              : "Fill in the book type details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="bookCode" className="text-sm font-medium">
              Book Type Code
            </label>
            <Input
              id="bookCode"
              value={bookCode}
              onChange={(e) => setBookCode(e.target.value)}
              placeholder="Enter code"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="bookName" className="text-sm font-medium">
              Book Type Name
            </label>
            <Input
              id="bookName"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </div>

          <DialogFooter className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit">{isEditing ? "Update" : "Submit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
