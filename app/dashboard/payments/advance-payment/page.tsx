"use client";

import { useState, useEffect } from "react";
import * as z from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchSelect } from "@/components/ui/search-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SupplierSearch } from "@/components/shared/supplier-search";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  type: z.enum(["customer", "supplier"]),
  location: z.string().min(1, "Location is required"),
  paymentMode: z.string().min(1, "Payment Mode is required"),
  amount: z.string().min(1, "Amount is required"),
  customer: z.string().optional(),
  supplier: z.string().optional(),
  remarks: z.string().optional(),

  // Conditional fields
  bankName: z.string().optional(),
  branch: z.string().optional(),
  chequeNo: z.string().optional(),
  cardType: z.string().optional(),
  cardNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const bankListS = [
  "People's Bank",
  "Commercial Bank",
  "Sampath Bank",
  "Hatton National Bank (HNB)",
  "National Development Bank (NDB)",
  "Bank of Ceylon (BOC)",
  "Union Bank",
  "Seylan Bank",
  "DFCC Bank",
  "Cargills Bank",
  "LB Finance",
  "Nations Trust Bank (NTB)",
  "Amana Bank",
  "National Savings Bank",
  "Pan Asia Bank",
  "Sanasa Development Bank",
  "Citizens Development Business Finance PLC",
  "Sri Lanka Savings Bank",
  "Standard Chartered Bank",
  "ICICI Bank",
  "HSBC",
  "MCB Bank",
  "Axis Bank",
  "Indian Bank",
];
const PAYMENT_MODES = ["CASH", "CARD", "CHEQUE", "BANK TRANSFER"];

export default function AdvancePaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"customer" | "supplier">(
    "customer"
  );
  const [documentDate, setDocumentDate] = useState<Date | undefined>(
    new Date()
  );
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "customer",
      location: "",
      customer: "",
      supplier: "",
      paymentMode: "",
      remarks: "",
      amount: "",
    },
  });

  const paymentMode = form.watch("paymentMode");

  // Fetch Locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data: res } = await api.get("/locations");
        if (res.success) {
          setLocations(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch locations", error);
      }
    };
    fetchLocations();
  }, []);

  // Fetch Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data: res } = await api.get("/customers");
        if (res.success) {
          setCustomers(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch customers", error);
      }
    };
    fetchCustomers();
  }, []);

  const onSubmit = async (data: FormValues) => {
    // Validate based on type
    if (activeTab === "customer" && !data.customer) {
      form.setError("customer", { message: "Customer is required" });
      return;
    }
    if (activeTab === "supplier" && !data.supplier) {
      form.setError("supplier", { message: "Supplier is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formatDate = (date: Date | undefined) => {
        if (!date) return undefined;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const submissionData = {
        advance: {
          ...data,
          documentDate: formatDate(documentDate),
          paymentDate: formatDate(paymentDate),
        },
      };

      console.log("Submitting:", submissionData);

      const response = await api.post(
        "/transactions/save-advance",
        submissionData
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Advance payment saved successfully.",
          type: "success",
        });

        // Reset form and dates
        form.reset({
          type: activeTab,
          location: "",
          customer: "",
          supplier: "",
          paymentMode: "",
          remarks: "",
          amount: "",
        });
        setDocumentDate(new Date());
        setPaymentDate(new Date());
      } else {
        toast({
          title: "Error",
          description:
            response.data.message || "Failed to save advance payment.",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "An error occurred.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (value: string) => {
    const type = value as "customer" | "supplier";
    setActiveTab(type);
    form.setValue("type", type);
    if (type === "customer") {
      form.setValue("supplier", "");
    } else {
      form.setValue("customer", "");
    }
  };

  const customerOptions = customers.map((c) => ({
    label: `${c.customer_name} (${c.customer_code})`,
    value: c.customer_code,
  }));

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Advance Payment</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/payments/advance-payment")}
          className="flex items-center gap-1 px-2 py-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>

      <div className="space-y-2 mt-2">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <TabsList>
                <TabsTrigger value="customer">Customer Advance</TabsTrigger>
                <TabsTrigger value="supplier">Supplier Advance</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col space-y-1">
                      <Label>Document Date*</Label>
                      <DatePicker
                        date={documentDate}
                        setDate={setDocumentDate}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Location*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="--Choose Location--" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.loca_code}>
                                  {loc.loca_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {activeTab === "customer" ? (
                      <FormField
                        control={form.control}
                        name="customer"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-1">
                            <FormLabel>Customer*</FormLabel>
                            <SearchSelect
                              items={customerOptions}
                              value={field.value || ""}
                              onValueChange={field.onChange}
                              placeholder="Select Customer"
                              searchPlaceholder="Search customer..."
                              emptyMessage="No customer found"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="supplier"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-1">
                            <FormLabel>Supplier*</FormLabel>
                            <SupplierSearch
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="paymentMode"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Payment Mode*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="--Choose Payment Mode--" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_MODES.map((mode) => (
                                <SelectItem key={mode} value={mode}>
                                  {mode}
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
                      name="remarks"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2 space-y-1">
                          <FormLabel>Remarks*</FormLabel>
                          <FormControl>
                            <Input placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Card className="bg-slate-50 border">
                    <CardContent className="p-3">
                      <h3 className="text-sm font-semibold mb-2">
                        Payment Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel>Amount*</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-1">
                          <Label>Date*</Label>
                          <DatePicker
                            date={paymentDate}
                            setDate={setPaymentDate}
                          />
                        </div>

                        {/* Conditional Fields based on Payment Mode */}
                        {["CARD", "BANK TRANSFER", "CHEQUE"].includes(
                          paymentMode
                        ) && (
                          <>
                            <FormField
                              control={form.control}
                              name="bankName"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormLabel>Bank Name</FormLabel>
                                  <FormControl>
                                    <SearchSelect
                                      items={bankListS.map((bank) => ({
                                        value: bank,
                                        label: bank,
                                      }))}
                                      value={field.value || ""}
                                      onValueChange={field.onChange}
                                      placeholder="Select Bank"
                                      searchPlaceholder="Search bank..."
                                      emptyMessage="No bank found."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="branch"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormLabel>Branch</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter Branch"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        {paymentMode === "CARD" && (
                          <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel>Card Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter Card Number"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {paymentMode === "CHEQUE" && (
                          <>
                            <FormField
                              control={form.control}
                              name="chequeNo"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormLabel>Cheque No</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter Cheque No"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button type="submit">Apply</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </>
  );
}
