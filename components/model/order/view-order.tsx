"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { nodeApi } from "@/utils/api-node";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { usePermissions } from "@/context/permissions";
import { getStatusConfig } from "@/app/dashboard/orders/columns";
import {
  Loader2,
  Package,
  User,
  CreditCard,
  Box,
  MapPin as MapPinIcon,
  Gift,
  Plus,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivery",
  "canceled",
];

interface ViewOrderProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onUpdate?: () => void;
}

export default function ViewOrder({
  isOpen,
  onClose,
  orderId,
  onUpdate,
}: ViewOrderProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Location Selector State
  const [locations, setLocations] = useState<any[]>([]);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [priceLevels, setPriceLevels] = useState<Record<string, any[]>>({});
  const [stockData, setStockData] = useState<Record<string, any[]>>({});
  const [fetchingLevels, setFetchingLevels] = useState(false);
  const [rowConfigs, setRowConfigs] = useState<any[]>([]);
  const [fetchingAvailable, setFetchingAvailable] = useState<
    Record<string, boolean>
  >({});

  const fetchOrder = useCallback(
    async (mounted = true) => {
      setLoading(true);
      setError(null);
      try {
        const { data: json } = await nodeApi.get(`/orders/${orderId}`);

        if (json.successful === false) {
          throw new Error(json.message || "Order not found");
        }

        const orderData = json.data || json;
        if (mounted) {
          setData(orderData);
          setSelectedStatus(orderData.status || "");
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
    },
    [orderId],
  );

  const fetchLocations = async () => {
    try {
      const { data: response } = await api.get("/locations");
      if (response.success) {
        setLocations(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch locations", err);
    }
  };

  const fetchPriceLevels = async (items: any[]) => {
    setFetchingLevels(true);
    try {
      const prodCodes = Array.from(
        new Set(
          items
            .map((item: any) => item.product?.prod_code)
            .filter(Boolean) as string[],
        ),
      );
      const levelsMap: Record<string, any[]> = {};
      const stockMap: Record<string, any[]> = {};

      await Promise.all(
        prodCodes.map(async (code) => {
          try {
            const { data: res } = await api.get(
              `/products/${code}/stock-by-location`,
            );
            if (res.success) {
              levelsMap[code] = res.data.price_levels || [];
              stockMap[code] = res.data.level_location_stocks || [];
            }
          } catch (err) {
            console.error(`Failed to fetch data for ${code}`, err);
          }
        }),
      );
      setPriceLevels(levelsMap);
      setStockData(stockMap);
      return levelsMap;
    } finally {
      setFetchingLevels(false);
    }
  };

  const initializeItemConfigs = (
    items: any[],
    fetchedLevelsMap?: Record<string, any[]>,
  ) => {
    const initialRows = items.map((item, idx) => {
      const prodCode = item.product?.prod_code;
      const prodLevels =
        (fetchedLevelsMap
          ? fetchedLevelsMap[prodCode]
          : priceLevels[prodCode]) || [];
      // Default to the latest level key (last item in price_levels array)
      const latestLevel =
        prodLevels.length > 0 ? prodLevels[prodLevels.length - 1] : null;
      const defaultLevelKey = latestLevel ? latestLevel.level_key : "original";
      const defaultSellingPrice = latestLevel
        ? Number(latestLevel.selling_price)
        : Number(item.product?.selling_price || 0);

      return {
        id: Math.random().toString(36).substr(2, 9),
        itemIndex: idx,
        prod_code: prodCode,
        prod_name: item.product?.prod_name,
        location: "",
        price_level_id: defaultLevelKey,
        selling_price: defaultSellingPrice,
        quantity: item.quantity || 1,
      };
    });
    setRowConfigs(initialRows);
  };

  const addNewRow = (itemIndex: number) => {
    const items = data?.payload_items || data?.raw_payload?.items || [];
    const item = items[itemIndex];
    if (!item) return;

    const prodCode = item.product?.prod_code;
    const prodLevels = priceLevels[prodCode] || [];
    const latestLevel =
      prodLevels.length > 0 ? prodLevels[prodLevels.length - 1] : null;
    const defaultLevelKey = latestLevel ? latestLevel.level_key : "original";
    const defaultSellingPrice = latestLevel
      ? Number(latestLevel.selling_price)
      : Number(item.product?.selling_price || 0);

    const currentQty = rowConfigs
      .filter((r) => r.itemIndex === itemIndex)
      .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    const requiredQty = item.quantity;
    const remainingQty = requiredQty - currentQty;

    if (remainingQty <= 0) return;

    const newRow = {
      id: Math.random().toString(36).substr(2, 9),
      itemIndex: itemIndex,
      prod_code: prodCode,
      prod_name: item.product?.prod_name,
      location: "",
      price_level_id: defaultLevelKey,
      selling_price: defaultSellingPrice,
      quantity: remainingQty,
    };
    setRowConfigs((prev) => [...prev, newRow]);
  };

  const removeRow = (rowId: string) => {
    setRowConfigs((prev) => prev.filter((row) => row.id !== rowId));
  };

  const updateRow = (rowId: string, updates: any) => {
    setRowConfigs((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
    );
  };

  // Look up available stock for a given location + price level within a product's stock data
  const getStock = (
    prodCode: string,
    locaCode: string,
    levelKey: string,
  ): number | null => {
    const rows = stockData[prodCode] || [];
    if (!locaCode || !levelKey) return null;

    const match = rows.find(
      (r) => r.loca_code === locaCode && r.level_key === levelKey,
    );
    return match ? Number(match.qty ?? 0) : null;
  };

  useEffect(() => {
    if (!isOpen) {
      setIsLocationDialogOpen(false);
      setPendingStatus(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && locations.length === 0) {
      fetchLocations();
    }
  }, [isOpen, locations.length]);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    let mounted = true;
    fetchOrder(mounted);

    return () => {
      mounted = false;
    };
  }, [isOpen, orderId, fetchOrder]);

  const handleStatusUpdate = async (newStatus: string, location?: string) => {
    if (!newStatus || newStatus === data?.status) return;

    setUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      if (location) {
        updateData.location = location;
      }

      await nodeApi.put(`/orders/${orderId}`, updateData);
      toast({
        title: "Status Updated",
        // description: `Order status changed to ${newStatus}${location ? ` at ${location}` : ""}`,
        description: "Order status has been updated successfully.",
        type: "success",
      });
      // Refresh local data
      await fetchOrder(true);
      // Notify parent
      onUpdate?.();
      onUpdate?.();
      setIsLocationDialogOpen(false);
      setPendingStatus(null);
      setRowConfigs([]);
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || err.message,
        type: "error",
      });
      // Reset selected status to current data status
      setSelectedStatus(data?.status || "");
    } finally {
      setUpdating(false);
    }
  };

  const statusConfig = data?.status ? getStatusConfig(data.status) : null;
  const StatusIcon = statusConfig?.icon;

  const items = data?.payload_items || data?.raw_payload?.items || [];
  const totals = data?.raw_payload?.totals || data?.totals || {};

  return (
    <>
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
              {data && (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedStatus}
                    onValueChange={async (val) => {
                      if (val === "confirmed" && data?.status !== "confirmed") {
                        setPendingStatus(val);
                        setIsLocationDialogOpen(true);
                        const levelsMap = await fetchPriceLevels(items);
                        initializeItemConfigs(items, levelsMap);
                      } else {
                        setSelectedStatus(val);
                        handleStatusUpdate(val);
                      }
                    }}
                    disabled={updating || !hasPermission("update order")}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 w-[140px] capitalize",
                        statusConfig?.className,
                      )}
                    >
                      {updating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                      ) : null}
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[140px] w-[160px]">
                      {ORDER_STATUSES.map((status) => {
                        const config = getStatusConfig(status);
                        const Icon = config.icon;

                        let isDisabled = false;
                        const currentStatus = (
                          data?.status || ""
                        ).toLowerCase();
                        if (
                          !["pending", "confirmed", "canceled"].includes(status)
                        ) {
                          if (status === "processing") {
                            isDisabled = ![
                              "confirmed",
                              "processing",
                              "shipped",
                              "delivery",
                            ].includes(currentStatus);
                          } else if (status === "shipped") {
                            isDisabled = ![
                              "processing",
                              "shipped",
                              "delivery",
                            ].includes(currentStatus);
                          } else if (status === "delivery") {
                            isDisabled = !["shipped", "delivery"].includes(
                              currentStatus,
                            );
                          } else {
                            isDisabled = true;
                          }
                        }

                        return (
                          <SelectItem
                            key={status}
                            value={status}
                            disabled={isDisabled}
                            className="capitalize flex items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
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

                  {/* Gift Receiver Details */}
                  {data.giftDetails && (
                    <div className="bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100 dark:border-rose-800/50 space-y-2 text-sm">
                      <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-400">
                        <Gift className="w-4 h-4" />
                        Gift Receiver Details
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs">
                            Name
                          </span>
                          <span className="font-medium text-right text-xs">
                            {data.giftDetails.first_name}{" "}
                            {data.giftDetails.last_name}
                          </span>
                        </div>

                        {data.giftDetails.email && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs">
                              Email
                            </span>
                            <span className="break-all text-right text-xs font-medium">
                              {data.giftDetails.email}
                            </span>
                          </div>
                        )}

                        {data.giftDetails.phone && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs">
                              Phone
                            </span>
                            <span className="text-right text-xs font-medium">
                              {data.giftDetails.phone}
                            </span>
                          </div>
                        )}

                        {data.giftDetails.address && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs">
                              Address
                            </span>
                            <span className="text-right text-xs font-medium">
                              {data.giftDetails.address}
                            </span>
                          </div>
                        )}

                        {data.giftDetails.city && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs">
                              City
                            </span>
                            <span className="text-right text-xs font-medium">
                              {data.giftDetails.city}
                            </span>
                          </div>
                        )}

                        {data.giftDetails.country && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs">
                              Country
                            </span>
                            <span className="text-right text-xs font-medium">
                              {data.giftDetails.country}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                              ? "Android"
                              : data.device === 2
                                ? "iOS"
                                : data.device === 3
                                  ? "Web"
                                  : "—")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-1.5 rounded-lg px-2 text-xs">
                        <span className="text-muted-foreground">Payment</span>
                        <div className="flex items-center gap-2 font-semibold capitalize">
                          {data.type === 1
                            ? "COD"
                            : data.type === 2
                              ? "Card (PayHere)"
                              : data.type === 3
                                ? "Mintpay"
                                : data.type_name || "—"}
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-1.5 h-4 text-[9px] uppercase",
                              data.payment_status === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200",
                            )}
                          >
                            {data.payment_status || "pending"}
                          </Badge>
                        </div>
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
                      {totals.originalSubTotal > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Original Subtotal</span>
                          <span className="font-medium text-foreground">
                            {totals.originalSubTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      {totals.productDiscountTotal > 0 && (
                        <div className="flex justify-between text-red-500 font-medium text-xs">
                          <span>Product Discounts</span>
                          <span>
                            -{" "}
                            {totals.productDiscountTotal.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">
                          {(totals.subTotal || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {(totals.discountAmount > 0 || totals.appliedCoupon) && (
                        <div className="flex justify-between text-red-500 font-medium text-xs">
                          <span>
                            Coupon Discount{" "}
                            {totals.appliedCoupon?.code
                              ? `(${totals.appliedCoupon.code})`
                              : ""}
                          </span>
                          <span>
                            -{" "}
                            {(
                              totals.discountAmount ||
                              totals.appliedCoupon?.amount ||
                              0
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-muted-foreground">
                        <span>Courier Charge</span>
                        <span className="font-medium text-foreground">
                          {(totals.courierCharge || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {totals.codCharge > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>COD Charge</span>
                          <span className="font-medium text-foreground">
                            {(totals.codCharge || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between font-bold text-base">
                        <span className="text-primary">Net Total</span>
                        <span className="text-primary">
                          {(
                            totals.netTotalWithCod ||
                            totals.netTotalWithoutCod ||
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

      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              Confirm Order Items
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {fetchingLevels ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                <p className="text-xs">Fetching product details...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-2">
                  {items.map((item: any, itemIdx: number) => {
                    const prodCode = item.product?.prod_code;
                    const prodLevels = priceLevels[prodCode] || [];
                    const itemRows = rowConfigs.filter(
                      (row) => row.itemIndex === itemIdx,
                    );
                    const itemTotalQty = itemRows.reduce(
                      (sum, r) => sum + (Number(r.quantity) || 0),
                      0,
                    );
                    const requiredQty = item.quantity || 1;
                    const remainingQty = requiredQty - itemTotalQty;

                    return (
                      <div
                        key={itemIdx}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                      >
                        {/* Product header */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold truncate">
                              {item.product?.prod_name || "Unknown Product"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                              · {prodCode}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono shrink-0 h-4 px-1.5"
                          >
                            Qty: {item.quantity || 0}
                          </Badge>
                        </div>

                        {/* Column headers */}
                        <div className="grid grid-cols-12 gap-1.5 px-3 pt-1.5 pb-0.5">
                          <span className="col-span-4 text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Location
                          </span>
                          <span className="col-span-4 text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Price Level
                          </span>
                          <span className="col-span-2 text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Qty
                          </span>
                          <span className="col-span-1 text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Stock
                          </span>
                          <span className="col-span-1" />
                        </div>

                        <div className="px-3 pb-2 space-y-1">
                          {itemRows.map((row, rowIdx) => {
                            const stock = getStock(
                              prodCode,
                              row.location,
                              row.price_level_id,
                            );
                            const latestLevel =
                              prodLevels.length > 0
                                ? prodLevels[prodLevels.length - 1]
                                : null;
                            const latestPrice = latestLevel
                              ? Number(latestLevel.selling_price)
                              : Number(item.product?.selling_price || 0);
                            return (
                              <div
                                key={row.id}
                                className="grid grid-cols-12 gap-1.5 items-center"
                              >
                                <div className="col-span-4">
                                  <Select
                                    value={row.location}
                                    onValueChange={(val) =>
                                      updateRow(row.id, { location: val })
                                    }
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {locations.map((loc) => (
                                        <SelectItem
                                          key={loc.id}
                                          value={loc.loca_code}
                                          className="text-xs"
                                        >
                                          {loc.loca_name} ({loc.loca_code})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="col-span-4">
                                  <Select
                                    value={row.price_level_id}
                                    onValueChange={(val) => {
                                      const chosenLevel = prodLevels.find(
                                        (pl) => pl.level_key === val,
                                      );
                                      updateRow(row.id, {
                                        price_level_id: val,
                                        selling_price: chosenLevel
                                          ? Number(chosenLevel.selling_price)
                                          : Number(
                                              item.product?.selling_price || 0,
                                            ),
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Price level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {prodLevels.map((pl) => (
                                        <SelectItem
                                          key={pl.level_key}
                                          value={pl.level_key}
                                          className="text-xs"
                                        >
                                          {pl.label} (Rs{" "}
                                          {Number(
                                            pl.selling_price,
                                          ).toLocaleString()}
                                          )
                                        </SelectItem>
                                      ))}
                                      {prodLevels.length === 0 && (
                                        <SelectItem
                                          value="original"
                                          className="text-xs"
                                        >
                                          Original (Rs{" "}
                                          {Number(
                                            item.product?.selling_price || 0,
                                          ).toLocaleString()}
                                          )
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Qty */}
                                <div className="col-span-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max={row.quantity + remainingQty}
                                    className="h-7 text-xs"
                                    value={
                                      row.quantity === 0 ? "" : row.quantity
                                    }
                                    onChange={(e) => {
                                      let val = parseInt(e.target.value);
                                      if (isNaN(val)) val = 0;
                                      const maxAllowed =
                                        row.quantity + remainingQty;
                                      if (val > maxAllowed) val = maxAllowed;
                                      updateRow(row.id, { quantity: val });
                                    }}
                                    onBlur={() => {
                                      if (row.quantity < 1) {
                                        updateRow(row.id, { quantity: 1 });
                                      }
                                    }}
                                  />
                                </div>

                                {/* Available stock badge */}
                                <div className="col-span-1 flex items-center justify-center">
                                  {row.location && row.price_level_id ? (
                                    stock !== null ? (
                                      <span className="text-[10px] font-semibold tabular-nums text-center">
                                        {stock}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground text-center">
                                        —
                                      </span>
                                    )
                                  ) : null}
                                </div>

                                <div className="col-span-1 flex justify-center">
                                  {rowIdx === 0 ? (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-primary hover:bg-primary/10 disabled:opacity-50"
                                      onClick={() => addNewRow(itemIdx)}
                                      disabled={remainingQty <= 0}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                      onClick={() => removeRow(row.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsLocationDialogOpen(false);
                setSelectedStatus(data?.status || "");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                updating ||
                rowConfigs.length === 0 ||
                rowConfigs.some((c) => !c.location || c.quantity <= 0) ||
                items.some((item: any, itemIdx: number) => {
                  const required = item.quantity || 1;
                  const total = rowConfigs
                    .filter((r) => r.itemIndex === itemIdx)
                    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
                  return total !== required;
                })
              }
              onClick={() => {
                if (!pendingStatus) return;

                // Frontend duplicate-combo guard
                const seen = new Set<string>();
                for (const r of rowConfigs) {
                  const key = `${r.prod_code}__${r.location}__${r.price_level_id || ""}`;
                  if (seen.has(key)) {
                    toast({
                      title: "Duplicate Row Detected",
                      description: `Product ${r.prod_code} already has a row for the same location and price level. Please merge or remove the duplicate.`,
                      type: "error",
                    });
                    return;
                  }
                  seen.add(key);
                }

                handleStatusUpdate(pendingStatus, JSON.stringify(rowConfigs));
              }}
            >
              {updating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : null}
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
