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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchSelectHandle } from "@/components/ui/search-select";
import { ArrowLeft, PackageCheck } from "lucide-react";
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
  deliveryLocation: z.string().min(1, "Delivery location is required"),
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
  const [fetching, setFetching] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isGeneratingAgn, setIsGeneratingAgn] = useState(false);
  const [tempAgnNumber, setTempAgnNumber] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const productSearchRef = useRef<SearchSelectHandle | null>(null);
  const [transactionDocs, setTransactionDocs] = useState<string[]>([]);
  const [unitType, setUnitType] = useState<"WHOLE" | "DEC" | null>(null);

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
    resolver: zodResolver(acceptGoodNoteSchema),
    defaultValues: {
      location: "",
      deliveryLocation: "",
      transactionDocNo: "",
      tgnRemark: "",
      agnRemark: "",
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
  }, [fetchLocations, toast, isEditMode, form]);

  const handleLocationChange = (value: string) => {
    form.setValue("location", value);
  };

  const handleDeliveryLocationChange = (locaCode: string) => {
    form.setValue("deliveryLocation", locaCode);
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

  const buildAgnPayload = useCallback(
    (
      docNumber: string,
      transactionDocs: string,
      overrideAmount?: number,
      overrideDate?: Date
    ) => ({
      location: form.getValues("deliveryLocation"),
      delivery_location: form.getValues("deliveryLocation"),
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
        await api.post("/accept-good-notes/draft-agn", payload);
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
      form.setValue("location", locationCode);

      const deliveryLocaCode = data.delivery_location?.loca_code || "";
      form.setValue("deliveryLocation", deliveryLocaCode);

      const loadedDate = new Date(data.document_date);
      setDate(loadedDate);

      form.setValue("tgnRemark", data.remarks_ref);

      const refDocNo = data.doc_no;
      if (refDocNo) {
        setTransactionDocs([refDocNo]);
        form.setValue("transactionDocNo", refDocNo);
      }

      let generatedAgnNumber = "";
      if (deliveryLocaCode) {
        generatedAgnNumber = await generateAgnNumber(
          "TempAGN",
          deliveryLocaCode
        );
      }

      const productDetails = data.transaction_details || [];

      const productsWithUnits = productDetails.map((product: any) => ({
        ...product,
        unit_name: product.product?.unit_name || product.unit_name,
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
        await handleDraftAgn(
          generatedAgnNumber,
          refDocNo,
          calculatedTotal,
          loadedDate
        );
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

  useEffect(() => {
    if (isEditMode && !hasDataLoaded.current) {
      hasDataLoaded.current = true;
      fetchAcceptGoodNote();
    }
  }, [isEditMode, fetchAcceptGoodNote]);

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

  const formatDateForAPI = (date: Date | undefined): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleApplyAcceptGoodNote = async () => {
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

    const payload = buildAgnPayload(tempAgnNumber, recallDocNo);

    setLoading(true);
    try {
      const response = await api.post("/accept-good-notes/save-agn", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Accept good note has been applied successfully.",
          type: "success",
        });

        const newDocNo = response.data.data.doc_no;
        setTimeout(() => {
          router.push(
            `/dashboard/transactions/accept-good-note?tab=applied&view_doc_no=${newDocNo}`
          );
        }, 2000);
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
                    name="deliveryLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Location *</FormLabel>
                        <Select
                          onValueChange={handleDeliveryLocationChange}
                          value={field.value}
                          disabled={isEditMode}
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
                            placeholder="Enter remark"
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
                        <TableHead className="text-right">
                          Selling Price
                        </TableHead>
                        <TableHead className="text-right">
                          Purchase Price
                        </TableHead>
                        <TableHead>Pack Size</TableHead>
                        <TableHead>Pack Qty</TableHead>
                        <TableHead>Unit Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
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
                            <TableCell className="text-right align-middle">
                              {formatThousandSeparator(product.amount)}
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
                          <TableCell className="font-medium text-right align-middle">
                            {formatThousandSeparator(calculateSubtotal())}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
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
