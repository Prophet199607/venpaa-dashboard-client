"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const permissionSchema = z.object({
  name: z
    .string()
    .min(1, "Permission name is required")
    .max(255, "Permission name is too long")
    .regex(/^[a-z0-9_\s]+$/, "Use lowercase letters, numbers, underscores, and spaces only"),
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PermissionDialog({ open, onOpenChange, onSuccess }: PermissionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) form.reset({ name: "" });
  }, [open, form]);

  const onSubmit = async (values: PermissionFormValues) => {
    setLoading(true);
    try {
      const res = await api.post("/permissions", values);
      if (res.data) {
        toast({ title: "Permission created", description: `Permission ${values.name} created successfully`, type: "success", duration: 3000 });
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      toast({ title: "Operation failed", description: error.response?.data?.message || "Please try again", type: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(() => form.reset({ name: "" }), 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add New Permission</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., create invoice, manage users" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-end mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader />
                    Creating...
                  </>
                ) : (
                  "Create Permission"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
