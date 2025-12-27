"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import { useForm } from "react-hook-form";
import { CalendarIcon, Trash2, Banknote, ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SearchSelect } from "@/components/ui/search-select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { SupplierSearch } from "@/components/shared/supplier-search";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const PAYMENT_MODES = [
  "PAYMENT SETOFF",
  "CASH",
  "CREDIT CARD",
  "DEBIT CARD",
  "CHEQUE",
  "BANK TRANSFER",
  "QR PAYMENT",
  "MOBILE WALLET",
  "GIFT VOUCHER",
];

const cardTypes = ["Visa", "Master", "Amex"];
const bankListS = [
  "People's Bank",
  "Commercial Bank",
  "Sampath Bank",
  "Hatton National Bank (HNB)",
  "National Development Bank (NDB)",
  "Bank of Ceylon (BOC)",
  "Union Bank",
  "Seylan Bank",
  "DFCC Bank",
  "Cargills Bank",
  "LB Finance",
  "Nations Trust Bank (NTB)",
  "Amana Bank",
  "National Savings Bank",
  "Pan Asia Bank",
  "Sanasa Development Bank",
  "Citizens Development Business Finance PLC",
  "Sri Lanka Savings Bank",
  "Standard Chartered Bank",
  "ICICI Bank",
  "HSBC",
  "MCB Bank",
  "Axis Bank",
  "Indian Bank",
];

// Define a simple schema for now, can be expanded later
const paymentVoucherSchema = z.object({
  supplier: z.string().optional(),
  location: z.string().optional(),
  documentNo: z.string().optional(),
  date: z.date().optional(),
  paymentMode: z.string().optional(),
  amount: z.string().optional(),
});

type PaymentVoucherFormValues = z.infer<typeof paymentVoucherSchema>;

