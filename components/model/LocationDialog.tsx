"use client";

import api from "@/utils/api";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit, Plus } from "lucide-react";
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

interface LocationDialogProps {
  location?: {
    locCode: string;
    locName: string;
    locType: string;
    deliveryAddress?: string;
    isActive: boolean;
  };
  variant?: "add" | "edit";
  onSuccess?: () => void;
}

interface FormData {
  loca_code: string;
  loca_name: string;
  location_type: string;
  delivery_address: string;
  is_active: boolean;
  logged_in: number;
}

export default function LocationDialog({
  location,
  variant = "add",
  onSuccess,
}: LocationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    loca_code: "",
    loca_name: "",
    location_type: "Branch",
    delivery_address: "",
    is_active: true,
    logged_in: 0,
  });

  const locTypeOptions = ["Branch", "Exhibition"];
  const isEditing = variant === "edit";

  const fetchLocationDetails = async (locCode: string) => {
    try {
      setLoading(true);
      const { data: res } = await api.get(`/locations/${locCode}`);

      if (res.success) {
        const loc = res.data;
        setFormData({
          loca_code: loc.loca_code,
          loca_name: loc.loca_name,
          location_type: loc.location_type,
          delivery_address: loc.delivery_address || "",
          is_active: Boolean(loc.is_active),
          logged_in: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch location details:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateLocationCode = async () => {
    try {
      const { data: res } = await api.get("/locations/generate-code");
      if (res.success) {
        setFormData((prev) => ({
          ...prev,
          loca_code: res.code,
        }));
      } else {
        console.error("Failed to generate code:", res.message);
      }
    } catch (error) {
      console.error("Failed to generate location code:", error);
    }
  };

  useEffect(() => {
    if (open) {
      if (isEditing && location?.locCode) {
        fetchLocationDetails(location.locCode);
      } else {
        handleReset();
        generateLocationCode();
      }
    }
  }, [open, location, isEditing]);

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
        logged_in: 0,
      };

      let response;
      if (isEditing && location?.locCode) {
        response = await api.put(`/locations/${location.locCode}`, payload);
      } else {
        response = await api.post("/locations", payload);
      }

      if (response.data.success) {
        setOpen(false);
        handleReset();
        window.location.reload();
      } else {
        console.error("Operation failed:", response.data.message);
      }
    } catch (error: any) {
      console.error(
        "Failed to save location:",
        error.response?.data?.message || error.message
      );
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
      logged_in: 0,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setTimeout(handleReset, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === "edit" ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        ) : (
          <Button type="button" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Location" : "Add New Location"}
          </DialogTitle>
        </DialogHeader>

        {formLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-2 py-2">
            <div className="flex justify-end items-center gap-2">
              <Label htmlFor="isActive" className="whitespace-nowrap">
                Active
              </Label>
              <Checkbox
                id="isActive"
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
                  {locTypeOptions.map((t) => (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
