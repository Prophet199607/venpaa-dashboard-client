"use client";

import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
}

export function ViewModal({ isOpen, onClose, data, title }: ViewModalProps) {
  const renderValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return value;
  };

  const name = data.name || data.pub_name || data.sup_name || data.auth_name;
  const code = data.code || data.pub_code || data.sup_code || data.auth_code;

  const imageUrl =
    data.imageUrl ||
    data.pub_image_url ||
    data.sup_image_url ||
    data.auth_image_url ||
    "/images/Placeholder.jpg";

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
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/0 rounded-full animate-spin-slow" />
            <Image
              src={imageUrl}
              alt={name || "Image"}
              width={120}
              height={120}
              className="rounded-full object-cover ring-2 ring-border shadow-lg"
            />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="text-sm text-muted-foreground">{code}</p>
          </div>

          <ScrollArea className="w-full max-h-[300px] rounded-lg border bg-card/50 backdrop-blur-sm p-4">
            <div className="space-y-4">
              {Object.entries(data).map(([key, value]) => {
                // Don't render internal or image URL keys
                if (
                  !value ||
                  key.endsWith("_url") ||
                  key.endsWith("_image") ||
                  key.endsWith("Url") ||
                  key === "id" ||
                  key === "created_by" ||
                  key === "updated_by" ||
                  key === "name" ||
                  key === "code" ||
                  key === "pub_name" ||
                  key === "pub_code" ||
                  key === "sup_name" ||
                  key === "sup_code" ||
                  key === "auth_name" ||
                  key === "auth_code"
                ) {
                  return null;
                }
                return (
                  <div
                    key={key}
                    className="flex flex-col p-1 rounded-md transition-colors hover:bg-accent/50"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-sm font-medium">
                      {renderValue(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
