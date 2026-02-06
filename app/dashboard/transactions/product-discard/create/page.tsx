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
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PackageX, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { SearchSelectHandle } from "@/components/ui/search-select";
import { UnsavedChangesModal } from "@/components/model/unsaved-dialog";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
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
  discardType: z.string().min(1, "Discard type is required"),
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
  selling_price: number;
  pack_qty: number;
  unit_qty: number;
  unit_name: string;
  unit: {
    unit_type: "WHOLE" | "DEC" | null;
  };
}

interface DiscardType {
  id: number;
  type_name: string;
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

function ProductDiscardFormContent() {
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
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const [isQtyDisabled, setIsQtyDisabled] = useState(false);
  const [discardType, setDiscardType] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isGeneratingPd, setIsGeneratingPd] = useState(false);
  const [tempPdNumber, setTempPdNumber] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [discardTypes, setDiscardTypes] = useState<DiscardType[]>([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);
  const [unsavedSessions, setUnsavedSessions] = useState<SessionDetail[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [currentStock, setCurrentStock] = useState<{
    qty: number;
    packQty: number;
    unitQty: number;
  } | null>(null);

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
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      location: "",
      discardType: "",
    },
  });

  const selectedLocation = form.watch("location");

  const [newProduct, setNewProduct] = useState({
    prod_name: "",
    unit_name: "",
    unit_type: null as "WHOLE" | "DEC" | null,
    purchase_price: 0,
    pack_size: 0,
    pack_qty: 0,
    unit_qty: 0,
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

  const fetchDiscardTypes = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/product-discards/discard-types");

      if (!res.success) throw new Error(res.message);

      setDiscardTypes(res.data);
    } catch (err: any) {
      console.error("Failed to fetch discard types:", err);
      toast({
        title: "Failed to load discard types",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const handleLocationChange = async (locaCode: string) => {
    form.setValue("location", locaCode);

    if (!locaCode) {
      setHasLoaded(false);
      setTempPdNumber("");
      setCurrentStock(null);
      return;
    }

    if (unsavedSessions.length === 0 && !isEditMode) {
      setHasLoaded(true);
      generatePdNumber("TempPD", locaCode, false);
    }

    // Refresh stock if product is already selected
    if (product && locaCode) {
      try {
        const { data: res } = await api.get(
          `/stock-adjustments/stock?prod_code=${product.prod_code}&loca_code=${locaCode}`,
        );
        if (res.success) {
          const stockQty = Number(res.data.qty) || 0;
          const packSize = Number(product.pack_size) || 1;

          setCurrentStock({
            qty: stockQty,
            packQty: Math.floor(stockQty / packSize),
            unitQty: stockQty % packSize,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stock:", error);
      }
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) setDate(newDate);
  };

  const generatePdNumber = async (
    type: string,
    locaCode: string,
    setFetchingState = true,
  ) => {
    try {
      setIsGeneratingPd(true);
      if (setFetchingState) {
        setFetching(true);
      }
      const { data: res } = await api.get(
        `/transactions/generate-code/${type}/${locaCode}`,
      );
      if (res.success) {
        setTempPdNumber(res.code);
      }
    } catch (error) {
      console.error("Failed to generate PD number:", error);
    } finally {
      setIsGeneratingPd(false);
      if (setFetchingState) {
        setFetching(false);
      }
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchLocations();
    fetchDiscardTypes();

    const checkUnsavedSessions = async () => {
      try {
        const { data: res } = await api.get(
          "/product-discards/unsaved-sessions",
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
  }, [fetchLocations, fetchDiscardTypes, toast]);

  useEffect(() => {
    if (!isEditMode || hasDataLoaded.current) return;

    const docNo = searchParams.get("doc_no");
    const status = searchParams.get("status");
    const iid = searchParams.get("iid");

    if (!docNo || !status || !iid) return;

    const loadProductDiscard = async () => {
      hasDataLoaded.current = true;

      try {
        setFetching(true);

        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`,
        );

        if (res.success) {
          const pdData = res.data;
          setTempPdNumber(pdData.doc_no);

          const locationCode = pdData.location?.loca_code || pdData.location;
          form.setValue("location", locationCode);

          const remarksValue = pdData.remarks_ref || "";
          const formattedValue = remarksValue.toLowerCase();
          setDiscardType(formattedValue);
          form.setValue("discardType", formattedValue);

          setDate(new Date(pdData.document_date));

          const productDetails =
            pdData.temp_transaction_details || pdData.transaction_details || [];

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
        console.error("Failed to load product discard:", error);
      } finally {
        setFetching(false);
      }
    };

    loadProductDiscard();
  }, [isEditMode, form, searchParams]);

  useEffect(() => {
    if (
      showUnsavedModal ||
      !tempPdNumber ||
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
          `/transactions/temp-products/${tempPdNumber}`,
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
    tempPdNumber,
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

  const handleProductSelect = async (selectedProduct: any) => {
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
        pack_qty: 0,
        unit_qty: 0,
      }));

      setUnitType(selectedProduct.unit?.unit_type || null);

      // Fetch stock
      if (selectedLocation) {
        try {
          const { data: res } = await api.get(
            `/stock-adjustments/stock?prod_code=${selectedProduct.prod_code}&loca_code=${selectedLocation}`,
          );
          if (res.success) {
            const stockQty = Number(res.data.qty) || 0;
            const packSize = Number(selectedProduct.pack_size) || 1;

            setCurrentStock({
              qty: stockQty,
              packQty: Math.floor(stockQty / packSize),
              unitQty: stockQty % packSize,
            });
          }
        } catch (error) {
          console.error("Failed to fetch stock:", error);
        }
      }

      setTimeout(() => {
        if (selectedProduct.pack_size == 1) {
          setIsQtyDisabled(true);
          setNewProduct((prev) => ({ ...prev, unit_qty: 0 }));
          packQtyInputRef.current?.focus();
        } else {
          setIsQtyDisabled(false);
          packQtyInputRef.current?.focus();
        }
      }, 0);
    } else {
      resetProductForm();
      setCurrentStock(null);
    }
  };

  const sanitizeQuantity = (
    value: string,
    unitType: "WHOLE" | "DEC" | null,
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
            if (editingProductId) {
              saveProduct();
            } else {
              addProduct();
            }
          }
          break;
        case "unit_qty":
          if (!newProduct.unit_qty && !newProduct.pack_qty) {
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
    const isQtyField = ["pack_qty", "unit_qty"].includes(name);

    setNewProduct((prev) => {
      const updatedValue = isQtyField
        ? sanitizeQuantity(value, prev.unit_type)
        : name === "purchase_price"
          ? Number(value) || 0
          : value;

      const updatedProduct = {
        ...prev,
        [name]: updatedValue,
      };

      return updatedProduct;
    });
  };

  const formatThousandSeparator = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue as number)) return "0.00";
    return (numValue as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const addProduct = async () => {
    if (!product) return;

    if (currentStock && currentStock.qty <= 0) {
      toast({
        title: "Stock Error",
        description: "Cannot add product as current stock is 0 or less.",
        type: "error",
      });
      return;
    }

    const payload = {
      doc_no: tempPdNumber,
      iid: "PD",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
      pack_qty: Number(newProduct.pack_qty) || 0,
      unit_qty: Number(newProduct.unit_qty) || 0,
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.post("/product-discards/add-product", payload);

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

    const payload = {
      doc_no: tempPdNumber,
      iid: "PD",
      ...newProduct,
      prod_code: product.prod_code,
      selling_price: product.selling_price || 0,
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.put(
        `/product-discards/update-product/${editingProductId}`,
        payload,
      );

      if (response.data.success) {
        setProducts(response.data.data);
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

  const editProduct = async (productId: number) => {
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
      unit_name: productToEdit.unit_name,
      unit_type: productToEdit.unit?.unit_type || null,
    });

    // Set unit type for input validation
    setUnitType(productToEdit.unit?.unit_type || null);

    // Fetch stock for the editing product
    if (selectedLocation) {
      try {
        const { data: res } = await api.get(
          `/stock-adjustments/stock?prod_code=${productToEdit.prod_code}&loca_code=${selectedLocation}`,
        );
        if (res.success) {
          const stockQty = Number(res.data.qty) || 0;
          const packSize = Number(productToEdit.pack_size) || 1;

          setCurrentStock({
            qty: stockQty,
            packQty: Math.floor(stockQty / packSize),
            unitQty: stockQty % packSize,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stock for editing product:", error);
      }
    }

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
        `/transactions/delete-detail/${tempPdNumber}/${productToRemove.line_no}`,
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

    setTempPdNumber(doc_no);

    if (location) {
      form.setValue("location", location.loca_code);
    }

    const remainingSessions = unsavedSessions.filter(
      (s) => s.doc_no !== doc_no,
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
        (s) => s.doc_no !== session.doc_no,
      );
      setUnsavedSessions(remainingSessions);
      if (remainingSessions.length === 0) {
        setShowUnsavedModal(false);
        setTempPdNumber("");
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
    setTempPdNumber("");
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
      remarks_ref: values.discardType,

      doc_no: tempPdNumber,
      iid: "PD",

      document_date: formatDateForAPI(date),
    };
    return payload;
  };

  const handleCreateDraftPd = async (values: FormData) => {
    const payload = getPayload(values);

    setLoading(true);
    try {
      const response = await api.post("/transactions/draft", payload);
      if (response.data.success) {
        if (tempPdNumber) {
          sessionStorage.removeItem(`skip_unsaved_modal_${tempPdNumber}`);
        }

        toast({
          title: "Success",
          description: "Product discard has been drafted successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/product-discard");
      }
    } catch (error: any) {
      console.error("Failed to draft PD:", error);
      toast({
        title: "Operation Failed",
        description: error.response?.data?.message || "Could not draft the PD.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDraftPd: (values: FormData) => Promise<void> = async (
    values,
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
          description: "Product discard has been updated successfully.",
          type: "success",
        });
        router.push("/dashboard/transactions/product-discard");
      }
    } catch (error: any) {
      console.error("Failed to update PD:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not update the PD.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values: FormData) => {
    if (isEditMode) {
      handleUpdateDraftPd(values);
    } else {
      handleCreateDraftPd(values);
    }
  };

  const handleApplyProductDiscard = async () => {
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
      const response = await api.post("/product-discards/save-pd", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Product discard has been applied successfully.",
          type: "success",
        });
        const newDocNo = response.data.data.doc_no;
        setTimeout(() => {
          router.push(
            `/dashboard/transactions/product-discard?tab=applied&view_doc_no=${newDocNo}`,
          );
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description: error.response?.data?.message || "Could not apply the PD.",
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
    });
    setProduct(null);
    setEditingProductId(null);
    setUnitType(null);
    setIsQtyDisabled(false);
    setCurrentStock(null);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/transactions/product-discard")}
          className="justify-self-start flex items-center gap-1 px-2 py-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>

        <div className="flex items-center justify-center gap-2">
          <PackageX className="h-5 w-5" />
          <h1 className="text-xl font-semibold">
            {isEditMode ? "Edit Product Discard" : "New Product Discard"}
          </h1>
        </div>

        <Badge
          variant="secondary"
          className="justify-self-end px-2 py-1 text-xs h-6"
        >
          <div className="flex items-center gap-2">
            <span>Document No:</span>
            {isGeneratingPd && <ClipLoader size={20} />}
            {!isGeneratingPd && <span>{tempPdNumber || "..."}</span>}
          </div>
        </Badge>
      </div>

      <Card>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    disabled={true}
                    required
                  />
                </div>

                <div>
                  <Label>Discard Type*</Label>
                  <Select
                    value={discardType}
                    onValueChange={(val) => {
                      setDiscardType(val);
                      form.setValue("discardType", val);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--Select Discard Type--" />
                    </SelectTrigger>
                    <SelectContent>
                      {discardTypes.map((type) => (
                        <SelectItem
                          key={type.id}
                          value={type.type_name.toLowerCase()}
                        >
                          {type.type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Details Table */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Product Details</h3>

                <div className="border rounded-lg">
                  <Table wrapperClassName="max-h-[250px]">
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="w-[50px] pr-4">Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Pur. Price</TableHead>
                        <TableHead className="text-center">Pack Qty</TableHead>
                        <TableHead className="text-center">Unit Qty</TableHead>
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
                            <TableCell className="max-w-[200px] truncate">
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
                              {formatThousandSeparator(product.purchase_price)}
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
                  </Table>
                </div>
              </div>

              {/* Add Product Section */}
              {!isApplied && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-2 items-end mb-4">
                    <div className="col-span-2 md:col-span-3 lg:col-span-4">
                      <div className="flex justify-between items-center mb-1">
                        <Label>Product</Label>
                      </div>
                      <BasicProductSearch
                        ref={productSearchRef}
                        onValueChange={handleProductSelect}
                        value={product?.prod_code}
                        disabled={!!editingProductId || !selectedLocation}
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
                  <div className="flex items-center justify-between mb-4">
                    {product && (
                      <div className="flex items-center gap-12 text-xs">
                        {/* Pack Size + Unit */}
                        <p className="text-muted-foreground">
                          Pack Size: {product.pack_size || "N/A"}
                          <br />
                          Unit: {newProduct.unit_name || "N/A"}
                        </p>

                        {/* Current Stock */}
                        {currentStock && (
                          <div className="flex items-center gap-2 font-semibold">
                            <span className="text-gray-500">Stock:</span>

                            <Badge variant="outline" className="h-5 py-0 px-2">
                              {currentStock.packQty} Packs
                            </Badge>

                            <Badge variant="outline" className="h-5 py-0 px-2">
                              {unitType === "WHOLE"
                                ? Math.floor(currentStock.unitQty)
                                : currentStock.unitQty.toFixed(3)}{" "}
                              Units
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              {!isApplied && (
                <div className="flex gap-4">
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
                        ? "UPDATE PD"
                        : "DRAFT PD"}
                  </Button>
                  <Button
                    type="button"
                    disabled={loading || products.length === 0}
                    onClick={handleApplyProductDiscard}
                  >
                    APPLY PD
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
        transactionType="Product Discard"
        iid="PD"
      />
    </div>
  );
}

export default function ProductDiscardForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDiscardFormContent />
    </Suspense>
  );
}
