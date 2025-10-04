"use client";

import { api } from "@/utils/api";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
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
import { useToast } from "@/hooks/use-toast";

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
  const router = useRouter();   
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);

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

  const prepareDialog = async () => {
    setPreparing(true);
    try {
      if (isEditing && location?.locCode) {
        const { data: res } = await api.get(`/locations/${location.locCode}`);
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
      } else {
        const { data: res } = await api.get("/locations/generate-code");
        if (res.success) {
          setFormData(prev => ({ ...prev, loca_code: res.code }));
        }
      }
      setOpen(true);
    } catch (error: any) {
      console.error("Failed to prepare dialog:", error);
      toast({
        title: "Failed to load data",
        description: error.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setPreparing(false);
    }
  };

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
        toast({
          title: isEditing ? "Location updated" : "Location created",
          description: `Location ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });

        setOpen(false);
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
      logged_in: 0,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setOpen(false);
      setTimeout(handleReset, 300);
    }
  };

  return (
    <>
      {preparing && (
            <Loader />
      )}
      
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {variant === "edit" ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={prepareDialog}
              disabled={preparing}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          ) : (
            <Button 
              type="button" 
              className="flex items-center gap-2"
              onClick={prepareDialog}
              disabled={preparing}
            >
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
        </DialogContent>
      </Dialog>
    </>
  );
}