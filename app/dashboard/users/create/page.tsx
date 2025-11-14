"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const userSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
    role: z.string().min(1, "Role is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormData = z.infer<typeof userSchema>;

interface Role {
  id: number;
  name: string;
}

function UserFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "",
    },
  });

  const fetchRoles = useCallback(async () => {
    try {
      setFetching(true);
      const response = await api.get("/roles");
      const res = response.data;

      if (Array.isArray(res)) {
        setRoles(res);
      } else if (res.data && Array.isArray(res.data)) {
        setRoles(res.data);
      } else if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch roles:", err);
      toast({
        title: "Failed to load roles",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchRoles();
  }, [fetchRoles]);

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const response = await api.post("/users", {
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        role: values.role,
      });

      if (response.data.success) {
        toast({
          title: "User created",
          description: `User ${values.name} created successfully`,
          type: "success",
          duration: 3000,
        });

        router.push("/dashboard/users");
      }
    } catch (error: any) {
      console.error("Failed to submit form:", error);

      // Show validation errors if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((key) => {
          const fieldKey = key === "password_confirmation" ? "password_confirmation" : key as keyof FormData;
          form.setError(fieldKey, {
            type: "manual",
            message: errors[key][0],
          });
        });
        toast({
          title: "Validation Error",
          description: Object.values(errors).flat().join(", "),
          type: "error",
          duration: 5000,
        });
      } else {
        toast({
          title: "Operation failed",
          description: error.response?.data?.message || "Please try again",
          type: "error",
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    form.reset({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "",
    });
  }, [form]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <div className="text-lg font-semibold">Create User</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter user name"
                            {...field}
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter password (min 8 characters)"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 8 characters long
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
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
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={fetching || roles.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="--Select Role--" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Clear
                </Button>
                <Button type="submit" disabled={loading} className="min-w-24">
                  {loading ? (
                    <>
                      <Loader />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        {fetching || loading ? <Loader /> : null}
      </Card>
    </div>
  );
}

export default function UserForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserFormContent />
    </Suspense>
  );
}

