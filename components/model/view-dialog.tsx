"use client";

import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DetailsPanel } from "@/components/shared/details-panel";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  type: "author" | "publisher" | "supplier";
}

export function ViewModal({ isOpen, onClose, data, type }: ViewModalProps) {
  const { name, code, imageUrl } = getDisplayData(data, type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-gradient-to-br from-background to-muted">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary/10 dark:bg-primary/20 animate-pulse" />
          <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-primary/5 dark:bg-primary/10 animate-pulse delay-1000" />
          <div className="absolute right-1/4 bottom-1/4 w-16 h-16 rounded-lg rotate-45 bg-primary/5 dark:bg-primary/10 animate-pulse delay-2000" />
        </div>

        <div className="relative flex flex-col items-center space-y-2 p-2">
          {/* Header with Image and Basic Info */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative w-64 h-36">
              <div className="absolute inset-0" />
              <div className="w-full h-full overflow-hidden relative">
                <Image
                  src={imageUrl}
                  alt={name || "Image"}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{code}</p>
            </div>
          </div>

          {/* Details Panel */}
          <DetailsPanel data={data} type={type} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getDisplayData(data: Record<string, any>, type: string) {
  switch (type) {
    case "author":
      return {
        name: data.auth_name,
        code: data.auth_code,
        imageUrl: data.auth_image_url || "/images/Placeholder.jpg",
      };
    case "publisher":
      return {
        name: data.pub_name,
        code: data.pub_code,
        imageUrl: data.pub_image_url || "/images/Placeholder.jpg",
      };
    case "supplier":
      return {
        name: data.sup_name,
        code: data.sup_code,
        imageUrl: data.sup_image_url || "/images/Placeholder.jpg",
      };
    default:
      return {
        name: data.name || "Unknown",
        code: data.code || "",
        imageUrl: "/images/Placeholder.jpg",
      };
  }
}
