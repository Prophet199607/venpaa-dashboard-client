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

const goodReceivedNoteSchema = z.object({
  location: z.string().min(1, "Location is required"),
  supplier: z.string().min(1, "Supplier is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  delivery_address: z.string().min(1, "Delivery address is required"),
  invoiceAmount: z.string().min(1, "Invoice amount is required"),
  recallDocNo: z.string().optional(),
  invoiceNumber: z.string().optional(),
  remarks: z.string().optional(),
  grnRemarks: z.string().optional(),
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

interface AppliedPO {
  doc_no: string;
  sup_name: string;
}

function GoodReceiveNoteFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const hasDataLoaded = useRef(false);
  const searchParams = useSearchParams();
  const skipUnsavedModal = useRef(false);
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isReturn, setIsReturn] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [isWithoutPo, setIsWithoutPo] = useState(false);
  const freeQtyInputRef = useRef<HTMLInputElement>(null);
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [isPoSelected, setIsPoSelected] = useState(false);
  const [isQtyDisabled, setIsQtyDisabled] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [appliedPOs, setAppliedPOs] = useState<AppliedPO[]>([]);
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
    resolver: zodResolver(goodReceivedNoteSchema),
    defaultValues: {
      location: "",
      supplier: "",
      deliveryLocation: "",
      delivery_address: "",
      recallDocNo: "",
      invoiceNumber: "",
      invoiceAmount: "",
      remarks: "",
      grnRemarks: "",
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

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchLocations();

    const checkUnsavedSessions = async () => {
      if (isEditMode) {
        return;
      }

      try {
        const { data: res } = await api.get(
          "/good-receive-notes/unsaved-sessions"
        );
        if (res.success && res.data.length > 0) {
          const filteredSessions = res.data.filter((session: SessionDetail) => {
            const shouldSkip =
              sessionStorage.getItem(`skip_unsaved_modal_${session.doc_no}`) ===
              "true";
            if (shouldSkip) {
              console.log(
                "Skipping unsaved modal for PO-loaded session:",
                session.doc_no
              );
              if (session.doc_no === tempGrnNumber) {
                skipUnsavedModal.current = true;
              }
            }
            return !shouldSkip;
          });

          if (filteredSessions.length > 0) {
            setUnsavedSessions(filteredSessions);
            setShowUnsavedModal(true);
          } else if (skipUnsavedModal.current) {
            setShowUnsavedModal(false);
          }
        }
      } catch (error) {
        console.error("Failed to check for unsaved sessions:", error);
      }
    };

    if (!skipUnsavedModal.current) {
      checkUnsavedSessions();
    }
  }, [fetchLocations, toast, isEditMode, tempGrnNumber]);

  useEffect(() => {
    if (tempGrnNumber && !isEditMode) {
      const shouldSkip =
        sessionStorage.getItem(`skip_unsaved_modal_${tempGrnNumber}`) ===
        "true";
      if (shouldSkip) {
        skipUnsavedModal.current = true;
      }
    }
  }, [tempGrnNumber, isEditMode]);

  useEffect(() => {
    return () => {
      if (!skipUnsavedModal.current && tempGrnNumber) {
        sessionStorage.removeItem(`skip_unsaved_modal_${tempGrnNumber}`);
      }
    };
  }, [tempGrnNumber]);

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
      setTempGrnNumber("");
      return;
    }
    fetchFilteredAppliedPOs(locaCode, form.getValues("supplier"));

    if (unsavedSessions.length === 0 && !isEditMode) {
      setHasLoaded(true);
      generateGrnNumber(locaCode, false);
    }
    handleDeliveryLocationChange(locaCode);
  };

  const handleSupplierChange = (value: string) => {
    form.setValue("supplier", value);
    setSupplier(value);
    setIsSupplierSelected(!!value);
    fetchFilteredAppliedPOs(form.getValues("location"), value);

    setProduct(null);
    resetProductForm();
  };

  const generateGrnNumber = async (
    locaCode: string,
    setFetchingState = true
  ) => {
    try {
      setIsGeneratingGrn(true);
      if (setFetchingState) {
        setFetching(true);
      }
      const { data: res } = await api.get(
        `/good-receive-notes/generate-code/${locaCode}`
      );
      if (res.success) {
        setTempGrnNumber(res.code);
      }
    } catch (error) {
      console.error("Failed to generate GRN number:", error);
    } finally {
      setIsGeneratingGrn(false);
      if (setFetchingState) {
        setFetching(false);
      }
    }
  };

  const fetchFilteredAppliedPOs = useCallback(
    async (location: string, supplier: string) => {
      if (!location || !supplier) {
        setAppliedPOs([]);
        return;
      }

      try {
        const { data: res } = await api.get(
          `/purchase-orders/applied?location=${location}&supplier=${supplier}`
        );
        if (!res.success) throw new Error(res.message);
        setAppliedPOs(res.data);
      } catch (err: any) {
        toast({
          title: "Failed to load applied Purchase Orders",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      }
    },
    [toast]
  );

  const handlePurchaseOrderChange = async (docNo: string) => {
    if (!docNo) return;

    try {
      setLoading(true);
      const { data: res } = await api.get(
        `/transactions/load-transaction-by-code/${docNo}/applied/PO`
      );

      if (res.success && res.data) {
        const poData = res.data;

        const locationCode = poData.location?.loca_code || poData.location;
        form.setValue("location", locationCode);

        form.setValue("supplier", poData.supplier_code);
        setSupplier(poData.supplier_code);
        setIsSupplierSelected(true);

        const deliveryLocationCode =
          poData.delivery_location?.loca_code || poData.delivery_location;
        form.setValue("deliveryLocation", deliveryLocationCode);
        const deliveryAddress =
          poData.delivery_location?.delivery_address || poData.delivery_address;
        form.setValue("delivery_address", deliveryAddress);
        form.setValue("recallDocNo", poData.doc_no || "");

        setPaymentMethod(poData.payment_mode.toLowerCase());
        if (poData.document_date) {
          setDate(new Date(poData.document_date));
        }
        form.setValue("remarks", poData.remarks_ref);

        const productDetails = poData.transaction_details || [];

        const productsWithUnits = productDetails.map((product: any) => ({
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
        setSummary({
          subTotal: parseFloat(poData.subtotal) || 0,
          discountPercent: parseFloat(poData.dis_per) || 0,
          discountValue: parseFloat(poData.discount) || 0,
          taxPercent: parseFloat(poData.tax_per) || 0,
          taxValue: parseFloat(poData.tax) || 0,
          netAmount: parseFloat(poData.net_total) || 0,
        });

        setIsPoSelected(true);

        skipUnsavedModal.current = true;
        sessionStorage.setItem(`skip_unsaved_modal_${tempGrnNumber}`, "true");

        await api.post("/good-receive-notes/add-products-from-po", {
          doc_number: docNo,
          grn_number: tempGrnNumber,
          iid: "GRN",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching PO details",
        description: "Could not load PO data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActualReceivedDateChange = (newDate: Date | undefined) => {
    if (newDate) setActualReceivedDate(newDate);
  };

  const handleInvoiceDateChange = (newDate: Date | undefined) => {
    if (newDate) setInvoiceDate(newDate);
  };

  useEffect(() => {
    if (!isEditMode || hasDataLoaded.current) return;

    const docNo = searchParams.get("doc_no");
    const status = searchParams.get("status");
    const iid = searchParams.get("iid");

    if (!docNo || !status || !iid) return;

    const loadGoodReceiveNote = async () => {
      hasDataLoaded.current = true;

      try {
        setFetching(true);

        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`
        );

        if (res.success) {
          const grnData = res.data;
          setTempGrnNumber(grnData.doc_no);

          const locationCode = grnData.location?.loca_code || grnData.location;
          form.setValue("location", locationCode);

          form.setValue("supplier", grnData.supplier_code);
          setSupplier(grnData.supplier_code);
          setIsSupplierSelected(true);

          const deliveryLocationCode =
            grnData.delivery_location?.loca_code || grnData.delivery_location;
          form.setValue("deliveryLocation", deliveryLocationCode);
          const deliveryAddress =
            grnData.delivery_location?.delivery_address ||
            grnData.delivery_address;
          form.setValue("delivery_address", deliveryAddress);
          form.setValue("recallDocNo", grnData.recall_doc_no || "");

          await fetchFilteredAppliedPOs(
            grnData.location,
            grnData.supplier_code
          );
          if (grnData.recall_doc_no) {
            setAppliedPOs((prev) => {
              const exists = prev.some(
                (po) => po.doc_no === grnData.recall_doc_no
              );
              return exists
                ? prev
                : [...prev, { doc_no: grnData.recall_doc_no, sup_name: "" }];
            });
          }

          form.setValue("invoiceNumber", grnData.invoice_no || "");
          form.setValue("invoiceAmount", grnData.invoice_amount || "");
          form.setValue("remarks", grnData.remarks_ref || "");
          form.setValue("grnRemarks", grnData.grn_remarks || "");

          setActualReceivedDate(new Date(grnData.transaction_date));
          setInvoiceDate(new Date(grnData.invoice_date));
          setDate(new Date(grnData.document_date));
          setPaymentMethod(grnData.payment_mode);

          const productDetails =
            grnData.temp_transaction_details ||
            grnData.transaction_details ||
            [];

          const productsWithUnits = productDetails.map((product: any) => ({
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
          setSummary({
            subTotal: parseFloat(grnData.subtotal) || 0,
            discountPercent: parseFloat(grnData.dis_per) || 0,
            discountValue: parseFloat(grnData.discount) || 0,
            taxPercent: parseFloat(grnData.tax_per) || 0,
            taxValue: parseFloat(grnData.tax) || 0,
            netAmount: parseFloat(grnData.net_total) || 0,
          });
        }
      } catch (error) {
        console.error("Failed to load good receive note:", error);
      } finally {
        setFetching(false);
      }
    };

    loadGoodReceiveNote();
  }, [isEditMode, form, searchParams, fetchFilteredAppliedPOs]);

  useEffect(() => {
    if (
      showUnsavedModal ||
      !tempGrnNumber ||
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
          `/transactions/temp-products/${tempGrnNumber}`
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
    tempGrnNumber,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const { name } = e.currentTarget;

      switch (name) {
        case "purchase_price":
          if (product) {
            packQtyInputRef.current?.focus();
          }
          break;
        case "pack_qty":
          if (!newProduct.pack_qty) {
            return;
          }
          if (!isQtyDisabled) {
            qtyInputRef.current?.focus();
          } else {
            freeQtyInputRef.current?.focus();
          }
          break;
        case "unit_qty":
          freeQtyInputRef.current?.focus();
          break;
        case "free_qty":
          discountInputRef.current?.focus();
          break;
        case "line_wise_discount_value":
          if (newProduct.pack_qty <= 0) {
            return;
          }
          if (editingProductId) {
            saveProduct();
          } else {
            addProduct();
          }
          break;
      }
    }
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

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    const subTotal = calculateSubtotal();

    setSummary((prev) => {
      const updated = { ...prev };

      if (value === "" || value === "0") {
        updated.discountPercent = 0;
        updated.discountValue = 0;
      } else if (value.endsWith("%")) {
        const num = parseFloat(value.slice(0, -1)) || 0;
        updated.discountPercent = Math.min(num, 100);
        updated.discountValue = (subTotal * updated.discountPercent) / 100;
      } else {
        const num = parseFloat(value) || 0;
        updated.discountValue = Math.min(num, subTotal);
        updated.discountPercent = 0;
      }

      updated.netAmount = subTotal - updated.discountValue + updated.taxValue;
      return updated;
    });
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    const subTotal = calculateSubtotal();

    setSummary((prev) => {
      const updated = { ...prev };
      const taxableAmount = subTotal - prev.discountValue;

      if (value === "" || value === "0") {
        updated.taxPercent = 0;
        updated.taxValue = 0;
      } else if (value.endsWith("%")) {
        const num = parseFloat(value.slice(0, -1)) || 0;
        updated.taxPercent = num;
        updated.taxValue = (taxableAmount * updated.taxPercent) / 100;
      } else {
        const num = parseFloat(value) || 0;
        updated.taxValue = num;
        updated.taxPercent = 0;
      }

      updated.netAmount = subTotal - prev.discountValue + updated.taxValue;
      return updated;
    });
  };

  const calculateTotalQty = () => {
    const packQty = Number(newProduct.pack_qty) || 0;
    const packSize = Number(newProduct.pack_size) || 0;
    const unitQty = Number(newProduct.unit_qty) || 0;
    const totalQty = packQty * packSize + unitQty;
    return totalQty;
  };

  const calculateAmount = () => {
    const totalQty = Number(calculateTotalQty()) || 0;
    const purchasePrice = Number(newProduct.purchase_price) || 0;
    const discountInput = newProduct.line_wise_discount_value;

    let calculatedDiscount = 0;
    const amountBeforeDiscount = purchasePrice * totalQty;

    if (typeof discountInput === "string" && discountInput.endsWith("%")) {
      const percentage = parseFloat(discountInput.slice(0, -1)) || 0;
      calculatedDiscount = (amountBeforeDiscount * percentage) / 100;
    } else {
      calculatedDiscount = parseFloat(discountInput) || 0;
    }

    const amount = amountBeforeDiscount - calculatedDiscount;
    return Math.max(0, amount);
  };

  const calculateSubtotal = useCallback((): number => {
    return products.reduce((total, product) => {
      const lineAmount = Number(product.amount) || 0;
      return total + lineAmount;
    }, 0);
  }, [products]);

  useEffect(() => {
    if (isEditMode && products.length > 0) {
      const shouldRecalculate =
        summary.subTotal === 0 || products.some((p) => p.amount !== undefined);

      if (!shouldRecalculate) {
        return;
      }
    }

    const subTotal = calculateSubtotal();

    setSummary((prev) => {
      // Recalculate discount value based on current discount percent
      const discountValue =
        prev.discountPercent > 0
          ? (subTotal * prev.discountPercent) / 100
          : prev.discountValue;

      const taxableAmount = subTotal - discountValue;

      // Recalculate tax value based on current tax percent
      const taxValue =
        prev.taxPercent > 0
          ? (taxableAmount * prev.taxPercent) / 100
          : prev.taxValue;

      const netAmount = subTotal - discountValue + taxValue;

      return {
        ...prev,
        subTotal: subTotal,
        discountValue: discountValue,
        taxValue: taxValue,
        netAmount: netAmount,
      };
    });
  }, [calculateSubtotal, isEditMode, products, summary.subTotal]);

  const recalculateSummary = (
    products: ProductItem[],
    currentSummary: typeof summary
  ) => {
    const newSubTotal = products.reduce((total, product) => {
      return total + (Number(product.amount) || 0);
    }, 0);

    return {
      ...currentSummary,
      subTotal: newSubTotal,
      netAmount:
        newSubTotal - currentSummary.discountValue + currentSummary.taxValue,
    };
  };

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

  const applyReturnLogic = (value: number): number => {
    return isReturn ? -Math.abs(value) : Math.abs(value);
  };

  const applyReturnLogicToString = (value: string): string => {
    if (!value) return value;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return isReturn
      ? (-Math.abs(numValue)).toString()
      : Math.abs(numValue).toString();
  };

  const addProduct = async () => {
    if (!product) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const payload = {
      doc_no: tempGrnNumber,
      iid: "GRN",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
      pack_qty: applyReturnLogic(Number(newProduct.pack_qty) || 0),
      unit_qty: applyReturnLogic(Number(newProduct.unit_qty) || 0),
      free_qty: applyReturnLogic(Number(newProduct.free_qty) || 0),
      total_qty: applyReturnLogic(totalQty),
      amount: applyReturnLogic(amount),
      line_wise_discount_value:
        typeof newProduct.line_wise_discount_value === "string" &&
        newProduct.line_wise_discount_value.endsWith("%")
          ? newProduct.line_wise_discount_value
          : applyReturnLogicToString(newProduct.line_wise_discount_value),
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.post("/transactions/add-product", payload);

      if (response.data.success) {
        setProducts(response.data.data);
        resetProductForm();
        setSummary((prev) => recalculateSummary(response.data.data, prev));
        productSearchRef.current?.openAndFocus();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to add the product.",
        type: "error",
      });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const saveProduct = async () => {
    if (!editingProductId || !product) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const payload = {
      doc_no: tempGrnNumber,
      iid: "GRN",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
      pack_qty: applyReturnLogic(Number(newProduct.pack_qty) || 0),
      unit_qty: applyReturnLogic(Number(newProduct.unit_qty) || 0),
      free_qty: applyReturnLogic(Number(newProduct.free_qty) || 0),
      total_qty: applyReturnLogic(totalQty),
      amount: applyReturnLogic(amount),
      line_wise_discount_value:
        typeof newProduct.line_wise_discount_value === "string" &&
        newProduct.line_wise_discount_value.endsWith("%")
          ? newProduct.line_wise_discount_value
          : applyReturnLogicToString(newProduct.line_wise_discount_value),
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.put(
        `/transactions/update-product/${editingProductId}`,
        payload
      );

      if (response.data.success) {
        setProducts(response.data.data);
        resetProductForm();
        setSummary((prev) => recalculateSummary(response.data.data, prev));
        productSearchRef.current?.openAndFocus();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save the product.",
        type: "error",
      });
    } finally {
      setIsSubmittingProduct(false);
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
      selling_price: productToEdit.selling_price,
      pack_size: productToEdit.pack_size,
    });

    // Populate the input fields
    setNewProduct({
      prod_name: productToEdit.prod_name,
      purchase_price: productToEdit.purchase_price,
      pack_size: Number(productToEdit.pack_size),
      pack_qty: Number(productToEdit.pack_qty),
      unit_qty: Number(productToEdit.unit_qty),
      free_qty: Number(productToEdit.free_qty),
      total_qty: productToEdit.total_qty,
      line_wise_discount_value: productToEdit.line_wise_discount_value,
      unit_name: productToEdit.unit_name,
      unit_type: productToEdit.unit?.unit_type || null,
    });

    // Set unit type for input validation
    setUnitType(productToEdit.unit?.unit_type || null);

    // Disable unit_qty if pack_size is 1
    if (Number(productToEdit.pack_size) === 1) {
      setIsQtyDisabled(true);
    } else {
      setIsQtyDisabled(false);
    }
  };

  const removeProduct = async (productId: number) => {
    const productToRemove = products.find((p) => p.id === productId);
    if (!productToRemove) return;

    try {
      setLoading(true);
      const response = await api.delete(
        `/transactions/delete-detail/${tempGrnNumber}/${productToRemove.line_no}`
      );

      if (response.data.success) {
        setProducts(response.data.data);
        setSummary((prev) => recalculateSummary(response.data.data, prev));
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

  const handleResumeSession = async (session: SessionDetail) => {
    const { doc_no, location, supplier } = session;

    setTempGrnNumber(doc_no);

    if (location) {
      form.setValue("location", location.loca_code);
      handleDeliveryLocationChange(location.loca_code);
    }

    if (supplier) {
      form.setValue("supplier", supplier.sup_code);
      setSupplier(supplier.sup_code);
      setIsSupplierSelected(true);
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
        setTempGrnNumber("");
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
    setTempGrnNumber("");
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

  const onSubmit = (values: FormData) => {
    if (isEditMode) {
      handleUpdateDraftGoodReceiveNote(values);
    } else {
      handleCreateDraftGoodReceiveNote(values);
    }
  };

  const formatDateForAPI = (date: Date | undefined): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPayload = (values: FormData) => {
    const payload = {
      location: values.location,
      supplier_code: values.supplier,
      delivery_location: values.deliveryLocation,
      delivery_address: values.delivery_address,

      remarks_ref: values.remarks,
      grn_remarks: values.grnRemarks,

      doc_no: tempGrnNumber,
      iid: "GRN",

      document_date: formatDateForAPI(date),
      transaction_date: formatDateForAPI(actualReceivedDate),

      payment_mode: paymentMethod,

      recall_doc_no:
        values.recallDocNo && values.recallDocNo.trim() !== ""
          ? values.recallDocNo
          : "Without Po",

      invoice_no: values.invoiceNumber || null,
      invoice_date: formatDateForAPI(invoiceDate),
      invoice_amount: values.invoiceAmount
        ? Number(values.invoiceAmount)
        : null,

      subtotal: summary.subTotal,
      net_total: summary.netAmount,
      discount: summary.discountPercent > 0 ? 0 : summary.discountValue,
      dis_per: summary.discountPercent > 0 ? summary.discountPercent : 0,
      tax: summary.taxPercent > 0 ? 0 : summary.taxValue,
      tax_per: summary.taxPercent > 0 ? summary.taxPercent : 0,
    };
    return payload;
  };

  const handleCreateDraftGoodReceiveNote = async (values: FormData) => {
    const payload = getPayload(values);

    setLoading(true);
    try {
      const response = await api.post("/transactions/draft", payload);
      if (response.data.success) {
        if (tempGrnNumber) {
          sessionStorage.removeItem(`skip_unsaved_modal_${tempGrnNumber}`);
        }

        toast({
          title: "Success",
          description: "Good receive note has been drafted successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/good-receive-note");
      }
    } catch (error: any) {
      console.error("Failed to draft GRN:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not draft the GRN.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDraftGoodReceiveNote: (
    values: FormData
  ) => Promise<void> = async (values) => {
    const payload = getPayload(values);
    const docNo = searchParams.get("doc_no");

    if (!docNo) return;

    setLoading(true);
    try {
      const response = await api.put(`/transactions/draft/${docNo}`, payload);
      if (response.data.success) {
        sessionStorage.removeItem(`skip_unsaved_modal_${docNo}`);

        toast({
          title: "Success",
          description: "Good receive note has been updated successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/good-receive-note");
      }
    } catch (error: any) {
      console.error("Failed to update GRN:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not update the GRN.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGoodReceiveNote = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Invalid Form",
        description: "Please fill all required fields before applying.",
        type: "error",
      });
      return;
    }

    const payload = getPayload(form.getValues());

    setLoading(true);
    try {
      const response = await api.post("/good-receive-notes/save-grn", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Good receive note has been applied successfully.",
          type: "success",
        });
        const newDocNo = response.data.data.doc_no;
        setTimeout(() => {
          router.push(
            `/dashboard/transactions/good-receive-note?tab=applied&view_doc_no=${newDocNo}`
          );
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not apply the GRN.",
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
            {isEditMode ? "Edit Good Receive Note" : "New Good Receive Note"}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            router.push("/dashboard/transactions/good-receive-note")
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
            id="without-po"
            checked={isWithoutPo}
            onCheckedChange={(checked: boolean) => setIsWithoutPo(checked)}
          />
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
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
                          disabled={
                            isEditMode || isPoSelected || isSupplierSelected
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
                          disabled={isEditMode || isPoSelected}
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
                        <FormLabel>Purchase Order</FormLabel>
                        <Select
                          onValueChange={handlePurchaseOrderChange}
                          value={field.value}
                          disabled={
                            isWithoutPo ||
                            !watchedLocation ||
                            !watchedSupplier ||
                            isEditMode
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="--Choose PO--" />
                          </SelectTrigger>
                          <SelectContent>
                            {appliedPOs.map((po) => (
                              <SelectItem key={po.doc_no} value={po.doc_no}>
                                {po.doc_no}
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
                  <Label className="text-sm font-medium">
                    Actual Received Date*
                  </Label>
                  <DatePicker
                    date={actualReceivedDate}
                    setDate={handleActualReceivedDateChange}
                    placeholder="Select actual received date"
                    required
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
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
                  <Label className="text-sm font-medium">
                    Payment Methods*
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Date*</Label>
                  <DatePicker
                    date={date}
                    setDate={setDate}
                    placeholder="Select date"
                    disabled={true}
                    required
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                <div>
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Invoice Number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Date*</Label>
                  <DatePicker
                    date={invoiceDate}
                    setDate={handleInvoiceDateChange}
                    placeholder="dd/mm/yyyy"
                    required
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="invoiceAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Invoice Amount"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 4 - Textareas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div>
                  <Label className="text-sm font-medium">PO Remarks</Label>
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <Textarea placeholder="PO Remarks" rows={3} {...field} />
                    )}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Remarks</Label>
                  <FormField
                    control={form.control}
                    name="grnRemarks"
                    render={({ field }) => (
                      <Textarea placeholder="GRN Remarks" rows={3} {...field} />
                    )}
                  />
                </div>
              </div>

              {/* Return Section */}
              <div className="mb-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="return"
                    checked={isReturn}
                    onCheckedChange={(checked: boolean) => setIsReturn(checked)}
                  />
                  <Label htmlFor="return" className="text-sm font-medium">
                    RETURN
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
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
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
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
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
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
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
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
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
                        value={formatThousandSeparator(calculateAmount())}
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
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
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
                            onClick={
                              editingProductId ? saveProduct : addProduct
                            }
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
                      onChange={handleDiscountChange}
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
                      onChange={handleTaxChange}
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
                    disabled={loading || products.length === 0 || isPoSelected}
                    // disabled={loading || products.length === 0}
                  >
                    {loading
                      ? isEditMode
                        ? "Updating..."
                        : "Drafting..."
                      : isEditMode
                      ? "UPDATE GRN"
                      : "DRAFT GRN"}
                  </Button>
                  <Button
                    type="button"
                    disabled={loading || products.length === 0}
                    onClick={handleApplyGoodReceiveNote}
                  >
                    APPLY GRN
                  </Button>
                </div>
              )}
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
        transactionType="Good Receive Note"
        iid="GRN"
      />
    </div>
  );
}

export default function GoodReceiveNoteForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoodReceiveNoteFormContent />
    </Suspense>
  );
}
