"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { ArrowLeft, Key } from "lucide-react";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";

const permissionSchema = z.object({
  name: z
    .string()
    .min(1, "Permission name is required")
    .max(255, "Permission name is too long")
    .regex(
      /^[a-z0-9_\s]+$/,
      "Permission name must contain only lowercase letters, numbers, underscores, and spaces"
    ),
});

type FormData = z.infer<typeof permissionSchema>;

function PermissionFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const response = await api.post("/permissions", {
        name: values.name,
      });

      if (response.data) {
        toast({
          title: "Permission created",
          description: `Permission ${values.name} created successfully`,
          type: "success",
          duration: 3000,
        });

        router.push("/dashboard/permissions");
      }
    } catch (error: any) {
      console.error("Failed to submit form:", error);

      // Show validation errors if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((key) => {
          form.setError(key as keyof FormData, {
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
    });
  }, [form]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <div className="text-lg font-semibold">Create Permission</div>
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
                <div className="space-y-2 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Permission Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter permission name (e.g., create invoice, edit user, view reports)"
                            {...field}
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Use lowercase letters, numbers, underscores, and spaces only
                        </p>
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
                    "Create Permission"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>
    </div>
  );
}

export default function PermissionForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PermissionFormContent />
    </Suspense>
  );
}

