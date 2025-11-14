"use client";

import { useEffect, useMemo, useState } from "react";
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

const roleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(255, "Role name is too long")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  role?: {
    id: number;
    name: string;
  } | null;
  mode?: "create" | "edit";
}

export default function RoleDialog({
  open,
  onOpenChange,
  onSuccess,
  role,
  mode,
}: RoleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const inferredMode: "create" | "edit" = useMemo(() => {
    if (mode) return mode;
    return role ? "edit" : "create";
  }, [mode, role]);
  const isEditMode = inferredMode === "edit" && !!role;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!open) return;

    if (isEditMode && role) {
      form.reset({ name: role.name });
    } else {
      form.reset({ name: "" });
    }
  }, [open, form, isEditMode, role]);

  const onSubmit = async (values: RoleFormValues) => {
    setLoading(true);
    try {
      const payload = { name: values.name.trim() };

      if (isEditMode && role) {
        const res = await api.put(`/roles/${role.id}`, payload);
        if (res.data) {
          toast({
            title: "Role updated",
            description: `Role ${payload.name} updated successfully`,
            type: "success",
            duration: 3000,
          });
          onOpenChange(false);
          onSuccess?.();
        }
      } else {
        const res = await api.post("/roles", payload);
        if (res.data) {
          toast({
            title: "Role created",
            description: `Role ${payload.name} created successfully`,
            type: "success",
            duration: 3000,
          });
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } catch (error: any) {
      toast({ title: "Operation failed", description: error.response?.data?.message || "Please try again", type: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setTimeout(() => form.reset({ name: "" }), 300);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Role" : "Add New Role"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., admin, staff"
                      {...field}
                      disabled={loading || (isEditMode && role?.name.toLowerCase() === "admin")}
                    />
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
                    {isEditMode ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  (isEditMode ? "Save Changes" : "Create Role")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
