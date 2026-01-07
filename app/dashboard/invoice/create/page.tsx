"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [locations, setLocations] = useState<any[]>([]);
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  // Form for item addition
  const [itemType, setItemType] = useState<string>("PRODUCT");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selPrice, setSelPrice] = useState<number>(0);
  const [packQty, setPackQty] = useState<number>(0);
  const [unitQty, setUnitQty] = useState<number>(0);
  const [freeQty, setFreeQty] = useState<number>(0);
  const [itemDiscount, setItemDiscount] = useState<number>(0);

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
      setFetching(true);
      // Assuming there's an endpoint for this, similar to payment voucher
      // If not, I'll just use a placeholder or check if I need to implement it
      const { data: res } = await api.get(
        `/transactions/generate-code/INV/${locaCode}`
      );
      if (res.success) {
        setInvoiceNo(res.code);
      }
    } catch (error) {
      console.error("Failed to generate invoice number:", error);
    } finally {
      setFetching(false);
    }
  }, []);

  const handleLocationChange = (val: string) => {
    form.setValue("location", val);
    if (val) {
      generateInvoiceNumber(val);
    } else {
      setInvoiceNo("");
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
    <div className="space-y-4 p-4 max-w-[1400px] mx-auto bg-slate-50/30 min-h-screen">
      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
        <div className="bg-[#8b5cf6] text-white px-5 py-2 rounded-md font-bold flex items-center gap-2 shadow-sm">
          Invoice No: <span className="font-mono">{invoiceNo || "..."}</span>
        </div>
        <div className="bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] px-5 py-2 rounded-md font-medium shadow-sm transition-all hover:scale-105">
          Outstanding:{" "}
          <span className="font-bold ml-1">
            Rs {customerDetails?.outstanding || "0.00"}
          </span>
        </div>
        <div className="bg-[#eff6ff] text-[#1e40af] border border-[#dbeafe] px-5 py-2 rounded-md font-medium shadow-sm transition-all hover:scale-105">
          Setoff Amount: <span className="font-bold ml-1">Rs 0.00</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Top Controls */}
          <div className="grid grid-cols-12 gap-5 items-end bg-white p-6 rounded-xl shadow-sm border border-slate-100">
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
                        <SelectTrigger className="hover:border-[#8b5cf6] transition-colors h-11">
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
                    <div className="h-11">
                      <DatePicker date={field.value} setDate={field.onChange} />
                    </div>
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
                        <SelectTrigger className="hover:border-[#8b5cf6] transition-colors h-11">
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
            <div className="col-span-12 md:col-span-4 flex items-center justify-center pb-2">
              <FormField
                control={form.control}
                name="saleType"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => field.onChange("WHOLE")}
                          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                            field.value === "WHOLE"
                              ? "bg-white text-[#8b5cf6] shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Wholesale
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("RETAIL")}
                          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                            field.value === "RETAIL"
                              ? "bg-white text-[#8b5cf6] shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Retail Sale
                        </button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Section 2: Customer and Refs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Customer info */}
            <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md overflow-hidden bg-white">
              <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#8b5cf6] rounded-full"></span>
                  Customer Details
                </span>
                <div className="h-2 w-2 rounded-full bg-[#8b5cf6] animate-pulse"></div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="relative">
                  <CustomerSearch
                    value={form.watch("customer")}
                    onValueChange={handleCustomerChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Due Balance
                    </span>
                    <span className="font-semibold text-slate-900">
                      {customerDetails?.due_balance
                        ? `Rs ${customerDetails.due_balance}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      No of Due Invoice
                    </span>
                    <span className="font-semibold text-slate-900">
                      {customerDetails?.due_invoices_count || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      PD Check
                    </span>
                    <span className="font-semibold text-slate-900">
                      {customerDetails?.pd_check || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Refund
                    </span>
                    <span className="font-semibold text-slate-900">
                      {customerDetails?.refund || "-"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Address:
                  </Label>
                  <Textarea
                    placeholder="Address details..."
                    className="min-h-[70px] resize-none bg-slate-50 border-slate-100 focus:bg-white transition-all text-slate-600 leading-relaxed"
                    value={customerDetails?.address || ""}
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right side: Sales Asst and Refs */}
            <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md overflow-hidden bg-white">
              <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#8b5cf6] rounded-full"></span>
                  Project & Reference
                </span>
                <div className="h-2 w-2 rounded-full bg-[#8b5cf6] animate-pulse"></div>
              </div>
              <CardContent className="p-5 space-y-5">
                <FormField
                  control={form.control}
                  name="salesAssistant"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Sales Assistant
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="hover:border-[#8b5cf6] transition-colors h-11">
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
                    <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      P.ORDER NO
                    </Label>
                    <Input
                      {...form.register("pOrderNo")}
                      className="h-11 focus:ring-1 focus:ring-[#8b5cf6]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      MANUAL NO
                    </Label>
                    <Input
                      {...form.register("manualNo")}
                      className="h-11 focus:ring-1 focus:ring-[#8b5cf6]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      REFERENCE
                    </Label>
                    <Input
                      {...form.register("reference")}
                      className="h-11 focus:ring-1 focus:ring-[#8b5cf6]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Table Area */}
          <div className="space-y-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent border-b border-slate-200 leading-none">
                    <TableHead className="w-[60px] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      #
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Type
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Code
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Product Name
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Price
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Unit
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Free
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Pack
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Total Qty
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Disc
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
                      Amount
                    </TableHead>
                    <TableHead className="w-[60px] text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center h-24 text-slate-400 font-medium italic"
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
                        <TableCell className="font-medium text-slate-900">
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-5 w-5 text-[#8b5cf6]" />
              <h3 className="font-bold text-slate-700">Add Item to Invoice</h3>
            </div>
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-12 md:col-span-2 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Line Type
                </Label>
                <Select onValueChange={setItemType} value={itemType}>
                  <SelectTrigger className="bg-slate-50 border-slate-100 h-11">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT">PRODUCT</SelectItem>
                    <SelectItem value="SERVICE">SERVICE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 md:col-span-4 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Search Product/Service
                </Label>
                <div className="relative">
                  <BasicProductSearch
                    value={selectedProduct?.prod_code}
                    onValueChange={handleProductChange}
                  />
                  {selectedProduct && (
                    <button
                      type="button"
                      onClick={() => handleProductChange(null)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-white pr-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-span-6 md:col-span-1 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Price
                </Label>
                <Input
                  type="number"
                  value={selPrice}
                  onChange={(e) => setSelPrice(Number(e.target.value))}
                  className="bg-slate-50 border-slate-100 h-11 text-right font-semibold"
                />
              </div>
              <div className="col-span-6 md:col-span-1 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Pack Qty
                </Label>
                <Input
                  type="number"
                  value={packQty}
                  onChange={(e) => setPackQty(Number(e.target.value))}
                  className="bg-slate-50 border-slate-100 h-11 text-right"
                />
              </div>
              <div className="col-span-6 md:col-span-1 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Unit Qty
                </Label>
                <Input
                  type="number"
                  value={unitQty}
                  onChange={(e) => setUnitQty(Number(e.target.value))}
                  className="bg-slate-50 border-slate-100 h-11 text-right font-medium"
                />
              </div>
              <div className="col-span-6 md:col-span-1 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Free Qty
                </Label>
                <Input
                  type="number"
                  value={freeQty}
                  onChange={(e) => setFreeQty(Number(e.target.value))}
                  className="bg-emerald-50 border-emerald-100 h-11 text-right text-emerald-700"
                />
              </div>
              <div className="col-span-6 md:col-span-1 space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Discount
                </Label>
                <Input
                  type="number"
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(Number(e.target.value))}
                  className="bg-red-50 border-red-100 h-11 text-right text-red-700 font-medium"
                />
              </div>
              <div className="col-span-6 md:col-span-1">
                <Button
                  type="button"
                  onClick={addItem}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold w-full h-11 shadow-md shadow-purple-100 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> ADD
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Total Line Amount
                  </span>
                  <div className="text-2xl font-black text-[#1e40af]">
                    Rs {calculateItemAmount().toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">
                      Current Stock
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-700">
                      {selectedProduct?.stock || 0}{" "}
                      {selectedProduct?.unit_name || "units"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Bottom Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-2 pb-10">
            {/* Left: Comments & Actions */}
            <div className="md:col-span-7 space-y-6">
              <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    internal comments / notes
                  </span>
                </div>
                <CardContent className="p-4">
                  <Textarea
                    {...form.register("comments")}
                    className="min-h-[140px] border-none focus-visible:ring-0 p-0 text-slate-600 leading-relaxed placeholder:italic"
                    placeholder="Add special instructions, delivery notes, or terms here..."
                  />
                </CardContent>
              </Card>

              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  className="bg-white border-2 border-slate-200 hover:border-[#8b5cf6] hover:bg-slate-50 text-slate-600 font-bold px-8 py-7 h-auto text-lg flex-1 shadow-sm transition-all group"
                >
                  <span className="group-hover:text-[#8b5cf6] transition-colors">
                    Draft Invoice
                  </span>
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold px-8 py-7 h-auto text-xl flex-[1.5] shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                >
                  Apply & Post Invoice
                </Button>
              </div>
            </div>

            {/* Right: Totals */}
            <div className="md:col-span-5">
              <Card className="bg-white border-slate-200 shadow-lg overflow-hidden border-t-4 border-t-[#1e40af]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between group">
                    <Label className="text-slate-500 font-medium group-hover:text-slate-800 transition-colors">
                      Sub-Total Amount
                    </Label>
                    <span className="text-lg font-bold text-slate-700">
                      Rs {subTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4 group">
                    <Label className="col-span-6 text-slate-500 font-medium group-hover:text-slate-800 transition-colors">
                      Discount (%)
                    </Label>
                    <div className="col-span-6 flex items-center gap-3">
                      <Input
                        type="number"
                        {...form.register("discount_per", {
                          valueAsNumber: true,
                        })}
                        className="bg-slate-50 text-right font-bold w-20 h-9"
                      />
                      <div className="flex-1 text-right font-bold text-red-500">
                        {discountVal > 0
                          ? `- ${discountVal.toFixed(2)}`
                          : "0.00"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4 group">
                    <Label className="col-span-6 text-slate-500 font-medium group-hover:text-slate-800 transition-colors">
                      Tax (%)
                    </Label>
                    <div className="col-span-6 flex items-center gap-3">
                      <Input
                        type="number"
                        {...form.register("tax_per", { valueAsNumber: true })}
                        className="bg-slate-50 text-right font-bold w-20 h-9"
                      />
                      <div className="flex-1 text-right font-bold text-slate-700">
                        {taxVal.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4 group">
                    <Label className="col-span-6 text-slate-500 font-medium group-hover:text-slate-800 transition-colors">
                      Delivery / Shipping
                    </Label>
                    <div className="col-span-6">
                      <Input
                        type="number"
                        {...form.register("delivery_charges", {
                          valueAsNumber: true,
                        })}
                        className="bg-slate-50 text-right font-bold h-9"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-slate-100 mt-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                          Grand Total Payable
                        </Label>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 rounded font-bold text-[9px]">
                          FINAL AMOUNT
                        </Badge>
                      </div>
                      <div className="bg-[#1e40af]/5 border border-[#1e40af]/10 rounded-xl p-5 flex items-center justify-between group transition-all hover:bg-[#1e40af]/10 active:scale-[0.99]">
                        <span className="text-xl font-bold text-[#1e40af]">
                          Rs
                        </span>
                        <span className="font-extrabold text-4xl text-[#1e40af] tabular-nums tracking-tighter shadow-indigo-100 drop-shadow-sm">
                          {netAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> return to invoice list
                </button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
