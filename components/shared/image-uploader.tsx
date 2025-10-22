"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { CameraIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { cn } from "@/utils/cn";

interface ImageUploaderProps {
  onImageSave: (file: File) => void;
  initialImage?: string | null;
  aspectRatio?: number;
  className?: string;
}

export default function ImageUploader({
  onImageSave,
  initialImage = null,
  aspectRatio = 14 / 20,
  className = "",
}: ImageUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => setImageSrc(reader.result as string);
    }
  };

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const getCroppedImage = async (): Promise<File | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      // Set canvas size to the cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Translate and rotate the context
      ctx.translate(croppedAreaPixels.width / 2, croppedAreaPixels.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(
        -croppedAreaPixels.width / 2,
        -croppedAreaPixels.height / 2
      );

      // Draw the cropped portion of the image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return new Promise<File>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "cropped-image.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(file);
            }
          },
          "image/jpeg",
          0.95
        ); // 95% quality
      });
    } catch (error) {
      console.error("Error cropping image:", error);
      return null;
    }
  };

  const handleSave = async () => {
    const croppedFile = await getCroppedImage();
    if (croppedFile) {
      onImageSave(croppedFile);
    }
  };

  const handleReset = () => {
    setImageSrc(null);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!imageSrc ? (
        <label
          htmlFor="file-upload"
          className={cn(
            "flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          )}
        >
          <CameraIcon className="h-6 w-6 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Upload Image
          </span>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <>
          <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              showGrid={false}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                variant="outline"
                size="sm"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Rotate
              </Button>

              <Button
                type="button"
                onClick={handleReset}
                variant="outline"
                size="sm"
              >
                Change Image
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                // onClick={() => setDialogOpen(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} size="sm">
                Save Image
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
