"use client";

import * as z from "zod";
import { api } from "@/utils/api";
import { useForm, Resolver } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Shield, Settings, Percent, Banknote } from "lucide-react";

const formSchema = z
  .object({
    emp_code: z.string().min(1, "Employee is required"),
    emp_name: z.string().min(1, "Display name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    confirm_password: z.string().min(1, "Confirm password is required"),
    mobile_number: z.string(),
    cashier_loca: z.string().min(1, "Location is required"),
    cancel: z.boolean(),
    refund: z.boolean(),
    cash_refund: z.boolean(),
    cash_out: z.boolean(),
    discount_allow: z.boolean(),
    discount: z.preprocess(
      (v) => (v === "" || v === undefined ? 0 : v),
      z.coerce.number(),
    ),
    dept_allow: z.boolean(),
    day_end_rep: z.boolean(),
    bill_copy: z.boolean(),
    sec_level: z.string(),
    disables: z.boolean(),
    cr_note_issue: z.boolean(),
    gift_voucher_issue: z.boolean(),
    sale_value: z.boolean(),
    new_price_allow: z.boolean(),
    refund_limit: z.preprocess(
      (v) => (v === "" || v === undefined ? 0 : v),
      z.coerce.number(),
    ),
    discount_amount: z.preprocess(
      (v) => (v === "" || v === undefined ? 0 : v),
      z.coerce.number(),
    ),
    discount_type: z.enum(["percentage", "amount"]),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof formSchema>;

interface CashierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashier?: any;
  onSuccess: () => void;
}

export function CashierForm({
  open,
  onOpenChange,
  cashier,
  onSuccess,
}: CashierFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      emp_code: "",
      emp_name: "",
      username: "",
      password: "",
      confirm_password: "",
      mobile_number: "",
      cashier_loca: "",
      cancel: false,
      refund: false,
      cash_refund: false,
      cash_out: false,
      discount_allow: false,
      discount: 0,
      dept_allow: false,
      day_end_rep: false,
      bill_copy: false,
      sec_level: "",
      disables: false,
      cr_note_issue: false,
      gift_voucher_issue: false,
      sale_value: false,
      new_price_allow: false,
      refund_limit: 0,
      discount_amount: 0,
      discount_type: "percentage",
    },
  });

  const fetchFormData = async () => {
    try {
      setFetchingData(true);
      const [formDataRes, codeRes] = await Promise.all([
        api.get("/cashiers/form-data"),
        !cashier ? api.get("/cashiers/generate-code") : Promise.resolve(null),
      ]);

      setFormData(formDataRes.data);

      if (!cashier && codeRes?.data?.code) {
        form.setValue("emp_code", codeRes.data.code);
      }
    } catch (err) {
      console.error("Failed to fetch form data", err);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFormData();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (cashier) {
        form.reset({
          ...cashier,
          confirm_password: cashier.password,
          sec_level: cashier.sec_level?.toString() || "",
          discount_type: cashier.discount > 0 ? "percentage" : "amount",
          mobile_number: cashier.mobile_number || "",
          cancel: cashier.cancel === 1,
          refund: cashier.refund === 1,
          cash_refund: cashier.cash_refund === 1,
          cash_out: cashier.cash_out === 1,
          discount_allow: cashier.discount_allow === 1,
          dept_allow: cashier.dept_allow === 1,
          day_end_rep: cashier.day_end_rep === 1,
          bill_copy: cashier.bill_copy === 1,
          disables: cashier.disables === 1,
          cr_note_issue: cashier.cr_note_issue === 1,
          gift_voucher_issue: cashier.gift_voucher_issue === 1,
          sale_value: cashier.sale_value === 1,
          new_price_allow: cashier.new_price_allow === 1,
        });
      } else {
        form.reset({
          emp_code: "",
          emp_name: "",
          username: "",
          password: "",
          confirm_password: "",
          mobile_number: "",
          cashier_loca: "",
          cancel: false,
          refund: false,
          cash_refund: false,
          cash_out: false,
          discount_allow: false,
          discount: 0,
          dept_allow: false,
          day_end_rep: false,
          bill_copy: false,
          sec_level: "",
          disables: false,
          cr_note_issue: false,
          gift_voucher_issue: false,
          sale_value: false,
          new_price_allow: false,
          refund_limit: 0,
          discount_amount: 0,
          discount_type: "percentage",
        });
      }
    }
  }, [cashier, form, open]);

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);
      if (cashier) {
        await api.put(`/cashiers/${cashier.id}`, values);
        toast({
          title: "Success",
          description: "Cashier updated successfully",
          type: "success",
        });
      } else {
        await api.post("/cashiers", values);
        toast({
          title: "Success",
          description: "Cashier created successfully",
          type: "success",
        });
      }
      form.reset();
      onSuccess();
    } catch (err: any) {
      const errorData = err.response?.data;
      let errorMessage = errorData?.message || "Something went wrong";

      // If backend returns specific validation errors, format them for the toast
      if (errorData?.errors) {
        const specificErrors = Object.values(errorData.errors).flat();
        if (specificErrors.length > 0) {
          errorMessage = specificErrors.join(" ");
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {cashier ? "Edit Cashier" : "Add New Cashier"}
          </SheetTitle>
          <SheetDescription>
            {cashier
              ? "Update cashier settings and permissions."
              : "Configure a new cashier and their access rights."}
          </SheetDescription>
        </SheetHeader>

        {fetchingData ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader />
            Loading configuration...
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.error("Form Validation Errors:", errors);
                toast({
                  title: "Validation Error",
                  description:
                    "Please check the form for missing or invalid fields.",
                  type: "error",
                });
              })}
              className="space-y-8 py-6"
            >
              {/* Primary Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border p-4 bg-muted/20">
                <FormField
                  control={form.control}
                  name="emp_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cashier Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter cashier code"
                          {...field}
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emp_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cashier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter cashier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+94..." {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cashier_loca"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {formData?.locations?.map((loc: any) => (
                            <SelectItem
                              key={loc.loca_code}
                              value={loc.loca_code}
                            >
                              {loc.loca_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Options & Permissions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Settings className="h-4 w-4" />
                    <span>Options & Permissions</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-muted/20 px-3 py-1.5 rounded-md border border-primary/10">
                    <Checkbox
                      id="check-all"
                      checked={[
                        "cancel",
                        "refund",
                        "cash_refund",
                        "cash_out",
                        "discount_allow",
                        "dept_allow",
                        "day_end_rep",
                        "bill_copy",
                        "cr_note_issue",
                        "gift_voucher_issue",
                        "sale_value",
                        "new_price_allow",
                      ].every((key) => form.watch(key as any))}
                      onCheckedChange={(checked) => {
                        const keys = [
                          "cancel",
                          "refund",
                          "cash_refund",
                          "cash_out",
                          "discount_allow",
                          "dept_allow",
                          "day_end_rep",
                          "bill_copy",
                          "cr_note_issue",
                          "gift_voucher_issue",
                          "sale_value",
                          "new_price_allow",
                        ];
                        keys.forEach((key) =>
                          form.setValue(key as any, !!checked, {
                            shouldValidate: true,
                            shouldDirty: true,
                          }),
                        );
                      }}
                    />
                    <label
                      htmlFor="check-all"
                      className="text-xs font-bold cursor-pointer text-primary"
                    >
                      Check All
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 rounded-lg border p-4 bg-muted/10">
                  <FormField
                    control={form.control}
                    name="cancel"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Cancel
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refund"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Refund
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cash_refund"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Cash Refund
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cash_out"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Cash Out
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount_allow"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Discount Allow
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dept_allow"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Dept. Sales
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="day_end_rep"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Day End Report
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bill_copy"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Bill Copy
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cr_note_issue"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Credit Note
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gift_voucher_issue"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Gift Voucher
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sale_value"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Sale Value
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="new_price_allow"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          New Price
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Amount, Sec Level, and Limits */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Banknote className="h-4 w-4" />
                    <span>Discounts & Limits</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="discount_type"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="percentage"
                                checked={field.value === "percentage"}
                                onChange={() => field.onChange("percentage")}
                              />
                              <Percent className="h-3 w-3" /> %
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="amount"
                                checked={field.value === "amount"}
                                onChange={() => field.onChange("amount")}
                              />
                              <Banknote className="h-3 w-3" /> Amt
                            </label>
                          </div>
                        </FormItem>
                      )}
                    />
                    {form.watch("discount_type") === "percentage" ? (
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Percentage (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onFocus={(e) => e.target.select()}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="discount_amount"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onFocus={(e) => e.target.select()}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="refund_limit"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Cash Refund Limit</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onFocus={(e) => e.target.select()}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Shield className="h-4 w-4" />
                    <span>Security & Status</span>
                  </div>
                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="sec_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {formData?.sec_levels?.map((level: any) => (
                                <SelectItem
                                  key={level.id}
                                  value={level.sec_level}
                                >
                                  {level.member} ({level.sec_level})
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
                      name="disables"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-3 border-red-200 bg-red-50/30">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-semibold text-red-600 cursor-pointer">
                            Disable Cashier
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="pt-4 sticky bottom-0 bg-background border-t">
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-[2]">
                    {loading && <Loader />}
                    {cashier ? "Update Cashier" : "Save Cashier"}
                  </Button>
                </div>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
