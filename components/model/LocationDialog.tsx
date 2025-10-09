"use client";

import { api } from "@/utils/api";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Loader from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface LocationDialogProps {
  location?: {
    loca_code: string;
    loca_name: string;
    location_type: string;
    delivery_address?: string;
    is_active: boolean;
  };
  variant: "add" | "edit";
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  loca_code: string;
  loca_name: string;
  location_type: string;
  delivery_address: string;
  is_active: boolean;
}

export default function LocationDialog({
  location,
  variant,
  onSuccess,
  open,
  onOpenChange,
}: LocationDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    loca_code: "",
    loca_name: "",
    location_type: "Branch",
    delivery_address: "",
    is_active: true,
  });

  const location_typeOptions = ["Branch", "Exhibition"];
  const isEditing = variant === "edit";

  useEffect(() => {
    if (open) {
      if (location) {
        setFormData({
          ...location,
          is_active: Boolean(location.is_active),
          delivery_address: location.delivery_address || "",
        });
      } else {
        handleReset();
      }
    }
  }, [open, isEditing, location]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        loca_code: formData.loca_code,
        loca_name: formData.loca_name,
        location_type: formData.location_type,
        delivery_address: formData.delivery_address,
        is_active: formData.is_active ? 1 : 0,
      };

      let response;
      if (isEditing && location?.loca_code) {
        response = await api.put(`/locations/${location.loca_code}`, payload);
      } else {
        response = await api.post("/locations", payload);
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Location updated" : "Location created",
          description: `Location ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });

        onOpenChange(false);
        handleReset();
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast({
          title: "Operation failed",
          description: response.data.message || "Please try again",
          type: "warning",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Failed to save location:", error);
      toast({
        title: "Operation failed",
        description: error.response?.data?.message || "Please try again",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      loca_code: "",
      loca_name: "",
      location_type: "Branch",
      delivery_address: "",
      is_active: true,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
      setTimeout(handleReset, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Location" : "Add New Location"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-2 py-2">
          <div className="flex justify-end items-center gap-2">
            <Label htmlFor="is_active" className="whitespace-nowrap">
              Active
            </Label>
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                handleInputChange("is_active", checked === true)
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Location Code</Label>
            <Input
              value={formData.loca_code}
              onChange={(e) => handleInputChange("loca_code", e.target.value)}
              placeholder="Enter location code"
              required
              disabled={isEditing}
            />
          </div>

          <div className="grid gap-2">
            <Label>Location Name</Label>
            <Input
              value={formData.loca_name}
              onChange={(e) => handleInputChange("loca_name", e.target.value)}
              placeholder="Enter location name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Location Type</Label>
            <Select
              value={formData.location_type}
              onValueChange={(value) =>
                handleInputChange("location_type", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                {location_typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Location</Label>
            <Input
              value={formData.delivery_address}
              onChange={(e) =>
                handleInputChange("delivery_address", e.target.value)
              }
              placeholder="Enter delivery address"
            />
          </div>

          <DialogFooter className="flex justify-between mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader />
                  {isEditing ? "Updating..." : "Submitting..."}
                </>
              ) : isEditing ? (
                "Update"
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
