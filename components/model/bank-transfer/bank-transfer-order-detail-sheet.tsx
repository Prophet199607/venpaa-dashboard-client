"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import {
  Loader2,
  Package,
  User,
  CreditCard,
  MapPin,
  Store,
  FileText,
  Phone,
  Mail,
  Landmark,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface OrderItem {
  prod_code: string;
  prod_name: string;
  qty: number;
  price: number;
  discount?: number;
  total: number;
}

interface CustomerInfo {
  code?: string;
  name?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  nic?: string;
}

interface OrderTotals {
  sub_total?: number;
  discount?: number;
  courier_charge?: number;
  cod_charge?: number;
  net_total?: number;
  payment?: number;
  balance?: number;
}

interface OrderDetailResponse {
  id: string;
  source: string;
  order_no: string;
  receipt_no: string;
  transaction_date: string;
  bill_date: string;
  bill_time: string;
  operator: string;
  payment_method: string;
  reference_no: string;
  location: string;
  location_name: string;
  status: string;
  customer: CustomerInfo;
  items: OrderItem[];
  totals: OrderTotals;
}

interface BankTransferOrderDetailProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  receiptNo: string;
}

export default function BankTransferOrderDetailSheet({
  isOpen,
  onClose,
  recordId,
  receiptNo,
}: BankTransferOrderDetailProps) {
  const [data, setData] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !recordId) return;
    if (fetchedRef.current === recordId) return;
    fetchedRef.current = recordId;
    setLoading(true);
    setError(null);
    setData(null);

    api
      .get(`/bank-transfer/${recordId}/details`)
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to load order details",
        ),
      )
      .finally(() => setLoading(false));
  }, [isOpen, recordId]);

  const items: OrderItem[] = data?.items ?? [];
  const totals = data?.totals ?? {};
  const customer = data?.customer ?? {};
  const isDelivery = (data?.payment_method ?? "")
    .toLowerCase()
    .includes("delivery");

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between pr-6">
            <div>
              <SheetTitle className="text-lg font-bold flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                Receipt #{data?.receipt_no || receiptNo}
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {data?.bill_date
                  ? `${data.bill_date} ${data.bill_time || ""}`
                  : "Loading..."}
              </SheetDescription>
            </div>
            {data?.status && (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold"
              >
                {data.status}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-70" />
            <p className="text-xs font-medium">
              Loading Bank Transfer details...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-center text-red-600 text-sm">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-4 pb-6">
            {/* Payment & POS Info */}
            <div className="grid grid-cols-2 gap-3">
              {/* Payment Details */}
              <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payment Method
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Type</span>
                    <Badge
                      variant="outline"
                      className={
                        isDelivery
                          ? "bg-amber-50 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0"
                      }
                    >
                      {data.payment_method || "Bank Transfer"}
                    </Badge>
                  </div>
                  {data.reference_no && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Bank Slip Ref
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {data.reference_no}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      LKR{" "}
                      {Number(
                        totals.payment ?? totals.net_total ?? 0,
                      ).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* POS Transaction Details */}
              <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Store className="w-3.5 h-3.5" />
                  POS Information
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Location</span>
                    <span
                      className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[130px]"
                      title={data.location_name}
                    >
                      {data.location_name || data.location}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      Cashier / Operator
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {data.operator || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Channel</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      POS
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details Card (from CRM) */}
            <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <User className="w-3.5 h-3.5" />
                  Customer Details (CRM)
                </div>
                {customer.code && (
                  <Badge variant="outline" className="text-[10px]">
                    {customer.code}
                  </Badge>
                )}
              </div>
              <div className="space-y-2 pt-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-right">
                    {customer.name || "DEFAULT"}
                  </span>
                </div>

                {(customer.mobile || customer.phone) && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone / Mobile
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 text-right">
                      {[customer.mobile, customer.phone]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </div>
                )}

                {customer.email && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 text-right break-all">
                      {customer.email}
                    </span>
                  </div>
                )}

                {customer.nic && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" /> NIC
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 text-right">
                      {customer.nic}
                    </span>
                  </div>
                )}

                {customer.address && (
                  <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-start gap-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {customer.address}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Package className="w-3.5 h-3.5" />
                  Order Items ({items.length})
                </div>
              </div>

              {items.length > 0 ? (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[300px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-neutral-900 dark:text-neutral-100 truncate">
                          {item.prod_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Code: {item.prod_code || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {Number(item.total).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {Number(item.qty)} x{" "}
                          {Number(item.price).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No line items found for this receipt.
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <FileText className="w-3.5 h-3.5" />
                Payment Summary
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span className="font-medium">
                    {Number(totals.sub_total ?? 0).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {Number(totals.discount ?? 0) !== 0 && (
                  <div
                    className={cn(
                      "flex justify-between text-xs",
                      Number(totals.discount) < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    <span>Discount</span>
                    <span>
                      {Number(totals.discount).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                {Number(totals.courier_charge ?? 0) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Courier Charge
                    </span>
                    <span className="font-medium">
                      +
                      {Number(totals.courier_charge).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                <div className="border-t border-neutral-200 dark:border-neutral-800 my-1 pt-1 flex justify-between text-sm font-bold">
                  <span>Net Total</span>
                  <span className="text-primary">
                    LKR{" "}
                    {Number(totals.net_total ?? 0).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Bank Transfer Payment</span>
                  <span>
                    {Number(totals.payment ?? 0).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Balance</span>
                  <span>
                    {Number(totals.balance ?? 0).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
