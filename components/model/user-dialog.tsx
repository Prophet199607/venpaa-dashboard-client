"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
    role: z.string().min(1, "Role is required"),
    location: z.string().max(255, "Location is too long").optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

const editUserSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
    role: z.string().min(1, "Role is required"),
    location: z.string().max(255, "Location is too long").optional(),
  })
  .superRefine((data, ctx) => {
    const password = data.password?.trim() ?? "";
    const confirmation = data.password_confirmation?.trim() ?? "";

    if (password.length === 0 && confirmation.length === 0) {
      return;
    }

    if (password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must be at least 8 characters",
      });
    }

    if (password !== confirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password_confirmation"],
        message: "Passwords do not match",
      });
    }
  });

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;
type UserFormValues = CreateUserFormValues | EditUserFormValues;

interface Role { id: number; name: string }

interface Location { id: number; loca_code: string; loca_name: string; delivery_address?: string }

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  user?: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    location?: string | null;
  } | null;
}

export default function UserDialog({
  open,
  onOpenChange,
  onSuccess,
  mode,
  user,
}: UserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const inferredMode: "create" | "edit" = useMemo(() => {
    if (mode) return mode;
    return user ? "edit" : "create";
  }, [mode, user]);
  const isEditMode = inferredMode === "edit" && !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? editUserSchema : createUserSchema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "", role: "", location: "" },
  });

  const fetchRoles = useCallback(async () => {
    try {
      setFetching(true);
      const response = await api.get("/roles");
      const res = response.data;
      if (Array.isArray(res)) setRoles(res);
      else if (res.data && Array.isArray(res.data)) setRoles(res.data);
      else if (res.success && Array.isArray(res.data)) setRoles(res.data);
    } catch (error: any) {
      toast({ title: "Failed to load roles", description: error.response?.data?.message || "Please try again", type: "error" });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const fetchLocations = useCallback(async () => {
    try {
      setFetchingLocations(true);
      const response = await api.get("/locations");
      const res = response.data;
      let data: any[] = [];
      if (Array.isArray(res)) data = res;
      else if (res.data && Array.isArray(res.data)) data = res.data;
      else if (res.success && Array.isArray(res.data)) data = res.data;

      const mapped = data.map((loc: any) => ({
        id: loc.id,
        loca_code: loc.loca_code,
        loca_name: loc.loca_name,
        delivery_address: loc.delivery_address,
      }));

      setLocations(mapped);
    } catch (error: any) {
      toast({ title: "Failed to load locations", description: error.response?.data?.message || "Please try again", type: "error" });
    } finally {
      setFetchingLocations(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    fetchRoles();
    fetchLocations();
  }, [open, fetchRoles, fetchLocations]);

  useEffect(() => {
    if (!open) return;

    if (isEditMode && user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        password_confirmation: "",
        role: user.roles?.[0] ?? "",
        location: (user as any).location ?? "",
      });
    } else {
      form.reset({ name: "", email: "", password: "", password_confirmation: "", role: "", location: "" });
    }
  }, [open, form, isEditMode, user]);

  useEffect(() => {
    if (!open) return;
    form.reset(form.getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  const onSubmit = async (values: UserFormValues) => {
    setLoading(true);
    try {
      if (isEditMode && user) {
        const payload: Record<string, any> = {
          name: values.name.trim(),
          email: values.email.trim(),
          role: values.role,
        };

        const location = (values as any).location?.trim() ?? "";
        if (location.length > 0) payload.location = location;

        const password = (values.password ?? "").trim();
        const confirmation = (values.password_confirmation ?? "").trim();

        if (password.length > 0) {
          payload.password = password;
          payload.password_confirmation = confirmation;
        }

        const res = await api.put(`/users/${user.id}`, payload);
        if (res.data.success) {
          toast({
            title: "User updated",
            description: `User ${values.name} updated successfully`,
            type: "success",
            duration: 3000,
          });
          onOpenChange(false);
          onSuccess?.();
        }
      } else {
        const res = await api.post("/users", values);
        if (res.data.success) {
          toast({ title: "User created", description: `User ${values.name} created successfully`, type: "success", duration: 3000 });
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors as Record<string, string[]>;
        Object.keys(errors).forEach((k) => {
          form.setError(k as keyof UserFormValues, { type: "manual", message: errors[k][0] });
        });
      }
      toast({ title: "Operation failed", description: error.response?.data?.message || "Please try again", type: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(() => form.reset(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter user name" autoComplete="name" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" autoComplete="email" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isEditMode ? "Leave blank to keep existing password" : "Min 8 characters"}
                        autoComplete={isEditMode ? "new-password" : "new-password"}
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        autoComplete="new-password"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Role *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={fetching || loading || (isEditMode && user?.roles?.[0]?.toLowerCase() === "admin")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="--Select Role--" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.name}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={fetchingLocations || loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="--Choose Location--" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loca) => (
                          <SelectItem key={loca.id} value={loca.loca_code}>
                            {loca.loca_name} - {loca.loca_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex justify-end mt-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader />
                    {isEditMode ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  (isEditMode ? "Save Changes" : "Create User")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
