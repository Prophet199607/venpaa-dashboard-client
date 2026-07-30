"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import {
  Loader2,
  Package,
  User,
  CreditCard,
  MapPin,
  Globe,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface CodOrderDetailItem {
  prod_code: string;
  prod_name: string;
  qty: number;
  price: number;
  total: number;
  discount?: number;
}

interface CodOrderDetailProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  orderNo: string;
}

export default function CodOrderDetailSheet({
  isOpen,
  onClose,
  recordId,
  orderNo,
}: CodOrderDetailProps) {
  const [data, setData] = useState<any>(null);
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
      .get(`/cod-management/${recordId}/details`)
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.error || err.message || "Failed to load details",
        ),
      )
      .finally(() => setLoading(false));
  }, [isOpen, recordId]);

  const items: CodOrderDetailItem[] = data?.items ?? [];
  const totals = data?.totals ?? {};
  const isWeb = data?.source === "WEB";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between pr-8">
            <div>
              <SheetTitle className="text-lg flex items-center gap-2">
                Order #{data?.order_no || orderNo}
              </SheetTitle>
              <SheetDescription>
                {data?.transaction_date
                  ? new Date(data.transaction_date).toLocaleString()
                  : "Loading..."}
              </SheetDescription>
            </div>
            {data?.status && (
              <Badge
                variant="outline"
                className={
                  data.status === "Received"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : data.status === "Returned"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-amber-100 text-amber-800 border-amber-200"
                }
              >
                {data.status}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin opacity-50" />
            <p className="text-sm">Loading order details...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">{error}</div>
        ) : data ? (
          <div className="space-y-4">
            {/* Source & Payment Info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  {isWeb ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : (
                    <Store className="w-3.5 h-3.5" />
                  )}
                  Source
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{data.source || "—"}</span>
                  </div>
                  {data.order_type && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">{data.order_type}</span>
                    </div>
                  )}
                  {/* {data.location && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">
                        {data.location_name || data.location}
                      </span>
                    </div>
                  )} */}
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payment
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Method</span>
                    <Badge
                      variant="outline"
                      className={
                        data.payment_method === "COD"
                          ? "bg-purple-100 text-purple-800 border-purple-200 text-[10px] px-1.5 py-0"
                          : "bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0"
                      }
                    >
                      {data.payment_method || "COD"}
                    </Badge>
                  </div>
                  {data.payment_status && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium capitalize">
                        {data.payment_status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <User className="w-3.5 h-3.5" />
                Customer Details
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-right">
                    {data.customer_name || "N/A"}
                  </span>
                </div>
                {data.customer_email && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-right break-all">
                      {data.customer_email}
                    </span>
                  </div>
                )}
                {data.customer_phone && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium text-right">
                      {data.customer_phone}
                    </span>
                  </div>
                )}
                {data.customer_address && (
                  <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                )}
                {data.customer_address && (
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {[
                        data.customer_address,
                        data.customer_city,
                        data.customer_province,
                        data.customer_postal_code,
                        data.customer_country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Package className="w-3.5 h-3.5" />
                  Order Items ({items.length})
                </div>
              </div>
              {items.length > 0 ? (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">
                          {item.prod_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Code: {item.prod_code || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">
                          {Number(item.total).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {Number(item.qty)} x{" "}
                          {Number(item.price).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No item details available
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payment Summary
                </div>
              </div>
              <div className="p-3 space-y-1.5 text-xs">
                {totals.original_sub_total > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Original Subtotal</span>
                    <span className="font-medium text-foreground">
                      {Number(totals.original_sub_total).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                )}
                {totals.product_discount > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Product Discounts</span>
                    <span>
                      -{" "}
                      {Number(totals.product_discount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {(totals.sub_total || totals.gross_total) && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">
                      {Number(
                        totals.sub_total || totals.gross_total,
                      ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {totals.coupon_discount > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Coupon Discount</span>
                    <span>
                      -{" "}
                      {Number(totals.coupon_discount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {Number(totals.discount) !== 0 && !totals.product_discount && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Discount</span>
                    <span>
                      -{" "}
                      {Math.abs(Number(totals.discount)).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {totals.courier_charge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Courier Charge</span>
                    <span className="font-medium text-foreground">
                      {Number(totals.courier_charge).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {totals.cod_charge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>COD Charge</span>
                    <span className="font-medium text-foreground">
                      {Number(totals.cod_charge).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-primary">Net Total</span>
                  <span className="text-primary">
                    {Number(
                      totals.net_total ?? totals.transaction_amount ?? 0,
                    ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
