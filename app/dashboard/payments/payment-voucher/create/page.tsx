"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchSelect } from "@/components/ui/search-select";
import { Trash2, Banknote, ArrowLeft, Pencil } from "lucide-react";
import { SupplierSearch } from "@/components/shared/supplier-search";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { PaymentSetOffModal } from "@/components/model/payments/payment-set-off-modal";

const SPECIAL_PAYMENT_MODES = ["PAYMENT SETOFF"];

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

interface Payment {
  mode: string;
  amount: number;
  bankName?: string;
  branch?: string;
  cardType?: string;
  cardNumber?: string;
  chequeNo?: string;
}

export default function PaymentVoucherPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fetched = useRef(false);
  const [branch, setBranch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [bankName, setBankName] = useState("");
  const [cardType, setCardType] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [pmtNo, setPmtNo] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isOverPayment, setIsOverPayment] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [setOffBalance, setSetOffBalance] = useState<string>("");
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [selectedSetOffs, setSelectedSetOffs] = useState<any[]>([]);
  const [isSetOffModalOpen, setIsSetOffModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<PaymentVoucherFormValues>({
    resolver: zodResolver(paymentVoucherSchema),
    defaultValues: {
      supplier: "",
      location: "",
      documentNo: "",
      paymentMode: "Cash",
      amount: "",
    },
  });

  const selectedPaymentMode = form.watch("paymentMode");

  const isCard = useCallback(
    (mode: string) => mode?.toUpperCase().includes("CARD"),
    [],
  );
  const isCheque = useCallback(
    (mode: string) => mode?.toUpperCase().includes("CHEQUE"),
    [],
  );
  const isBank = useCallback(
    (mode: string) =>
      mode?.toUpperCase().includes("BANK") ||
      mode?.toUpperCase().includes("TRANSFER") ||
      mode?.toUpperCase().includes("QR"),
    [],
  );

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

  useEffect(() => {
    const fetchPaymentTypes = async () => {
      try {
        const { data: res } = await api.get("/payment-types");
        if (res.success) {
          setPaymentTypes(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch payment types", err);
      }
    };
    fetchPaymentTypes();
  }, []);

  const generatePmtNumber = useCallback(
    async (locaCode: string, setFetchingState = true): Promise<string> => {
      try {
        if (setFetchingState) {
          setFetching(true);
        }

        const { data: res } = await api.post(
          `/payment-vouchers/generate-code`,
          { loca: locaCode },
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
    [toast],
  );

  useEffect(() => {
    const fetchPendingPayments = async () => {
      if (!supplier || !selectedLocation) return;
      try {
        const { data: res } = await api.get(
          `/payment-vouchers/pending-payments/${supplier}/${selectedLocation}/GRN`,
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

  useEffect(() => {
    const fetchAvailableSetOffs = async () => {
      if (!supplier || !selectedLocation) {
        setSetOffBalance("");
        return;
      }
      try {
        const { data: res } = await api.get(
          `/payment-vouchers/available-set-offs/${supplier}/${selectedLocation}`,
        );
        if (res.success && Array.isArray(res.data)) {
          const total = res.data.reduce(
            (sum: number, item: any) =>
              sum + (Number(item.balance_amount) || 0),
            0,
          );
          setSetOffBalance(total.toFixed(2));
        }
      } catch (err) {
        console.error("Failed to fetch available set offs", err);
      }
    };
    fetchAvailableSetOffs();
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

  const handleDocumentPaidAmountChange = (docNo: string, value: string) => {
    const updatedDocuments = selectedDocuments.map((doc) => {
      if (doc.doc_no === docNo) {
        const paidAmount = parseFloat(value);
        const balanceAmount = parseFloat(doc.balance_amount as string);

        if (!isNaN(paidAmount) && paidAmount > balanceAmount) {
          return { ...doc, paid_amount: balanceAmount.toString() };
        }
        return { ...doc, paid_amount: value };
      }
      return doc;
    });

    setSelectedDocuments(updatedDocuments);

    const totalPaid = updatedDocuments.reduce(
      (sum, doc) => sum + (Number(doc.paid_amount) || 0),
      0,
    );

    setPaymentAmount(totalPaid > 0 ? totalPaid.toString() : "");
  };

  const onSubmit = async (data: PaymentVoucherFormValues) => {
    if (!supplier || !selectedLocation) {
      toast({
        title: "Validation Error",
        description: "Please select supplier and location.",
        type: "error",
      });
      return;
    }

    if (selectedDocuments.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one document.",
        type: "error",
      });
      return;
    }

    if (payments.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one payment.",
        type: "error",
      });
      return;
    }

    const totalSelectedPaymentVal = selectedDocuments.reduce(
      (sum, item) => sum + (Number(item.paid_amount) || 0),
      0,
    );
    const totalPaymentVal = payments.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );

    if (totalPaymentVal < totalSelectedPaymentVal) {
      toast({
        title: "Validation Error",
        description:
          "Total payment amount cannot be less than the selected documents amount.",
        type: "error",
      });
      return;
    }

    if (totalPaymentVal > totalSelectedPaymentVal && !isOverPayment) {
      toast({
        title: "Validation Error",
        description:
          "Excess payment detected. Please check 'Over Payment' to proceed.",
        type: "error",
      });
      return;
    }

    try {
      // Prepare allocations from selected documents
      const allocations = selectedDocuments.map((doc) => ({
        doc_no: doc.doc_no,
        transaction_amount: Number(doc.transaction_amount) || 0,
        balance_amount: Number(doc.balance_amount) || 0,
        paid_amount: Number(doc.paid_amount) || 0,
        transaction_date:
          doc.transaction_date || date?.toISOString().split("T")[0],
      }));

      // Prepare payments array - normalize to always be array of arrays
      const paymentsData = payments.map((payment) => ({
        mode: payment.mode,
        amount: payment.amount,
        bank: payment.bankName || null,
        branch: payment.branch || null,
        chequeNo: payment.chequeNo || null,
        chequeDate:
          isCheque(payment.mode) && date
            ? date.toISOString().split("T")[0]
            : null,
        cardType: payment.cardType || null,
        cardNumber: payment.cardNumber || null,
      }));

      // Calculate over payment (excess payment not allocated to any document)
      // Difference between total payments made and total amount allocated to documents
      const balance = totalSelectedPaymentVal - totalPaymentVal;
      const overPayment = isOverPayment && balance < 0 ? balance : 0;

      // Prepare setoff documents if payment mode is PAYMENT SETOFF
      const setoffDocs = selectedSetOffs.map((doc) => ({
        doc_no: doc.doc_no,
        transaction_amount: Number(doc.transaction_amount) || 0,
        balance_amount: Number(doc.balance_amount) || 0,
        paid_amount: Number(doc.paid_amount) || 0,
        transaction_date: doc.transaction_date,
      }));

      // Prepare request payload
      const payload = {
        receipt: {
          doc_no: pmtNo,
          location: selectedLocation,
          date: date
            ? date.toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          over_payment: overPayment,
        },
        supplier: {
          supplier_code: supplier,
        },
        payments: paymentsData,
        allocations: allocations,
        setoff: {
          selectedDocs: setoffDocs,
        },
      };

      const { data: res } = await api.post(
        "/payment-vouchers/save-pmt",
        payload,
      );

      if (res.success) {
        toast({
          title: "Success",
          description: res.message || "Payment voucher created successfully.",
          type: "success",
        });

        // Reset form
        handleClear();
      } else {
        throw new Error(res.message || "Failed to create payment voucher.");
      }
    } catch (error: any) {
      console.error("Failed to save payment voucher:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to create payment voucher. Please try again.",
        type: "error",
      });
    }
  };

  const handleAddPayment = () => {
    const mode = form.getValues("paymentMode") || "";
    const amount = parseFloat(paymentAmount);

    // Filter out the item currently being edited from validation checks
    const otherPayments =
      editingIndex !== null
        ? payments.filter((_, i) => i !== editingIndex)
        : payments;

    if (selectedDocuments.length > 1 && otherPayments.length > 0) {
      toast({
        title: "Action Denied",
        description:
          "Only one payment record is allowed when multiple documents are selected.",
        type: "error",
      });
      return;
    }

    if (otherPayments.some((p) => p.mode?.toUpperCase() === "PAYMENT SETOFF")) {
      toast({
        title: "Invalid Action",
        description: "Cannot add other payments when a setoff already exists.",
        type: "error",
      });
      return;
    }

    if (mode?.toUpperCase() === "PAYMENT SETOFF") {
      if (otherPayments.length > 0) {
        toast({
          title: "Invalid Action",
          description: "Cannot add setoff when other payments already exist.",
          type: "error",
        });
        return;
      }

      if (selectedDocuments.length === 0) {
        toast({
          title: "No Documents Selected",
          description: "Please select at least one document for set off.",
          type: "error",
        });
        return;
      }

      // Open the set off modal
      setIsSetOffModalOpen(true);
      return;
    }

    if (
      mode?.toUpperCase() === "CASH" &&
      otherPayments.some((p) => p.mode?.toUpperCase() === "CASH")
    ) {
      toast({
        title: "Warning",
        description: "Cannot add more than one cash payment record.",
        type: "warning",
      });
      return;
    }

    if (isCard(mode)) {
      if (!bankName || !cardType || !cardNumber) {
        toast({
          title: "Missing Information",
          description:
            "Bank Name, Card Type, and Card Number are required for card payments.",
          type: "error",
        });
        return;
      }
      const isDuplicate = otherPayments.some(
        (p) =>
          p.mode === mode &&
          p.bankName === bankName &&
          p.cardType === cardType &&
          p.cardNumber === cardNumber,
      );
      if (isDuplicate) {
        toast({
          title: "Warning",
          description: "This card payment has already been added.",
          type: "error",
        });
        return;
      }
    }

    if (mode?.toUpperCase() !== "PAYMENT SETOFF" && (!amount || amount <= 0)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        type: "error",
      });
      return;
    }

    const newPayment: Payment = {
      mode,
      amount,
    };

    if (isCard(mode)) {
      newPayment.bankName = bankName;
      newPayment.cardType = cardType;
      newPayment.cardNumber = cardNumber;
    } else if (isCheque(mode)) {
      newPayment.bankName = bankName;
      newPayment.branch = branch;
      newPayment.chequeNo = chequeNo;
    } else if (isBank(mode)) {
      newPayment.bankName = bankName;
      newPayment.branch = branch;
    }

    if (editingIndex !== null) {
      const updatedPayments = [...payments];
      updatedPayments[editingIndex] = newPayment;
      setPayments(updatedPayments);
      setEditingIndex(null);
    } else {
      setPayments([...payments, newPayment]);
    }

    setPaymentAmount("");
    setBankName("");
    setBranch("");
    setCardType("");
    setCardNumber("");
    setChequeNo("");
    form.setValue("paymentMode", "Cash"); // Reset to default or keep as is, usually good to reset
  };

  const handleEditPayment = (index: number) => {
    const payment = payments[index];
    form.setValue("paymentMode", payment.mode);
    setPaymentAmount(payment.amount.toString());

    if (isCard(payment.mode)) {
      setBankName(payment.bankName || "");
      setCardType(payment.cardType || "");
      setCardNumber(payment.cardNumber || "");
    } else if (isCheque(payment.mode)) {
      setBankName(payment.bankName || "");
      setBranch(payment.branch || "");
      setChequeNo(payment.chequeNo || "");
    } else if (isBank(payment.mode)) {
      setBankName(payment.bankName || "");
      setBranch(payment.branch || "");
    }

    setEditingIndex(index);
  };

  const handleDeletePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setPaymentAmount("");
      setBankName("");
      setBranch("");
      setCardType("");
      setCardNumber("");
      setChequeNo("");
      form.setValue("paymentMode", "Cash");
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

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
      if (payments.length > 0) {
        toast({
          title: "Action Denied",
          description:
            "Cannot remove selected documents while payment records exist. Please remove payments first.",
          type: "error",
        });
        return;
      }
      setSelectedDocuments((prev) => prev.filter((p) => p.doc_no !== docNo));
    }
  };

  const handleRemoveSelectedDocument = (docNo: string) => {
    if (payments.length > 0) {
      toast({
        title: "Action Denied",
        description:
          "Cannot remove selected documents while payment records exist. Please remove payments first.",
        type: "error",
      });
      return;
    }
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
    if (payments.length > 0) {
      toast({
        title: "Action Denied",
        description:
          "Cannot remove selected documents while payment records exist. Please remove payments first.",
        type: "error",
      });
      return;
    }
    setSelectedDocuments((prev) =>
      prev.filter((p) => !pendingPayments.some((p) => p.doc_no === p.doc_no)),
    );
  };

  const handleSetOffConfirm = (data: {
    documents: any[];
    credits: any[];
    setOffAmount: number;
    description: string;
  }) => {
    // Create payment set off record
    const newPayment: Payment = {
      mode: "PAYMENT SETOFF",
      amount: data.setOffAmount,
    };

    setPayments([...payments, newPayment]);

    // Store selected credits for backend
    setSelectedSetOffs(data.credits);

    // Update selected documents with paid amounts
    setSelectedDocuments(data.documents);

    setIsSetOffModalOpen(false);

    // Reset form fields
    setPaymentAmount("");
    form.setValue("paymentMode", "Cash");
  };

  // Fetch supplier name when supplier code changes
  useEffect(() => {
    const fetchSupplierName = async () => {
      if (!supplier) {
        setSupplierName("");
        return;
      }

      try {
        const { data: res } = await api.get(
          `/suppliers/search?query=${encodeURIComponent(supplier)}`,
        );
        if (res.success && res.data.length > 0) {
          const foundSupplier = res.data.find(
            (s: any) => s.sup_code === supplier,
          );
          if (foundSupplier) {
            setSupplierName(foundSupplier.sup_name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch supplier name", err);
      }
    };

    fetchSupplierName();
  }, [supplier]);

  const totalSelectedPayment = selectedDocuments.reduce(
    (sum, item) => sum + (Number(item.paid_amount) || 0),
    0,
  );

  const totalPayment = payments.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );
  const balance = totalSelectedPayment - totalPayment;

  const totalPendingOutstanding = pendingPayments.reduce(
    (sum, item) => sum + (Number(item.balance_amount) || 0),
    0,
  );

  const outstandingAmount =
    (Number(totalPendingOutstanding) || 0) - Number(setOffBalance || 0);

  const handleClear = () => {
    setPayments([]);
    setSelectedDocuments([]);
    setSelectedSetOffs([]);
    setPendingPayments([]);
    setSetOffBalance("");
    setSupplierName("");
    setIsOverPayment(false);
    setPaymentAmount("");
    setBankName("");
    setBranch("");
    setCardType("");
    setCardNumber("");
    setChequeNo("");
    setEditingIndex(null);
    setSupplier("");
    setSelectedLocation("");
    setPmtNo("");
    form.setValue("paymentMode", "Cash");
    form.reset();
  };

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
          className="flex items-center gap-1 px-2 py-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>
      <div className="flex justify-end">
        <Badge variant="secondary" className="px-2 py-1 text-xs h-6">
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
                    value={outstandingAmount.toFixed(2)}
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
                    value={setOffBalance}
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
                    allowFuture
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="flex flex-col h-full">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
                        <TableHead className="w-[50px]">Select</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-4 text-gray-500"
                          >
                            No pending bills
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingPayments.map((item, i) => {
                          const isSelected = selectedDocuments.some(
                            (s) => s.doc_no === item.doc_no,
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
                                      checked as boolean,
                                    )
                                  }
                                  disabled={payments.length > 0}
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
                    <Checkbox
                      id="overpayment"
                      checked={isOverPayment}
                      onCheckedChange={(checked) =>
                        setIsOverPayment(checked as boolean)
                      }
                    />
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
                      disabled={payments.length > 0}
                    >
                      {">>"}
                    </Button>
                    <span className="text-xs font-medium">
                      Total Outstanding
                    </span>
                    <Input
                      className="w-full sm:w-28 h-8 text-right"
                      value={totalPendingOutstanding.toFixed(2)}
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Documents Section */}
            <Card className="flex flex-col h-full">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
                            className="text-center py-4 text-gray-500"
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
                            <TableCell className="text-right w-[120px] p-1">
                              <Input
                                className="h-8 text-right"
                                value={item.paid_amount}
                                onChange={(e) =>
                                  handleDocumentPaidAmountChange(
                                    item.doc_no,
                                    e.target.value,
                                  )
                                }
                                onFocus={(e) => e.target.select()}
                                disabled={payments.length > 0}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  handleRemoveSelectedDocument(item.doc_no)
                                }
                                type="button"
                                disabled={payments.length > 0}
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

                <div className="grid grid-cols-3 items-center gap-3 p-4 border-t">
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
                      disabled={payments.length > 0}
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
                <div className="text-xs font-medium text-gray-700">
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
                        {SPECIAL_PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                        {paymentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
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
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>

                {selectedPaymentMode &&
                  (isCard(selectedPaymentMode) ||
                    isBank(selectedPaymentMode) ||
                    isCheque(selectedPaymentMode)) && (
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

                      {isCard(selectedPaymentMode) && (
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

                      {isCard(selectedPaymentMode) && (
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

                      {!isCard(selectedPaymentMode) && (
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

                      {isCheque(selectedPaymentMode) && (
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
                      {!selectedPaymentMode?.toUpperCase().includes("QR") && (
                        <div>
                          <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                            Date
                          </Label>
                          <DatePicker
                            date={date}
                            setDate={setDate}
                            allowFuture
                          />
                        </div>
                      )}
                    </div>
                  )}

                <div className="flex justify-end mt-8">
                  <Button type="button" onClick={handleAddPayment}>
                    {editingIndex !== null
                      ? "Update Payment"
                      : form.watch("paymentMode")?.toUpperCase() ===
                          "PAYMENT SETOFF"
                        ? "Set Off"
                        : "Add Payment"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payments Section */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-xs font-medium text-gray-700">
                  Payments
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Bank Name</TableHead>
                      <TableHead>Branch / Type</TableHead>
                      <TableHead>Cheque No</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px] text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-4 text-gray-500"
                        >
                          No payments added
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell>{payment.mode}</TableCell>
                          <TableCell>{payment.bankName || "-"}</TableCell>
                          <TableCell>
                            {isCard(payment.mode)
                              ? `${payment.cardType} - ${payment.cardNumber}`
                              : payment.branch || "-"}
                          </TableCell>
                          <TableCell>{payment.chequeNo || "-"}</TableCell>
                          <TableCell className="text-right">
                            {payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="w-[80px] text-center">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditPayment(index)}
                                type="button"
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeletePayment(index)}
                                type="button"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="p-4 border-t mt-auto grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Label>Balance</Label>
                    <Input
                      className="text-right"
                      value={balance.toFixed(2)}
                      readOnly
                    />
                  </div>

                  <div className="grid grid-cols-2 items-center gap-2">
                    <Label>Total Payment</Label>
                    <Input
                      className="text-right"
                      value={totalPayment.toFixed(2)}
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit">Apply</Button>
            <Button variant="secondary" type="button" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </form>
      </Form>

      {/* Payment Set Off Modal */}
      <PaymentSetOffModal
        isOpen={isSetOffModalOpen}
        onClose={() => setIsSetOffModalOpen(false)}
        onConfirm={handleSetOffConfirm}
        documents={selectedDocuments}
        supplierName={supplierName}
        supplierCode={supplier}
        locationCode={selectedLocation}
        paymentAmount={paymentAmount}
      />
    </div>
  );
}
