"use client";

import { X, Eye } from "lucide-react";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  onRemove?: () => void;
  onPreview?: () => void;
  className?: string;
}

export function ImagePreview({
  src,
  alt = "Preview",
  onRemove,
  onPreview,
  className = "",
}: ImagePreviewProps) {
  return (
    <div className={cn("relative group", className)}>
      <Image
        src={src}
        alt={alt}
        width={80}
        height={80}
        className="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-700"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={onPreview}
          className="p-1 bg-white dark:bg-gray-800 rounded-full text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Preview"
        >
          <Eye className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="p-1 bg-white dark:bg-gray-800 rounded-full text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
