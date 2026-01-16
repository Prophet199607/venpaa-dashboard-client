"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchSelectHandle } from "@/components/ui/search-select";
import { Trash2, Plus, FileText, ArrowLeft, X, Pencil } from "lucide-react";
import { CustomerSearch } from "@/components/shared/customer-search";
import { UnsavedChangesModal } from "@/components/model/unsaved-dialog";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import { PaymentDetailsModal } from "@/components/model/payments/payment-details-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
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
  id: number;
  line_no: number;
  type: string;
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

function InvoiceFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const freeQtyInputRef = useRef<HTMLInputElement>(null);
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const sellingPriceRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const [isQtyDisabled, setIsQtyDisabled] = useState(false);
  const [products, setProducts] = useState<InvoiceItem[]>([]);
  const [isGeneratingInv, setIsGeneratingInv] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tempInvNumber, setTempInvNumber] = useState<string>("");
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [unsavedSessions, setUnsavedSessions] = useState<SessionDetail[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form for item addition
  const [itemType, setItemType] = useState<string>("Sales");

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

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      location: "",
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

  const generateInvNumber = async (
    type: string,
    locaCode: string,
    setFetchingState = true
  ) => {
    try {
      setIsGeneratingInv(true);
      if (setFetchingState) {
        setFetching(true);
      }
      const { data: res } = await api.get(
        `/transactions/generate-code/${type}/${locaCode}`
      );
      if (res.success) {
        setTempInvNumber(res.code);
      }
    } catch (error) {
      console.error("Failed to generate INV number:", error);
    } finally {
      setIsGeneratingInv(false);
      if (setFetchingState) {
        setFetching(false);
      }
    }
  };

  const handleLocationChange = (locaCode: string) => {
    form.setValue("location", locaCode);

    if (!locaCode) {
      setHasLoaded(false);
      setTempInvNumber("");
      return;
    }

    if (unsavedSessions.length === 0 && !isEditMode) {
      setHasLoaded(true);
      generateInvNumber("TempINV", locaCode, false);
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) setDate(newDate);
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    setLocations([]);

    const checkUnsavedSessions = async () => {
      try {
        const { data: res } = await api.get("/invoices/unsaved-sessions");
        if (res.success && res.data.length > 0) {
          setUnsavedSessions(res.data);
          setShowUnsavedModal(true);
        }
      } catch (error) {
        console.error("Failed to check for unsaved sessions:", error);
      }
    };

    checkUnsavedSessions();
  }, [setLocations, toast]);

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
          setNewProduct((prev) => ({ ...prev, unit_qty: 0 }));
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
        case "selling_price":
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
        : name === "selling_price"
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
    const sellingPrice = Number(newProduct.selling_price) || 0;
    const discountInput = newProduct.line_wise_discount_value;

    let calculatedDiscount = 0;
    const amountBeforeDiscount = sellingPrice * totalQty;

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

  const recalculateSummary = (
    products: InvoiceItem[],
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
    return (numValue as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const addProduct = async () => {
    if (!product) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const payload = {
      doc_no: tempInvNumber,
      iid: "INV",
      ...newProduct,
      type: itemType,
      prod_code: product.prod_code,
      total_qty: totalQty,
      amount: amount,
      selling_price: newProduct.selling_price || 0,
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.post("/invoices/add-product", payload);

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
      doc_no: tempInvNumber,
      iid: "INV",
      ...newProduct,
      type: itemType,
      prod_code: product.prod_code,
      total_qty: totalQty,
      amount: amount,
      selling_price: newProduct.selling_price || 0,
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.put(
        `/invoices/update-product/${editingProductId}`,
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
    setItemType(productToEdit.type || "Sales");

    // Set the product for the search component to display the name
    setProduct({
      prod_code: productToEdit.prod_code,
      prod_name: productToEdit.prod_name,
      pack_size: productToEdit.pack_size,
      selling_price: productToEdit.selling_price,
    });

    // Populate the input fields
    setNewProduct({
      prod_name: productToEdit.prod_name,
      purchase_price: productToEdit.purchase_price,
      selling_price: productToEdit.selling_price,
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
        `/transactions/delete-detail/${tempInvNumber}/${productToRemove.line_no}`
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

    setTempInvNumber(doc_no);

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
      const response = await api.get(`/invoices/temp-products/${doc_no}`);
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
        setTempInvNumber("");
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
    setTempInvNumber("");
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

  const handleCreateDraftInvoice = async (values: InvoiceFormValues) => {
    const payload = getPayload(values);

    setLoading(true);
    try {
      const response = await api.post("/transactions/draft", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Invoice has been drafted successfully.",
          type: "success",
        });
        router.push("/dashboard/invoice");
      }
    } catch (error: any) {
      console.error("Failed to draft invoice:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not draft the invoice.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDraftInvoice = async (values: InvoiceFormValues) => {
    const payload = getPayload(values);
    const docNo = searchParams.get("doc_no");

    if (!docNo) return;

    setLoading(true);
    try {
      const response = await api.put(`/transactions/draft/${docNo}`, payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Invoice draft has been updated successfully.",
          type: "success",
        });
        router.push("/dashboard/invoice");
      }
    } catch (error: any) {
      console.error("Failed to update invoice draft:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message ||
          "Could not update the invoice draft.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyInvoice = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Invalid Form",
        description: "Please fill all required fields before applying.",
        type: "error",
      });
      return;
    }

    // Open payment modal instead of directly applying
    setShowPaymentModal(true);
  };

  const handleCompletePayment = async (payments: any[]) => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Invalid Form",
        description: "Please fill all required fields before applying.",
        type: "error",
      });
      return;
    }

    const basePayload = getPayload(form.getValues());

    // Include payment details in payload if needed
    // You can extend this based on your API requirements
    const payload: any = {
      ...basePayload,
    };

    if (payments.length > 0) {
      // Add payment information to payload
      payload.payments = payments;
      // For single payment, update payment_mode based on selected payment method
      if (payments.length === 1) {
        payload.payment_mode = payments[0].method;
      }
    }

    setLoading(true);
    setShowPaymentModal(false);

    try {
      const response = await api.post("/invoices/save-invoice", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Invoice has been applied successfully.",
          type: "success",
        });
        const newDocNo = response.data.data.doc_no;
        setTimeout(() => {
          router.push(`/dashboard/invoice?tab=applied&view_doc_no=${newDocNo}`);
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to apply invoice",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date: Date | undefined): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPayload = (values: InvoiceFormValues) => {
    const discountVal = (summary.subTotal * values.discount_per) / 100;
    const taxVal = ((summary.subTotal - discountVal) * values.tax_per) / 100;
    const netAmount =
      summary.subTotal -
      discountVal +
      taxVal +
      Number(values.delivery_charges || 0);

    const payload = {
      location: values.location,
      customer_code: values.customer,
      sale_type: values.saleType,
      payment_mode: values.paymentMethod,
      sales_assistant_code: values.salesAssistant,
      p_order_no: values.pOrderNo,
      manual_no: values.manualNo,
      comments: values.comments,

      doc_no: tempInvNumber,
      document_date: formatDateForAPI(values.date),

      subtotal: summary.subTotal,
      net_total: netAmount,
      discount: discountVal,
      dis_per: values.discount_per,
      tax: taxVal,
      tax_per: values.tax_per,
      delivery_charges: values.delivery_charges,

      iid: "INV",
    };
    return payload;
  };

  const onSubmit = (values: InvoiceFormValues) => {
    if (isEditMode) {
      handleUpdateDraftInvoice(values);
    } else {
      handleCreateDraftInvoice(values);
    }
  };

  const resetProductForm = () => {
    setNewProduct({
      prod_name: "",
      unit_name: "",
      unit_type: null,
      purchase_price: 0,
      selling_price: 0,
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

  const discountVal =
    (summary.subTotal * (form.watch("discount_per") || 0)) / 100;
  const taxVal =
    ((summary.subTotal - discountVal) * (form.watch("tax_per") || 0)) / 100;
  const netAmount =
    summary.subTotal -
    discountVal +
    taxVal +
    Number(form.watch("delivery_charges") || 0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/invoice")}
          className="flex items-center gap-1 px-2 py-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>

        <div className="flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">
            {isEditMode ? "Edit Invoice" : "New Invoice"}
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs justify-end">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Outstanding:</span>
            <span className="font-bold">
              Rs {customerDetails?.outstanding || "0.00"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Setoff:</span>
            <span className="font-bold">Rs 0.00</span>
          </div>

          <Badge variant="secondary" className="px-3 py-1">
            <div className="flex items-center gap-2">
              <span>Invoice No:</span>
              {isGeneratingInv ? (
                <ClipLoader size={14} />
              ) : (
                <span className="font-bold">{tempInvNumber || "..."}</span>
              )}
            </div>
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-12 gap-5 items-end p-4 rounded-xl shadow-sm border">
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
                        <SelectTrigger>
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
                    <DatePicker date={field.value} setDate={field.onChange} />
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
                        <SelectTrigger>
                          <SelectValue placeholder="--Select Payment method--" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">CASH</SelectItem>
                        <SelectItem value="CREDIT">CREDIT</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormField
                control={form.control}
                name="saleType"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Tabs
                        value={field.value}
                        onValueChange={field.onChange}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2 p-2">
                          <TabsTrigger value="WHOLE" className="font-bold">
                            Wholesale
                          </TabsTrigger>
                          <TabsTrigger value="RETAIL" className="font-bold">
                            Retail Sale
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card>
              <div className="px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-bold">Customer Details</span>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="relative">
                  <CustomerSearch
                    value={form.watch("customer")}
                    onValueChange={handleCustomerChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-y-3 p-3 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold">Due Balance</span>
                    <span>
                      {customerDetails?.due_balance
                        ? `Rs ${customerDetails.due_balance}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-xs font-semibold">
                      No of Due Invoice
                    </span>
                    <span>{customerDetails?.due_invoices_count || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold">PD Check</span>
                    <span>{customerDetails?.pd_check || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-xs font-semibold">Refund</span>
                    <span>{customerDetails?.refund || "-"}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Address:</Label>
                  <Textarea
                    placeholder="Address details..."
                    value={customerDetails?.address || ""}
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right side: Sales Asst and Refs */}
            <Card>
              <div className="px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-bold">Project & Reference</span>
              </div>
              <CardContent className="p-5 space-y-5">
                <FormField
                  control={form.control}
                  name="salesAssistant"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs">Sales Assistant</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                    <Label className="text-xs">P.ORDER NO</Label>
                    <Input {...form.register("pOrderNo")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">MANUAL NO</Label>
                    <Input {...form.register("manualNo")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">REFERENCE</Label>
                    <Input {...form.register("reference")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Table Area */}
          <div className="space-y-0rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b leading-none">
                    <TableHead className="w-[60px] text-xs font-bold">
                      #
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Pack Qty</TableHead>
                    <TableHead>Unit Qty</TableHead>
                    <TableHead>Free Qty</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Disc</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[60px] text-center">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center h-12 text-slate-400 font-medium italic"
                      >
                        No items added to this invoice yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="font-mono text-xs text-slate-400">
                          {item.line_no}
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
                          {item.prod_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.prod_name}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatThousandSeparator(item.selling_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.pack_qty}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unit_qty}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">
                          {item.free_qty}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800">
                          {item.total_qty}
                        </TableCell>
                        <TableCell className="text-right text-red-500">
                          {item.line_wise_discount_value}
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#1e40af]">
                          {formatThousandSeparator(item.amount)}
                        </TableCell>
                        <TableCell className="text-center p-0 px-2 flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            onClick={() => editProduct(item.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            onClick={() => removeProduct(item.id)}
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
          <div className="p-4 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-3 w-3" />
              <h3 className="font-semibold text-sm">Add Item to Invoice</h3>
            </div>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 md:col-span-2 space-y-1.5">
                <Label>Line Type</Label>
                <Select onValueChange={setItemType} value={itemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 md:col-span-3 space-y-1.5">
                <Label>Search Product/Service</Label>
                <div className="relative">
                  <BasicProductSearch
                    ref={productSearchRef}
                    value={product?.prod_code}
                    onValueChange={handleProductSelect}
                    disabled={!!editingProductId || !watchedLocation}
                  />
                </div>
              </div>
              <div>
                <Label>Sel. Price</Label>
                <Input
                  ref={sellingPriceRef}
                  name="selling_price"
                  type="number"
                  value={newProduct.selling_price}
                  onChange={handleProductChange}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div>
                <Label>Pack Qty</Label>
                <Input
                  ref={packQtyInputRef}
                  name="pack_qty"
                  type="text"
                  inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                  value={newProduct.pack_qty}
                  onChange={handleProductChange}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div>
                <Label>Unit Qty</Label>
                <Input
                  ref={qtyInputRef}
                  name="unit_qty"
                  type="text"
                  inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                  value={newProduct.unit_qty}
                  onChange={handleProductChange}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.target.select()}
                  disabled={isQtyDisabled}
                />
              </div>
              <div>
                <Label>Free Qty</Label>
                <Input
                  ref={freeQtyInputRef}
                  name="free_qty"
                  type="text"
                  inputMode={unitType === "WHOLE" ? "numeric" : "decimal"}
                  value={newProduct.free_qty}
                  onChange={handleProductChange}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div>
                <Label>Discount</Label>
                <Input
                  ref={discountInputRef}
                  name="line_wise_discount_value"
                  type="text"
                  value={newProduct.line_wise_discount_value}
                  onChange={handleProductChange}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  value={formatThousandSeparator(calculateAmount())}
                  disabled
                />
              </div>
              <div>
                <Button
                  type="button"
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

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Current Stock</span>
                  <span className="text-xs">
                    {/* {selectedProduct?.stock || 0}{" "}
                    {selectedProduct?.unit_name || "units"} */}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Bottom Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* LEFT SIDE */}
            <div className="md:col-span-7 space-y-2">
              <div>
                <Label>Comments</Label>
                <Textarea
                  value={form.watch("comments")}
                  onChange={form.register("comments").onChange}
                />
              </div>

              <div className="flex gap-3">
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
                    ? "Update Draft"
                    : "Draft Invoice"}
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyInvoice}
                  disabled={loading || products.length === 0}
                >
                  Apply Invoice
                </Button>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="md:col-span-5 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <Label>Discount %:</Label>
                <Input
                  type="number"
                  {...form.register("discount_per", { valueAsNumber: true })}
                />
                <Input disabled value={discountVal.toFixed(2)} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Label>Tax %:</Label>
                <Input
                  type="number"
                  {...form.register("tax_per", { valueAsNumber: true })}
                />
                <Input disabled value={taxVal.toFixed(2)} />
              </div>

              {/* Delivery */}
              <div className="grid grid-cols-3 gap-3">
                <Label>Delivery Charges:</Label>
                <div />
                <Input
                  type="number"
                  {...form.register("delivery_charges", {
                    valueAsNumber: true,
                  })}
                />
              </div>

              {/* Net Amount */}
              <div className="grid grid-cols-3 items-center gap-3">
                <Label className="font-semibold">Net Amount:</Label>
                <div />
                <Input
                  disabled
                  value={netAmount.toFixed(2)}
                  className="text-right font-bold"
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        sessions={unsavedSessions}
        onContinue={handleResumeSession}
        onDiscardAll={handleDiscardAllSessions}
        onDiscardSelected={handleDiscardSelectedSession}
        transactionType="Invoice"
        iid="INV"
      />
      <PaymentDetailsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onComplete={handleCompletePayment}
        totalAmount={netAmount}
      />
    </div>
  );
}

export default function InvoiceForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoiceFormContent />
    </Suspense>
  );
}
