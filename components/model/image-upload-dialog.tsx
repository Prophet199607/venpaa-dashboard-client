"use client";

import React from "react";
import ImageUploader from "@/components/shared/image-uploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (file: File) => void;
  initialImage: string | null;
  aspectRatio?: number;
}

export default function ImageUploadDialog({
  open,
  onOpenChange,
  onSave,
  initialImage,
  aspectRatio,
}: ImageUploadDialogProps) {
  const handleSave = (file: File) => {
    onSave(file);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Crop & Upload Image</DialogTitle>
        </DialogHeader>
        <ImageUploader
          onImageSave={handleSave}
          initialImage={initialImage}
          aspectRatio={aspectRatio}
        />
      </DialogContent>
    </Dialog>
  );
}
