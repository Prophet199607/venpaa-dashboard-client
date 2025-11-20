"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { set, z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { ClipLoader } from "react-spinners";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { locations, suppliers, books } from "@/lib/data";
import { Package, Trash2, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductSearch } from "@/components/shared/product-search";
import { SearchSelectHandle } from "@/components/ui/search-select";
import { SupplierSearch } from "@/components/shared/supplier-search";
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

const goodReceivedNoteSchema = z.object({
  location: z.string().min(1, "Location is required"),
  supplier: z.string().min(1, "Supplier is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  delivery_address: z.string().min(1, "Delivery address is required"),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof goodReceivedNoteSchema>;

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
  unit_qty: number;
  free_qty: number;
  total_qty: number;
  line_wise_discount_value: string;
  amount: number;
  unit_name: string;
  unit: {
    unit_type: "WHOLE" | "DEC" | null;
  };
}

interface SessionDetail {
  doc_no: string;
  location: {
    loca_code: string;
    loca_name: string;
  } | null;
  supplier: {
    sup_code: string;
    sup_name: string;
  } | null;
  product_count: number;
  created_at: string;
}

export default function GoodReceivedNoteForm() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const hasDataLoaded = useRef(false);
  const searchParams = useSearchParams();
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const freeQtyInputRef = useRef<HTMLInputElement>(null);
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [isQtyDisabled, setIsQtyDisabled] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isGeneratingGrn, setIsGeneratingGrn] = useState(false);
  const [tempGrnNumber, setTempGrnNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [isSupplierSelected, setIsSupplierSelected] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);
  const [unsavedSessions, setUnsavedSessions] = useState<SessionDetail[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);

  const isEditMode = useMemo(() => {
    return (
      searchParams.has("doc_no") &&
      searchParams.has("status") &&
      searchParams.has("iid")
    );
  }, [searchParams]);

  useEffect(() => {
    if (isEditMode) {
      productSearchRef.current?.openAndFocus();
    }
  }, [isEditMode]);

  const isApplied = useMemo(() => {
    if (!isEditMode) return false;
    return searchParams.get("status") === "applied";
  }, [isEditMode, searchParams]);

  const form = useForm<FormData>({
    resolver: zodResolver(goodReceivedNoteSchema),
    defaultValues: {
      location: "",
      supplier: "",
      deliveryLocation: "",
      delivery_address: "",
      remarks: "",
    },
  });

  const [newProduct, setNewProduct] = useState({
    prod_name: "",
    unit_name: "",
    unit_type: null as "WHOLE" | "DEC" | null,
    purchase_price: 0,
    pack_size: 0,
    pack_qty: 0,
    unit_qty: 0,
    free_qty: 0,
    total_qty: 0,
    line_wise_discount_value: "",
  });

  const handleProductSelect = (selectedProduct: any) => {
    if (selectedProduct) {
      setProduct(selectedProduct);
      setNewProduct((prev) => ({
        ...prev,
        prod_name: selectedProduct.prod_name,
        purchase_price: Number(selectedProduct.purchase_price) || 0,
        selling_price: Number(selectedProduct.selling_price) || 0,
        pack_size: Number(selectedProduct.pack_size) || 0,
        unit_name: selectedProduct.unit_name || "",
        unit_type: selectedProduct.unit?.unit_type || null,
      }));

      setUnitType(selectedProduct.unit?.unit_type || null);

      setTimeout(() => {
        if (selectedProduct.pack_size == 1) {
          setIsQtyDisabled(true);
          setNewProduct((prev) => ({ ...prev, qty: 0 }));
          packQtyInputRef.current?.focus();
        } else {
          setIsQtyDisabled(false);
          packQtyInputRef.current?.focus();
        }
      }, 0);
    } else {
      resetProductForm();
    }
  };

  const sanitizeQuantity = (
    value: string,
    unitType: "WHOLE" | "DEC" | null
  ) => {
    if (!value) return "";

    if (unitType === "WHOLE") {
      // Allow only integers, remove any decimal points
      const sanitizedValue = value.replace(/[^0-9]/g, "");
      return sanitizedValue === "" ? "" : sanitizedValue;
    }

    if (unitType === "DEC") {
      // Allow numbers and one decimal point, max 3 decimal places
      let sanitizedValue = value.replace(/[^0-9.]/g, "");

      // Handle multiple decimal points
      const parts = sanitizedValue.split(".");
      if (parts.length > 2) {
        sanitizedValue = parts[0] + "." + parts.slice(1).join("");
      }

      // Limit to 3 decimal places
      if (parts.length === 2 && parts[1].length > 3) {
        sanitizedValue = parts[0] + "." + parts[1].substring(0, 3);
      }

      return sanitizedValue === "" ? "" : sanitizedValue;
    }

    // Default behavior if unitType is not set
    return value.replace(/[^0-9.]/g, "");
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) setDate(newDate);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isQtyField = ["pack_qty", "unit_qty", "free_qty"].includes(name);

    setNewProduct((prev) => {
      const updatedValue = isQtyField
        ? sanitizeQuantity(value, prev.unit_type)
        : name === "purchase_price"
        ? Number(value) || 0
        : value;

      return {
        ...prev,
        [name]: updatedValue,
      };
    });
  };

  const resetProductForm = () => {
    setNewProduct({
      prod_name: "",
      unit_name: "",
      unit_type: null,
      purchase_price: 0,
      pack_size: 0,
      pack_qty: 0,
      unit_qty: 0,
      free_qty: 0,
      total_qty: 0,
      line_wise_discount_value: "",
    });
    setProduct(null);
    setEditingProductId(null);
    setUnitType(null);
    setIsQtyDisabled(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">New Good Received Note</h1>
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
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox id="without-po" />
          <Label htmlFor="without-po" className="text-sm font-medium">
            Without Purchase Order
          </Label>
        </div>
        <Badge variant="secondary" className="px-2 py-1 text-sm h-6">
          <div className="flex items-center gap-2">
            <span>Document No:</span>
            {isGeneratingGrn && <ClipLoader className="h-2 w-2 animate-spin" />}
            {!isGeneratingGrn && <span>{tempGrnNumber || "..."}</span>}
          </div>
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-4">
            <div>
              <Label>Location*</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="--Choose Location--" />
                </SelectTrigger>
                <SelectContent></SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supplier*</Label>
              <Select value={supplier} onValueChange={setSupplier} required>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Supplier--" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.supCode}>
                      {sup.supName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Purchase Order*</Label>
              <Input name="purchaseOrder" placeholder="Without PO" disabled />
            </div>

            <div>
              <Label className="text-sm font-medium">
                Actual Received Date*
              </Label>
              <DatePicker
                date={date}
                setDate={handleDateChange}
                placeholder="Select actual received date"
                required
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div>
              <Label className="text-sm font-medium">Delivery Location</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="--Choose Location--" />
                </SelectTrigger>
                <SelectContent></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Payment Methods*</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Date*</Label>
              <DatePicker
                date={date}
                setDate={handleDateChange}
                placeholder="Select date"
                disabled={true}
                required
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div>
              <Label className="text-sm font-medium">Invoice Number</Label>
              <Input name="invoiceNumber" placeholder="Enter Invoice Number" />
            </div>
            <div>
              <Label className="text-sm font-medium">Invoice Date*</Label>
              <DatePicker
                date={date}
                setDate={handleDateChange}
                placeholder="dd/mm/yyyy"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Invoice Amount</Label>
              <Input name="invoiceAmount" placeholder="Enter Invoice Amount" />
            </div>
          </div>

          {/* Row 4 - Textareas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium">Delivery Address*</Label>
              <Textarea
                name="deliveryAddress"
                placeholder="Enter Delivery Address"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">PO Remarks</Label>
              <Textarea name="poRemarks" placeholder="PO Remarks" rows={3} />
            </div>

            <div>
              <Label className="text-sm font-medium">Remarks</Label>
              <Textarea name="remarks" placeholder="Remarks" rows={3} />
            </div>
          </div>

          {/* Return Section */}
          <div className="mb-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Checkbox id="return" />
              <Label htmlFor="return" className="text-sm font-medium">
                RETURN
              </Label>
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
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Pack Qty</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Free Qty</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Disc</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  {/* <TableBody>
                    {products.length > 0 ? (
                      products.map((product, index) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.code}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block">
                                    {product.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  {product.name}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            {product.purchasePrice}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.packQty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.qty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.freeQty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.totalQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.discValue}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.amount}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
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
                          colSpan={9}
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
                          colSpan={8}
                          className="text-right font-medium"
                        >
                          Subtotal
                        </TableCell>
                        <TableCell className="font-medium">
                          {summary.subTotal}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )} */}
                </Table>
              </div>
            </div>
          </div>

          {/* Add Product Section */}
          <div>
            <div className="flex gap-2 items-end mb-4 overflow-x-auto">
              <div className="w-64">
                <Label>Product</Label>
                <ProductSearch
                  ref={productSearchRef}
                  onValueChange={handleProductSelect}
                  value={product?.prod_code}
                  supplier={supplier}
                  disabled={!!editingProductId || !isSupplierSelected}
                />
              </div>

              <div className="w-24">
                <Label>Purchase Price</Label>
                <Input
                  name="purchasePrice"
                  type="number"
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  className="text-sm"
                />
              </div>

              <div className="w-20">
                <Label>Pack Qty</Label>
                <Input
                  name="packQty"
                  type="number"
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
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  className="text-sm"
                />
              </div>

              <div className="w-20">
                <Label>Free Qty</Label>
                <Input
                  name="freeQty"
                  type="number"
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  className="text-sm"
                />
              </div>

              <div className="w-24">
                <Label>Total Qty</Label>
                <Input disabled className="text-sm" />
              </div>

              <div className="w-24">
                <Label>Amount</Label>
                <Input disabled className="text-sm" />
              </div>

              <div className="w-20">
                <Label>Discount</Label>
                <Input
                  name="discValue"
                  type="number"
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  className="text-sm"
                />
              </div>

              <div className="w-20">
                <Button type="button" size="sm" className="w-20 h-9">
                  ADD
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
                <Input disabled className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Discount</Label>
                <Input name="discount" type="text" className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Tax</Label>
                <Input
                  name="tax"
                  type="text"
                  className="flex-1"
                  placeholder="0 or 0%"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Net Amount</Label>
                <Input disabled className="flex-1" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline">DRAFT GRN</Button>
            <Button>APPLY GRN</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
