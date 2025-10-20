"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImageUploader from "@/components/ui/ImageUploader";

interface ImageUploadDialogProps {
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
}: ImageUploadDialogProps) {
  const handleSave = (file: File) => {
    onSave(file);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        <ImageUploader initialImage={initialImage} onImageSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
