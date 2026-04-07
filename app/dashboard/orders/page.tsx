"use client";

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
import { nodeApi } from "@/utils/api-node";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ViewOrder from "@/components/model/order/view-order";
import { ShoppingBag, RefreshCw, Loader2 } from "lucide-react";
import { getColumns, Order, getStatusConfig } from "./columns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatAmount(value: number | string | undefined | null): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function mapOrder(raw: any): Order {
  return {
    id: raw.id ?? raw._id ?? "",
    orderId: raw.orderId ?? raw.order_id ?? "",
    customerName:
      raw.customer_name ||
      (raw.user
        ? `${raw.user.fname || ""} ${raw.user.lname || ""}`.trim()
        : null) ||
      raw.customerName,
    customerEmail:
      raw.customerEmail ??
      raw.customer_email ??
      raw.user?.email ??
      raw.email ??
      "",
    phone: raw.phone ?? raw.mobile ?? raw.user?.phone ?? raw.contact ?? "",
    totalAmount: parseFloat(
      raw.totalAmount ?? raw.total_amount ?? raw.total ?? 0,
    ),
    formattedTotal: formatAmount(
      raw.totalAmount ?? raw.total_amount ?? raw.total ?? 0,
    ),
    status: raw.status ?? "pending",
    paymentMethod:
      raw.paymentMethod ?? raw.payment_method ?? raw.payment_type ?? "",
    orderDate: raw.orderDate
      ? raw.orderDate
      : (raw.order_date ?? raw.createdAt ?? raw.created_at)
        ? new Date(
            raw.order_date ?? raw.createdAt ?? raw.created_at,
          ).toLocaleDateString("en-CA")
        : "",
    itemCount: (() => {
      if (raw.itemCount != null) return raw.itemCount;
      if (raw.item_count != null) return raw.item_count;
      if (Array.isArray(raw.items)) return raw.items.length;
      if (Array.isArray(raw.orderItems)) return raw.orderItems.length;
      if (raw.payload) {
        try {
          const parsed =
            typeof raw.payload === "string"
              ? JSON.parse(raw.payload)
              : raw.payload;
          if (Array.isArray(parsed?.items)) return parsed.items.length;
        } catch {}
      }
      return undefined;
    })(),
    device: raw.device,
    typeName: raw.type_name,
  };
}

// ─── Status count badge ────────────────────────────────────────────────────────
function StatusBadge({ count, status }: { count: number; status: string }) {
  if (count === 0) return null;
  return (
    <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-primary/15 text-primary border-primary/20">
      {count}
    </Badge>
  );
}

