"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
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

const bookTypeSchema = z.object({
  bkt_code: z
    .string()
    .min(1, "Book type code is required")
    .regex(/^BT\d{3,}$/, "Code must follow the format BT001"),
  bkt_name: z.string().min(1, "Book type name is required"),
});

type BookTypeFormValues = z.infer<typeof bookTypeSchema>;

interface BookTypeDialogProps {
  bookType?: {
    bkt_code: string;
    bkt_name: string;
  };
  variant?: "add" | "edit";
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookTypeDialog({
  bookType,
  variant = "add",
  onSuccess,
  open,
  onOpenChange,
}: BookTypeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<BookTypeFormValues>({
    resolver: zodResolver(bookTypeSchema),
    defaultValues: {
      bkt_code: "",
      bkt_name: "",
    },
  });
  const isEditing = variant === "edit";

  useEffect(() => {
    if (open) {
      if (bookType) {
        form.reset({
          ...bookType,
        });
      } else {
        form.reset({
          bkt_code: "",
          bkt_name: "",
        });
      }
    }
  }, [open, bookType, form]);

  const onSubmit = async (values: BookTypeFormValues) => {
    setLoading(true);

    try {
      const payload = {
        ...values,
      };

      let response;
      if (isEditing && bookType?.bkt_code) {
        response = await api.put(`/book-types/${bookType.bkt_code}`, payload);
      } else {
        response = await api.post("/book-types", payload);
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Book type updated" : "Book type created",
          description: `Book type ${
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
      console.error("Failed to save book type:", error);
      toast({
        title: "Failed to save book type",
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
      bkt_code: bookType?.bkt_code || "",
      bkt_name: "",
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
            {isEditing ? "Edit Book Type" : "Add New Book Type"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-2 py-2"
          >
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="bkt_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book Type Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter book type code (e.g., BT001)"
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
                name="bkt_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book Type Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter book type name" {...field} />
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
