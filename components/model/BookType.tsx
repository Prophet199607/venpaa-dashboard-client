"use client";

import { api } from "@/utils/api";
import React, { useState } from "react";
import { Edit, Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookTypeDialogProps {
  bookType?: {
    bookTypeCode: string;
    bookTypeName: string;
  };
  variant?: "add" | "edit";
  onSuccess?: () => void;
}

interface FormData {
  bkt_code: string;
  bkt_name: string;
}

export default function BookTypeDialog({
  bookType,
  variant = "add",
  onSuccess,
}: BookTypeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    bkt_code: "",
    bkt_name: "",
  });

  const isEditing = variant === "edit";

  const prepareDialog = async () => {
    setPreparing(true);
    try {
      if (isEditing && bookType?.bookTypeCode) {
        const { data: res } = await api.get(
          `/book-types/${bookType.bookTypeCode}`
        );
        if (res.success) {
          const bkt = res.data;
          setFormData({
            bkt_code: bkt.bkt_code,
            bkt_name: bkt.bkt_name,
          });
        }
      } else {
        const { data: res } = await api.get("/book-types/generate-code");
        if (res.success) {
          setFormData((prev) => ({ ...prev, bkt_code: res.code }));
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
        bkt_code: formData.bkt_code,
        bkt_name: formData.bkt_name,
      };

      let response;
      if (isEditing && bookType?.bookTypeCode) {
        response = await api.put(
          `/book-types/${bookType.bookTypeCode}`,
          payload
        );
      } else {
        response = await api.post("/book-types", payload);
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Book Type updated" : "Book Type created",
          description: `Book Type ${
            isEditing ? "updated" : "created"
          } successfully`,
          type: "success",
          duration: 3000,
        });
        setOpen(false);
        handleReset();
        onSuccess?.();
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
      console.error("Failed to submit form:", error);
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
      bkt_code: "",
      bkt_name: "",
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
      {preparing && <Loader />}

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
              {isEditing ? "Edit Book Type" : "Add New Book Type"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Book Type Code</Label>
              <Input
                value={formData.bkt_code}
                onChange={(e) => handleInputChange("bkt_code", e.target.value)}
                placeholder="Enter book type code"
                required
                disabled={isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Book Type Name</Label>
              <Input
                value={formData.bkt_name}
                onChange={(e) => handleInputChange("bkt_name", e.target.value)}
                placeholder="Enter book type name"
                required
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
