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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PackageCheck, Pencil } from "lucide-react";
import { SearchSelectHandle } from "@/components/ui/search-select";
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

const acceptGoodNoteSchema = z.object({
  location: z.string().min(1, "Location is required"),
  receiveLocation: z.string().min(1, "Receive location is required"),
  transactionDocNo: z.string().optional(),
  tgnRemark: z.string().optional(),
  agnRemark: z.string().optional(),
});

type FormData = z.infer<typeof acceptGoodNoteSchema>;

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
  variance_pack_qty: number;
  variance_unit_qty: number;
  is_edited?: boolean;
  unit: {
    unit_type: "WHOLE" | "DEC" | null;
  };
}

function AcceptGoodNoteFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const hasDataLoaded = useRef(false);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isReturn, setIsReturn] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const packQtyInputRef = useRef<HTMLInputElement>(null);
  const unitQtyInputRef = useRef<HTMLInputElement>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isGeneratingAgn, setIsGeneratingAgn] = useState(false);
  const [tempAgnNumber, setTempAgnNumber] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [originalPackQty, setOriginalPackQty] = useState<number>(0);
  const [originalUnitQty, setOriginalUnitQty] = useState<number>(0);
  const [isPackQtyDisabled, setIsPackQtyDisabled] = useState(false);
  const [isUnitQtyDisabled, setIsUnitQtyDisabled] = useState(false);
  const [transactionDocs, setTransactionDocs] = useState<string[]>([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

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

  const form = useForm<FormData>({
    resolver: zodResolver(acceptGoodNoteSchema),
    defaultValues: {
      location: "",
      receiveLocation: "",
      transactionDocNo: "",
      tgnRemark: "",
      agnRemark: "",
    },
  });

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
  }, [fetchLocations, toast, isEditMode, form]);

  const handleLocationChange = (value: string) => {
    form.setValue("location", value);
  };

  const handleReceiveLocationChange = (locaCode: string) => {
    form.setValue("receiveLocation", locaCode);
  };

  const generateAgnNumber = useCallback(
    async (
      type: string,
      locaCode: string,
      setFetchingState = true
    ): Promise<string> => {
      try {
        setIsGeneratingAgn(true);
        if (setFetchingState) {
          setFetching(true);
        }

        const { data: res } = await api.get(
          `/transactions/generate-code/${type}/${locaCode}`
        );

        if (res.success && res.code) {
          setTempAgnNumber(res.code);
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
        setIsGeneratingAgn(false);
        if (setFetchingState) {
          setFetching(false);
        }
      }
    },
    [toast]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const { name } = e.currentTarget;

      switch (name) {
        case "pack_qty":
          if (!newProduct.pack_qty) {
            toast({
              title: "Validation Error",
              description: "Pack Qty is required",
              type: "error",
            });
            return;
          }

          if (isUnitQtyDisabled || !unitQtyInputRef.current) {
            saveProduct();
          } else {
            unitQtyInputRef.current?.focus();
            unitQtyInputRef.current?.select();
          }
          break;

        case "unit_qty":
          if (!isPackQtyDisabled && Number(newProduct.pack_qty) === 0) {
            toast({
              title: "Validation Error",
              description: "Pack Qty is required first",
              type: "error",
            });
          } else {
            saveProduct();
          }
          break;
      }
    }
  };

  const handleQtyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "pack_qty" | "unit_qty"
  ) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;

    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const editProduct = (productId: number) => {
    const productToEdit = products.find((p) => p.id === productId);
    if (!productToEdit) return;

    setEditingProductId(productId);

    const originalPack = Number(productToEdit.pack_qty) || 0;
    const originalUnit = Number(productToEdit.unit_qty) || 0;
    setOriginalPackQty(originalPack);
    setOriginalUnitQty(originalUnit);

    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === productId
          ? {
              ...p,
              variance_pack_qty: 0,
              variance_unit_qty: 0,
            }
          : p
      )
    );

    setNewProduct({
      prod_name: productToEdit.prod_name,
      selling_price: productToEdit.selling_price,
      purchase_price: productToEdit.purchase_price,
      pack_size: Number(productToEdit.pack_size),
      pack_qty: originalPack,
      unit_qty: originalUnit,
      total_qty: productToEdit.total_qty,
      unit_name: productToEdit.unit_name,
      unit_type: productToEdit.unit?.unit_type || null,
    });

    setUnitType(productToEdit.unit?.unit_type || null);

    if (Number(productToEdit.pack_size) === 1) {
      setIsUnitQtyDisabled(true);
    } else {
      setIsUnitQtyDisabled(false);
    }
    setTimeout(() => {
      packQtyInputRef.current?.focus();
      packQtyInputRef.current?.select();
    }, 100);
  };

  const saveProduct = async () => {
    if (isSubmittingProduct) return;
    if (!editingProductId) return;

    const productToEdit = products.find((p) => p.id === editingProductId);
    if (!productToEdit) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();
    const variancePackQty = calculateVariancePackQty();
    const varianceUnitQty = calculateVarianceUnitQty();

    const payload = {
      doc_no: tempAgnNumber,
      iid: "AGN",
      ...newProduct,
      prod_code: productToEdit.prod_code,
      selling_price: productToEdit.selling_price || 0,
      pack_qty: Number(newProduct.pack_qty) || 0,
      unit_qty: Number(newProduct.unit_qty) || 0,
      total_qty: totalQty,
      amount: amount,
      variance_pack_qty: variancePackQty,
      variance_unit_qty: varianceUnitQty,
    };

    try {
      setIsSubmittingProduct(true);
      const response = await api.put(
        `/accept-good-notes/update-product/${editingProductId}`,
        payload
      );

      if (response.data.success) {
        const calculatedVariancePackQty = variancePackQty;
        const calculatedVarianceUnitQty = varianceUnitQty;

        const existingProductsMap = new Map(products.map((p) => [p.id, p]));

        const updatedProducts = response.data.data.map((p: any) => {
          const isEditedProduct = p.id === editingProductId;
          const existingProduct = existingProductsMap.get(p.id);

          const variancePackQtyValue = isEditedProduct
            ? calculatedVariancePackQty
            : existingProduct?.variance_pack_qty !== undefined &&
              existingProduct?.variance_pack_qty !== null
            ? Number(existingProduct.variance_pack_qty)
            : p.variance_pack_qty !== undefined && p.variance_pack_qty !== null
            ? Number(p.variance_pack_qty)
            : 0;

          const varianceUnitQtyValue = isEditedProduct
            ? calculatedVarianceUnitQty
            : existingProduct?.variance_unit_qty !== undefined &&
              existingProduct?.variance_unit_qty !== null
            ? Number(existingProduct.variance_unit_qty)
            : p.variance_unit_qty !== undefined && p.variance_unit_qty !== null
            ? Number(p.variance_unit_qty)
            : 0;

          const mappedProduct = {
            ...p,
            unit_name: p.unit_name || p.product?.unit_name,
            variance_pack_qty: variancePackQtyValue,
            variance_unit_qty: varianceUnitQtyValue,
            unit: {
              unit_type:
                p.product?.unit?.unit_type || p.unit?.unit_type || null,
            },
            is_edited: isEditedProduct ? true : existingProduct?.is_edited,
          };

          return mappedProduct;
        });

        setProducts(updatedProducts);
        resetProductForm();
      } else {
        throw new Error(
          response.data.message || "Failed to update product on server."
        );
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

  const buildAgnPayload = useCallback(
    (
      docNumber: string,
      transactionDocs: string,
      overrideAmount?: number,
      overrideDate?: Date
    ) => ({
      location: form.getValues("location"),
      delivery_location: form.getValues("receiveLocation"),
      remarks_ref: form.getValues("agnRemark") || "",
      doc_no: docNumber,
      temp_doc_no: docNumber,
      iid: "AGN",
      document_date: formatDateForAPI(overrideDate || date),
      recall_doc_no: transactionDocs,
      subtotal: overrideAmount ?? totalAmount,
      net_total: overrideAmount ?? totalAmount,
    }),
    [form, date, totalAmount]
  );

  const handleDraftAgn = useCallback(
    async (
      docNumber: string,
      recallDocNo: string,
      overrideAmount?: number,
      overrideDate?: Date
    ) => {
      try {
        const payload = buildAgnPayload(
          docNumber,
          recallDocNo,
          overrideAmount,
          overrideDate
        );
        const { data: res } = await api.post(
          "/accept-good-notes/draft-agn",
          payload
        );
        return res;
      } catch (error: any) {
        console.error("Failed to draft AGN:", error);
      }
    },
    [buildAgnPayload]
  );

  const fetchAcceptGoodNote = useCallback(async () => {
    const docNo = searchParams.get("doc_no");
    const status = searchParams.get("status");
    const iid = searchParams.get("iid");

    if (!docNo || !status || !iid) return;

    try {
      setFetching(true);
      const { data: res } = await api.get(
        `/accept-good-notes/load-agn-by-code/${docNo}/${status}/${iid}`
      );

      if (!res.success) throw new Error(res.message);

      const data = res.data;

      // Set form values
      const locationCode = data.location?.loca_code || data.location;
      form.setValue("receiveLocation", locationCode);

      const receiveLocationCode = data.delivery_location?.loca_code || "";
      form.setValue("location", receiveLocationCode);

      const loadedDate = new Date(data.document_date);
      setDate(loadedDate);

      form.setValue("tgnRemark", data.remarks_ref);

      const refDocNo = data.doc_no;
      if (refDocNo) {
        setTransactionDocs([refDocNo]);
        form.setValue("transactionDocNo", refDocNo);
      }

      let generatedAgnNumber = "";
      if (receiveLocationCode) {
        generatedAgnNumber = await generateAgnNumber(
          "TempAGN",
          receiveLocationCode
        );
      }

      const productDetails = data.transaction_details || [];

      const productsWithUnits = productDetails.map((product: any) => ({
        ...product,
        unit_name: product.product?.unit_name || product.unit_name,
        variance_pack_qty: product.variance_pack_qty || 0,
        variance_unit_qty: product.variance_unit_qty || 0,
        unit: {
          unit_type:
            product.product?.unit?.unit_type || product.unit?.unit_type || null,
        },
      }));

      setProducts(productsWithUnits);

      const calculatedTotal = productsWithUnits.reduce(
        (acc: number, item: any) => acc + (Number(item.amount) || 0),
        0
      );

      if (generatedAgnNumber && refDocNo) {
        const draftRes = await handleDraftAgn(
          generatedAgnNumber,
          refDocNo,
          calculatedTotal,
          loadedDate
        );

        if (
          draftRes &&
          draftRes.success &&
          draftRes.transaction_details &&
          draftRes.transaction_details.length > 0
        ) {
          const tempProductsWithUnits = draftRes.transaction_details.map(
            (product: any) => ({
              ...product,
              unit_name: product.product?.unit_name || product.unit_name,
              variance_pack_qty: product.variance_pack_qty || 0,
              variance_unit_qty: product.variance_unit_qty || 0,
              unit: {
                unit_type:
                  product.product?.unit?.unit_type ||
                  product.unit?.unit_type ||
                  null,
              },
            })
          );
          setProducts(tempProductsWithUnits);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error loading transaction",
        description: err.message || "Failed to load",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [searchParams, form, toast, generateAgnNumber, handleDraftAgn]);

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

  const calculateVariancePackQty = (): number => {
    const oldPackQty = originalPackQty;
    const newPackQty = Number(newProduct.pack_qty) || 0;
    const variance = oldPackQty - newPackQty;

    if (unitType === "DEC") {
      return Math.round(variance * 1000) / 1000;
    }
    return variance;
  };

  const calculateVarianceUnitQty = (): number => {
    const oldUnitQty = originalUnitQty;
    const newUnitQty = Number(newProduct.unit_qty) || 0;
    const variance = oldUnitQty - newUnitQty;

    if (unitType === "DEC") {
      return Math.round(variance * 1000) / 1000;
    }
    return variance;
  };

  const calculateSubtotal = useCallback((): number => {
    return products.reduce((total, product) => {
      const lineAmount = Number(product.amount) || 0;
      return total + lineAmount;
    }, 0);
  }, [products]);

  useEffect(() => {
    if (isEditMode && !hasDataLoaded.current) {
      hasDataLoaded.current = true;
      fetchAcceptGoodNote();
    }
  }, [isEditMode, fetchAcceptGoodNote]);

  useEffect(() => {
    setTotalAmount(calculateSubtotal());
  }, [products, calculateSubtotal]);

  useEffect(() => {
    if (isReturn) {
      form.setError("agnRemark", {
        type: "manual",
        message: "Remark is required",
      });
    } else {
      form.clearErrors("agnRemark");
    }
  }, [isReturn, form]);

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

  const formatDateForAPI = (date: Date | undefined): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleApplyAcceptGoodNote = async () => {
    if (isReturn && !form.getValues("agnRemark")?.trim()) {
      form.setError("agnRemark", {
        type: "manual",
        message: "Remark is required when RETURN is checked",
      });
      toast({
        title: "Validation Error",
        description: "Please enter a remark when RETURN is checked",
        type: "error",
      });
      return;
    }

    if (isReturn) {
      const hasVariance = products.some(
        (p) =>
          (Number(p.variance_pack_qty) || 0) !== 0 ||
          (Number(p.variance_unit_qty) || 0) !== 0
      );
      if (!hasVariance) {
        toast({
          title: "Validation Error",
          description:
            "Please edit and save at least one product with variance when CORRECTION is checked.",
          type: "error",
        });
        return;
      }
    }

    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Invalid Form",
        description: "Please fill all required fields before applying.",
        type: "error",
      });
      return;
    }

    const recallDocNo =
      transactionDocs.length > 0
        ? transactionDocs[0]
        : form.getValues("transactionDocNo")?.trim() || "";

    const payload: any = buildAgnPayload(tempAgnNumber, recallDocNo);

    if (isReturn) {
      payload.is_return = true;
      payload.products = products
        .filter(
          (p) =>
            (Number(p.variance_pack_qty) || 0) !== 0 ||
            (Number(p.variance_unit_qty) || 0) !== 0
        )
        .map((p) => ({
          ...p,
          variance_pack_qty: p.variance_pack_qty,
          variance_unit_qty: p.variance_unit_qty,
        }));
    }

    setLoading(true);
    try {
      const response = await api.post("/accept-good-notes/save-agn", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: isReturn
            ? "Return Note drafted successfully."
            : "Accept good note has been applied successfully.",
          type: "success",
        });

        if (isReturn) {
          setTimeout(() => {
            router.push("/dashboard/transactions/accept-good-note");
          }, 2000);
        } else {
          const newDocNo = response.data.data.doc_no;
          setTimeout(() => {
            router.push(
              `/dashboard/transactions/accept-good-note?tab=applied&view_doc_no=${newDocNo}`
            );
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("AGN Save Error:", error);
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not apply the AGN.",
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
      selling_price: 0,
      purchase_price: 0,
      pack_size: 0,
      pack_qty: 0,
      unit_qty: 0,
      total_qty: 0,
    });
    setUnitType(null);
    setOriginalUnitQty(0);
    setOriginalPackQty(0);
    setEditingProductId(null);
    setIsPackQtyDisabled(false);
    setIsUnitQtyDisabled(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-6 w-6" />
          <h1 className="text-xl font-semibold">
            {isEditMode
              ? "Edit Accept of Goods Note"
              : "New Accept of Goods Note"}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            router.push("/dashboard/transactions/accept-good-note")
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
            {isGeneratingAgn && <ClipLoader className="h-2 w-2 animate-spin" />}
            {!isGeneratingAgn && <span>{tempAgnNumber || "..."}</span>}
          </div>
        </Badge>
      </div>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={() => {}} className="flex flex-col space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
                <div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select
                          onValueChange={handleReceiveLocationChange}
                          value={field.value}
                          disabled={isEditMode}
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
                    name="transactionDocNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Document Number</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={isEditMode}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  transactionDocs.length > 0
                                    ? transactionDocs[0]
                                    : "Select Document Number"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transactionDocs.map((doc) => (
                              <SelectItem key={doc} value={doc}>
                                {doc}
                              </SelectItem>
                            ))}
                            {transactionDocs.length === 0 && field.value && (
                              <SelectItem value={field.value}>
                                {field.value}
                              </SelectItem>
                            )}
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
                    disabled={isEditMode}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="receiveLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receive Location *</FormLabel>
                        <Select
                          onValueChange={handleLocationChange}
                          value={field.value}
                          disabled={isEditMode}
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
                    name="tgnRemark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TGN Remark</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isEditMode}
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

                <div>
                  <FormField
                    control={form.control}
                    name="agnRemark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Reason for correction"
                            {...field}
                            className="min-h-[100px] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="return"
                    checked={isReturn}
                    onCheckedChange={(checked: boolean) => setIsReturn(checked)}
                  />
                  <Label htmlFor="return" className="text-sm font-medium">
                    CORRECTION
                  </Label>
                </div>

                {/* Product Details Table */}
                <div className="mb-2">
                  <h3 className="text-lg font-semibold mb-2">
                    Product Details
                  </h3>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead className="w-[50px]">Code</TableHead>
                          <TableHead className="w-[180px]">Name</TableHead>
                          <TableHead className="text-right">
                            Selling Price
                          </TableHead>
                          <TableHead className="text-right">
                            Purchase Price
                          </TableHead>
                          <TableHead>Pack Size</TableHead>
                          <TableHead>Pack Qty</TableHead>
                          {isReturn && <TableHead>Var. Pack</TableHead>}
                          <TableHead>Unit Qty</TableHead>
                          {isReturn && <TableHead>Var. Unit</TableHead>}
                          <TableHead className="text-right">Amount</TableHead>
                          {isReturn && (
                            <TableHead className="text-center">
                              Action
                            </TableHead>
                          )}
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
                                {formatThousandSeparator(
                                  product.purchase_price
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {Number(product.pack_size)}
                              </TableCell>
                              <TableCell className="text-center">
                                {product.unit?.unit_type === "WHOLE"
                                  ? Math.floor(Number(product.pack_qty)) || 0
                                  : Number(product.pack_qty).toFixed(3) || 0}
                              </TableCell>
                              {isReturn && (
                                <TableCell className="text-center text-red-500 font-medium">
                                  {Number(product.variance_pack_qty) !== 0
                                    ? Number(product.variance_pack_qty) > 0
                                      ? `+${
                                          product.unit?.unit_type === "WHOLE"
                                            ? Math.floor(
                                                Number(
                                                  product.variance_pack_qty
                                                )
                                              )
                                            : Number(
                                                product.variance_pack_qty
                                              ).toFixed(3)
                                        }`
                                      : product.unit?.unit_type === "WHOLE"
                                      ? Math.floor(
                                          Number(product.variance_pack_qty)
                                        )
                                      : Number(
                                          product.variance_pack_qty
                                        ).toFixed(3)
                                    : "-"}
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                {product.unit?.unit_type === "WHOLE"
                                  ? Math.floor(Number(product.unit_qty)) || 0
                                  : Number(product.unit_qty).toFixed(3) || 0}
                              </TableCell>
                              {isReturn && (
                                <TableCell className="text-center text-red-500 font-medium">
                                  {Number(product.variance_unit_qty) !== 0
                                    ? Number(product.variance_unit_qty) > 0
                                      ? `+${
                                          product.unit?.unit_type === "WHOLE"
                                            ? Math.floor(
                                                Number(
                                                  product.variance_unit_qty
                                                )
                                              )
                                            : Number(
                                                product.variance_unit_qty
                                              ).toFixed(3)
                                        }`
                                      : product.unit?.unit_type === "WHOLE"
                                      ? Math.floor(
                                          Number(product.variance_unit_qty)
                                        )
                                      : Number(
                                          product.variance_unit_qty
                                        ).toFixed(3)
                                    : "-"}
                                </TableCell>
                              )}
                              <TableCell className="text-right align-middle">
                                {formatThousandSeparator(product.amount)}
                              </TableCell>
                              {isReturn && (
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
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={isReturn ? 10 : 8}
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
                              colSpan={isReturn ? 10 : 8}
                              className="text-right font-medium"
                            >
                              Subtotal
                            </TableCell>
                            <TableCell className="font-medium text-right align-middle">
                              {formatThousandSeparator(calculateSubtotal())}
                            </TableCell>
                            {isReturn && <TableCell></TableCell>}
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </div>
                </div>

                {/* Add Product Section */}
                {isReturn && (
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex gap-2 items-end overflow-x-auto pb-2 w-full">
                      <div className="w-72 ml-1">
                        <Label>Product</Label>
                        <Input
                          value={newProduct.prod_name}
                          disabled
                          className="text-sm"
                        />
                      </div>
                      <div className="w-28">
                        <Label>Selling Price</Label>
                        <Input
                          name="selling_price"
                          type="number"
                          value={newProduct.selling_price}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          className="text-sm"
                          disabled
                        />
                      </div>
                      <div className="w-28">
                        <Label>Purchase Price</Label>
                        <Input
                          name="purchase_price"
                          type="number"
                          value={newProduct.purchase_price}
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
                          inputMode={
                            unitType === "WHOLE" ? "numeric" : "decimal"
                          }
                          value={newProduct.pack_qty}
                          onChange={(e) => handleQtyChange(e, "pack_qty")}
                          onKeyDown={handleKeyDown}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          disabled={isPackQtyDisabled}
                          className="text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="w-28">
                        <Label>Unit Qty</Label>
                        <Input
                          ref={unitQtyInputRef}
                          name="unit_qty"
                          type="text"
                          inputMode={
                            unitType === "WHOLE" ? "numeric" : "decimal"
                          }
                          value={newProduct.unit_qty}
                          onChange={(e) => handleQtyChange(e, "unit_qty")}
                          onKeyDown={handleKeyDown}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          disabled={isUnitQtyDisabled}
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
                        <div className="flex items-center gap-2">
                          {isSubmittingProduct && editingProductId && (
                            <ClipLoader className="h-4 w-4 animate-spin" />
                          )}
                          <Button
                            type="button"
                            onClick={saveProduct}
                            disabled={isSubmittingProduct || !editingProductId}
                            size="sm"
                            className="w-20 h-9"
                          >
                            {isSubmittingProduct && editingProductId
                              ? "SAVING..."
                              : "SAVE"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-8">
                <div className="flex gap-4 mt-8">
                  <Button type="submit" variant="outline" disabled>
                    REJECT AGN
                  </Button>
                  <Button
                    type="button"
                    disabled={loading || products.length === 0}
                    onClick={handleApplyAcceptGoodNote}
                  >
                    APPLY AGN
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        {fetching || loading ? <Loader /> : null}
      </Card>
    </div>
  );
}

export default function AcceptGoodNoteForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptGoodNoteFormContent />
    </Suspense>
  );
}
