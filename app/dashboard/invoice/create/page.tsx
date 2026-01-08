"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@/components/ui/date-picker";
import { Trash2, Plus, FileText, ArrowLeft, X } from "lucide-react";
import { CustomerSearch } from "@/components/shared/customer-search";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const invoiceSchema = z.object({
  location: z.string().min(1, "Location is required"),
  date: z.date(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  saleType: z.enum(["WHOLE", "RETAIL"]),
  customer: z.string().min(1, "Customer is required"),
  salesAssistant: z.string(),
  pOrderNo: z.string(),
  manualNo: z.string(),
  reference: z.string(),
  comments: z.string(),
  discount_per: z.number(),
  tax_per: z.number(),
  delivery_charges: z.number(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceItem {
  lineNo: number;
  type: string;
  productCode: string;
  productName: string;
  selPrice: number;
  unitQty: number;
  freeQty: number;
  packQty: number;
  totalQty: number;
  discount: number;
  amount: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<any[]>([]);
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isGeneratingInv, setIsGeneratingInv] = useState(false);
  const [tempInvNumber, setTempInvNumber] = useState<string>("");
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  // Form for item addition
  const [itemType, setItemType] = useState<string>("PRODUCT");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selPrice, setSelPrice] = useState<number>(0);
  const [packQty, setPackQty] = useState<number>(0);
  const [unitQty, setUnitQty] = useState<number>(0);
  const [freeQty, setFreeQty] = useState<number>(0);
  const [itemDiscount, setItemDiscount] = useState<number>(0);

  const isEditMode = useMemo(() => {
    return (
      searchParams.has("doc_no") &&
      searchParams.has("status") &&
      searchParams.has("iid")
    );
  }, [searchParams]);

  const isApplied = useMemo(() => {
    if (!isEditMode) return false;
    return searchParams.get("status") === "applied";
  }, [isEditMode, searchParams]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      location: "",
      date: new Date(),
      paymentMethod: "",
      saleType: "RETAIL",
      customer: "",
      salesAssistant: "",
      pOrderNo: "",
      manualNo: "",
      reference: "",
      comments: "",
      discount_per: 0,
      tax_per: 0,
      delivery_charges: 0,
    },
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data: res } = await api.get("/locations");
        if (res.success) {
          setLocations(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };
    fetchLocations();
  }, []);

  const generateInvoiceNumber = useCallback(async (locaCode: string) => {
    try {
      setIsGeneratingInv(true);
      // Assuming there's an endpoint for this, similar to payment voucher
      // If not, I'll just use a placeholder or check if I need to implement it
      const { data: res } = await api.get(
        `/transactions/generate-code/INV/${locaCode}`
      );
      if (res.success) {
        setInvoiceNo(res.code);
        setTempInvNumber(res.code);
      }
    } catch (error) {
      console.error("Failed to generate invoice number:", error);
    } finally {
      setIsGeneratingInv(false);
    }
  }, []);

  const handleLocationChange = (val: string) => {
    form.setValue("location", val);
    if (val) {
      generateInvoiceNumber(val);
    } else {
      setInvoiceNo("");
      setTempInvNumber("");
    }
  };

  const handleCustomerChange = async (customerCode: string) => {
    form.setValue("customer", customerCode);
    if (customerCode) {
      try {
        const { data: res } = await api.get(`/customers/${customerCode}`);
        if (res.success) {
          setCustomerDetails(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch customer details", err);
      }
    } else {
      setCustomerDetails(null);
    }
  };

  const handleProductChange = (product: any) => {
    setSelectedProduct(product);
    if (product) {
      setSelPrice(product.selling_price || 0);
    } else {
      setSelPrice(0);
    }
  };

  const calculateItemAmount = () => {
    const totalQty = packQty * (selectedProduct?.pack_size || 1) + unitQty;
    return totalQty * selPrice - itemDiscount;
  };

  const addItem = () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        type: "error",
      });
      return;
    }

    const totalQty = packQty * (selectedProduct?.pack_size || 1) + unitQty;
    if (totalQty <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        type: "error",
      });
      return;
    }

    const newItem: InvoiceItem = {
      lineNo: items.length + 1,
      type: itemType,
      productCode: selectedProduct.prod_code,
      productName: selectedProduct.prod_name,
      selPrice: selPrice,
      unitQty: unitQty,
      freeQty: freeQty,
      packQty: packQty,
      totalQty: totalQty,
      discount: itemDiscount,
      amount: calculateItemAmount(),
    };

    setItems([...items, newItem]);
    // Reset item fields
    setSelectedProduct(null);
    setPackQty(0);
    setUnitQty(0);
    setFreeQty(0);
    setItemDiscount(0);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Update line numbers
    const updatedItems = newItems.map((item, i) => ({
      ...item,
      lineNo: i + 1,
    }));
    setItems(updatedItems);
  };

  const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountVal = (subTotal * form.watch("discount_per")) / 100;
  const taxVal = ((subTotal - discountVal) * form.watch("tax_per")) / 100;
  const netAmount =
    subTotal -
    discountVal +
    taxVal +
    Number(form.watch("delivery_charges") || 0);

  const onSubmit = async (data: InvoiceFormValues) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        type: "error",
      });
      return;
    }

    const payload = {
      ...data,
      invoiceNo,
      items,
      subTotal,
      discountVal,
      taxVal,
      netAmount,
    };

    try {
      const { data: res } = await api.post("/invoices", payload);
      if (res.success) {
        toast({
          title: "Success",
          description: "Invoice created successfully",
          type: "success",
        });
        router.push("/dashboard/invoice");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create invoice",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/invoice")}
          className="flex items-center gap-1 px-2 py-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>

        <div className="flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">
            {isEditMode ? "Edit Invoice" : "New Invoice"}
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs justify-end">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Outstanding:</span>
            <span className="font-bold">
              Rs {customerDetails?.outstanding || "0.00"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Setoff:</span>
            <span className="font-bold">Rs 0.00</span>
          </div>

          <Badge variant="secondary" className="px-3 py-1">
            <div className="flex items-center gap-2">
              <span>Invoice No:</span>
              {isGeneratingInv ? (
                <ClipLoader size={14} />
              ) : (
                <span className="font-bold">{tempInvNumber || "..."}</span>
              )}
            </div>
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-12 gap-5 items-end p-4 rounded-xl shadow-sm border">
            <div className="col-span-12 md:col-span-3">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 font-semibold">
                      Location<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={handleLocationChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select Location --" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.loca_code} value={loc.loca_code}>
                            {loc.loca_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 font-semibold">
                      Date<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 font-semibold">
                      Payment Methods
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="--Select Payment method--" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">CASH</SelectItem>
                        <SelectItem value="CREDIT">CREDIT</SelectItem>
                        <SelectItem value="CHEQUE">CHEQUE</SelectItem>
                        <SelectItem value="CARD">CARD</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormField
                control={form.control}
                name="saleType"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Tabs
                        value={field.value}
                        onValueChange={field.onChange}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2 p-2">
                          <TabsTrigger value="WHOLE" className="font-bold">
                            Wholesale
                          </TabsTrigger>
                          <TabsTrigger value="RETAIL" className="font-bold">
                            Retail Sale
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card>
              <div className="px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-bold">Customer Details</span>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="relative">
                  <CustomerSearch
                    value={form.watch("customer")}
                    onValueChange={handleCustomerChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-y-3 p-3 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold">Due Balance</span>
                    <span>
                      {customerDetails?.due_balance
                        ? `Rs ${customerDetails.due_balance}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-xs font-semibold">
                      No of Due Invoice
                    </span>
                    <span>{customerDetails?.due_invoices_count || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold">PD Check</span>
                    <span>{customerDetails?.pd_check || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-xs font-semibold">Refund</span>
                    <span>{customerDetails?.refund || "-"}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Address:</Label>
                  <Textarea
                    placeholder="Address details..."
                    value={customerDetails?.address || ""}
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right side: Sales Asst and Refs */}
            <Card>
              <div className="px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-bold">Project & Reference</span>
              </div>
              <CardContent className="p-5 space-y-5">
                <FormField
                  control={form.control}
                  name="salesAssistant"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs">Sales Assistant</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- Select Sales Assistant --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SA001">
                            SA001 - John Doe
                          </SelectItem>
                          <SelectItem value="SA002">
                            SA002 - Jane Smith
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">P.ORDER NO</Label>
                    <Input {...form.register("pOrderNo")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">MANUAL NO</Label>
                    <Input {...form.register("manualNo")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">REFERENCE</Label>
                    <Input {...form.register("reference")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Table Area */}
          <div className="space-y-0rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b leading-none">
                    <TableHead className="w-[60px] text-xs font-bold">
                      #
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Free</TableHead>
                    <TableHead>Pack</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Disc</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[60px] text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center h-12 text-slate-400 font-medium italic"
                      >
                        No items added to this invoice yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow
                        key={index}
                        className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="font-mono text-xs text-slate-400">
                          {item.lineNo}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.type === "PRODUCT"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {item.productCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {item.selPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unitQty}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">
                          {item.freeQty}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.packQty}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800">
                          {item.totalQty}
                        </TableCell>
                        <TableCell className="text-right text-red-500">
                          {item.discount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#1e40af]">
                          {item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center p-0 px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Section 4: Product Addition Area */}
          <div className="p-4 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-3 w-3" />
              <h3 className="font-semibold text-sm">Add Item to Invoice</h3>
            </div>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 md:col-span-2 space-y-1.5">
                <Label>Line Type</Label>
                <Select onValueChange={setItemType} value={itemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 md:col-span-3 space-y-1.5">
                <Label>Search Product/Service</Label>
                <div className="relative">
                  <BasicProductSearch
                    value={selectedProduct?.prod_code}
                    onValueChange={handleProductChange}
                  />
                  {selectedProduct && (
                    <button
                      type="button"
                      onClick={() => handleProductChange(null)}
                    ></button>
                  )}
                </div>
              </div>
              <div>
                <Label>Sel. Price</Label>
                <Input
                  type="number"
                  value={selPrice}
                  onChange={(e) => setSelPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Pack Qty</Label>
                <Input
                  type="number"
                  value={packQty}
                  onChange={(e) => setPackQty(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Unit Qty</Label>
                <Input
                  type="number"
                  value={unitQty}
                  onChange={(e) => setUnitQty(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Free Qty</Label>
                <Input
                  type="number"
                  value={freeQty}
                  onChange={(e) => setFreeQty(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Discount</Label>
                <Input
                  type="number"
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={calculateItemAmount().toFixed(2)} />
              </div>
              <div>
                <Button type="button" onClick={addItem}>
                  ADD
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Current Stock</span>
                  <span className="text-xs">
                    {selectedProduct?.stock || 0}{" "}
                    {selectedProduct?.unit_name || "units"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Bottom Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* LEFT SIDE */}
            <div className="md:col-span-7 space-y-2">
              <div>
                <Label>Comments</Label>
                <Textarea
                  value={form.watch("comments")}
                  onChange={form.register("comments").onChange}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline">
                  Draft Invoice
                </Button>
                <Button type="submit">Apply Invoice</Button>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="md:col-span-5 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <Label>Discount %:</Label>
                <Input
                  type="number"
                  {...form.register("discount_per", { valueAsNumber: true })}
                />
                <Input disabled value={discountVal.toFixed(2)} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Label>Tax %:</Label>
                <Input
                  type="number"
                  {...form.register("tax_per", { valueAsNumber: true })}
                />
                <Input disabled value={taxVal.toFixed(2)} />
              </div>

              {/* Delivery */}
              <div className="grid grid-cols-3 gap-3">
                <Label>Delivery Charges:</Label>
                <div />
                <Input
                  type="number"
                  {...form.register("delivery_charges", {
                    valueAsNumber: true,
                  })}
                />
              </div>

              {/* Net Amount */}
              <div className="grid grid-cols-3 items-center gap-3">
                <Label className="font-semibold">Net Amount:</Label>
                <div />
                <Input
                  disabled
                  value={netAmount.toFixed(2)}
                  className="text-right font-bold"
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
