"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Info, CheckCircle2, TrendingUp } from "lucide-react";
import { api } from "@/utils/api";
import { DatePicker } from "@/components/ui/date-picker";

interface PaymentMethod {
  id: string;
  method: string;
  amount: string;
  bankName?: string;
  branch?: string;
  date?: string;
  chequeNumber?: string;
  cardNumber?: string;
  advanceId?: string;
  returnId?: string;
  overPaymentId?: string;
  doc_no?: string;
  IID?: string;
}

function isBankTransfer(method: string) {
  return method?.toUpperCase() === "BANK TRANSFER";
}
function isCheque(method: string) {
  return method?.toUpperCase() === "CHEQUE";
}
function isCard(method: string) {
  const m = method?.toUpperCase();
  return m === "CREDIT CARD" || m === "DEBIT CARD";
}
function isCredit(method: string) {
  return method?.toUpperCase() === "CREDIT";
}
function isAdvance(method: string) {
  return method?.toUpperCase() === "ADVANCE";
}
function isReturn(method: string) {
  return method?.toUpperCase() === "RETURN";
}
function isOverPayment(method: string) {
  return method?.toUpperCase() === "OVERPAYMENT";
}

interface PaymentType {
  id: number;
  name: string;
  status: number;
  mandatory: number;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (payments: PaymentMethod[]) => void;
  totalAmount: number;
  invoicePaymentMode?: string;
  customerCode?: string;
  locationCode?: string;
}

