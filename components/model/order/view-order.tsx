"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nodeApi } from "@/utils/api-node";
import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "@/app/dashboard/orders/columns";
import { Loader2, Package, User, CreditCard, Box } from "lucide-react";

interface ViewOrderProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function ViewOrder({
  isOpen,
  onClose,
  orderId,
}: ViewOrderProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    let mounted = true;
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: json } = await nodeApi.get(`/orders/${orderId}`);

        if (json.successful === false) {
          throw new Error(json.message || "Order not found");
        }

        if (mounted) {
          setData(json.data || json);
        }
      } catch (err: any) {
        if (mounted) {
          setError(
            err.response?.data?.message || err.message || "An error occurred",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const statusConfig = data?.status ? getStatusConfig(data.status) : null;
  const StatusIcon = statusConfig?.icon;

  const items = data?.payload_items || data?.raw_payload?.items || [];
  const totals = data?.raw_payload?.totals || data?.totals || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        hideClose={false}
        className="max-w-6xl w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-neutral-50 dark:bg-neutral-950 flex flex-col"
      >
        <DialogHeader className="p-3 md:p-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                Order #{data?.order_id || orderId}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                {data?.created_at
                  ? new Date(data.created_at).toLocaleString()
                  : "Loading date..."}
              </div>
            </div>
            {statusConfig && (
              <Badge
                variant="outline"
                className={`gap-1 capitalize ${statusConfig.className}`}
              >
                {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                {statusConfig.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
            <Loader2 className="w-4 h-4 animate-spin opacity-50" />
            <p className="text-sm">Loading order details...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-2 md:p-3 grid grid-cols-1 lg:grid-cols-5 gap-3">
              {/* Left Column: Items List */}
              <div className="lg:col-span-3 space-y-3">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden h-full">
                  <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Box className="w-4 h-4" />
                      Order Items ({items.length})
                    </div>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {items.map((item: any, idx: number) => {
                      const price = parseFloat(
                        item.product?.selling_price || 0,
                      );
                      const qty = item.quantity || 1;
                      const total = price * qty;
                      return (
                        <div
                          key={idx}
                          className="p-3 flex items-center justify-between gap-3 text-sm hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs md:text-sm truncate">
                              {item.product?.prod_name || "Unknown Product"}
                            </p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">
                              Code: {item.product?.prod_code || "—"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold">
                              {total.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {qty} x{" "}
                              {price.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Customer, Order Info & Totals */}
              <div className="lg:col-span-2 space-y-3">
                {/* Customer Details */}
                <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <User className="w-4 h-4" />
                    Customer Details
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground text-sm">
                        Name
                      </span>
                      <span className="font-medium text-right text-xs">
                        {data.customer_name || "Unknown"}
                      </span>
                    </div>

                    {data.user?.email && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          Email
                        </span>
                        <span className="break-all text-right text-xs">
                          {data.user.email}
                        </span>
                      </div>
                    )}

                    {data.user?.phone && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          Phone
                        </span>
                        <span className="text-right text-xs">
                          {data.user.phone}
                        </span>
                      </div>
                    )}

                    {data.user?.country && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          Country
                        </span>
                        <span className="text-right text-xs">
                          {data.user.country}
                        </span>
                      </div>
                    )}

                    {data.user?.address && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          Address
                        </span>
                        <span className="text-right text-xs">
                          {data.user.address}
                        </span>
                      </div>
                    )}

                    {data.user?.city && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          City
                        </span>
                        <span className="text-right text-xs">
                          {data.user.city}
                        </span>
                      </div>
                    )}

                    {data.user?.province && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          Province
                        </span>
                        <span className="text-right text-xs">
                          {data.user.province}
                        </span>
                      </div>
                    )}

                    {data.user?.postal_code && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          Postal Code
                        </span>
                        <span className="text-right text-xs">
                          {data.user.postal_code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Package className="w-4 h-4" />
                    Order Info
                  </div>
                  <div className="space-y-1.5 font-medium">
                    <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-1.5 rounded-lg px-2 text-xs">
                      <span className="text-muted-foreground">Source</span>
                      <span>
                        {data.source ||
                          (data.device === 1
                            ? "App"
                            : data.device === 2
                              ? "Web"
                              : "—")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-1.5 rounded-lg px-2 text-xs">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize">
                        {data.type_name || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                  <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CreditCard className="w-4 h-4" />
                      Payment Summary
                    </div>
                  </div>
                  <div className="p-3 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-medium text-foreground">
                        {(totals.subTotal || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Courier Charge</span>
                      <span className="font-medium text-foreground">
                        {(totals.courierCharge || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>COD Charge</span>
                      <span className="font-medium text-foreground">
                        {(totals.codCharge || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between font-bold text-base">
                      <span className="text-primary">Net Total</span>
                      <span className="text-primary">
                        {(
                          totals.netTotalWithCod ||
                          totals.netTotalWithOutCod ||
                          0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
