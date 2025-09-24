"use client";

import React, { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button"; // if you have shadcn/ui
import { CameraIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { cn } from "@/utils/cn";

interface Props {
  onImageSave: (file: File) => void;
  initialImage?: string | null;
}

export default function ImageUploader({
  onImageSave,
  initialImage = null,
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Handle file upload
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => setImageSrc(reader.result as string);
    }
  };

  useEffect(() => {
    if (initialImage) setImageSrc(initialImage);
  }, [initialImage]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Convert cropped image to blob
  const getCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const safeArea = Math.max(image.width, image.height) * 2;
    canvas.width = safeArea;
    canvas.height = safeArea;

    if (!ctx) return;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      (safeArea - image.width) / 2,
      (safeArea - image.height) / 2
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    ctx.putImageData(data, -croppedAreaPixels.x, -croppedAreaPixels.y);

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "cropped-image.jpeg", {
            type: "image/jpeg",
          });
          console.log('Calling onImageSave with file:', file);
          onImageSave(file);
          resolve(file);
        }
      }, "image/jpeg");
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload input */}
      <label
        htmlFor="file-upload"
        className={cn(
          "flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50"
        )}
      >
        <CameraIcon className="h-6 w-6 mr-2 text-gray-500" />
        <span className="text-sm text-gray-600">Upload Image</span>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </label>

      {/* Cropper */}
      {imageSrc && (
        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={12/18}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
      )}

      {/* Controls */}
      {imageSrc && (
        <div className="flex gap-4 justify-center">
          <Button
            type="button"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            variant="outline"
            aria-label="Rotate image"
            title="Rotate image"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1 transition-transform duration-300" />{" "}
            Rotate
          </Button>
          <Button 
            type="button" 
            onClick={async () => {
              try {
                await getCroppedImage();
              } catch (error) {
                console.error('Error saving image:', error);
              }
            }}
          >
            Save Image
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to load image
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // for CORS issues
    image.src = url;
  });
}
