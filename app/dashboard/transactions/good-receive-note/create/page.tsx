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

interface POCacheData {
  grnNumber: string;
  poDocNo: string;
  location: string;
  supplier: string;
  timestamp: number;
  isPoLoaded: boolean;
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
  const [forcedWithoutPo, setForcedWithoutPo] = useState(false);
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
      // Now check for real unsaved sessions
      try {
        const { data: res } = await api.get(
          "/good-receive-notes/unsaved-sessions"
        );
        if (res.success && res.data.length > 0) {
          const filteredSessions = res.data.filter((session: SessionDetail) => {
            const shouldSkip =
              sessionStorage.getItem(`skip_unsaved_modal_${session.doc_no}`) ===
              "true";
            return !shouldSkip;
          });

          if (filteredSessions.length > 0) {
            setUnsavedSessions(filteredSessions);
            setShowUnsavedModal(true);

            setForcedWithoutPo(true);
            form.setValue("recallDocNo", "Without Po");
          }
        }
      } catch (error) {
        console.error("Failed to check for unsaved sessions:", error);
      }
    };

    if (!skipUnsavedModal.current && !isEditMode) {
      checkUnsavedSessions();
    }
  }, [fetchLocations, toast, isEditMode, form]);

  useEffect(() => {
    const cleanupPoSession = async () => {
      if (isEditMode) {
        return;
      }

      const poCacheKey = `po_grn_session`;
      const poSessionData = sessionStorage.getItem(poCacheKey);

      if (poSessionData) {
        try {
          const poData: POCacheData = JSON.parse(poSessionData);

          if (poData.isPoLoaded) {
            try {
              await api.post(`/transactions/unsave/${poData.grnNumber}`);

              console.log("Cleaned up PO-loaded session:", poData.grnNumber);

              // Clear the session storage
              sessionStorage.removeItem(poCacheKey);
              sessionStorage.removeItem(
                `skip_unsaved_modal_${poData.grnNumber}`
              );

              // Reset form if needed
              if (tempGrnNumber === poData.grnNumber) {
                setTempGrnNumber("");
                setProducts([]);
                resetProductForm();
              }
            } catch (error: any) {
              console.error(
                "Failed to cleanup PO session:",
                error.response?.data || error
              );
            }
          }
        } catch (error) {
          console.error("Error parsing PO session data:", error);
          sessionStorage.removeItem(poCacheKey);
        }
      }
    };
    cleanupPoSession();
  }, [isEditMode, tempGrnNumber]);

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
    fetchFilteredAppliedPOs("GRN", "PO", locaCode, form.getValues("supplier"));

    if (unsavedSessions.length === 0 && !isEditMode) {
      setHasLoaded(true);
      generateGrnNumber("TempGRN", locaCode, false);
    }
    handleDeliveryLocationChange(locaCode);
  };

  const handleSupplierChange = (value: string) => {
    form.setValue("supplier", value);
    setSupplier(value);
    setIsSupplierSelected(!!value);
    fetchFilteredAppliedPOs("GRN", "PO", form.getValues("location"), value);

    setProduct(null);
    resetProductForm();
  };

  const generateGrnNumber = async (
    type: string,
    locaCode: string,
    setFetchingState = true
  ): Promise<string | null> => {
    try {
      setIsGeneratingGrn(true);
      if (setFetchingState) {
        setFetching(true);
      }

      const { data: res } = await api.get(
        `/transactions/generate-code/${type}/${locaCode}`
      );
      if (res.success && res.code) {
        setTempGrnNumber(res.code);
        return res.code;
      }
      return null;
    } catch (error: any) {
      console.error("Failed to generate GRN number:", error);
      return null;
    } finally {
      setIsGeneratingGrn(false);
      if (setFetchingState) {
        setFetching(false);
      }
    }
  };

  const fetchFilteredAppliedPOs = useCallback(
    async (
      iid: string,
      recall_iid: string,
      location: string,
      supplier: string
    ) => {
      if (!iid || !recall_iid || !location || !supplier) {
        setAppliedPOs([]);
        return;
      }

      try {
        const { data: res } = await api.get(
          `/transactions/applied?iid=${iid}&recall_iid=${recall_iid}&location=${location}&supplier=${supplier}`
        );

        if (!res.success) throw new Error(res.message);
        setAppliedPOs(res.data);
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

        let generatedGrnNumber = tempGrnNumber;

        if (
          !generatedGrnNumber ||
          form.getValues("location") !== locationCode
        ) {
          const newGrnNumber = await generateGrnNumber(
            "TempGRN",
            locationCode,
            false
          );

          if (!newGrnNumber) {
            throw new Error("Failed to generate GRN number");
          }

          generatedGrnNumber = newGrnNumber;
          setTempGrnNumber(newGrnNumber);
        }

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

        const poSessionData: POCacheData = {
          grnNumber: generatedGrnNumber,
          poDocNo: docNo,
          location: locationCode,
          supplier: poData.supplier_code,
          timestamp: Date.now(),
          isPoLoaded: true,
        };

        sessionStorage.setItem("po_grn_session", JSON.stringify(poSessionData));
        skipUnsavedModal.current = true;
        sessionStorage.setItem(
          `skip_unsaved_modal_${generatedGrnNumber}`,
          "true"
        );

        for (const product of productsWithUnits) {
          try {
            const shouldConvertToInt = product.unit?.unit_type === "WHOLE";

            const payload = {
              doc_no: generatedGrnNumber,
              iid: "GRN",
              prod_code: product.prod_code,
              prod_name: product.prod_name,
              purchase_price: product.purchase_price || 0,
              selling_price: product.selling_price || 0,
              pack_size: product.pack_size || 0,
              pack_qty: shouldConvertToInt
                ? Math.floor(product.pack_qty)
                : product.pack_qty,
              unit_qty: shouldConvertToInt
                ? Math.floor(product.unit_qty)
                : product.unit_qty,
              free_qty: shouldConvertToInt
                ? Math.floor(product.free_qty)
                : product.free_qty,
              total_qty: shouldConvertToInt
                ? Math.floor(product.total_qty)
                : product.total_qty,
              amount: product.amount || 0,
              line_wise_discount_value: product.line_wise_discount_value || "0",
            };

            console.log("Adding product with doc_no:", generatedGrnNumber);
            await api.post("/transactions/add-product", payload);
          } catch (error: any) {
            console.error(
              `Failed to add product ${product.prod_code}:`,
              error.response?.data || error.message
            );
          }
        }

        const response = await api.get(
          `/transactions/temp-products/${generatedGrnNumber}`
        );
        if (response.data.success) {
          setProducts(response.data.data);
        }
      }
    } catch (error: any) {
      console.error("Error in handlePurchaseOrderChange:", error);
      toast({
        title: "Error fetching PO details",
        description: error.message || "Could not load PO data.",
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
            grnData.supplier_code,
            grnData.recall_iid,
            grnData.iid
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

  useEffect(() => {
    if (isEditMode || hasDataLoaded.current || locations.length === 0) return;

    const poDataJson = sessionStorage.getItem("po_data_for_grn");
    if (!poDataJson) return;

    const loadPODataForGrn = async () => {
      try {
        const poData = JSON.parse(poDataJson);
        sessionStorage.removeItem("po_data_for_grn");
        setFetching(true);

        const locationCode = poData.location;

        if (!locationCode) {
          throw new Error("Location code is missing in PO data");
        }

        // Generate GRN number FIRST
        console.log("Generating GRN number for location:", locationCode);
        const generatedGrnNumber = await generateGrnNumber(
          "TempGRN",
          locationCode,
          false
        );

        if (!generatedGrnNumber) {
          throw new Error("Failed to generate GRN number");
        }

        console.log("Generated GRN number:", generatedGrnNumber);

        // Now set form values with the generated GRN number
        form.setValue("location", locationCode);

        const deliveryLocationCode = poData.deliveryLocation;
        form.setValue("deliveryLocation", deliveryLocationCode);

        const selectedDeliveryLocation = locations.find(
          (loc) => loc.loca_code === deliveryLocationCode
        );
        if (selectedDeliveryLocation) {
          form.setValue(
            "delivery_address",
            selectedDeliveryLocation.delivery_address
          );
        } else {
          form.setValue("delivery_address", poData.delivery_address || "");
        }

        form.setValue("supplier", poData.supplier);
        setSupplier(poData.supplier);
        setIsSupplierSelected(true);

        await fetchFilteredAppliedPOs(
          "GRN",
          "PO",
          locationCode,
          poData.supplier
        );

        if (poData.po_doc_no) {
          setTimeout(() => {
            form.setValue("recallDocNo", poData.po_doc_no);
          }, 100);
        }

        if (poData.payment_mode) {
          const paymentModeValue = poData.payment_mode.toLowerCase();
          setPaymentMethod(paymentModeValue);
        }

        if (poData.document_date) {
          setDate(new Date(poData.document_date));
        }

        form.setValue("remarks", poData.remarks_ref || "");

        // IMPORTANT: Add each product from PO to TempTransactionDetail
        if (poData.products && poData.products.length > 0) {
          console.log(
            `Adding ${poData.products.length} products to temp table`
          );

          for (const product of poData.products) {
            try {
              const shouldConvertToInt = product.unit?.unit_type === "WHOLE";

              const payload = {
                doc_no: generatedGrnNumber, // Use the generated number
                iid: "GRN",
                prod_code: product.prod_code,
                prod_name: product.prod_name,
                purchase_price: product.purchase_price || 0,
                selling_price: product.selling_price || 0,
                pack_size: product.pack_size || 0,
                pack_qty: shouldConvertToInt
                  ? Math.floor(product.pack_qty || 0)
                  : product.pack_qty || 0,
                unit_qty: shouldConvertToInt
                  ? Math.floor(product.unit_qty || 0)
                  : product.unit_qty || 0,
                free_qty: shouldConvertToInt
                  ? Math.floor(product.free_qty || 0)
                  : product.free_qty || 0,
                total_qty: shouldConvertToInt
                  ? Math.floor(product.total_qty || 0)
                  : product.total_qty || 0,
                amount: product.amount || 0,
                line_wise_discount_value:
                  product.line_wise_discount_value || "0",
              };

              console.log(
                "Adding product payload with doc_no:",
                generatedGrnNumber
              );
              await api.post("/transactions/add-product", payload);
            } catch (error: any) {
              console.error(
                `Failed to add product ${product.prod_code}:`,
                error.response?.data || error.message
              );
            }
          }

          // After adding all products, fetch the updated product list
          const response = await api.get(
            `/transactions/temp-products/${generatedGrnNumber}`
          );
          if (response.data.success) {
            setProducts(response.data.data);
          }
        }

        if (poData.summary) {
          setSummary(poData.summary);
        }

        setHasLoaded(true);
        skipUnsavedModal.current = true;

        toast({
          title: "PO Data Loaded",
          description: "Purchase Order data has been loaded successfully.",
          type: "success",
        });
      } catch (error: any) {
        console.error("Failed to load PO data:", error);
        toast({
          title: "Error",
          description: `Failed to load Purchase Order data: ${error.message}`,
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    };

    loadPODataForGrn();
  }, [isEditMode, form, toast, fetchFilteredAppliedPOs, locations]);

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
    <div className="space-y-2">
      <div className="grid grid-cols-3 items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            router.push("/dashboard/transactions/good-receive-note")
          }
          className="justify-self-start flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>

        <div className="flex items-center justify-center gap-2">
          <Package className="h-5 w-5" />
          <h1 className="text-lg font-semibold">
            {isEditMode ? "Edit Good Receive Note" : "New Good Receive Note"}
          </h1>
        </div>

        <Badge
          variant="secondary"
          className="justify-self-end px-2 py-1 text-xs h-6"
        >
          <div className="flex items-center gap-2">
            <span>Document No:</span>
            {isGeneratingGrn && <ClipLoader size={20} />}
            {!isGeneratingGrn && <span>{tempGrnNumber || "..."}</span>}
          </div>
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="without-po"
          checked={isWithoutPo}
          onCheckedChange={(checked: boolean) => setIsWithoutPo(checked)}
        />
        <Label htmlFor="without-po">Without Purchase Order</Label>
      </div>

      <Card>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-2"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                          onValueChange={(val) => {
                            if (forcedWithoutPo) return;
                            handlePurchaseOrderChange(val);
                          }}
                          value={forcedWithoutPo ? "Without Po" : field.value}
                          disabled={
                            forcedWithoutPo ||
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
                            {forcedWithoutPo ? (
                              <SelectItem value="Without Po" disabled>
                                Without Po
                              </SelectItem>
                            ) : (
                              appliedPOs.map((po) => (
                                <SelectItem key={po.doc_no} value={po.doc_no}>
                                  {po.doc_no}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label>Actual Received Date*</Label>
                  <DatePicker
                    date={actualReceivedDate}
                    setDate={handleActualReceivedDateChange}
                    placeholder="Select actual received date"
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
                              <SelectValue placeholder="--Delivery Location--" />
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

                {/* Row 2 */}
                <div>
                  <Label>Payment Methods*</Label>
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
                  <Label>Date*</Label>
                  <DatePicker
                    date={date}
                    setDate={setDate}
                    placeholder="Select date"
                    disabled={true}
                    required
                  />
                </div>

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
                  <Label>Invoice Date*</Label>
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

              {/* Row 3 - Textareas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label>PO Remarks</Label>
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <Textarea
                        placeholder="PO Remarks"
                        {...field}
                        disabled={isWithoutPo}
                      />
                    )}
                  />
                </div>

                <div>
                  <Label>Remarks</Label>
                  <FormField
                    control={form.control}
                    name="grnRemarks"
                    render={({ field }) => (
                      <Textarea placeholder="GRN Remarks" {...field} />
                    )}
                  />
                </div>
              </div>

              <div className="mb-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="return"
                    checked={isReturn}
                    onCheckedChange={(checked: boolean) => setIsReturn(checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="return">RETURN</Label>
                </div>

                {/* Product Details Table */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    Product Details
                  </h3>

                  <div className="border rounded-lg">
                    <Table wrapperClassName="max-h-[250px]">
                      <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead className="w-[50px] pr-4">Code</TableHead>
                          <TableHead className="w-[150px]">Name</TableHead>
                          <TableHead>Pur. Price</TableHead>
                          <TableHead>Pack Qty</TableHead>
                          <TableHead>Unit Qty</TableHead>
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
                              <TableCell className="text-right pr-4">
                                {product.prod_code}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
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
                                  onClick={() => editProduct(product.id)}
                                  className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700 mr-1"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => removeProduct(product.id)}
                                  className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
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
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2 items-end mb-4">
                    <div className="col-span-2 md:col-span-4 lg:col-span-4">
                      <Label>Product</Label>
                      <ProductSearch
                        ref={productSearchRef}
                        onValueChange={handleProductSelect}
                        value={product?.prod_code}
                        supplier={supplier}
                        disabled={!!editingProductId || !isSupplierSelected}
                      />
                    </div>

                    <div className="col-span-1">
                      <Label>Pur. Price</Label>
                      <Input
                        ref={purchasePriceRef}
                        name="purchase_price"
                        type="number"
                        value={newProduct.purchase_price}
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        disabled
                      />
                    </div>

                    <div className="col-span-1">
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
                        className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div className="col-span-1">
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
                        className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div className="col-span-1">
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
                      />
                    </div>

                    <div className="col-span-1">
                      <Label>Total Qty</Label>
                      <Input value={calculateTotalQty()} disabled />
                    </div>

                    <div className="col-span-1">
                      <Label>Amount</Label>
                      <Input
                        value={formatThousandSeparator(calculateAmount())}
                        disabled
                      />
                    </div>

                    <div className="col-span-1">
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
                      />
                    </div>

                    <div className="col-span-2 md:col-span-1 lg:col-span-1">
                      <Button
                        type="button"
                        className="w-full"
                        onClick={editingProductId ? saveProduct : addProduct}
                        disabled={isSubmittingProduct}
                      >
                        {isSubmittingProduct ? (
                          <>
                            <ClipLoader size={14} color="currentColor" />
                            {editingProductId ? "SAVING" : "ADDING"}
                          </>
                        ) : editingProductId ? (
                          "SAVE"
                        ) : (
                          "ADD"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="flex-1">
                      {product && (
                        <p className="text-xs text-muted-foreground">
                          Pack Size: {product.pack_size || "N/A"}
                          <br />
                          Unit: {newProduct.unit_name || "N/A"}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4">
                {/* Action Buttons */}
                {!isApplied && (
                  <div className="flex gap-2 justify-start mt-4 lg:mt-10 order-2 lg:order-1">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={loading || products.length === 0}
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

                {/* Summary Section */}
                <div className="flex justify-end order-1 lg:order-2">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3 w-full max-w-md">
                    <div className="flex items-center">
                      <Label className="w-24">Sub Total</Label>
                      <Input
                        value={formatThousandSeparator(summary.subTotal)}
                        disabled
                        className="flex-1 text-right"
                      />
                    </div>

                    <div className="flex items-center">
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
                        className="flex-1 text-right"
                        placeholder="0 or 0%"
                      />
                    </div>

                    <div className="flex items-center">
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
                        className="flex-1 text-right"
                        placeholder="0 or 0%"
                      />
                    </div>

                    <div className="flex items-center">
                      <Label className="w-24">Net Amount</Label>
                      <Input
                        value={formatThousandSeparator(summary.netAmount)}
                        disabled
                        className="flex-1 text-right font-semibold"
                      />
                    </div>
                  </div>
                </div>
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
