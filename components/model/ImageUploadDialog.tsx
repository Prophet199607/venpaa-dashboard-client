"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImageUploader from "@/components/ui/imageUploader";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (file: File) => void;
  initialImage?: string | null;
}

export default function ImageUploadDialog({
  open,
  onOpenChange,
  onSave,
  initialImage = null,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload & Edit Image</DialogTitle>
        </DialogHeader>
        <div>
          <ImageUploader
            initialImage={initialImage}
            onImageSave={(file: File) => onSave(file)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
