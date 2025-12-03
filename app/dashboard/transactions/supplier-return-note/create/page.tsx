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
import { ConfirmationDialog } from "@/components/model/confirmation-dialog";
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
  grnAmount: z.string().optional(),
  recallDocNo: z.string().optional(),
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

interface GRNCacheData {
  srnNumber: string;
  grnDocNo: string;
  location: string;
  supplier: string;
  timestamp: number;
  isGrnLoaded: boolean;
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
  const freeQtyInputRef = useRef<HTMLInputElement>(null);
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [isWithoutGrn, setIsWithoutGrn] = useState(false);
  const [isGrnSelected, setIsGrnSelected] = useState(false);
  const [isQtyDisabled, setIsQtyDisabled] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isGeneratingSrn, setIsGeneratingSrn] = useState(false);
  const [tempSrnNumber, setTempSrnNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [forcedWithoutGrn, setForcedWithoutGrn] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [appliedGRNs, setAppliedGRNs] = useState<AppliedGRN[]>([]);
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [grnProducts, setGrnProducts] = useState<ProductItem[]>([]);
  const [isSupplierSelected, setIsSupplierSelected] = useState(false);
  const [grnProductCodes, setGrnProductCodes] = useState<string[]>([]);
  const [selectedGrnDocNo, setSelectedGrnDocNo] = useState<string>("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);
  const [showGrnConfirmDialog, setShowGrnConfirmDialog] = useState(false);
  const [unsavedSessions, setUnsavedSessions] = useState<SessionDetail[]>([]);
  const [isProductsLoadedFromGrn, setIsProductsLoadedFromGrn] = useState(false);
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
      recallDocNo: "",
      grnAmount: "",
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

    const checkUnsavedSessions = async () => {
      if (isEditMode) {
        return;
      }

      const grnCacheKey = `grn_srn_session`;
      const srnSessionData = sessionStorage.getItem(grnCacheKey);

      if (srnSessionData) {
        try {
          const srnData: GRNCacheData = JSON.parse(srnSessionData);

          if (srnData) {
            try {
              await api.delete(
                `/supplier-return-notes/cleanup-srn/${srnData.srnNumber}`
              );

              console.log("Cleaned up GRN-loaded session:", srnData.srnNumber);

              sessionStorage.removeItem(grnCacheKey);
              sessionStorage.removeItem(
                `skip_unsaved_modal_${srnData.srnNumber}`
              );

              if (tempSrnNumber === srnData.srnNumber) {
                setTempSrnNumber("");
                setProducts([]);
                resetProductForm();
              }
            } catch (error) {
              console.error("Failed to cleanup srnData session:", error);
            }
          }
        } catch (error) {
          console.error("Error parsing GRN session data:", error);
          sessionStorage.removeItem(grnCacheKey);
        }
      }

      try {
        const { data: res } = await api.get(
          "/supplier-return-notes/unsaved-sessions"
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

            setForcedWithoutGrn(true);
            form.setValue("recallDocNo", "Without Grn");
          }
        }
      } catch (error) {
        console.error("Failed to check for unsaved sessions:", error);
      }
    };

    if (!skipUnsavedModal.current) {
      checkUnsavedSessions();
    }
  }, [fetchLocations, toast, isEditMode, tempSrnNumber, form]);

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
  };

  const handleSupplierChange = (value: string) => {
    form.setValue("supplier", value);
    setSupplier(value);
    setIsSupplierSelected(!!value);
    fetchFilteredAppliedGRNs("GRN", form.getValues("location"), value);

    setProduct(null);
    resetProductForm();
  };

  const generateSrnNumber = useCallback(
    async (
      type: string,
      locaCode: string,
      setFetchingState = true
    ): Promise<string> => {
      try {
        setIsGeneratingSrn(true);
        if (setFetchingState) {
          setFetching(true);
        }

        const { data: res } = await api.get(
          `/transactions/generate-code/${type}/${locaCode}`
        );

        if (res.success && res.code) {
          setTempSrnNumber(res.code);
          return res.code;
        }
        throw new Error("Failed to generate document number.");
      } catch (error: any) {
        console.error("Failed to generate SRN number:", error);
        toast({
          title: "Error",
          description: "Failed to generate document number.",
          type: "error",
        });
        throw error;
      } finally {
        setIsGeneratingSrn(false);
        if (setFetchingState) {
          setFetching(false);
        }
      }
    },
    [toast]
  );

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

  const handleGrnChange = (docNo: string) => {
    if (!docNo) return;

    setSelectedGrnDocNo(docNo);
    setShowGrnConfirmDialog(true);
  };

  const handleConfirmGrnLoad = async (loadAllProducts: boolean) => {
    try {
      setLoading(true);
      setShowGrnConfirmDialog(false);

      const { data: res } = await api.get(
        `/transactions/load-transaction-by-code/${selectedGrnDocNo}/applied/GRN`
      );

      if (res.success && res.data) {
        const grnData = res.data;
        const locationCode = grnData.location?.loca_code || grnData.location;

        let generatedSrnNumber = tempSrnNumber;

        if (
          !generatedSrnNumber ||
          form.getValues("location") !== locationCode
        ) {
          generatedSrnNumber = await generateSrnNumber(
            "TempSRN",
            locationCode,
            false
          );

          if (!generatedSrnNumber) {
            throw new Error("Failed to generate SRN number");
          }

          setTempSrnNumber(generatedSrnNumber);
        }

        form.setValue("location", locationCode);
        form.setValue("supplier", grnData.supplier_code);
        setSupplier(grnData.supplier_code);
        setIsSupplierSelected(true);

        form.setValue("recallDocNo", grnData.doc_no || "");
        form.setValue("grnAmount", grnData.net_total || 0);

        if (grnData.document_date) {
          setDate(new Date(grnData.document_date));
        }

        const productDetails = grnData.transaction_details || [];

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

        setGrnProducts(productsWithUnits);
        const productCodes = productsWithUnits.map((p: any) => p.prod_code);
        setGrnProductCodes(productCodes);

        setIsGrnSelected(true);

        if (loadAllProducts) {
          setIsProductsLoadedFromGrn(true);
          setProducts(productsWithUnits);
          setSummary({
            subTotal: parseFloat(grnData.subtotal) || 0,
            discountPercent: parseFloat(grnData.dis_per) || 0,
            discountValue: parseFloat(grnData.discount) || 0,
            taxPercent: parseFloat(grnData.tax_per) || 0,
            taxValue: parseFloat(grnData.tax) || 0,
            netAmount: parseFloat(grnData.net_total) || 0,
          });

          for (const product of productsWithUnits) {
            try {
              const shouldConvertToInt = product.unit?.unit_type === "WHOLE";

              const payload = {
                doc_no: generatedSrnNumber,
                iid: "SRN",
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
                line_wise_discount_value:
                  product.line_wise_discount_value || "0",
              };

              await api.post("/transactions/add-product", payload);
            } catch (error: any) {
              console.error(
                `Failed to add product ${product.prod_code}:`,
                error.response?.data || error.message
              );
            }
          }

          const response = await api.get(
            `/transactions/temp-products/${generatedSrnNumber}`
          );
          if (response.data.success) {
            setProducts(response.data.data);
          }
        } else {
          setIsProductsLoadedFromGrn(false);
          setProducts([]);
          setSummary({
            subTotal: 0,
            discountPercent: 0,
            discountValue: 0,
            taxPercent: 0,
            taxValue: 0,
            netAmount: 0,
          });
          setTimeout(() => {
            productSearchRef.current?.openAndFocus();
          }, 100);
        }

        const grnSessionData: GRNCacheData = {
          srnNumber: generatedSrnNumber,
          grnDocNo: selectedGrnDocNo,
          location: locationCode,
          supplier: grnData.supplier_code,
          timestamp: Date.now(),
          isGrnLoaded: loadAllProducts,
        };

        sessionStorage.setItem(
          "grn_srn_session",
          JSON.stringify(grnSessionData)
        );
        skipUnsavedModal.current = true;
        sessionStorage.setItem(
          `skip_unsaved_modal_${generatedSrnNumber}`,
          "true"
        );

        toast({
          title: loadAllProducts ? "Products Loaded" : "GRN Selected",
          description: loadAllProducts
            ? "All products from GRN have been loaded successfully."
            : "You can now add products manually from this GRN.",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Error in handleConfirmGrnLoad:", error);
      toast({
        title: "Error fetching GRN details",
        description: error.message || "Could not load GRN data.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualGrnLoad = () => {
    setShowGrnConfirmDialog(false);
    handleConfirmGrnLoad(false);
  };

  const handleCancelGrnSelection = () => {
    setShowGrnConfirmDialog(false);
    setSelectedGrnDocNo("");
    setGrnProducts([]);
    setGrnProductCodes([]);
    setIsGrnSelected(false);
    setIsProductsLoadedFromGrn(false);
    if (!isGrnSelected) {
      form.resetField("recallDocNo");
    }
  };

  useEffect(() => {
    if (!isEditMode || hasDataLoaded.current) return;

    const docNo = searchParams.get("doc_no");
    const status = searchParams.get("status");
    const iid = searchParams.get("iid");

    if (!docNo || !status || !iid) return;

    const loadSupplierReturnNote = async () => {
      hasDataLoaded.current = true;

      try {
        setFetching(true);

        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`
        );

        if (res.success) {
          const srnData = res.data;
          setTempSrnNumber(srnData.doc_no);

          const locationCode = srnData.location?.loca_code || srnData.location;
          form.setValue("location", locationCode);

          form.setValue("supplier", srnData.supplier_code);
          setSupplier(srnData.supplier_code);
          setIsSupplierSelected(true);

          form.setValue("recallDocNo", srnData.recall_doc_no || "");

          await fetchFilteredAppliedGRNs(
            srnData.location,
            srnData.supplier_code,
            srnData.iid
          );
          if (srnData.recall_doc_no) {
            setAppliedGRNs((prev) => {
              const exists = prev.some(
                (grn) => grn.doc_no === srnData.recall_doc_no
              );
              return exists
                ? prev
                : [...prev, { doc_no: srnData.recall_doc_no, sup_name: "" }];
            });
          }

          form.setValue("grnAmount", srnData.net_total || "");
          form.setValue("srnRemarks", srnData.srn_remarks || "");

          setDate(new Date(srnData.document_date));

          const productDetails =
            srnData.temp_transaction_details ||
            srnData.transaction_details ||
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
            subTotal: parseFloat(srnData.subtotal) || 0,
            discountPercent: parseFloat(srnData.dis_per) || 0,
            discountValue: parseFloat(srnData.discount) || 0,
            taxPercent: parseFloat(srnData.tax_per) || 0,
            taxValue: parseFloat(srnData.tax) || 0,
            netAmount: parseFloat(srnData.net_total) || 0,
          });
        }
      } catch (error) {
        console.error("Failed to load supplier return note:", error);
      } finally {
        setFetching(false);
      }
    };

    loadSupplierReturnNote();
  }, [isEditMode, form, searchParams, fetchFilteredAppliedGRNs]);

  useEffect(() => {
    if (
      showUnsavedModal ||
      !tempSrnNumber ||
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
          `/transactions/temp-products/${tempSrnNumber}`
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
    tempSrnNumber,
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

    const grnDataJson = sessionStorage.getItem("grn_data_for_srn");
    if (!grnDataJson) return;

    const loadGRNDataForSrn = async () => {
      try {
        const grnData = JSON.parse(grnDataJson);
        sessionStorage.removeItem("grn_data_for_srn");
        setFetching(true);

        const locationCode = grnData.location;

        if (!locationCode) {
          throw new Error("Location code is missing in GRN data");
        }

        console.log("Generating SRN number for location:", locationCode);
        const generatedSrnNumber = await generateSrnNumber(
          "TempSRN",
          locationCode,
          false
        );

        if (!generatedSrnNumber) {
          throw new Error("Failed to generate SRN number");
        }

        console.log("Generated SRN number:", generatedSrnNumber);

        form.setValue("location", locationCode);

        form.setValue("supplier", grnData.supplier);
        setSupplier(grnData.supplier);
        setIsSupplierSelected(true);

        await fetchFilteredAppliedGRNs("GRN", locationCode, grnData.supplier);

        if (grnData.po_doc_no) {
          setTimeout(() => {
            form.setValue("recallDocNo", grnData.grn_doc_no);
          }, 100);
        }

        if (grnData.document_date) {
          setDate(new Date(grnData.document_date));
        }

        form.setValue("srnRemarks", grnData.srn_remarks || "");

        if (grnData.products && grnData.products.length > 0) {
          console.log(
            `Adding ${grnData.products.length} products to temp table`
          );

          for (const product of grnData.products) {
            try {
              const shouldConvertToInt = product.unit?.unit_type === "WHOLE";

              const payload = {
                doc_no: generatedSrnNumber,
                iid: "SRN",
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
                generatedSrnNumber
              );
              await api.post("/transactions/add-product", payload);
            } catch (error: any) {
              console.error(
                `Failed to add product ${product.prod_code}:`,
                error.response?.data || error.message
              );
            }
          }

          const response = await api.get(
            `/transactions/temp-products/${generatedSrnNumber}`
          );
          if (response.data.success) {
            setProducts(response.data.data);
          }
        }

        if (grnData.summary) {
          setSummary(grnData.summary);
        }

        setHasLoaded(true);
        skipUnsavedModal.current = true;

        toast({
          title: "GRN Data Loaded",
          description: "Good receive note data has been loaded successfully.",
          type: "success",
        });
      } catch (error: any) {
        console.error("Failed to load PO data:", error);
        toast({
          title: "Error",
          description: `Failed to load Good receive note data: ${error.message}`,
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    };

    loadGRNDataForSrn();
  }, [
    isEditMode,
    form,
    toast,
    fetchFilteredAppliedGRNs,
    generateSrnNumber,
    locations,
  ]);

  const handleProductSelect = (selectedProduct: any) => {
    if (selectedProduct) {
      if (isGrnSelected && !isProductsLoadedFromGrn && grnProducts.length > 0) {
        const isProductInGrn = grnProducts.some(
          (p) => p.prod_code === selectedProduct.prod_code
        );
        if (!isProductInGrn) {
          toast({
            title: "Product Not Allowed",
            description: "This product is not in the selected GRN.",
            type: "error",
          });
          productSearchRef.current?.clear();
          return;
        }
      }

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

  const addProduct = async () => {
    if (!product) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const payload = {
      doc_no: tempSrnNumber,
      iid: "SRN",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
      pack_qty: Number(newProduct.pack_qty) || 0,
      unit_qty: Number(newProduct.unit_qty) || 0,
      free_qty: Number(newProduct.free_qty) || 0,
      total_qty: totalQty,
      amount: amount,
      line_wise_discount_value:
        typeof newProduct.line_wise_discount_value === "string" &&
        newProduct.line_wise_discount_value.endsWith("%")
          ? newProduct.line_wise_discount_value
          : newProduct.line_wise_discount_value,
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
      doc_no: tempSrnNumber,
      iid: "SRN",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
      pack_qty: Number(newProduct.pack_qty) || 0,
      unit_qty: Number(newProduct.unit_qty) || 0,
      free_qty: Number(newProduct.free_qty) || 0,
      total_qty: totalQty,
      amount: amount,
      line_wise_discount_value:
        typeof newProduct.line_wise_discount_value === "string" &&
        newProduct.line_wise_discount_value.endsWith("%")
          ? newProduct.line_wise_discount_value
          : newProduct.line_wise_discount_value,
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
        `/transactions/delete-detail/${tempSrnNumber}/${productToRemove.line_no}`
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

    setTempSrnNumber(doc_no);

    if (location) {
      form.setValue("location", location.loca_code);
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
        setTempSrnNumber("");
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
    setTempSrnNumber("");
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
      handleUpdateDraftSrn(values);
    } else {
      handleCreateDraftSrn(values);
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

      srn_remarks: values.srnRemarks,

      doc_no: tempSrnNumber,
      iid: "SRN",

      document_date: formatDateForAPI(date),

      recall_doc_no:
        values.recallDocNo && values.recallDocNo.trim() !== ""
          ? values.recallDocNo
          : "Without Grn",

      subtotal: summary.subTotal,
      net_total: summary.netAmount,
      discount: summary.discountPercent > 0 ? 0 : summary.discountValue,
      dis_per: summary.discountPercent > 0 ? summary.discountPercent : 0,
      tax: summary.taxPercent > 0 ? 0 : summary.taxValue,
      tax_per: summary.taxPercent > 0 ? summary.taxPercent : 0,
    };
    return payload;
  };

  const handleCreateDraftSrn = async (values: FormData) => {
    const payload = getPayload(values);

    setLoading(true);
    try {
      const response = await api.post("/transactions/draft", payload);
      if (response.data.success) {
        if (tempSrnNumber) {
          sessionStorage.removeItem(`skip_unsaved_modal_${tempSrnNumber}`);
        }

        toast({
          title: "Success",
          description: "Supplier return note has been drafted successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/supplier-return-note");
      }
    } catch (error: any) {
      console.error("Failed to draft SRN:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not draft the SRN.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDraftSrn: (values: FormData) => Promise<void> = async (
    values
  ) => {
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
          description: "Supplier return note has been updated successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/supplier-return-note");
      }
    } catch (error: any) {
      console.error("Failed to update SRN:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not update the SRN.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplySupplierReturnNote = async () => {
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
      const response = await api.post(
        "/supplier-return-notes/save-srn",
        payload
      );
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Supplier return note has been applied successfully.",
          type: "success",
        });
        const newDocNo = response.data.data.doc_no;
        setTimeout(() => {
          router.push(
            `/dashboard/transactions/supplier-return-note?tab=applied&view_doc_no=${newDocNo}`
          );
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not apply the SRN.",
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
                          onValueChange={handleGrnChange}
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
                    name="grnAmount"
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
                                {!isProductsLoadedFromGrn && (
                                  <>
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
                                  </>
                                )}
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
              {!isApplied && !isProductsLoadedFromGrn && (
                <>
                  <div className="flex gap-2 items-end mb-4 overflow-x-auto pb-2">
                    <div className="w-72 ml-1">
                      <Label>Product</Label>
                      <ProductSearch
                        ref={productSearchRef}
                        onValueChange={handleProductSelect}
                        value={product?.prod_code}
                        supplier={supplier}
                        disabled={
                          !!editingProductId ||
                          !isSupplierSelected ||
                          isProductsLoadedFromGrn
                        }
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
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        sessions={unsavedSessions}
        onContinue={handleResumeSession}
        onDiscardAll={handleDiscardAllSessions}
        onDiscardSelected={handleDiscardSelectedSession}
        transactionType="Supplier Return Note"
        iid="SRN"
      />
      {/* GRN Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showGrnConfirmDialog}
        onClose={handleCancelGrnSelection}
        onConfirm={() => handleConfirmGrnLoad(true)}
        onCancel={handleManualGrnLoad}
        title="Load All GRN Products?"
        description="Do you want to load all products from GRN? Click 'Yes' to load all products. Click 'No' to manually add products."
        confirmText="Yes, Load All"
        cancelText="No, Add Manually"
        variant="default"
      />
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
