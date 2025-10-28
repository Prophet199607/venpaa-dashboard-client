"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { ProductSearch } from "@/components/shared/product-search";
import { SupplierSearch } from "@/components/shared/supplier-search";
import { ShoppingBag, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { UnsavedChangesModal } from "@/components/model/unsaved-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const purchaseOrderSchema = z.object({
  location: z.string().min(1, "Location is required"),
  supplier: z.string().min(1, "Supplier is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  delivery_address: z.string().min(1, "Delivery address is required"),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof purchaseOrderSchema>;

interface Location {
  id: number;
  loca_code: string;
  loca_name: string;
  delivery_address: string;
}

interface ProductItem {
  id: number;
  line_no: number;
  prod_code: string;
  prod_name: string;
  pack_size: string | number | null;
  purchase_price: number;
  pack_qty: number;
  qty: number;
  free_qty: number;
  total_qty: number;
  line_wise_discount_value: number;
  amount: number;
}

export default function PurchaseOrderForm() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [product, setProduct] = useState<any>(null);
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tempPoNumber, setTempPoNumber] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [deliveryLocation, setDeliveryLocation] = useState<string>("");
  const [unsavedSessions, setUnsavedSessions] = useState<string[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);

  const form = useForm<FormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      location: "",
      supplier: "",
      deliveryLocation: "",
      delivery_address: "",
      remarks: "",
    },
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    prod_name: "",
    purchase_price: 0,
    pack_size: "",
    pack_qty: 0,
    qty: 0,
    free_qty: 0,
    total_qty: 0,
    line_wise_discount_value: 0,
  });

  const [summary, setSummary] = useState({
    subTotal: 0,
    discountPercent: 0,
    discountValue: 0,
    taxPercent: 0,
    taxValue: 0,
    netAmount: 0,
  });

  // Effect to handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (products.length > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [products.length]);

  const fetchLocations = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/locations");

      if (!res.success) throw new Error(res.message);

      const mapped: Location[] = res.data.map((loc: any) => ({
        id: loc.id,
        loca_code: loc.loca_code,
        loca_name: loc.loca_name,
        delivery_address: loc.delivery_address,
      }));

      setLocations(mapped);
    } catch (err: any) {
      console.error("Failed to fetch locations:", err);
      toast({
        title: "Failed to load locations",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const handleDeliveryLocationChange = (value: string) => {
    setDeliveryLocation(value);
    form.setValue("deliveryLocation", value);
    const selectedLocation = locations.find((loc) => loc.loca_code === value);

    if (selectedLocation) {
      form.setValue("delivery_address", selectedLocation.delivery_address);
    }
  };

  const handleLocationChange = async (locaCode: string) => {
    form.setValue("location", locaCode);
    if (!locaCode) {
      setTempPoNumber("");
      return;
    }

    // If there are unsaved sessions, don't generate a new number yet.
    // The user will choose to resume or discard first.
    if (unsavedSessions.length > 0) {
      return;
    }

    generatePoNumber(locaCode);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) setDate(newDate);
  };

  const generatePoNumber = async (locaCode: string) => {
    // Do not generate if a session is already loaded or modal is open
    if (tempPoNumber || showUnsavedModal) {
      return;
    }

    try {
      setFetching(true);
      const { data: res } = await api.get(
        `/purchase-orders/generate-code/${locaCode}`
      );
      if (res.success) {
        setTempPoNumber(res.code);
      }
    } catch (error) {
      console.error("Failed to generate PO number:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchLocations();

    const checkUnsavedSessions = async () => {
      try {
        const { data: res } = await api.get(
          "/purchase-orders/unsaved-sessions"
        );
        if (res.success && res.data.length > 0) {
          setUnsavedSessions(res.data);
          setShowUnsavedModal(true);
        }
      } catch (error) {
        console.error("Failed to check for unsaved sessions:", error);
      }
    };

    checkUnsavedSessions();
  }, [fetchLocations, toast]);

  useEffect(() => {
    if (showUnsavedModal || !tempPoNumber) {
      setProducts([]);
      return;
    }

    const fetchTempProducts = async () => {
      try {
        setFetching(true);
        const response = await api.get(
          `/purchase-orders/temp-products/${tempPoNumber}`
        );
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch temp products", error);
      } finally {
        setFetching(false);
      }
    };
    fetchTempProducts();
  }, [tempPoNumber, showUnsavedModal]);

  const handleProductSelect = (selectedProduct: any) => {
    if (selectedProduct) {
      setProduct(selectedProduct);
      setNewProduct((prev) => ({
        ...prev,
        prod_name: selectedProduct.prod_name,
        purchase_price: selectedProduct.purchase_price || 0,
        pack_size: selectedProduct.pack_size || "",
      }));
    } else {
      setProduct(null);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]:
        name.includes("Price") || name.includes("Qty") || name.includes("Value")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    setSummary((prev) => {
      const updated = { ...prev };

      if (value.endsWith("%")) {
        // Discount entered as percentage
        const num = parseFloat(value.slice(0, -1)) || 0;
        updated.discountPercent = num;
        updated.discountValue = (prev.subTotal * num) / 100;
      } else {
        // Discount entered as amount
        const num = parseFloat(value) || 0;
        updated.discountValue = num;
        updated.discountPercent = prev.subTotal
          ? (num / prev.subTotal) * 100
          : 0;
      }

      // Recalculate net amount
      updated.netAmount = prev.subTotal - updated.discountValue + prev.taxValue;

      return updated;
    });
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    setSummary((prev) => {
      const updated = { ...prev };

      const taxableAmount = prev.subTotal - prev.discountValue;

      if (value.endsWith("%")) {
        // Tax entered as percentage
        const num = parseFloat(value.slice(0, -1)) || 0;
        updated.taxPercent = num;
        updated.taxValue = (taxableAmount * num) / 100;
      } else {
        // Tax entered as amount
        const num = parseFloat(value) || 0;
        updated.taxValue = num;
        updated.taxPercent = taxableAmount ? (num / taxableAmount) * 100 : 0;
      }

      // Recalculate net amount
      updated.netAmount = prev.subTotal - prev.discountValue + updated.taxValue;

      return updated;
    });
  };

  const calculateTotalQty = () => {
    const packQty = Number(newProduct.pack_qty) || 0;
    const packSize = Number(newProduct.pack_size) || 0;
    const qty = Number(newProduct.qty) || 0;
    const totalQty = packQty * packSize + qty;
    return totalQty;
  };

  const calculateAmount = () => {
    const totalQty = calculateTotalQty();
    const amount =
      newProduct.purchase_price * totalQty -
      newProduct.line_wise_discount_value;
    return Math.max(0, amount);
  };

  const resetProductForm = () => {
    setNewProduct({
      prod_name: "",
      purchase_price: 0,
      pack_size: "",
      pack_qty: 0,
      qty: 0,
      free_qty: 0,
      total_qty: 0,
      line_wise_discount_value: 0,
    });
    setProduct(null);
    setEditingProductId(null);
  };

  const addProduct = async () => {
    if (!product) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const payload = {
      doc_no: tempPoNumber,
      iid: "PO",
      ...newProduct,
      prod_code: product.prod_code,
      total_qty: totalQty,
      amount: amount,
    };

    try {
      setLoading(true);
      const response = await api.post("/purchase-orders/add-product", payload);

      if (response.data.success) {
        setProducts(response.data.data);
        resetProductForm();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to add the product.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    if (!editingProductId || !product) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const payload = {
      doc_no: tempPoNumber,
      iid: "PO",
      ...newProduct,
      prod_code: product.prod_code,
      total_qty: totalQty,
      amount: amount,
    };

    try {
      setLoading(true);
      const response = await api.put(
        `/purchase-orders/update-product/${editingProductId}`,
        payload
      );

      if (response.data.success) {
        setProducts(response.data.data);
        resetProductForm();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save the product.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (productId: number) => {
    const productToEdit = products.find((p) => p.id === productId);
    if (!productToEdit) return;

    setEditingProductId(productId);

    // Set the product for the search component to display the name
    setProduct({
      prod_code: productToEdit.prod_code,
      prod_name: productToEdit.prod_name,
      purchase_price: productToEdit.purchase_price,
      pack_size: productToEdit.pack_size,
    });

    // Populate the input fields
    setNewProduct({
      prod_name: productToEdit.prod_name,
      purchase_price: productToEdit.purchase_price,
      pack_size: String(productToEdit.pack_size || ""),
      pack_qty: productToEdit.pack_qty,
      qty: productToEdit.qty,
      free_qty: productToEdit.free_qty,
      total_qty: productToEdit.total_qty,
      line_wise_discount_value: productToEdit.line_wise_discount_value,
    });
  };

  const removeProduct = async (productId: number) => {
    const productToRemove = products.find((p) => p.id === productId);
    if (!productToRemove) return;

    try {
      setLoading(true);
      const response = await api.delete(
        `/purchase-orders/delete-detail/${tempPoNumber}/${productToRemove.line_no}`
      );

      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to remove the product.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = (docNo: string) => {
    setTempPoNumber(docNo);
    setShowUnsavedModal(false);
  };

  const discardSession = async (docNo: string) => {
    try {
      await api.post(`/purchase-orders/unsave/${docNo}`);
      return true;
    } catch (error) {
      console.error(`Failed to discard session ${docNo}`, error);
      toast({
        title: "Error",
        description: `Could not discard session ${docNo}.`,
        type: "error",
      });
      return false;
    }
  };

  const handleDiscardSelectedSession = async (docNo: string) => {
    setLoading(true);
    const success = await discardSession(docNo);
    if (success) {
      const remainingSessions = unsavedSessions.filter((s) => s !== docNo);
      setUnsavedSessions(remainingSessions);
      if (remainingSessions.length === 0) {
        setShowUnsavedModal(false);
        setTempPoNumber("");
      }
      toast({ title: "Success", description: `Session ${docNo} discarded.` });
    }
    setLoading(false);
  };

  const handleDiscardAllSessions = async (docNos: string[]) => {
    setLoading(true);
    for (const docNo of docNos) {
      await discardSession(docNo);
    }
    setLoading(false);
    setShowUnsavedModal(false);
    setProducts([]);
    setTempPoNumber("");
    toast({
      title: "Success",
      description: "All unsaved sessions have been discarded.",
    });
  };

  const handleDraftPurchaseOrder = async (values: FormData) => {
    const payload = {
      // From form validation
      location: values.location,
      supplier_code: values.supplier,
      delivery_location: values.deliveryLocation,
      delivery_address: values.delivery_address,
      remarks_ref: values.remarks,

      // From state
      doc_no: tempPoNumber,
      document_date: date,
      expected_date: expectedDate,
      payment_mode: paymentMethod,

      // From calculations
      subtotal: summary.subTotal,
      discount: summary.discountValue,
      dis_per: summary.discountPercent,
      tax: summary.taxValue,
      tax_per: summary.taxPercent,
      net_total: summary.netAmount,

      // Hardcoded/System values
      iid: "PO",
    };

    setLoading(true);
    try {
      const response = await api.post("/purchase-orders/draft", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Purchase Order has been drafted successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/purchase-order");
      }
    } catch (error: any) {
      console.error("Failed to draft PO:", error);
      toast({
        title: "Operation Failed",
        description: error.response?.data?.message || "Could not draft the PO.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {" "}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {" "}
          <ShoppingBag className="h-6 w-6" />
          <h1 className="text-xl font-semibold">New Purchase Order</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size={"sm"}
          onClick={() => router.back()}
          className="flex items-center gap-1 px-2 py-1 text-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>
      <div className="flex justify-end">
        <Badge variant="secondary" className="px-2 py-1 text-sm">
          Document No: {tempPoNumber || "..."}
        </Badge>
      </div>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleDraftPurchaseOrder)}
              className="flex flex-col space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select
                          onValueChange={handleLocationChange}
                          value={field.value}
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

                <div>
                  <Label>Date*</Label>
                  <DatePicker
                    date={date}
                    setDate={handleDateChange}
                    placeholder="Select date"
                    disabled={true}
                    required
                  />
                </div>

                <div>
                  <Label>Payment Methods*</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--Select Payment method--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier*</FormLabel>
                        <SupplierSearch
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSupplier(value);
                          }}
                          value={field.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label>Expected Date*</Label>
                  <DatePicker
                    date={expectedDate}
                    setDate={setExpectedDate}
                    placeholder="dd/mm/yyyy"
                    required
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="deliveryLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Location *</FormLabel>
                        <Select
                          onValueChange={handleDeliveryLocationChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="--Choose Delivery Location--" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((loca) => (
                              <SelectItem key={loca.id} value={loca.loca_code}>
                                {loca.loca_name}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your remarks"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="delivery_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter delivery address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Product Details Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Product Details</h3>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="w-[50px]">Code</TableHead>
                        <TableHead className="w-[180px]">Name</TableHead>
                        <TableHead>Pur. Price</TableHead>
                        <TableHead>Pack Qty</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Free Qty</TableHead>
                        <TableHead>Total Qty</TableHead>
                        <TableHead>Disc</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {products.length > 0 ? (
                        products.map((product, index) => (
                          <TableRow key={product.id}>
                            <TableCell className="text-center">
                              {index + 1}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.prod_code}
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block">
                                      {product.prod_name}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs"
                                  >
                                    {product.prod_name}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-right">
                              {product.purchase_price}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.pack_qty}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.qty}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.free_qty}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.total_qty}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.line_wise_discount_value}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.amount}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => editProduct(product.id)}
                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 mr-2"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProduct(product.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="text-center py-6 text-gray-500"
                          >
                            No products added yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>

                    {products.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-right font-medium"
                          >
                            Subtotal
                          </TableCell>
                          <TableCell className="font-medium">
                            {summary.subTotal}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </div>

              {/* Add Product Section */}
              <div>
                <div className="flex gap-2 items-end mb-4 overflow-x-auto">
                  <div className="w-72">
                    <Label>Product</Label>
                    <ProductSearch
                      onValueChange={handleProductSelect}
                      value={product?.prod_code}
                      supplier={supplier}
                      disabled={!!editingProductId}
                    />
                  </div>

                  <div className="w-28">
                    <Label>Pur. Price</Label>
                    <Input
                      name="purchase_price"
                      type="number"
                      value={newProduct.purchase_price}
                      onChange={handleProductChange}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      className="text-sm"
                      readOnly={!product || !!editingProductId}
                    />
                  </div>

                  <div className="w-20">
                    <Label>Pack Qty</Label>
                    <Input
                      name="pack_qty"
                      type="number"
                      value={newProduct.pack_qty}
                      onChange={handleProductChange}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      className="text-sm"
                    />
                  </div>

                  <div className="w-20">
                    <Label>Qty</Label>
                    <Input
                      name="qty"
                      type="number"
                      value={newProduct.qty}
                      onChange={handleProductChange}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      className="text-sm"
                    />
                  </div>

                  <div className="w-20">
                    <Label>Free Qty</Label>
                    <Input
                      name="free_qty"
                      type="number"
                      value={newProduct.free_qty}
                      onChange={handleProductChange}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      className="text-sm"
                    />
                  </div>

                  <div className="w-24">
                    <Label>Total Qty</Label>
                    <Input
                      value={calculateTotalQty()}
                      disabled
                      className="text-sm"
                    />
                  </div>

                  <div className="w-28">
                    <Label>Amount</Label>
                    <Input
                      value={calculateAmount()}
                      disabled
                      className="text-sm"
                    />
                  </div>

                  <div className="w-20">
                    <Label>Discount</Label>
                    <Input
                      name="line_wise_discount_value"
                      type="number"
                      value={newProduct.line_wise_discount_value}
                      onChange={handleProductChange}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1">
                    {product && (
                      <p className="text-xs text-muted-foreground">
                        Pack Size: {product.pack_size || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Button
                      type="button"
                      onClick={editingProductId ? saveProduct : addProduct}
                      size="sm"
                      className="w-20 h-9"
                    >
                      {editingProductId ? "SAVE" : "ADD"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end mt-10">
                <div className="space-y-2 w-full max-w-md">
                  {" "}
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Sub Total</Label>
                    <Input
                      value={summary.subTotal}
                      disabled
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Discount</Label>
                    <Input
                      name="discount"
                      type="text"
                      value={
                        summary.discountPercent
                          ? `${summary.discountPercent}%`
                          : summary.discountValue
                      }
                      onChange={handleDiscountChange}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Tax</Label>
                    <Input
                      name="tax"
                      type="text"
                      value={
                        summary.taxPercent
                          ? `${summary.taxPercent}%`
                          : summary.taxValue
                      }
                      onChange={handleTaxChange}
                      className="flex-1"
                      placeholder="0 or 0%"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Net Amount</Label>
                    <Input
                      value={summary.netAmount}
                      disabled
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button type="submit" variant="outline" disabled={loading}>
                  {loading ? "Drafting..." : "DRAFT PO"}
                </Button>
                <Button type="button" disabled={loading}>
                  APPLY PO
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        {fetching || loading ? <Loader /> : null}
      </Card>
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        sessions={unsavedSessions}
        onContinue={handleResumeSession}
        onDiscardAll={handleDiscardAllSessions}
        onDiscardSelected={handleDiscardSelectedSession}
        transactionType="Purchase Order"
      />
    </div>
  );
}
