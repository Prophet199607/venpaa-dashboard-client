"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  Suspense,
  useDeferredValue,
} from "react";
import { z } from "zod";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Trash2, ArrowLeft, Pencil } from "lucide-react";
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

const supplierReturnNoteSchema = z.object({
  location: z.string().min(1, "Location is required"),
  supplier: z.string().min(1, "Supplier is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  delivery_address: z.string().min(1, "Delivery address is required"),
  invoiceAmount: z.string().min(1, "Invoice amount is required"),
  recallDocNo: z.string().optional(),
  invoiceNumber: z.string().optional(),
  grnRemarks: z.string().optional(),
  srnRemarks: z.string().optional(),
});

type FormData = z.infer<typeof supplierReturnNoteSchema>;

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
  selling_price: number;
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

interface AppliedGRN {
  doc_no: string;
  sup_name: string;
}

function SupplierReturnNoteFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const hasDataLoaded = useRef(false);
  const searchParams = useSearchParams();
  const skipUnsavedModal = useRef(false);
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isAccept, setIsAccept] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [isWithoutGrn, setIsWithoutGrn] = useState(false);
  const freeQtyInputRef = useRef<HTMLInputElement>(null);
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [isGrnSelected, setIsGrnSelected] = useState(false);
  const [isQtyDisabled, setIsQtyDisabled] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isGeneratingSrn, setIsGeneratingSrn] = useState(false);
  const [tempSrnNumber, setTempSrnNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [appliedGRNs, setAppliedGRNs] = useState<AppliedGRN[]>([]);
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [isSupplierSelected, setIsSupplierSelected] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);
  const [unsavedSessions, setUnsavedSessions] = useState<SessionDetail[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [actualReceivedDate, setActualReceivedDate] = useState<
    Date | undefined
  >(new Date());
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());

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
    resolver: zodResolver(supplierReturnNoteSchema),
    defaultValues: {
      location: "",
      supplier: "",
      deliveryLocation: "",
      delivery_address: "",
      recallDocNo: "",
      invoiceNumber: "",
      invoiceAmount: "",
      grnRemarks: "",
      srnRemarks: "",
    },
  });

  const watchedLocation = form.watch("location");
  const watchedSupplier = form.watch("supplier");

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

  const [summary, setSummary] = useState({
    subTotal: 0,
    discountPercent: 0,
    discountValue: 0,
    taxPercent: 0,
    taxValue: 0,
    netAmount: 0,
  });

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
      toast({
        title: "Failed to load locations",
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

    fetchLocations();

    // TODO: Uncomment
    // const checkUnsavedSessions = async () => {
    //   if (isEditMode) {
    //     return;
    //   }

    //   try {
    //     const { data: res } = await api.get(
    //       "/supplier-return-notes/unsaved-sessions"
    //     );
    //     if (res.success && res.data.length > 0) {
    //       const filteredSessions = res.data.filter((session: SessionDetail) => {
    //         const shouldSkip =
    //           sessionStorage.getItem(`skip_unsaved_modal_${session.doc_no}`) ===
    //           "true";
    //         if (shouldSkip) {
    //           console.log(
    //             "Skipping unsaved modal for PO-loaded session:",
    //             session.doc_no
    //           );
    //           if (session.doc_no === tempSrnNumber) {
    //             skipUnsavedModal.current = true;
    //           }
    //         }
    //         return !shouldSkip;
    //       });

    //       if (filteredSessions.length > 0) {
    //         setUnsavedSessions(filteredSessions);
    //         setShowUnsavedModal(true);
    //       } else if (skipUnsavedModal.current) {
    //         setShowUnsavedModal(false);
    //       }
    //     }
    //   } catch (error) {
    //     console.error("Failed to check for unsaved sessions:", error);
    //   }
    // };

    if (!skipUnsavedModal.current) {
      //   checkUnsavedSessions();
    }
  }, [fetchLocations, toast, isEditMode, tempSrnNumber]);

  useEffect(() => {
    if (tempSrnNumber && !isEditMode) {
      const shouldSkip =
        sessionStorage.getItem(`skip_unsaved_modal_${tempSrnNumber}`) ===
        "true";
      if (shouldSkip) {
        skipUnsavedModal.current = true;
      }
    }
  }, [tempSrnNumber, isEditMode]);

  useEffect(() => {
    return () => {
      if (!skipUnsavedModal.current && tempSrnNumber) {
        sessionStorage.removeItem(`skip_unsaved_modal_${tempSrnNumber}`);
      }
    };
  }, [tempSrnNumber]);

  const handleDeliveryLocationChange = (value: string) => {
    form.setValue("deliveryLocation", value);
    const selectedLocation = locations.find((loc) => loc.loca_code === value);

    if (selectedLocation) {
      form.setValue("delivery_address", selectedLocation.delivery_address);
    }
  };

  const handleLocationChange = (locaCode: string) => {
    form.setValue("location", locaCode);

    if (!locaCode) {
      setHasLoaded(false);
      setTempSrnNumber("");
      return;
    }
    fetchFilteredAppliedGRNs("GRN", locaCode, form.getValues("supplier"));

    if (unsavedSessions.length === 0 && !isEditMode) {
      setHasLoaded(true);
      generateSrnNumber("TempSRN", locaCode, false);
    }
    handleDeliveryLocationChange(locaCode);
  };

  const handleSupplierChange = (value: string) => {
    form.setValue("supplier", value);
    setSupplier(value);
    setIsSupplierSelected(!!value);
    fetchFilteredAppliedGRNs("GRN", form.getValues("location"), value);

    setProduct(null);
    resetProductForm();
  };

  const generateSrnNumber = async (
    type: string,
    locaCode: string,
    setFetchingState = true
  ) => {
    try {
      setIsGeneratingSrn(true);
      if (setFetchingState) {
        setFetching(true);
      }

      const { data: res } = await api.get(
        `/transactions/generate-code/${type}/${locaCode}`
      );

      if (res.success) {
        setTempSrnNumber(res.code);
      }
    } catch (error) {
      console.error("Failed to generate SRN number:", error);
    } finally {
      setIsGeneratingSrn(false);
      if (setFetchingState) {
        setFetching(false);
      }
    }
  };

  const fetchFilteredAppliedGRNs = useCallback(
    async (iid: string, location: string, supplier: string) => {
      if (!iid || !location || !supplier) {
        setAppliedGRNs([]);
        return;
      }

      try {
        const { data: res } = await api.get(
          `/transactions/applied?iid=${iid}&location=${location}&supplier=${supplier}`
        );

        if (!res.success) throw new Error(res.message);
        setAppliedGRNs(res.data);
      } catch (err: any) {
        toast({
          title: "Failed to load applied transactions",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      }
    },
    [toast]
  );

  const formatThousandSeparator = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue as number)) return "0.00";

    const absoluteValue = Math.abs(numValue as number);
    const formattedValue = absoluteValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (numValue as number) < 0 ? `-${formattedValue}` : formattedValue;
  };

  const handleProductSelect = (selectedProduct: any) => {};

  const onSubmit = (values: FormData) => {
    // TODO: implement submit
    toast({
      title: "Submitted",
      description: "Form submitted!",
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
          <h1 className="text-xl font-semibold">
            {isEditMode
              ? "Edit Supplier Return Note"
              : "New Supplier Return Note"}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            router.push("/dashboard/transactions/supplier-return-note")
          }
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            id="without-grn"
            checked={isWithoutGrn}
            onCheckedChange={(checked: boolean) => setIsWithoutGrn(checked)}
          />
          <Label htmlFor="without-grn" className="text-sm font-medium">
            Without GRN
          </Label>
        </div>
        <Badge variant="secondary" className="px-2 py-1 text-sm h-6">
          <div className="flex items-center gap-2">
            <span>Document No:</span>
            {isGeneratingSrn && <ClipLoader className="h-2 w-2 animate-spin" />}
            {!isGeneratingSrn && <span>{tempSrnNumber || "..."}</span>}
          </div>
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                <div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select
                          onValueChange={handleLocationChange}
                          value={field.value}
                          disabled={
                            isEditMode || isGrnSelected || isSupplierSelected
                          }
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
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier*</FormLabel>
                        <SupplierSearch
                          onValueChange={handleSupplierChange}
                          value={field.value}
                          disabled={isEditMode || isGrnSelected}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="recallDocNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Good Receive Note</FormLabel>
                        <Select
                          //   onValueChange={handlePurchaseOrderChange}
                          value={field.value}
                          disabled={
                            isWithoutGrn ||
                            !watchedLocation ||
                            !watchedSupplier ||
                            isEditMode
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="--Choose GRN--" />
                          </SelectTrigger>
                          <SelectContent>
                            {appliedGRNs.map((grn) => (
                              <SelectItem key={grn.doc_no} value={grn.doc_no}>
                                {grn.doc_no}
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
                  <Label className="text-sm font-medium">Date*</Label>
                  <DatePicker
                    date={date}
                    setDate={setDate}
                    placeholder="Select date"
                    required
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    //TODO: Change to grnNet
                    name="invoiceAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GRN Net</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GRN Net" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="srnRemarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Remarks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="mb-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="accept"
                    checked={isAccept}
                    onCheckedChange={(checked: boolean) => setIsAccept(checked)}
                  />
                  <Label htmlFor="accept" className="text-sm font-medium">
                    Accept Other Suppliers Product
                  </Label>
                </div>

                {/* Product Details Table */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Product Details
                  </h3>
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
                                {formatThousandSeparator(
                                  product.purchase_price
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {product.unit?.unit_type === "WHOLE"
                                  ? Math.floor(Number(product.pack_qty)) || 0
                                  : Number(product.pack_qty).toFixed(3) || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {product.unit?.unit_type === "WHOLE"
                                  ? Math.floor(Number(product.unit_qty)) || 0
                                  : Number(product.unit_qty).toFixed(3) || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {product.unit?.unit_type === "WHOLE"
                                  ? Math.floor(Number(product.free_qty)) || 0
                                  : Number(product.free_qty).toFixed(3) || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {product.unit?.unit_type === "WHOLE"
                                  ? Math.floor(Number(product.total_qty)) || 0
                                  : Number(product.total_qty).toFixed(3) || 0}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatThousandSeparator(
                                  product.line_wise_discount_value
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatThousandSeparator(product.amount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  //   onClick={() => editProduct(product.id)}
                                  className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 mr-2"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  //   onClick={() => removeProduct(product.id)}
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
                            <TableCell className="font-medium text-right">
                              {formatThousandSeparator(summary.subTotal)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </div>
                </div>
              </div>

              {/* Add Product Section */}
              {!isApplied && (
                <>
                  <div className="flex gap-2 items-end mb-4 overflow-x-auto pb-2">
                    <div className="w-72 ml-1">
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
                        ref={purchasePriceRef}
                        name="purchase_price"
                        type="number"
                        value={newProduct.purchase_price}
                        // onChange={handleProductChange}
                        // onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        className="text-sm"
                        disabled
                      />
                    </div>

                    <div className="w-20">
                      <Label>Pack Qty</Label>
                      <Input
                        ref={packQtyInputRef}
                        name="pack_qty"
                        type="text"
                        inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                        value={newProduct.pack_qty}
                        // onChange={handleProductChange}
                        // onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        className="text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div className="w-20">
                      <Label>Unit Qty</Label>
                      <Input
                        ref={qtyInputRef}
                        name="unit_qty"
                        type="text"
                        inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                        value={newProduct.unit_qty}
                        // onChange={handleProductChange}
                        // onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        disabled={isQtyDisabled}
                        className="text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div className="w-20">
                      <Label>Free Qty</Label>
                      <Input
                        ref={freeQtyInputRef}
                        name="free_qty"
                        type="text"
                        inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                        value={newProduct.free_qty}
                        // onChange={handleProductChange}
                        // onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        className="text-sm"
                      />
                    </div>

                    <div className="w-24">
                      <Label>Total Qty</Label>
                      <Input
                        // value={calculateTotalQty()}
                        disabled
                        className="text-sm"
                      />
                    </div>

                    <div className="w-28">
                      <Label>Amount</Label>
                      <Input
                        // value={formatThousandSeparator(calculateAmount())}
                        disabled
                        className="text-sm"
                      />
                    </div>

                    <div className="w-20">
                      <Label>Discount</Label>
                      <Input
                        ref={discountInputRef}
                        name="line_wise_discount_value"
                        type="text"
                        value={newProduct.line_wise_discount_value}
                        // onChange={handleProductChange}
                        // onKeyDown={handleKeyDown}
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
                          <br />
                          Unit: {newProduct.unit_name || "N/A"}
                        </p>
                      )}
                    </div>
                    <div>
                      <div>
                        {isSubmittingProduct ? (
                          <div className="flex items-center gap-2">
                            <ClipLoader className="h-4 w-4 animate-spin" />
                            <Button
                              type="button"
                              disabled
                              size="sm"
                              className="w-20 h-9 opacity-50 cursor-not-allowed"
                            >
                              {editingProductId ? "SAVE" : "ADD"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            // onClick={
                            //   editingProductId ? saveProduct : addProduct
                            // }
                            disabled={isSubmittingProduct}
                            size="sm"
                            className="w-20 h-9"
                          >
                            {editingProductId ? "SAVE" : "ADD"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Summary Section */}
              <div className="flex justify-end mt-10">
                <div className="space-y-2 w-full max-w-md">
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Sub Total</Label>
                    <Input
                      value={formatThousandSeparator(summary.subTotal)}
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
                        summary.discountPercent > 0
                          ? `${summary.discountPercent}%`
                          : summary.discountValue > 0
                          ? summary.discountValue.toString()
                          : ""
                      }
                      //   onChange={handleDiscountChange}
                      className="flex-1"
                      placeholder="0 or 0%"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Tax</Label>
                    <Input
                      name="tax"
                      type="text"
                      value={
                        summary.taxPercent > 0
                          ? `${summary.taxPercent}%`
                          : summary.taxValue > 0
                          ? summary.taxValue.toString()
                          : ""
                      }
                      //   onChange={handleTaxChange}
                      className="flex-1"
                      placeholder="0 or 0%"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Net Amount</Label>
                    <Input
                      value={formatThousandSeparator(summary.netAmount)}
                      disabled
                      className="flex-1 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isApplied && (
                <div className="flex gap-4 mt-8">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={loading || products.length === 0 || isGrnSelected}
                  >
                    {loading
                      ? isEditMode
                        ? "Updating..."
                        : "Drafting..."
                      : isEditMode
                      ? "UPDATE SRN"
                      : "DRAFT SRN"}
                  </Button>
                  <Button
                    type="button"
                    disabled={loading || products.length === 0}
                  >
                    APPLY SRN
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        {fetching || loading ? <Loader /> : null}
      </Card>
      {/* <UnsavedChangesModal
        isOpen={showUnsavedModal}
        sessions={unsavedSessions}
        onContinue={handleResumeSession}
        onDiscardAll={handleDiscardAllSessions}
        onDiscardSelected={handleDiscardSelectedSession}
        transactionType="Supplier Return Note"
        iid="SRN"
      /> */}
    </div>
  );
}

export default function SupplierReturnNoteForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupplierReturnNoteFormContent />
    </Suspense>
  );
}
