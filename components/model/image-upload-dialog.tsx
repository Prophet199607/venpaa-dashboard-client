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
  initialFile?: File | null;
  aspectRatio?: number;
}

export default function ImageUploadDialog({
  open,
  onOpenChange,
  onSave,
  initialImage,
  initialFile,
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
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <ImageUploader
          onImageSave={handleSave}
          initialImage={initialImage}
          initialFile={initialFile}
          aspectRatio={aspectRatio}
        />
      </DialogContent>
    </Dialog>
  );
}
