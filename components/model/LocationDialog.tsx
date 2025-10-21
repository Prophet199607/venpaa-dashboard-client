"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const locationSchema = z.object({
  loca_code: z
    .string()
    .min(1, "Location code is required")
    .regex(/^L\d{3,}$/, "Code must follow the format L001"),
  loca_name: z.string().min(1, "Location name is required"),
  location_type: z.string().min(1, "Location type is required"),
  delivery_address: z.string().optional(),
  is_active: z.boolean().optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;
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

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      loca_code: "",
      loca_name: "",
      location_type: "Branch",
      delivery_address: "",
      is_active: true,
    },
  });

  const location_typeOptions = ["Branch", "Exhibition"];
  const isEditing = variant === "edit";

  useEffect(() => {
    if (open) {
      if (location) {
        form.reset({
          ...location,
          is_active: Boolean(location.is_active),
          delivery_address: location.delivery_address || "",
        });
      } else {
        form.reset({
          loca_code: "",
          loca_name: "",
          location_type: "Branch",
          delivery_address: "",
          is_active: true,
        });
      }
    }
  }, [open, location, form]);

  const onSubmit = async (values: LocationFormValues) => {
    setLoading(true);

    try {
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0,
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
    form.reset({
      loca_code: location?.loca_code || "",
      loca_name: "",
      location_type: "Branch",
      delivery_address: "",
      is_active: true,
    });
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => form.reset(), 300);
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-2 py-2"
          >
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex justify-end items-center gap-2">
                  <FormLabel htmlFor="is_active" className="whitespace-nowrap">
                    Active
                  </FormLabel>
                  <FormControl>
                    <Checkbox
                      id="is_active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="loca_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter location code (e.g., L001)"
                        disabled
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="loca_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="location_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {location_typeOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="delivery_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter location address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
