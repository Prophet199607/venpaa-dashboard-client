"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { number, z } from "zod";
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
import { SearchSelectHandle } from "@/components/ui/search-select";
import { SupplierSearch } from "@/components/shared/supplier-search";
import { UnsavedChangesModal } from "@/components/model/unsaved-dialog";
import { ConfirmationDialog } from "@/components/model/confirmation-dialog";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import {
  Package,
  Trash2,
  ArrowLeft,
  Pencil,
  ArrowLeftRight,
} from "lucide-react";
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

const transferGoodNoteSchema = z.object({
  location: z.string().min(1, "Location is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  transactionType: z.string().optional(),
  transactionDocNo: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof transferGoodNoteSchema>;

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

interface AppliedTransaction {
  doc_no: string;
}

interface TransactionCacheData {
  tgnNumber: string;
  transactionDocNo: string;
  location: string;
  timestamp: number;
  isTransactionLoaded: string;
}

function TransferGoodNoteFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const hasDataLoaded = useRef(false);
  const searchParams = useSearchParams();
  const skipUnsavedModal = useRef(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const freeQtyInputRef = useRef<HTMLInputElement>(null);
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const sellingPriceRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [isGrnSelected, setIsGrnSelected] = useState(false);
  const [isQtyDisabled, setIsQtyDisabled] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isGeneratingTgn, setIsGeneratingTgn] = useState(false);
  const [tempTgnNumber, setTempTgnNumber] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);
  const [isWithoutTransaction, setIsWithoutTransaction] = useState(false);
  const [showGrnConfirmDialog, setShowGrnConfirmDialog] = useState(false);
  const [isTransactionSelected, setIsTransactionSelected] = useState(false);
  const [unsavedSessions, setUnsavedSessions] = useState<SessionDetail[]>([]);
  const [selectedTransactionDocNo, setSelectedTransactionDocNo] =
    useState<string>("");
  const [isProductsLoadedFromTransaction, setIsProductsLoadedFromTransaction] =
    useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [appliedTransactions, setAppliedTransactions] = useState<
    AppliedTransaction[]
  >([]);
  const [selectedTransactionType, setSelectedTransactionType] =
    useState<string>("");

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
    resolver: zodResolver(transferGoodNoteSchema),
    defaultValues: {
      location: "",
      deliveryLocation: "",
      transactionDocNo: "",
      transactionType: "",
      remarks: "",
    },
  });

  const watchedLocation = form.watch("location");

  const [newProduct, setNewProduct] = useState({
    prod_name: "",
    unit_name: "",
    unit_type: null as "WHOLE" | "DEC" | null,
    purchase_price: 0,
    selling_price: 0,
    pack_size: 0,
    pack_qty: 0,
    unit_qty: 0,
    total_qty: 0,
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

      const tgnCacheKey = "transaction_tgn_session";
      const tgnSessionData = sessionStorage.getItem(tgnCacheKey);

      if (tgnSessionData) {
        try {
          const tgnData: TransactionCacheData = JSON.parse(tgnSessionData);

          if (tgnData) {
            try {
              await api.post(`/transactions/unsave/${tgnData.tgnNumber}`);

              console.log(
                "Cleaned up transaction loaded session:",
                tgnData.tgnNumber
              );

              sessionStorage.removeItem(tgnCacheKey);
              sessionStorage.removeItem(
                `skip_unsaved_modal_${tgnData.tgnNumber}`
              );

              if (tempTgnNumber === tgnData.tgnNumber) {
                setTempTgnNumber("");
                setProducts([]);
                resetProductForm();
              }
            } catch (error) {
              console.error("Failed to cleanup transaction session:", error);
            }
          }
        } catch (error) {
          console.error("Error parsing transaction session data:", error);
          sessionStorage.removeItem(tgnCacheKey);
        }
      }

      try {
        const { data: res } = await api.get(
          "/transfer-good-notes/unsaved-sessions"
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

            setIsWithoutTransaction(true);
            form.setValue("transactionDocNo", "Without Transactioin");
          }
        }
      } catch (error) {
        console.error("Failed to check for unsaved sessions:", error);
      }
    };

    if (!skipUnsavedModal.current) {
      checkUnsavedSessions();
    }
  }, [
    fetchLocations,
    toast,
    isEditMode,
    tempTgnNumber,
    form,
    setIsWithoutTransaction,
  ]);

  useEffect(() => {
    if (tempTgnNumber && !isEditMode) {
      const shouldSkip =
        sessionStorage.getItem(`skip_unsaved_modal_${tempTgnNumber}`) ===
        "true";
      if (shouldSkip) {
        skipUnsavedModal.current = true;
      }
    }
  }, [tempTgnNumber, isEditMode]);

  useEffect(() => {
    return () => {
      if (!skipUnsavedModal.current && tempTgnNumber) {
        sessionStorage.removeItem(`skip_unsaved_modal_${tempTgnNumber}`);
      }
    };
  }, [tempTgnNumber]);

  const handleDeliveryLocationChange = (value: string) => {
    form.setValue("deliveryLocation", value);
  };

  const handleLocationChange = (locaCode: string) => {
    form.setValue("location", locaCode);

    if (!locaCode) {
      setHasLoaded(false);
      setTempTgnNumber("");
      return;
    }

    if (unsavedSessions.length === 0 && !isEditMode) {
      setHasLoaded(true);
      generateTgnNumber("TempTGN", locaCode, false);
    }
    handleDeliveryLocationChange(locaCode);
  };

  const generateTgnNumber = useCallback(
    async (
      type: string,
      locaCode: string,
      setFetchingState = true
    ): Promise<string> => {
      try {
        setIsGeneratingTgn(true);
        if (setFetchingState) {
          setFetching(true);
        }

        const { data: res } = await api.get(
          `/transactions/generate-code/${type}/${locaCode}`
        );

        if (res.success && res.code) {
          setTempTgnNumber(res.code);
          return res.code;
        }
        throw new Error("Failed to generate document number.");
      } catch (error: any) {
        console.error("Failed to generate Tgn number:", error);
        toast({
          title: "Error",
          description: "Failed to generate document number.",
          type: "error",
        });
        throw error;
      } finally {
        setIsGeneratingTgn(false);
        if (setFetchingState) {
          setFetching(false);
        }
      }
    },
    [toast]
  );

  const fetchAppliedTransactions = useCallback(
    async (iid: string, location: string) => {
      if (!iid || !location) {
        setAppliedTransactions([]);
        return;
      }

      try {
        setFetching(true);

        const { data: res } = await api.get("/transfer-good-notes/applied", {
          params: {
            iid: iid,
            location: location,
            exclude_iid: "TGN",
          },
        });

        if (res.success) {
          setAppliedTransactions(res.data);
        } else {
          setAppliedTransactions([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch applied transactions:", err);
        setAppliedTransactions([]);
        toast({
          title: "Warning",
          description: "Could not load available transactions",
          type: "warning",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast]
  );

  const handleTransactionTypeChange = (value: string) => {
    setSelectedTransactionType(value);
    form.setValue("transactionType", value);

    form.setValue("transactionDocNo", "");
    setSelectedTransactionDocNo("");

    const location = form.getValues("location");
    if (location && value) {
      fetchAppliedTransactions(value, location);
    } else {
      setAppliedTransactions([]);
    }
  };

  const handleTransactionChange = (docNo: string) => {
    form.setValue("transactionDocNo", docNo);
    setSelectedTransactionDocNo(docNo);

    const selectedTransaction = appliedTransactions.find(
      (t) => t.doc_no === docNo
    );
    if (selectedTransaction) {
      loadProductsFromTransaction(docNo);
    }
  };

  useEffect(() => {
    if (!isEditMode || hasDataLoaded.current) return;

    const docNo = searchParams.get("doc_no");
    const status = searchParams.get("status");
    const iid = searchParams.get("iid");

    if (!docNo || !status || !iid) return;

    const loadTransferGoodNote = async () => {
      hasDataLoaded.current = true;

      try {
        setFetching(true);

        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`
        );

        if (res.success) {
          const tgnData = res.data;
          setTempTgnNumber(tgnData.doc_no);

          const locationCode = tgnData.location?.loca_code || tgnData.location;
          form.setValue("location", locationCode);

          form.setValue("remarks", tgnData.ref_remarks || "");

          setDate(new Date(tgnData.document_date));

          const productDetails =
            tgnData.temp_transaction_details ||
            tgnData.transaction_details ||
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
        }
      } catch (error) {
        console.error("Failed to load transfer good note:", error);
      } finally {
        setFetching(false);
      }
    };

    loadTransferGoodNote();
  }, [isEditMode, form, searchParams]);

  useEffect(() => {
    if (
      showUnsavedModal ||
      !tempTgnNumber ||
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
          `/transactions/temp-products/${tempTgnNumber}`
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
    tempTgnNumber,
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
    if (watchedLocation && selectedTransactionType) {
      fetchAppliedTransactions(selectedTransactionType, watchedLocation);
    } else {
      setAppliedTransactions([]);
    }
  }, [watchedLocation, selectedTransactionType, fetchAppliedTransactions]);

  const loadProductsFromTransaction = async (docNo: string) => {
    try {
      setLoading(true);
      setFetching(true);

      if (products.length > 0) {
        await api.post(`/transactions/unsave/${tempTgnNumber}`);
      }

      const { data: res } = await api.get(
        `/transactions/load-transaction-by-code/${docNo}/applied/${selectedTransactionType}`
      );

      if (res.success && res.data) {
        const transactionData = res.data;
        const locationCode =
          transactionData.location?.loca_code || transactionData.location;

        let generatedTgnNumber = tempTgnNumber;

        form.setValue("location", locationCode);
        const deliveryLocationCode =
          transactionData.delivery_location?.loca_code ||
          transactionData.delivery_location;
        form.setValue("deliveryLocation", deliveryLocationCode);

        if (transactionData.document_date) {
          setDate(new Date(transactionData.document_date));
        }

        const productDetails = transactionData.transaction_details || [];

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
        setIsTransactionSelected(true);

        if (docNo) {
          setIsProductsLoadedFromTransaction(true);
          setProduct(productsWithUnits);

          for (const product of productsWithUnits) {
            try {
              const shouldConvertToInt = product.unit?.unit_type === "WHOLE";

              const payload = {
                doc_no: generatedTgnNumber,
                iid: "TGN",
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
                total_qty: shouldConvertToInt
                  ? Math.floor(product.total_qty)
                  : product.total_qty,
                amount: product.amount || 0,
              };

              await api.post("/transfer-good-notes/add-product", payload);
            } catch (error: any) {
              console.error(
                `Failed to add product ${product.prod_code}:`,
                error.response?.data || error.message
              );
            }
          }

          const response = await api.get(
            `/transactions/temp-products/${generatedTgnNumber}`
          );
          if (response.data.success) {
            setProducts(response.data.data);
          }
        } else {
          setIsProductsLoadedFromTransaction(false);
          setProducts([]);
          setTimeout(() => {
            productSearchRef.current?.openAndFocus();
          }, 100);
        }

        const transactionSessionData: TransactionCacheData = {
          tgnNumber: generatedTgnNumber,
          transactionDocNo: selectedTransactionDocNo,
          location: locationCode,
          timestamp: Date.now(),
          isTransactionLoaded: docNo,
        };

        sessionStorage.setItem(
          "transaction_tgn_session",
          JSON.stringify(transactionSessionData)
        );
        skipUnsavedModal.current = true;
        sessionStorage.setItem(
          `skip_unsaved_modal_${generatedTgnNumber}`,
          "true"
        );

        toast({
          title: "Success",
          description: `Loaded ${productsWithUnits.length} product(s) from ${docNo}`,
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Error in fetching transaction details:", error);
      toast({
        title: "Error fetching transaction details",
        description: error.message || "Could not load transaction data.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleProductSelect = (selectedProduct: any) => {
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
        case "selling_price":
          if (product) {
            purchasePriceRef.current?.focus();
          }
          break;
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
          if (newProduct.pack_qty > 0) {
            if (editingProductId) {
              saveProduct();
            } else {
              addProduct();
            }
          }
          break;
      }
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isQtyField = ["pack_qty", "unit_qty"].includes(name);

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

    const amount = purchasePrice * totalQty;
    return Math.max(0, amount);
  };

  const calculateSubtotal = useCallback((): number => {
    return products.reduce((total, product) => {
      const lineAmount = Number(product.amount) || 0;
      return total + lineAmount;
    }, 0);
  }, [products]);

  useEffect(() => {
    setTotalAmount(calculateSubtotal());
  }, [products, calculateSubtotal]);

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
      doc_no: tempTgnNumber,
      iid: "TGN",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
      pack_qty: Number(newProduct.pack_qty) || 0,
      unit_qty: Number(newProduct.unit_qty) || 0,
      total_qty: totalQty,
      amount: amount,
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.post(
        "/transfer-good-notes/add-product",
        payload
      );

      if (response.data.success) {
        setProducts(response.data.data);
        resetProductForm();
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
      doc_no: tempTgnNumber,
      iid: "TGN",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
      pack_qty: Number(newProduct.pack_qty) || 0,
      unit_qty: Number(newProduct.unit_qty) || 0,
      total_qty: totalQty,
      amount: amount,
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.put(
        `/transfer-good-notes/update-product/${editingProductId}`,
        payload
      );

      if (response.data.success) {
        setProducts(response.data.data);
        resetProductForm();
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
      selling_price: productToEdit.selling_price,
      purchase_price: productToEdit.purchase_price,
      pack_size: Number(productToEdit.pack_size),
      pack_qty: Number(productToEdit.pack_qty),
      unit_qty: Number(productToEdit.unit_qty),
      total_qty: productToEdit.total_qty,
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
        `/transactions/delete-detail/${tempTgnNumber}/${productToRemove.line_no}`
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

  const handleResumeSession = async (session: SessionDetail) => {
    const { doc_no, location } = session;

    setTempTgnNumber(doc_no);

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
        setTempTgnNumber("");
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
    setTempTgnNumber("");
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
      delivery_location: values.deliveryLocation,

      remarks_ref: values.remarks,

      doc_no: tempTgnNumber,
      iid: "TGN",

      document_date: formatDateForAPI(date),

      recall_doc_no:
        values.transactionDocNo && values.transactionDocNo.trim() !== ""
          ? values.transactionDocNo
          : "Without Transaction",

      subtotal: totalAmount,
      net_total: totalAmount,
    };
    return payload;
  };

  const handleCreateDraftTgn = async (values: FormData) => {
    const payload = getPayload(values);

    setLoading(true);
    try {
      const response = await api.post("/transactions/draft", payload);
      if (response.data.success) {
        if (tempTgnNumber) {
          sessionStorage.removeItem(`skip_unsaved_modal_${tempTgnNumber}`);
        }

        toast({
          title: "Success",
          description: "Transfer good note has been drafted successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/transfer-good-note");
      }
    } catch (error: any) {
      console.error("Failed to draft TGN:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not draft the TGN.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDraftTgn: (values: FormData) => Promise<void> = async (
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
          description: "Transfer good note has been updated successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/transfer-good-note");
      }
    } catch (error: any) {
      console.error("Failed to update TGN:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not update the TGN.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values: FormData) => {
    if (isEditMode) {
      handleUpdateDraftTgn(values);
    } else {
      handleCreateDraftTgn(values);
    }
  };

  const resetProductForm = () => {
    setNewProduct({
      prod_name: "",
      unit_name: "",
      unit_type: null,
      selling_price: 0,
      purchase_price: 0,
      pack_size: 0,
      pack_qty: 0,
      unit_qty: 0,
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
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6" />
          <h1 className="text-xl font-semibold">
            {isEditMode
              ? "Edit Transfer of Goods Note"
              : "New Transfer of Goods Note"}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            router.push("/dashboard/transactions/transfer-good-note")
          }
          className="flex items-center gap-1 px-2 py-1 text-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>
      <div className="flex justify-end">
        <Badge variant="secondary" className="px-2 py-1 text-sm h-6">
          <div className="flex items-center gap-2">
            <span>Document No:</span>
            {isGeneratingTgn && <ClipLoader className="h-2 w-2 animate-spin" />}
            {!isGeneratingTgn && <span>{tempTgnNumber || "..."}</span>}
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
                          disabled={isEditMode || isTransactionSelected}
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
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <Select
                          onValueChange={handleTransactionTypeChange}
                          value={field.value}
                          disabled={!watchedLocation || isEditMode}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="--Select Transaction Type--" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GRN">GRN</SelectItem>
                            <SelectItem value="AGN">AGN</SelectItem>
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
                    name="transactionDocNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Document Number</FormLabel>
                        <Select
                          onValueChange={handleTransactionChange}
                          value={field.value}
                          disabled={
                            !selectedTransactionType ||
                            !watchedLocation ||
                            isEditMode
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  appliedTransactions.length === 0
                                    ? "No documents available"
                                    : "--Choose Document--"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appliedTransactions.map((transaction) => (
                              <SelectItem
                                key={transaction.doc_no}
                                value={transaction.doc_no}
                              >
                                {transaction.doc_no}
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

                {/* Row 2 */}
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
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Remarks" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="invoice return">
                              Invoice Return
                            </SelectItem>
                            <SelectItem value="non moving">
                              Non Moving
                            </SelectItem>
                            <SelectItem value="normal transfer">
                              Normal Transfer
                            </SelectItem>
                            <SelectItem value="over stock">
                              Over Stock
                            </SelectItem>
                            <SelectItem value="stain mark">
                              Stain Mark
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <TableHead>Selling Price</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Pack Size</TableHead>
                        <TableHead>Pack Qty</TableHead>
                        <TableHead>Unit Qty</TableHead>
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
                              {formatThousandSeparator(product.selling_price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatThousandSeparator(product.purchase_price)}
                            </TableCell>
                            <TableCell className="text-center">
                              {Number(product.pack_size)}
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
                            {formatThousandSeparator(calculateSubtotal())}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </div>

              {/* Add Product Section */}
              {!isApplied && (
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex gap-2 items-end overflow-x-auto pb-2 w-full">
                    <div className="w-72 ml-1">
                      <Label>Product</Label>
                      <BasicProductSearch
                        ref={productSearchRef}
                        onValueChange={handleProductSelect}
                        value={product?.prod_code}
                        disabled={!!editingProductId}
                      />
                    </div>
                    <div className="w-28">
                      <Label>Selling Price</Label>
                      <Input
                        ref={sellingPriceRef}
                        name="selling_price"
                        type="number"
                        value={newProduct.selling_price}
                        onChange={handleProductChange}
                        onKeyDown={handleKeyDown}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        className="text-sm"
                        disabled
                      />
                    </div>
                    <div className="w-28">
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
                    <div className="w-28">
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
                    <div className="w-28">
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
                    <div className="w-28">
                      <Label>Amount</Label>
                      <Input
                        value={formatThousandSeparator(calculateAmount())}
                        disabled
                        className="text-sm"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
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
                          onClick={editingProductId ? saveProduct : addProduct}
                          disabled={isSubmittingProduct}
                          size="sm"
                          className="w-20 h-9"
                        >
                          {editingProductId ? "SAVE" : "ADD"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {product && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        Pack Size: {product.pack_size || "N/A"}
                        <br />
                        Unit: {newProduct.unit_name || "N/A"}
                      </span>
                      <span>
                        Current Pack Qty: {newProduct.pack_qty || "N/A"}
                        <br />
                        Current Unit Qty: {newProduct.unit_qty || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons and Total Amount */}
              <div className="flex items-center justify-between mt-8">
                {!isApplied && (
                  <div className="flex gap-4 mt-8">
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
                        : "DRAFT TGN"}
                    </Button>
                    <Button
                      type="button"
                      disabled={loading || products.length === 0}
                      // onClick={handleApplyTransferGoodsNote}
                    >
                      APPLY TGN
                    </Button>
                  </div>
                )}
                <div className="text-lg font-semibold">
                  Total Amount: {formatThousandSeparator(calculateSubtotal())}
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
        transactionType="Transfer Good Note"
        iid="TGN"
      />
    </div>
  );
}

export default function TransferGoodNoteForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransferGoodNoteFormContent />
    </Suspense>
  );
}
