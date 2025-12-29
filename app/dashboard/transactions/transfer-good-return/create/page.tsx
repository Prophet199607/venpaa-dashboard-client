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
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchSelectHandle } from "@/components/ui/search-select";
import { UnsavedChangesModal } from "@/components/model/unsaved-dialog";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import { Trash2, ArrowLeft, Pencil, RotateCcw } from "lucide-react";
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
  returnLocation: z.string().min(1, "Delivery location is required"),
  transactionDocNo: z.string().optional(),
  netAmount: z.string().optional(),
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

function TransferGoodReturnFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const hasDataLoaded = useRef(false);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [tempTgrNumber, setTempTgrNumber] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const productSearchRef = useRef<SearchSelectHandle | null>(null);

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
      returnLocation: "",
      transactionDocNo: "",
      netAmount: "",
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
  }, [fetchLocations]);

  const handleLocationChange = (locaCode: string) => {
    form.setValue("location", locaCode);
  };

  const handleReturnLocationChange = (value: string) => {
    form.setValue("returnLocation", value);
  };

  useEffect(() => {
    if (!isEditMode || hasDataLoaded.current) return;

    const docNo = searchParams.get("doc_no");
    const status = searchParams.get("status");
    const iid = searchParams.get("iid");

    if (!docNo || !status || !iid) return;

    const loadTransferGoodReturn = async () => {
      hasDataLoaded.current = true;

      try {
        setFetching(true);

        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`
        );

        if (res.success) {
          const tgrData = res.data;
          setTempTgrNumber(tgrData.doc_no);

          const locationCode = tgrData.location?.loca_code || tgrData.location;
          form.setValue("location", locationCode);
          const returnLocationCode =
            tgrData.delivery_location?.loca_code || tgrData.delivery_location;
          form.setValue("returnLocation", returnLocationCode);

          const remarksValue =
            tgrData.remarks_ref || tgrData.remarks || tgrData.ref_remarks || "";
          form.setValue("remarks", remarksValue);

          const recallDocNo = tgrData.recall_doc_no || "";
          form.setValue("transactionDocNo", recallDocNo);

          const netAmount = tgrData.net_total || "";
          form.setValue("netAmount", netAmount);

          setDate(new Date(tgrData.document_date));

          const productDetails =
            tgrData.temp_transaction_details ||
            tgrData.transaction_details ||
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
        console.error("Failed to load transfer good return:", error);
      } finally {
        setFetching(false);
      }
    };

    loadTransferGoodReturn();
  }, [isEditMode, form, searchParams]);

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

  const getPayload = (values: FormData) => {
    const payload = {
      location: values.location,
      delivery_location: values.returnLocation,

      remarks_ref: values.remarks,

      doc_no: tempTgrNumber,
      iid: "TGR",

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

  const onSubmit = async () => {
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
        "/transfer-good-returns/save-tgr",
        payload
      );
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Transfer good return has been applied successfully.",
          type: "success",
        });
        const newDocNo = response.data.data.doc_no;
        setTimeout(() => {
          router.push(
            `/dashboard/transactions/transfer-good-return?tab=applied&view_doc_no=${newDocNo}`
          );
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not apply the TGR.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            router.push("/dashboard/transactions/transfer-good-return")
          }
          className="justify-self-start flex items-center gap-1 px-2 py-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>

        <div className="flex items-center justify-center gap-2">
          <RotateCcw className="h-5 w-5" />
          <h1 className="text-lg font-semibold">
            Manage Transfer of Goods Return
          </h1>
        </div>

        <Badge
          variant="secondary"
          className="justify-self-end px-2 py-1 text-xs h-6"
        >
          <div className="flex items-center gap-2">
            <span>Document No:</span>
            <span>{tempTgrNumber || "..."}</span>
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
                          disabled
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
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label>Date*</Label>
                  <DatePicker
                    date={date}
                    setDate={setDate}
                    placeholder="Select date"
                    required
                    disabled
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="returnLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Location *</FormLabel>
                        <Select
                          onValueChange={handleReturnLocationChange}
                          value={field.value}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="--Choose Return Location--" />
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
                    name="netAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Amount</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
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
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <TableHead className="w-[150px]">Name</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead>Purchase Price</TableHead>
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

              {/* Action Buttons and Total Amount */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4 mt-3">
                  <Button type="button" variant="destructive" disabled>
                    Reject TGR
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || products.length === 0}
                  >
                    Approve TGR
                  </Button>
                </div>
                <div className="text-base font-semibold">
                  Total Amount: {formatThousandSeparator(calculateSubtotal())}
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

export default function TransferGoodReturnForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransferGoodReturnFormContent />
    </Suspense>
  );
}
