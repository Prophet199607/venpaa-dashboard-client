"use client";

import * as z from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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

const formSchema = z.object({
  sales_code: z.string().optional(),
  sales_name: z.string().min(2, "Name is required"),
  sales_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  sales_phone: z.string().optional(),
  sales_address: z.string().optional(),
  sales_status: z.enum(["Active", "Inactive"]),
});

interface SalesmanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesman?: any;
  onSuccess: () => void;
}

export function SalesmanForm({
  open,
  onOpenChange,
  salesman,
  onSuccess,
}: SalesmanFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sales_code: "",
      sales_name: "",
      sales_email: "",
      sales_phone: "",
      sales_address: "",
      sales_status: "Active",
    },
  });

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const { data: res } = await api.get("/salesmen/generate-code");
        if (res.success) {
          form.setValue("sales_code", res.code);
        }
      } catch (err) {
        console.error("Failed to fetch sales code", err);
      }
    };

    if (open && !salesman) {
      fetchCode();
    }
  }, [open, salesman, form]);

  useEffect(() => {
    if (salesman) {
      form.reset({
        sales_code: salesman.sales_code || "",
        sales_name: salesman.sales_name || "",
        sales_email: salesman.sales_email || "",
        sales_phone: salesman.sales_phone || "",
        sales_address: salesman.sales_address || "",
        sales_status:
          salesman.sales_status === 1 || salesman.sales_status === "Active"
            ? "Active"
            : "Inactive",
      });
    } else {
      form.reset({
        sales_code: "",
        sales_name: "",
        sales_email: "",
        sales_phone: "",
        sales_address: "",
        sales_status: "Active",
      });
    }
  }, [salesman, form]);
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const payload = {
        ...values,
        sales_status: values.sales_status === "Active" ? 1 : 0,
      };
      if (salesman) {
        await api.put(`/salesmen/${salesman.id}`, payload);
        toast({
          title: "Success",
          description: "Salesman updated successfully",
          type: "success",
        });
      } else {
        await api.post("/salesmen", payload);
        toast({
          title: "Success",
          description: "Salesman created successfully",
          type: "success",
        });
      }
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {salesman ? "Edit Salesman" : "Add New Salesman"}
          </SheetTitle>
          <SheetDescription>
            {salesman
              ? "Update salesman details."
              : "Create a new salesman profile for your team."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sales_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Code</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sales_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sales_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sales_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone no" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sales_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sales_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader />}
                {salesman ? "Update Salesman" : "Save Salesman"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
