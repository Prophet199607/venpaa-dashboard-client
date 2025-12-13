"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { ClipLoader } from "react-spinners";
import Loader from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import { SearchSelectHandle } from "@/components/ui/search-select";
import { UnsavedChangesModal } from "@/components/model/unsaved-dialog";
import { Trash2, ArrowLeft, Pencil, ArrowLeftRight } from "lucide-react";
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
import { useSearchParams } from "next/navigation";

const stockAdjustmentSchema = z.object({
  location: z.string().min(1, "Location is required"),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof stockAdjustmentSchema>;

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
  pack_size: string | number;
  purchase_price: number;
  selling_price: number;
  pack_qty: number;
  unit_qty: number;
  physical_pack_qty: number;
  physical_unit_qty: number;
  variance_pack_qty: number;
  variance_unit_qty: number;
  total_qty: number;
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

function StockAdjustmentFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const hasDataLoaded = useRef(false);
  const searchParams = useSearchParams();
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
  const [isGeneratingSta, setIsGeneratingSta] = useState(false);
  const [tempStaNumber, setTempStaNumber] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
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
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      location: "",
      remarks: "",
    },
  });
  const watchedLocation = form.watch("location");

  const [newProduct, setNewProduct] = useState({
    prod_name: "",
    unit_name: "",
    unit_type: null as "WHOLE" | "DEC" | null,
    purchase_price: 0,
    pack_size: 0,
    pack_qty: 0,
    unit_qty: 0,
    total_qty: 0,
    physical_pack_qty: 0,
    physical_unit_qty: 0,
    variance_pack_qty: 0,
    variance_unit_qty: 0,
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

  const handleLocationChange = (locaCode: string) => {
    form.setValue("location", locaCode);

    if (!locaCode) {
      setHasLoaded(false);
      setTempStaNumber("");
      return;
    }

    if (unsavedSessions.length === 0 && !isEditMode) {
      setHasLoaded(true);
      generateStaNumber("TempSTA", locaCode, false);
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) setDate(newDate);
  };

  const generateStaNumber = async (
    type: string,
    locaCode: string,
    setFetchingState = true
  ) => {
    try {
      setIsGeneratingSta(true);
      if (setFetchingState) {
        setFetching(true);
      }
      const { data: res } = await api.get(
        `/transactions/generate-code/${type}/${locaCode}`
      );
      if (res.success) {
        setTempStaNumber(res.code);
      }
    } catch (error) {
      console.error("Failed to generate STA number:", error);
    } finally {
      setIsGeneratingSta(false);
      if (setFetchingState) {
        setFetching(false);
      }
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchLocations();

    const checkUnsavedSessions = async () => {
      try {
        const { data: res } = await api.get(
          "/stock-adjustments/unsaved-sessions"
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
    if (
      showUnsavedModal ||
      !tempStaNumber ||
      isEditMode ||
      hasLoaded ||
      unsavedSessions.length > 0
    ) {
      return;
    }

    const fetchTempProducts = async () => {
      try {
        setFetching(true);
        setHasLoaded(true);

        const response = await api.get(
          `/transactions/temp-products/${tempStaNumber}`
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
  }, [
    tempStaNumber,
    showUnsavedModal,
    isEditMode,
    hasLoaded,
    unsavedSessions.length,
  ]);

  useEffect(() => {
    return () => {
      setHasLoaded(false);
    };
  }, []);

  const formatDisplayValue = (
    value: number | string,
    unitType: "WHOLE" | "DEC" | null
  ) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return "";
    if (unitType === "DEC") {
      return numValue.toFixed(3);
    }
    return Math.floor(numValue).toString();
  };

  const validateInputByUnitType = (
    value: number | string,
    unitType: "WHOLE" | "DEC" | null
  ) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return 0;
    if (unitType === "DEC") {
      return parseFloat(numValue.toFixed(3));
    }
    return Math.floor(numValue);
  };

  const calculateCurrentPackQty = (
    currentQty: number,
    packSize: number,
    unitType: "WHOLE" | "DEC" | null
  ) => {
    let packQty = 0;
    let unitQty = 0;

    if (packSize === 1) {
      packQty = 0;
      unitQty = currentQty;
    } else if (packSize > 1) {
      packQty = Math.floor(currentQty / packSize);
      unitQty = currentQty % packSize;

      unitQty =
        unitType === "DEC"
          ? parseFloat(unitQty.toFixed(3))
          : Math.floor(unitQty);
    } else {
      packQty = 0;
      unitQty =
        unitType === "DEC"
          ? parseFloat(currentQty.toFixed(3))
          : Math.floor(currentQty);
    }

    return { packQty, unitQty };
  };

  const handleProductSelect = async (selectedProduct: any) => {
    if (selectedProduct) {
      const currentLocation = form.getValues("location");

      let currentQty = 0;
      let purchasePrice = Number(selectedProduct.purchase_price) || 0;
      let sellingPrice = Number(selectedProduct.selling_price) || 0;

      if (currentLocation) {
        try {
          const { data: stockRes } = await api.get(
            `/stock-adjustments/stock?prod_code=${encodeURIComponent(
              selectedProduct.prod_code
            )}&loca_code=${encodeURIComponent(currentLocation)}`
          );
          if (stockRes.success) {
            currentQty = Number(stockRes.data.qty) || 0;
            if (stockRes.data.purchase_price)
              purchasePrice = Number(stockRes.data.purchase_price);
            if (stockRes.data.selling_price)
              sellingPrice = Number(stockRes.data.selling_price);
          }
        } catch (error) {
          console.error("Failed to fetch stock details:", error);
          toast({
            title: "Warning",
            description: "Could not fetch current stock details. Assuming 0.",
            type: "warning",
          });
        }
      }

      setProduct({ ...selectedProduct, current_qty: currentQty });

      const packSize = Number(selectedProduct.pack_size) || 0;
      const unitType = selectedProduct.unit?.unit_type || null;

      const { packQty, unitQty } = calculateCurrentPackQty(
        currentQty,
        packSize,
        unitType
      );

      setNewProduct((prev) => ({
        ...prev,
        prod_name: selectedProduct.prod_name,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        pack_size: packSize,
        unit_name: selectedProduct.unit_name || "",
        unit_type: unitType,
        pack_qty: packQty,
        unit_qty: unitQty,
        physical_pack_qty: 0,
        physical_unit_qty: 0,
        variance_pack_qty: 0 - packQty,
        variance_unit_qty: 0 - unitQty,
      }));
      setUnitType(unitType);

      setTimeout(() => {
        if (packSize == 1) {
          setIsQtyDisabled(true);
          const element = document.getElementsByName(
            "physical_pack_qty"
          )[0] as HTMLInputElement;
          if (element) element.focus();
        } else {
          setIsQtyDisabled(false);
          const element = document.getElementsByName(
            "physical_pack_qty"
          )[0] as HTMLInputElement;
          if (element) element.focus();
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
      const sanitizedValue = value.replace(/[^0-9-]/g, "");
      return sanitizedValue === "" ? "" : sanitizedValue;
    }

    if (unitType === "DEC") {
      // Allow numbers and one decimal point, max 3 decimal places
      let sanitizedValue = value.replace(/[^0-9.-]/g, "");

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
    return value.replace(/[^0-9.-]/g, "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const { name } = e.currentTarget;

      switch (name) {
        case "purchase_price":
          const physicalPackInput = document.getElementsByName(
            "physical_pack_qty"
          )[0] as HTMLInputElement;
          physicalPackInput?.focus();
          break;
        case "physical_pack_qty":
          const physicalUnitInput = document.getElementsByName(
            "physical_unit_qty"
          )[0] as HTMLInputElement;
          physicalUnitInput?.focus();
          break;
        case "physical_unit_qty":
          const addButton = document.querySelector(
            'button[type="button"]:not([disabled])'
          ) as HTMLButtonElement;
          break;
      }
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isQtyField = [
      "pack_qty",
      "unit_qty",
      "physical_pack_qty",
      "physical_unit_qty",
    ].includes(name);

    setNewProduct((prev) => {
      const updatedValue = isQtyField
        ? sanitizeQuantity(value, prev.unit_type)
        : name === "purchase_price"
        ? Number(value) || 0
        : value;

      const nextProduct = {
        ...prev,
        [name]: updatedValue,
      };

      if (name === "physical_pack_qty" || name === "physical_unit_qty") {
        const unitType = prev.unit_type;

        const physicalPackQty =
          name === "physical_pack_qty"
            ? Number(updatedValue)
            : Number(prev.physical_pack_qty);

        const physicalUnitQty =
          name === "physical_unit_qty"
            ? Number(updatedValue)
            : Number(prev.physical_unit_qty);

        const currentPackQty = Number(prev.pack_qty);
        const currentUnitQty = Number(prev.unit_qty);

        const variancePack = validateInputByUnitType(
          physicalPackQty - currentPackQty,
          unitType
        );
        const varianceUnit = validateInputByUnitType(
          physicalUnitQty - currentUnitQty,
          unitType
        );

        nextProduct.physical_pack_qty = physicalPackQty;
        nextProduct.physical_unit_qty = physicalUnitQty;

        nextProduct.variance_pack_qty = variancePack;
        nextProduct.variance_unit_qty = varianceUnit;
      }

      return nextProduct;
    });
  };

  const handleResumeSession = async (session: SessionDetail) => {
    const { doc_no, location } = session;

    setTempStaNumber(doc_no);

    if (location) {
      form.setValue("location", location.loca_code);
    }

    const remainingSessions = unsavedSessions.filter(
      (s) => s.doc_no !== doc_no
    );
    setUnsavedSessions(remainingSessions);
    setShowUnsavedModal(false);
    setHasLoaded(false);

    try {
      setFetching(true);
      const response = await api.get(`/transactions/temp-products/${doc_no}`);
      if (response.data.success) {
        const productsWithUnits = response.data.data.map((product: any) => ({
          ...product,
          unit_name: product.product?.unit_name || product.unit_name,
          unit: {
            unit_type:
              product.product?.unit?.unit_type ||
              product.unit?.unit_type ||
              null,
          },
        }));
        setProducts(productsWithUnits);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("Failed to fetch temp products", error);
      toast({
        title: "Error",
        description: "Failed to load products for this session.",
        type: "error",
      });
    } finally {
      setFetching(false);
    }

    toast({
      title: "Session Resumed",
      description: `Resumed session ${doc_no} with ${session.product_count} products`,
      type: "success",
    });
  };

  const handleDiscardSelectedSession = async (session: SessionDetail) => {
    setLoading(true);
    const success = await discardSession(session.doc_no);
    if (success) {
      const remainingSessions = unsavedSessions.filter(
        (s) => s.doc_no !== session.doc_no
      );
      setUnsavedSessions(remainingSessions);
      if (remainingSessions.length === 0) {
        setShowUnsavedModal(false);
        setTempStaNumber("");
      }
      toast({
        title: "Success",
        description: `Session ${session.doc_no} discarded.`,
        type: "success",
      });
    }
    setLoading(false);
  };

  const handleDiscardAllSessions = async (sessions: SessionDetail[]) => {
    setLoading(true);
    const docNos = sessions.map((session) => session.doc_no);
    for (const docNo of docNos) {
      await discardSession(docNo);
    }
    setLoading(false);
    setShowUnsavedModal(false);
    setProducts([]);
    setUnsavedSessions([]);
    setTempStaNumber("");
    toast({
      title: "Success",
      description: "All unsaved sessions have been discarded.",
      type: "success",
    });
  };

  const discardSession = async (docNo: string) => {
    try {
      await api.post(`/transactions/unsave/${docNo}`);
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

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const response = await api.post(`/transactions/stock-adjustment`, data);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Stock Adjustment created successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/stock-adjustment");
      }
    } catch (error) {
      console.error("Failed to create stock adjustment", error);
      toast({
        title: "Error",
        description: "Failed to create stock adjustment.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
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
      physical_pack_qty: 0,
      physical_unit_qty: 0,
      variance_pack_qty: 0,
      variance_unit_qty: 0,
      total_qty: 0,
    });
    setProduct(null);
    setEditingProductId(null);
    setUnitType(null);
    setIsQtyDisabled(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6" />
          <h1 className="text-xl font-semibold">
            {isEditMode ? "Edit Stock Adjustment" : "New Stock Adjustment"}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size={"sm"}
          onClick={() =>
            router.push("/dashboard/transactions/stock-adjustment")
          }
          className="flex items-center gap-1 px-2 py-1 text-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>
      <div className="flex justify-end items-center">
        <Badge variant="secondary" className="px-2 py-1 text-sm h-6">
          <div className="flex items-center gap-2">
            <span>Document No:</span>
            {isGeneratingSta && <ClipLoader className="h-2 w-2 animate-spin" />}
            {!isGeneratingSta && <span>{tempStaNumber || "..."}</span>}
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
                          disabled={isEditMode || products.length > 0}
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
                    required
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your remarks" {...field} />
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
                        <TableHead>Pack Size</TableHead>
                        <TableHead>Current Pack Qty</TableHead>
                        <TableHead>Current Unit Qty</TableHead>
                        <TableHead>Physical Pack Qty</TableHead>
                        <TableHead>Physical Unit Qty</TableHead>
                        <TableHead>Variance Pack</TableHead>
                        <TableHead>Variance Unit</TableHead>
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
                              {product.pack_size}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.unit?.unit_type === "WHOLE"
                                ? Math.floor(Number(product.pack_qty))
                                : Number(product.pack_qty).toFixed(3)}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.unit?.unit_type === "WHOLE"
                                ? Math.floor(Number(product.unit_qty))
                                : Number(product.unit_qty).toFixed(3)}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.unit?.unit_type === "WHOLE"
                                ? Math.floor(Number(product.physical_pack_qty))
                                : Number(product.physical_pack_qty).toFixed(3)}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.unit?.unit_type === "WHOLE"
                                ? Math.floor(Number(product.physical_unit_qty))
                                : Number(product.physical_unit_qty).toFixed(3)}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.unit?.unit_type === "WHOLE"
                                ? Math.floor(Number(product.variance_pack_qty))
                                : Number(product.variance_pack_qty).toFixed(3)}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.unit?.unit_type === "WHOLE"
                                ? Math.floor(Number(product.variance_unit_qty))
                                : Number(product.variance_unit_qty).toFixed(3)}
                            </TableCell>
                            {/* <TableCell className="text-center">
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
                            </TableCell> */}
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
                            {/* {formatThousandSeparator(summary.subTotal)} */}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </div>

              {/* Add Product Section */}
              {!isApplied && (
                <>
                  <div className="flex gap-2 items-end mb-4 overflow-x-auto pb-2">
                    <div className="w-72 ml-1">
                      <Label>Product</Label>
                      <BasicProductSearch
                        ref={productSearchRef}
                        onValueChange={handleProductSelect}
                        value={product?.prod_code}
                        disabled={!!editingProductId || !watchedLocation}
                      />
                    </div>

                    <div className="w-24">
                      <Label>Current Pack Qty</Label>
                      <Input
                        ref={packQtyInputRef}
                        name="pack_qty"
                        type="text"
                        inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                        value={newProduct.pack_qty}
                        readOnly
                        disabled={true}
                        placeholder="0"
                        className="text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-gray-100"
                      />
                    </div>

                    <div className="w-28">
                      <Label>Current Unit Qty</Label>
                      <Input
                        ref={qtyInputRef}
                        name="unit_qty"
                        type="text"
                        inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                        value={newProduct.unit_qty}
                        readOnly
                        disabled={true}
                        placeholder="0"
                        className="text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-gray-100"
                      />
                    </div>

                    <div className="w-28">
                      <Label>Physical Pack Qty</Label>
                      <Input
                        name="physical_pack_qty"
                        type="text"
                        inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                        value={newProduct.physical_pack_qty}
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        className="text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <Label>Physical Unit Qty</Label>
                      <Input
                        name="physical_unit_qty"
                        type="text"
                        inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                        value={newProduct.physical_unit_qty}
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        className="text-sm"
                      />
                    </div>

                    <div className="w-28">
                      <Label>Variance Pack Qty</Label>
                      <Input
                        name="variance_pack_qty"
                        type="text"
                        value={formatDisplayValue(
                          newProduct.variance_pack_qty,
                          unitType
                        )}
                        readOnly
                        disabled
                        placeholder="0"
                        className="text-sm bg-gray-100"
                      />
                    </div>
                    <div className="w-28">
                      <Label>Variance Unit Qty</Label>
                      <Input
                        name="variance_unit_qty"
                        type="text"
                        value={formatDisplayValue(
                          newProduct.variance_unit_qty,
                          unitType
                        )}
                        readOnly
                        disabled
                        placeholder="0"
                        className="text-sm bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex-1">
                      {product && (
                        <p className="text-xs text-muted-foreground">
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
                <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                  {/* Current Pack Qty */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32">Current Pack Qty:</Label>
                    <Input
                      disabled
                      defaultValue="0"
                      className="text-right flex-1"
                    />
                  </div>

                  {/* Current Unit Qty */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32">Current Unit Qty:</Label>
                    <Input
                      disabled
                      defaultValue="0"
                      className="text-right flex-1"
                    />
                  </div>

                  {/* Physical Pack Qty */}
                  <div className="flex items-center gap-3">
                    <Label className="w-32">Physical Pack Qty:</Label>
                    <Input
                      disabled
                      defaultValue="0"
                      autoFocus
                      className="text-right flex-1"
                    />
                  </div>

                  {/* Physical Unit Qty */}
                  <div className="flex items-center gap-3">
                    <Label className="w-32">Physical Unit Qty:</Label>
                    <Input
                      disabled
                      defaultValue="0"
                      className="text-right flex-1"
                    />
                  </div>

                  {/* Variance Pack */}
                  <div className="flex items-center gap-3">
                    <Label className="w-32">Variance Pack:</Label>
                    <Input
                      disabled
                      defaultValue="0"
                      className="text-right flex-1"
                    />
                  </div>

                  {/* Variance Unit */}
                  <div className="flex items-center gap-3">
                    <Label className="w-32">Variance Unit:</Label>
                    <Input
                      disabled
                      defaultValue="0"
                      className="text-right flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button variant="outline">DRAFT Adjustment</Button>
                <Button>APPLY Adjustment</Button>
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
        transactionType="Stock Adjustment"
        iid="STA"
      />
    </div>
  );
}

export default function StockAdjustmentForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StockAdjustmentFormContent />
    </Suspense>
  );
}