export function PaymentDetailsModal({
  isOpen,
  onClose,
  onComplete,
  totalAmount,
  invoicePaymentMode,
  customerCode,
  locationCode,
}: PaymentDetailsModalProps) {
  const [paymentType, setPaymentType] = useState<"single" | "multiple">(
    "single"
  );
  const [singlePaymentMethod, setSinglePaymentMethod] = useState<string>("");
  const [singlePaymentAmount, setSinglePaymentAmount] = useState<string>("");
  const [singleBankName, setSingleBankName] = useState<string>("");
  const [singleBranch, setSingleBranch] = useState<string>("");
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [singleChequeNumber, setSingleChequeNumber] = useState<string>("");
  const [singleCardNumber, setSingleCardNumber] = useState<string>("");
  const [singleAdvanceId, setSingleAdvanceId] = useState<string>("");
  const [singleReturnId, setSingleReturnId] = useState<string>("");
  const [singleIID, setSingleIID] = useState<string>("");
  const [singleOverPaymentId, setSingleOverPaymentId] = useState<string>("");
  const [multiplePayments, setMultiplePayments] = useState<PaymentMethod[]>([
    { id: "1", method: "", amount: "0" },
  ]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loadingPaymentTypes, setLoadingPaymentTypes] = useState(false);
  const [setoffPayments, setSetoffPayments] = useState<{
    advances: any[];
    over_pay: any[];
    return: any[];
  }>({
    advances: [],
    over_pay: [],
    return: [],
  });
  const [loadingSetoff, setLoadingSetoff] = useState(false);
  

  useEffect(() => {
    const fetchPaymentTypes = async () => {
      try {
        setLoadingPaymentTypes(true);
        const response = await api.get("/payment-types/invoice");
        if (response.data.success) {
          setPaymentTypes(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch payment types:", error);
      } finally {
        setLoadingPaymentTypes(false);
      }
    };

    fetchPaymentTypes();
  }, []);

  useEffect(() => {
    const fetchSetoffPayments = async () => {
      if (!customerCode || !locationCode || !isOpen) return;

      try {
        setLoadingSetoff(true);
        const response = await api.get(
          `/payment-types/load-all-setoff-payments/${customerCode}/${locationCode}`
        );
        setSetoffPayments({
          advances: response.data.advances || [],
          over_pay: response.data.over_pay || [],
          return: response.data.return || [],
        });
      } catch (error) {
        console.error("Failed to fetch setoff payments:", error);
      } finally {
        setLoadingSetoff(false);
      }
    };

    fetchSetoffPayments();
  }, [customerCode, locationCode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setPaymentType("single");
      setSinglePaymentMethod("");
      setSinglePaymentAmount(totalAmount.toString());
      setSingleBankName("");
      setSingleBranch("");
      setSingleDate(undefined);
      setSingleChequeNumber("");
      setSingleCardNumber("");
      setSingleAdvanceId("");
      setSingleReturnId("");
      setSingleIID("");
      setSingleOverPaymentId("");
      setMultiplePayments([{ id: "1", method: "", amount: "0" }]);
    }
  }, [isOpen, totalAmount]);

  useEffect(()=>{

  },[]);

  const handleAddPaymentMethod = () => {
    const newId = (multiplePayments.length + 1).toString();
    setMultiplePayments([
      ...multiplePayments,
      { id: newId, method: "", amount: "0" },
    ]);
  };

  const handleRemovePaymentMethod = (id: string) => {
    if (multiplePayments.length > 1) {
      setMultiplePayments(multiplePayments.filter((p) => p.id !== id));
    }
  };

  const handleMultiplePaymentMethodChange = (id: string, method: string) => {
    setMultiplePayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              method,
              bankName: undefined,
              branch: undefined,
              date: undefined,
              chequeNumber: undefined,
              cardNumber: undefined,
              advanceId: undefined,
              returnId: undefined,
              overPaymentId: undefined,
              doc_no: undefined,
            }
          : p
      )
    );
  };

  const handleMultiplePaymentAmountChange = (id: string, amount: string) => {
    const numericValue = amount.replace(/[^0-9.]/g, "");
    setMultiplePayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, amount: numericValue } : p
      )
    );
  };

  const handleMultiplePaymentDetailChange = (
    id: string,
    field: keyof Pick<
      PaymentMethod,
      | "bankName"
      | "branch"
      | "date"
      | "chequeNumber"
      | "cardNumber"
      | "advanceId"
      | "returnId"
      | "overPaymentId"
      | "doc_no"
      | "IID"
    >,
    value: string | undefined
  ) => {
    setMultiplePayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const calculatePaidAmount = (): number => {
    if (paymentType === "single") {
      return parseFloat(singlePaymentAmount) || 0;
    } else {
      return multiplePayments.reduce(
        (sum, p) => sum + (parseFloat(p.amount) || 0),
        0
      );
    }
  };

  const paidAmount = calculatePaidAmount();
  const balance = totalAmount - paidAmount;

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleClear = () => {
    if (paymentType === "single") {
      setSinglePaymentMethod("");
      setSinglePaymentAmount(totalAmount.toString());
      setSingleBankName("");
      setSingleBranch("");
      setSingleDate(undefined);
      setSingleChequeNumber("");
      setSingleCardNumber("");
      setSingleAdvanceId("");
      setSingleReturnId("");
      setSingleOverPaymentId("");
    } else {
      setMultiplePayments([{ id: "1", method: "", amount: "0" }]);
    }
  };

  const isCreditMode =
    invoicePaymentMode?.toUpperCase() === "CREDIT" ||
    (paymentType === "single" && isCredit(singlePaymentMethod)) ||
    (paymentType === "multiple" &&
      multiplePayments.some((p) => isCredit(p.method)));

  const canComplete = balance === 0 || (isCreditMode && balance > 0);

  const handleComplete = () => {
    if (!canComplete) {
      return;
    }

    let payments: PaymentMethod[] = [];
    if (paymentType === "single") {
      if (singlePaymentMethod && singlePaymentAmount) {
        const single: PaymentMethod = {
          id: "1",
          method: singlePaymentMethod,
          amount: singlePaymentAmount,
        };
        if (isBankTransfer(singlePaymentMethod)) {
          single.bankName = singleBankName || undefined;
          single.branch = singleBranch || undefined;
          single.date = singleDate?.toISOString?.();
        } else if (isCheque(singlePaymentMethod)) {
          single.bankName = singleBankName || undefined;
          single.branch = singleBranch || undefined;
          single.chequeNumber = singleChequeNumber || undefined;
          single.date = singleDate?.toISOString?.();
        } else if (isCard(singlePaymentMethod)) {
          single.bankName = singleBankName || undefined;
          single.cardNumber = singleCardNumber || undefined;
          single.date = singleDate?.toISOString?.();
        } else if (isAdvance(singlePaymentMethod)) {
          single.advanceId = singleAdvanceId || undefined;
          single.IID = singleIID || undefined;
          single.doc_no = singleAdvanceId || undefined;
        } else if (isReturn(singlePaymentMethod)) {
          single.returnId = singleReturnId || undefined;
          single.IID = singleIID || undefined;
          single.doc_no = singleReturnId || undefined;
        } else if (isOverPayment(singlePaymentMethod)) {
          single.overPaymentId = singleOverPaymentId || undefined;
          single.IID = singleIID || undefined;
          single.doc_no = singleOverPaymentId || undefined;
        }
        payments = [single];
      }
    } else {
      payments = multiplePayments.filter(
        (p) => p.method && (parseFloat(p.amount) > 0 || isCredit(p.method))
      );
    }

    if (canComplete) {
      onComplete(payments);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Complete your transaction securely
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Payment Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Payment Type</Label>
            <Tabs
              value={paymentType}
              onValueChange={(value) =>
                setPaymentType(value as "single" | "multiple")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Payment</TabsTrigger>
                <TabsTrigger value="multiple">Multiple Payment</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Payment Method Input */}
          {paymentType === "single" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={singlePaymentMethod}
                    onValueChange={(v) => {
                      setSinglePaymentMethod(v);
                      setSingleBankName("");
                      setSingleBranch("");
                      setSingleDate(undefined);
                      setSingleChequeNumber("");
                      setSingleCardNumber("");
                      setSingleAdvanceId("");
                      setSingleReturnId("");
                      setSingleIID("");
                      setSingleOverPaymentId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPaymentTypes ? (
                        <SelectItem value="" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        paymentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="text"
                    value={singlePaymentAmount}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(
                        /[^0-9.]/g,
                        ""
                      );
                      setSinglePaymentAmount(numericValue);
                    }}
                    placeholder="Rs 0"
                  />
                </div>
              </div>
              {/* Bank Transfer: Bank Name, Branch, Date */}
              {isBankTransfer(singlePaymentMethod) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={singleBankName}
                      onChange={(e) => setSingleBankName(e.target.value)}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input
                      value={singleBranch}
                      onChange={(e) => setSingleBranch(e.target.value)}
                      placeholder="Branch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePicker
                      date={singleDate}
                      setDate={setSingleDate}
                      placeholder="Pick date"
                      allowFuture
                    />
                  </div>
                </div>
              )}
              {/* Cheque: Bank Name, Branch, Cheque Number, Date */}
              {isCheque(singlePaymentMethod) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={singleBankName}
                      onChange={(e) => setSingleBankName(e.target.value)}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input
                      value={singleBranch}
                      onChange={(e) => setSingleBranch(e.target.value)}
                      placeholder="Branch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cheque Number</Label>
                    <Input
                      value={singleChequeNumber}
                      onChange={(e) =>
                        setSingleChequeNumber(e.target.value)}
                      placeholder="Cheque Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePicker
                      date={singleDate}
                      setDate={setSingleDate}
                      placeholder="Pick date"
                      allowFuture
                    />
                  </div>
                </div>
              )}
              {/* Credit / Debit Card: Bank Name, Card Number, Date */}
              {isCard(singlePaymentMethod) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={singleBankName}
                      onChange={(e) => setSingleBankName(e.target.value)}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input
                      value={singleCardNumber}
                      onChange={(e) => setSingleCardNumber(e.target.value)}
                      placeholder="Card Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePicker
                      date={singleDate}
                      setDate={setSingleDate}
                      placeholder="Pick date"
                      allowFuture
                    />
                  </div>
                </div>
              )}
              {/* Advance Selection */}
              {isAdvance(singlePaymentMethod) && (
                <div className="pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Select Advance</Label>
                    <Select
                      value={singleAdvanceId}
                      onValueChange={(val) => {
                        setSingleAdvanceId(val);
                        setSingleIID("CADV");
                        const selected = setoffPayments.advances.find(
                           (a: any) => a.doc_no === val
                        );
                        if (selected) {
                          setSinglePaymentAmount(
                            selected.balance_amount.toString()
                          );
                          setSingleIID(selected.iid || "");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an advance document" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSetoff ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : setoffPayments.advances.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No advances available
                          </SelectItem>
                        ) : (
                          setoffPayments.advances.map((adv) => (
                            <SelectItem key={adv.id} value={adv.doc_no}>
                              {adv.doc_no} - Rs{" "}
                              {parseFloat(
                                adv.balance_amount
                              ).toLocaleString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {/*Return*/}
              {isReturn(singlePaymentMethod) && (
                <div className="pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Select Return</Label>
                    <Select
                      value={singleReturnId}
                      onValueChange={(val) => {
                        setSingleReturnId(val);
                        setSingleIID("CUR");
                        const selected = setoffPayments.return.find(
                          (a: any) => a.doc_no === val
                        );
                        if (selected) {
                          setSinglePaymentAmount(
                            selected.balance_amount.toString()
                          );
                          setSingleIID(selected.iid || "");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an return document" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSetoff ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : setoffPayments.return.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No returns available
                          </SelectItem>
                        ) : (
                          setoffPayments.return.map((ret) => (
                            <SelectItem key={ret.id} value={ret.doc_no}>
                              {ret.doc_no} - Rs{" "}
                              {parseFloat(
                                ret.balance_amount
                              ).toLocaleString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {/*Over Payment*/}
              {isOverPayment(singlePaymentMethod) && (
                <div className="pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Select Over Payment</Label>
                    <Select
                      value={singleOverPaymentId}
                      onValueChange={(val) => {
                        setSingleOverPaymentId(val);
                        setSingleIID("OVREC");
                        const selected = setoffPayments.over_pay.find(
                          (a) => a.doc_no === val
                        );
                        if (selected) {
                          setSinglePaymentAmount(
                            selected.balance_amount.toString()
                          );
                          setSingleIID(selected.iid || "");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an over payment document" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSetoff ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : setoffPayments.over_pay.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No over payments available
                          </SelectItem>
                        ) : (
                          setoffPayments.over_pay.map((ovr) => (
                            <SelectItem key={ovr.id} value={ovr.doc_no}>
                              {ovr.doc_no} - Rs{" "}
                              {parseFloat(
                                ovr.balance_amount
                              ).toLocaleString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {multiplePayments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="space-y-2 p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">
                      Payment Method #{index + 1}
                    </Label>
                    {multiplePayments.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemovePaymentMethod(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select
                        value={payment.method}
                        onValueChange={(value) =>
                          handleMultiplePaymentMethodChange(payment.id, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingPaymentTypes ? (
                            <SelectItem value="" disabled>
                              Loading...
                            </SelectItem>
                          ) : (
                            paymentTypes.map((type) => (
                              <SelectItem key={type.id} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="text"
                        value={payment.amount}
                        onChange={(e) =>
                          handleMultiplePaymentAmountChange(
                            payment.id,
                            e.target.value
                          )
                        }
                        placeholder="Rs 0"
                      />
                    </div>
                  </div>
                  {/* Bank Transfer: Bank Name, Branch, Date */}
                  {isBankTransfer(payment.method) && (
                    <div className="grid grid-cols-2 gap-4 pt-2 mt-2 border-t">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={payment.bankName ?? ""}
                          onChange={(e) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "bankName",
                              e.target.value || undefined
                            )
                          }
                          placeholder="Bank Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Input
                          value={payment.branch ?? ""}
                          onChange={(e) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "branch",
                              e.target.value || undefined
                            )
                          }
                          placeholder="Branch"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <DatePicker
                          date={
                            payment.date
                              ? new Date(payment.date)
                              : undefined
                          }
                          setDate={(d) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "date",
                              d?.toISOString?.()
                            )
                          }
                          placeholder="Pick date"
                          allowFuture
                        />
                      </div>
                    </div>
                  )}
                  {/* Cheque: Bank Name, Branch, Cheque Number, Date */}
                  {isCheque(payment.method) && (
                    <div className="grid grid-cols-2 gap-4 pt-2 mt-2 border-t">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={payment.bankName ?? ""}
                          onChange={(e) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "bankName",
                              e.target.value || undefined
                            )
                          }
                          placeholder="Bank Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Input
                          value={payment.branch ?? ""}
                          onChange={(e) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "branch",
                              e.target.value || undefined
                            )
                          }
                          placeholder="Branch"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cheque Number</Label>
                        <Input
                          value={payment.chequeNumber ?? ""}
                          onChange={(e) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "chequeNumber",
                              e.target.value || undefined
                            )
                          }
                          placeholder="Cheque Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <DatePicker
                          date={
                            payment.date
                              ? new Date(payment.date)
                              : undefined
                          }
                          setDate={(d) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "date",
                              d?.toISOString?.()
                            )
                          }
                          placeholder="Pick date"
                          allowFuture
                        />
                      </div>
                    </div>
                  )}
                  {/* Credit / Debit Card: Bank Name, Card Number, Date */}
                  {isCard(payment.method) && (
                    <div className="grid grid-cols-2 gap-4 pt-2 mt-2 border-t">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={payment.bankName ?? ""}
                          onChange={(e) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "bankName",
                              e.target.value || undefined
                            )
                          }
                          placeholder="Bank Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input
                          value={payment.cardNumber ?? ""}
                          onChange={(e) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "cardNumber",
                              e.target.value || undefined
                            )
                          }
                          placeholder="Card Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <DatePicker
                          date={
                            payment.date
                              ? new Date(payment.date)
                              : undefined
                          }
                          setDate={(d) =>
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "date",
                              d?.toISOString?.()
                            )
                          }
                          placeholder="Pick date"
                          allowFuture
                        />
                      </div>
                    </div>
                  )}
                  {/* Advance Selection */}
                  {isAdvance(payment.method) && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="space-y-2">
                        <Label>Select Advance</Label>
                        <Select
                          value={payment.advanceId ?? ""}
                          onValueChange={(val) => {
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "advanceId",
                              val
                            );
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "doc_no",
                              val
                            );
                            const selected = setoffPayments.advances.find(
                              (a: any) => a.doc_no === val
                            );
                            if (selected) {
                              handleMultiplePaymentDetailChange(
                                payment.id,
                                "IID",
                                selected.iid || ""
                              );
                              handleMultiplePaymentAmountChange(
                                payment.id,
                                selected.balance_amount.toString()
                              );
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an advance document" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingSetoff ? (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            ) : setoffPayments.advances.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No advances available
                              </SelectItem>
                            ) : (
                              setoffPayments.advances.map((adv) => (
                                <SelectItem key={adv.id} value={adv.doc_no}>
                                  {adv.doc_no} - Rs{" "}
                                  {parseFloat(
                                    adv.balance_amount
                                  ).toLocaleString()}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {/* Return Selection */}
                  {isReturn(payment.method) && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="space-y-2">
                        <Label>Select Return</Label>
                        <Select
                          value={payment.returnId ?? ""}
                          onValueChange={(val) => {
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "returnId",
                              val
                            );
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "doc_no",
                              val
                            );
                            const selected = setoffPayments.return.find(
                              (a: any) => a.doc_no === val
                            );
                            if (selected) {
                              handleMultiplePaymentDetailChange(
                                payment.id,
                                "IID",
                                selected.iid || ""
                              );
                              handleMultiplePaymentAmountChange(
                                payment.id,
                                selected.balance_amount.toString()
                              );
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an return document" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingSetoff ? (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            ) : setoffPayments.return.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No return available
                              </SelectItem>
                            ) : (
                              setoffPayments.return.map((ret) => (
                                <SelectItem key={ret.id} value={ret.doc_no}>
                                  {ret.doc_no} - Rs{" "}
                                  {parseFloat(
                                    ret.balance_amount
                                  ).toLocaleString()}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {/* Over Payment Selection */}
                  {isOverPayment(payment.method) && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="space-y-2">
                        <Label>Select Over Payment</Label>
                        <Select
                          value={payment.overPaymentId ?? ""}
                          onValueChange={(val) => {
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "overPaymentId",
                              val
                            );
                            handleMultiplePaymentDetailChange(
                              payment.id,
                              "doc_no",
                              val
                            );
                            const selected = setoffPayments.over_pay.find(
                              (a: any) => a.doc_no === val
                            );
                            if (selected) {
                              handleMultiplePaymentDetailChange(
                                payment.id,
                                "IID",
                                selected.iid || ""
                              );
                              handleMultiplePaymentAmountChange(
                                payment.id,
                                selected.balance_amount.toString()
                              );
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an over payment document" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingSetoff ? (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            ) : setoffPayments.over_pay.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No over payments available
                              </SelectItem>
                            ) : (
                              setoffPayments.over_pay.map((ovr) => (
                                <SelectItem key={ovr.id} value={ovr.doc_no}>
                                  {ovr.doc_no} - Rs{" "}
                                  {parseFloat(
                                    ovr.balance_amount
                                  ).toLocaleString()}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPaymentMethod}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          )}

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Total Amount
                  </Label>
                </div>
                <div className="text-2xl font-bold">
                  Rs {formatCurrency(totalAmount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Paid Amount
                  </Label>
                </div>
                <div className="text-2xl font-bold text-primary">
                  Rs {formatCurrency(paidAmount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Balance
                  </Label>
                </div>
                <div className="text-2xl font-bold text-destructive">
                  Rs {formatCurrency(Math.abs(balance))}{" "}
                  {balance > 0 && "(Due)"}
                  {balance < 0 && "(Overpaid)"}
                  {balance === 0 && ""}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleComplete}
              disabled={!canComplete}
            >
              Complete Payment
            </Button>
          </div>
          {!canComplete && balance !== 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {balance < 0 ? "(Overpaid)" : "(Balance must be zero)"}
            </p>
          )}
          {canComplete && balance > 0 && (
            <p className="text-xs text-primary text-center">
              (Remaining balance will be added to credit)
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
