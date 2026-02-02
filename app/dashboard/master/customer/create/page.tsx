"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@/components/ui/date-picker";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const customerSchema = z.object({
  customer_code: z
    .string()
    .min(1, "Customer code is required")
    .regex(/^C\d{5,}$/, "Code must follow the format C00001"),
  customer_name: z.string().min(1, "Customer name is required"),
  mobile: z.string().optional(),
  nic: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
  is_credit: z.boolean().optional(),
  credit_limit: z.string().optional(),
  credit_period: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function CustomerFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const customer_code_param = searchParams.get("customer_code");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_code: "",
      customer_name: "",
      mobile: "",
      nic: "",
      address: "",
      dob: "",
      is_credit: false,
      credit_limit: "",
      credit_period: "",
    },
  });

  const creditCustomer = form.watch("is_credit");

  const isEditing = !!customer_code_param;

  const generateCustomerCode = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/customers/generate-code");

      if (res.success) {
        form.setValue("customer_code", res.code);
      }
    } catch (err: any) {
      console.error("Failed to generate code:", err);
      toast({
        title: "Failed to generate code",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast, form]);

  const fetchCustomer = useCallback(
    async (code: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(`/customers/${code}`);

        if (res.success) {
          const customer = res.data;

          const formattedDob = customer.dob
            ? new Date(customer.dob).toISOString().split("T")[0]
            : "";

          form.reset({
            customer_code: customer.customer_code,
            customer_name: customer.customer_name,
            mobile: customer.mobile || "",
            nic: customer.nic || "",
            address: customer.address || "",
            dob: formattedDob,
            is_credit: customer.is_credit || false,
            credit_limit: customer.credit_limit
              ? String(customer.credit_limit)
              : "",
            credit_period: customer.credit_period
              ? String(customer.credit_period)
              : "",
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch customer:", err);
        toast({
          title: "Failed to load customer",
          description: err.response?.data?.message || "Please try again",
          type: "error",
          duration: 3000,
        });
      } finally {
        setFetching(false);
      }
    },
    [toast, form],
  );

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    if (isEditing && customer_code_param) {
      fetchCustomer(customer_code_param);
    } else {
      generateCustomerCode();
    }
  }, [isEditing, customer_code_param, fetchCustomer, generateCustomerCode]);

  const onSubmit = (values: CustomerFormValues) => {
    const submit = async () => {
      setLoading(true);
      try {
        const payload = values;

        let response;
        if (isEditing && customer_code_param) {
          response = await api.put(
            `/customers/${customer_code_param}`,
            payload,
          );
        } else {
          response = await api.post("/customers", payload);
        }

        if (response.data.success) {
          toast({
            title: isEditing ? "Customer updated" : "Customer created",
            description: `Customer ${values.customer_name} ${
              isEditing ? "updated" : "created"
            } successfully`,
            type: "success",
            duration: 3000,
          });

          router.push("/dashboard/master/customer");
        }
      } catch (error: any) {
        console.error("Failed to submit form:", error);

        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          Object.keys(errors).forEach((key) => {
            form.setError(key as any, {
              type: "manual",
              message: errors[key][0],
            });
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
    submit();
  };

  const handleReset = useCallback(() => {
    form.reset({
      customer_code: "",
      customer_name: "",
      mobile: "",
      nic: "",
      dob: "",
      is_credit: false,
      credit_limit: "",
      credit_period: "",
    });
    if (!isEditing) generateCustomerCode();
  }, [form, isEditing, generateCustomerCode]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Customer" : "Create Customer"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 self-start md:self-auto"
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
                    name="customer_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Customer code (e.g., C00001)"
                            disabled
                            {...field}
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
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="nic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIC</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter NIC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Enter address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-2">
                <FormField
                  control={form.control}
                  name="is_credit"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={!!field.value}
                          onCheckedChange={(v) => field.onChange(!!v)}
                        />
                      </FormControl>
                      <FormLabel className="!mb-0">Credit Customer</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {creditCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="credit_limit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter credit limit"
                              {...field}
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
                      name="credit_period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Period</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                placeholder="Enter credit period"
                                {...field}
                              />
                              <span className="ml-2 text-sm text-muted-foreground">
                                days
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : null}

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
                      {isEditing ? "Updating..." : "Submitting..."}
                    </>
                  ) : isEditing ? (
                    "Update"
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        {fetching || loading ? <Loader /> : null};
      </Card>
    </div>
  );
}

export default function CustomerForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerFormContent />
    </Suspense>
  );
}