// ─── Main Content ──────────────────────────────────────────────────────────────
function OrdersContent() {
  const { toast } = useToast();
  const fetchRef = useRef(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [activeSource, setActiveSource] = useState("all");
  const [viewDialog, setViewDialog] = useState({ isOpen: false, orderId: "" });

  const handleView = useCallback((id: string) => {
    setViewDialog({ isOpen: true, orderId: id });
  }, []);

  const tableColumns = useMemo(() => getColumns(handleView), [handleView]);

  const fetchOrders = useCallback(async () => {
    setFetching(true);
    try {
      const { data: json } = await nodeApi.get("/orders/all");

      // Handle various response shapes
      const rawList: any[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.orders)
            ? json.orders
            : Array.isArray(json?.result)
              ? json.result
              : [];

      setOrders(rawList.map(mapOrder));
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      toast({
        title: "Failed to load orders",
        description: err?.message ?? "Could not reach the orders API.",
        type: "error",
      } as any);
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (fetchRef.current) return;
    fetchOrders();
    fetchRef.current = true;
  }, [fetchOrders]);

  // ── Filtered data by status tab ────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusMatch =
        activeTab === "all" ||
        o.status?.toLowerCase() === activeTab.toLowerCase();
      const sourceMatch =
        activeSource === "all" ||
        (activeSource === "app" && o.device === 1) ||
        (activeSource === "web" && o.device === 2);

      const typeMatch =
        activeType === "all" ||
        (o.typeName?.toLowerCase() || "").includes(activeType.toLowerCase());

      return statusMatch && sourceMatch && typeMatch;
    });
  }, [orders, activeTab, activeSource, activeType]);

  // ── Count per status for badges ────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      const key = (o.status ?? "").toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  // ── Count per source ─────────
  const sourceCounts = useMemo(
    () => ({
      all: orders.length,
      app: orders.filter((o) => o.device === 1).length,
      web: orders.filter((o) => o.device === 2).length,
    }),
    [orders],
  );

  // ── Count per type ─────────
  const typeCounts = useMemo(
    () => ({
      all: orders.length,
      delivery: orders.filter((o) =>
        (o.typeName?.toLowerCase() || "").includes("delivery"),
      ).length,
      pick: orders.filter((o) =>
        (o.typeName?.toLowerCase() || "").includes("pick"),
      ).length,
    }),
    [orders],
  );

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Orders</h1>
            <p className="text-xs text-muted-foreground">
              Manage and track all customer orders from the online store.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={fetching}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={cn("w-4 h-4", fetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STATUS_TABS.map((tab) => {
          const count = statusCounts[tab.value] ?? 0;
          const config =
            tab.value !== "all" ? getStatusConfig(tab.value) : null;
          const Icon = config?.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                activeTab === tab.value
                  ? "bg-primary/5 border-primary/30 shadow-sm"
                  : "bg-background border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
              )}
            >
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1">
                {Icon && <Icon className="w-3 h-3" />}
                {tab.label}
              </span>
              <span
                className={cn(
                  "text-2xl font-bold",
                  activeTab === tab.value ? "text-primary" : "",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table Card ── */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-start justify-between w-full">
                {/* Order Source (Left) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Order Source
                  </span>
                  <Tabs
                    value={activeSource}
                    onValueChange={setActiveSource}
                    className="w-auto"
                  >
                    <TabsList className="h-8 p-1 gap-1">
                      <TabsTrigger
                        value="all"
                        className="text-[11px] px-3 h-6 gap-1"
                      >
                        All Sources
                        <StatusBadge count={sourceCounts.all} status="all" />
                      </TabsTrigger>
                      <TabsTrigger
                        value="app"
                        className="text-[11px] px-3 h-6 gap-1"
                      >
                        App
                        <StatusBadge count={sourceCounts.app} status="app" />
                      </TabsTrigger>
                      <TabsTrigger
                        value="web"
                        className="text-[11px] px-3 h-6 gap-1"
                      >
                        Web
                        <StatusBadge count={sourceCounts.web} status="web" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Order Type (Right) */}
                <div className="flex flex-col gap-1.5 items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
                    Order Type
                  </span>
                  <Tabs
                    value={activeType}
                    onValueChange={setActiveType}
                    className="w-auto"
                  >
                    <TabsList className="h-8 p-1 gap-1">
                      <TabsTrigger
                        value="all"
                        className="text-[11px] px-3 h-6 gap-1"
                      >
                        All Types
                        <StatusBadge count={typeCounts.all} status="all" />
                      </TabsTrigger>
                      <TabsTrigger
                        value="delivery"
                        className="text-[11px] px-3 h-6 gap-1"
                      >
                        Delivery
                        <StatusBadge
                          count={typeCounts.delivery}
                          status="delivery"
                        />
                      </TabsTrigger>
                      <TabsTrigger
                        value="pick"
                        className="text-[11px] px-3 h-6 gap-1"
                      >
                        Pick & Collect
                        <StatusBadge count={typeCounts.pick} status="pick" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {fetching && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground self-start mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading…
                </span>
              )}
            </div>
          </Tabs>
        </CardHeader>

        <CardContent>
          {fetching && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin opacity-40" />
              <p className="text-sm">Fetching orders…</p>
            </div>
          ) : (
            <DataTable columns={tableColumns} data={filteredOrders} />
          )}
        </CardContent>
      </Card>

      {/* ── View Order Modal ── */}
      <ViewOrder
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog({ isOpen: false, orderId: "" })}
        orderId={viewDialog.orderId}
      />
    </div>
  );
}

// ─── Page wrapper with Suspense ────────────────────────────────────────────────
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