export default function PaymentVoucherPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [supplier, setSupplier] = useState("");
  const [pmtNo, setPmtNo] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  // New state for card details
  const [bankName, setBankName] = useState("");
  const [cardType, setCardType] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  // New state for cheque details
  const [branch, setBranch] = useState("");
  const [chequeNo, setChequeNo] = useState("");

  const form = useForm<PaymentVoucherFormValues>({
    resolver: zodResolver(paymentVoucherSchema),
    defaultValues: {
      supplier: "",
      location: "",
      documentNo: "",
      paymentMode: "CASH",
      amount: "",
    },
  });

  const selectedPaymentMode = form.watch("paymentMode");

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

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

  const generatePmtNumber = useCallback(
    async (locaCode: string, setFetchingState = true): Promise<string> => {
      try {
        if (setFetchingState) {
          setFetching(true);
        }

        const { data: res } = await api.post(
          `/payment-vouchers/generate-code`,
          { loca: locaCode }
        );

        if (res.success && res.code) {
          setPmtNo(res.code);
          return res.code;
        }
        throw new Error("Failed to generate document number.");
      } catch (error: any) {
        console.error("Failed to generate PMT number:", error);
        toast({
          title: "Error",
          description: "Failed to generate document number.",
          type: "error",
        });
        throw error;
      } finally {
        if (setFetchingState) {
          setFetching(false);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    const fetchPendingPayments = async () => {
      if (!supplier || !selectedLocation) return;
      try {
        const { data: res } = await api.get(
          `/payment-vouchers/pending-payments/${supplier}/${selectedLocation}/GRN`
        );
        if (res.success) {
          setPendingPayments(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch pending payments", err);
      }
    };
    fetchPendingPayments();
  }, [supplier, selectedLocation]);

  const handleLocationChange = (locaCode: string) => {
    setSelectedLocation(locaCode);
    form.setValue("location", locaCode);

    if (!locaCode) {
      setHasLoaded(false);
      setPmtNo("");
      form.setValue("documentNo", "");
      return;
    }

    generatePmtNumber(locaCode);
  };

  function onSubmit(data: PaymentVoucherFormValues) {
    console.log(data);
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  const handlePendingPaymentCheck = (docNo: string, checked: boolean) => {
    if (checked) {
      const paymentToAdd = pendingPayments.find((p) => p.doc_no === docNo);
      if (paymentToAdd) {
        setSelectedDocuments((prev) => [
          ...prev,
          {
            ...paymentToAdd,
            paid_amount: 0,
          },
        ]);
      }
    } else {
      setSelectedDocuments((prev) => prev.filter((p) => p.doc_no !== docNo));
    }
  };

  const handleRemoveSelectedDocument = (docNo: string) => {
    setSelectedDocuments((prev) => prev.filter((p) => p.doc_no !== docNo));
  };

  const handleSelectAllPending = () => {
    const newDocuments = pendingPayments
      .filter((p) => !selectedDocuments.some((s) => s.doc_no === p.doc_no))
      .map((p) => ({
        ...p,
        paid_amount: 0,
      }));

    setSelectedDocuments((prev) => [...prev, ...newDocuments]);
  };

  const handleDeselectAllPending = () => {
    setSelectedDocuments((prev) =>
      prev.filter((p) => !pendingPayments.some((p) => p.doc_no === p.doc_no))
    );
  };

  const totalSelectedPayment = selectedDocuments.reduce(
    (sum, item) => sum + (Number(item.balance_amount) || 0),
    0
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Payment Voucher</h1>
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
            {fetching ? (
              <ClipLoader className="h-4 w-4 animate-spin" />
            ) : (
              <span>{pmtNo || "..."}</span>
            )}
          </div>
        </Badge>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                  <Label htmlFor="supplier" className="mb-2 block">
                    Supplier
                  </Label>
                  <SupplierSearch
                    value={supplier}
                    onValueChange={setSupplier}
                  />
                </div>

                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                  <Label htmlFor="location" className="mb-2 block">
                    Location
                  </Label>
                  <Select
                    value={selectedLocation}
                    onValueChange={handleLocationChange}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.loca_code}>
                          {loc.loca_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-6 md:col-span-2 lg:col-span-2">
                  <Label htmlFor="outstanding" className="mb-2 block">
                    Outstanding
                  </Label>
                  <Input
                    id="outstanding"
                    value=""
                    placeholder="0.00"
                    readOnly
                    className="text-right bg-gray-50 bg-opacity-50"
                  />
                </div>

                <div className="col-span-6 md:col-span-2 lg:col-span-2">
                  <Label htmlFor="setoff" className="mb-2 block">
                    Set Off Balance
                  </Label>
                  <Input
                    id="setoff"
                    value=""
                    placeholder="0.00"
                    readOnly
                    className="text-right bg-gray-50 bg-opacity-50"
                  />
                </div>

                <div className="col-span-6 md:col-span-2 lg:col-span-2">
                  <Label htmlFor="date" className="mb-2 block">
                    Date
                  </Label>
                  <DatePicker
                    date={date}
                    setDate={setDate}
                    className="h-10"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="flex flex-col h-full">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pending Payments
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-auto max-h-[300px]">
                  <Table className="text-xs">
                    <TableHeader className="sticky top-0">
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead className="text-right w-[80px]">
                          Amount
                        </TableHead>
                        <TableHead className="text-right w-[80px]">
                          Balance Amount
                        </TableHead>
                        <TableHead className="w-[50px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-gray-500 text-sm"
                          >
                            No pending bills
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingPayments.map((item, i) => {
                          const isSelected = selectedDocuments.some(
                            (s) => s.doc_no === item.doc_no
                          );
                          return (
                            <TableRow key={i}>
                              <TableCell>{item.doc_no}</TableCell>
                              <TableCell>{item.transaction_date}</TableCell>
                              <TableCell className="text-right">
                                {Number(item.transaction_amount).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                {Number(item.balance_amount).toFixed(2)}
                              </TableCell>
                              <TableCell className="w-[50px] text-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handlePendingPaymentCheck(
                                      item.doc_no,
                                      checked as boolean
                                    )
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 border-t mt-auto flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="overpayment" />
                    <Label
                      htmlFor="overpayment"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Over Payment
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={handleSelectAllPending}
                      type="button"
                    >
                      {">>"}
                    </Button>
                    <span className="text-xs font-medium">
                      Total Outstanding
                    </span>
                    <Input
                      className="w-full sm:w-28 h-8 text-right"
                      value="0.00"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Documents Section */}
            <Card className="flex flex-col h-full">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected Documents
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-auto max-h-[300px]">
                  <Table className="text-xs">
                    <TableHeader className="sticky top-0">
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead className="text-right w-[80px]">
                          Amount
                        </TableHead>
                        <TableHead className="text-right w-[80px]">
                          Balance Amount
                        </TableHead>
                        <TableHead className="text-right w-[80px]">
                          Paid Amount
                        </TableHead>
                        <TableHead className="w-[50px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDocuments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-gray-500"
                          >
                            No documents selected
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedDocuments.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.doc_no}</TableCell>
                            <TableCell>{item.transaction_date}</TableCell>
                            <TableCell className="text-right">
                              {Number(item.transaction_amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(item.balance_amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(item.paid_amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  handleRemoveSelectedDocument(item.doc_no)
                                }
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

                <div className="grid grid-cols-3 items-center gap-3">
                  <span className="text-xs font-medium text-left">
                    Total Selected Payment
                  </span>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={handleDeselectAllPending}
                      type="button"
                    >
                      {"<<"}
                    </Button>
                  </div>

                  <Input
                    className="justify-self-end w-28 h-8 text-right"
                    value={totalSelectedPayment.toFixed(2)}
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Mode Section */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700">
                  Payment Mode
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <div className="flex gap-4 mb-4">
                  <div className="w-1/2">
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Payment Mode
                    </Label>
                    <Select
                      value={form.watch("paymentMode")}
                      onValueChange={(val) => form.setValue("paymentMode", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-1/2">
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Amount
                    </Label>
                    <Input
                      type="number"
                      className="text-right"
                      placeholder="0"
                    />
                  </div>
                </div>

                {selectedPaymentMode &&
                  [
                    "CREDIT CARD",
                    "DEBIT CARD",
                    "BANK TRANSFER",
                    "CHEQUE",
                    "QR PAYMENT",
                    "MOBILE WALLET",
                    "GIFT VOUCHER",
                  ].includes(selectedPaymentMode) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                          Bank Name
                        </Label>
                        <SearchSelect
                          items={bankListS.map((bank) => ({
                            value: bank,
                            label: bank,
                          }))}
                          value={bankName}
                          onValueChange={setBankName}
                          placeholder="Select Bank"
                          searchPlaceholder="Search bank..."
                          emptyMessage="No bank found."
                        />
                      </div>

                      {["CREDIT CARD", "DEBIT CARD"].includes(
                        selectedPaymentMode
                      ) && (
                        <div>
                          <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                            Card Type
                          </Label>
                          <Select value={cardType} onValueChange={setCardType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Card Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {cardTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {["CREDIT CARD", "DEBIT CARD"].includes(
                        selectedPaymentMode
                      ) && (
                        <div>
                          <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                            Card Number
                          </Label>
                          <Input
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="Enter Card Number"
                          />
                        </div>
                      )}

                      {!["CREDIT CARD", "DEBIT CARD"].includes(
                        selectedPaymentMode
                      ) && (
                        <div>
                          <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                            Branch
                          </Label>
                          <Input
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="Enter Branch"
                          />
                        </div>
                      )}

                      {selectedPaymentMode === "CHEQUE" && (
                        <div>
                          <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                            Cheque No
                          </Label>
                          <Input
                            value={chequeNo}
                            onChange={(e) => setChequeNo(e.target.value)}
                            placeholder="Enter Cheque Number"
                          />
                        </div>
                      )}
                      {![
                        "QR PAYMENT",
                        "MOBILE WALLET",
                        "GIFT VOUCHER",
                      ].includes(selectedPaymentMode) && (
                        <div>
                          <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                            Date
                          </Label>
                          <DatePicker date={date} setDate={setDate} />
                        </div>
                      )}
                    </div>
                  )}

                <div className="flex justify-end mt-8">
                  <Button>
                    {form.watch("paymentMode") === "PAYMENT SETOFF"
                      ? "Set Off"
                      : "Select pending first"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payments Section */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700">
                  Payments
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-auto min-h-[120px]">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Cheque No</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-gray-500 text-sm"
                          >
                            No payments added
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 border-t mt-auto flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Balance</Label>
                    <Input
                      className="w-32 h-8 text-right bg-yellow-50 border-yellow-200"
                      value="0.00"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Total Payment</Label>
                    <Input
                      className="w-32 h-8 text-right bg-yellow-50 border-yellow-200"
                      value="0.00"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
            >
              Apply
            </Button>
            <Button
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 min-w-[100px]"
            >
              Clear
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
