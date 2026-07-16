"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import {
  Loader2,
  Book,
  Users,
  ShoppingCart,
  Briefcase,
  TrendingUp,
  LayoutGrid,
  Clock,
  Search,
  ScrollText,
  X,
  Activity,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import Loader from "@/components/ui/loader";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BillRow, columns, n, lkr } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { BillPreview } from "@/components/model/bill-preview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  stats: {
    total_books: { value: number };
    total_transactions: { value: number };
  };
  extra_stats: {
    authors: number;
    suppliers: number;
    publishers: number;
    categories: number;
    customers: number;
  };
  recent_orders: Array<{
    doc_no: string;
    description: string;
    type: string;
    total: number;
    status: string;
    date: string;
  }>;
  top_products: Array<{
    prod_code: string;
    Item_Descrip: string;
    total_qty: number;
    total_amount: number;
  }>;
}

// ─── Payment method options ───────────────────────────────────────────────────
interface PaymentMethodOption {
  value: string;
  label: string;
  category: "CASH" | "CREDIT";
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: "CASH", label: "Cash", category: "CASH" },
  { value: "PETTY CASH", label: "Petty Cash", category: "CASH" },

  { value: "COD", label: "COD", category: "CREDIT" },
  { value: "VISA", label: "Visa", category: "CREDIT" },
  { value: "MASTER", label: "Master", category: "CREDIT" },
  { value: "BANK TRANSFER", label: "Bank Transfer", category: "CREDIT" },
  { value: "CHEQUE", label: "Cheque", category: "CREDIT" },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardHome() {
  const fetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const { hasPermission, loading: permissionsLoading, user } = usePermissions();

  // ── Location / date / unit ────────────────────────────────────────────────
  const [locations, setLocations] = useState<
    Array<{ loca_code: string; loca_name: string }>
  >([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const [selectedUnit, setSelectedUnit] = useState<string>("1");
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>("ALL");
  const [selectedPayCategory, setSelectedPayCategory] = useState<string>("ALL");

  // ── Bill state ────────────────────────────────────────────────────────────
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillRow | null>(null);

  // ── Init: fetch dashboard stats + locations ───────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const init = async () => {
      try {
        const [statsRes, locsRes, salesRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/locations"),
          api.get("/dashboard/sales-overview", {
            params: { days: 14, location: user?.location },
          }),
        ]);
        if (statsRes.data.success) setData(statsRes.data.data);
        if (salesRes.data.success) setSalesData(salesRes.data.data);
        if (locsRes.data.success) {
          setLocations(locsRes.data.data);
          if (locsRes.data.data.length > 0)
            setSelectedLocation(locsRes.data.data[0].loca_code);
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Payment-filter helpers ────────────────────────────────────────────────
  const handlePayCategoryChange = (val: string) => {
    setSelectedPayCategory(val);
    setSelectedPayMethod("ALL");
  };

  const handlePayMethodChange = (val: string) => {
    setSelectedPayMethod(val);
    if (val !== "ALL") {
      const match = PAYMENT_METHODS.find((m) => m.value === val);
      if (match) setSelectedPayCategory(match.category);
    }
  };

  const filteredMethods =
    selectedPayCategory === "ALL"
      ? PAYMENT_METHODS
      : PAYMENT_METHODS.filter((m) => m.category === selectedPayCategory);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchBills = async () => {
    if (!selectedLocation || !dateFrom || !selectedUnit) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBills([]);
    setLoadingBills(true);
    setHasSearched(true);

    try {
      const res = await api.get("/dashboard/bills", {
        params: {
          location: selectedLocation,
          date_from: dateFrom,
          date_to: dateTo !== dateFrom ? dateTo : undefined,
          unit: selectedUnit,
          pay_type:
            selectedPayCategory === "ALL" ? undefined : selectedPayCategory,
          payment_method:
            selectedPayMethod === "ALL" ? undefined : selectedPayMethod,
        },
        signal: controller.signal,
      });
      setBills(res.data.success ? (res.data.data as BillRow[]) : []);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "CanceledError") return;
      console.error("Failed to fetch bills:", err);
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (!permissionsLoading && !hasPermission("view dashboard stats")) {
    return <AccessDenied />;
  }

  // ── Stat configs ──────────────────────────────────────────────────────────
  const statCardsList = [
    {
      label: "Total Books",
      value: data?.stats.total_books.value ?? 0,
      icon: Book,
      gradient: "from-blue-600/20 to-indigo-800/5",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      accent: "bg-blue-500",
    },
    {
      label: "Transactions",
      value: data?.stats.total_transactions.value ?? 0,
      icon: ShoppingCart,
      gradient: "from-amber-600/20 to-orange-800/5",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      accent: "bg-amber-500",
    },
    {
      label: "Authors",
      value: data?.extra_stats.authors ?? 0,
      icon: Users,
      gradient: "from-violet-600/20 to-purple-800/5",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      accent: "bg-violet-500",
    },
    {
      label: "Suppliers",
      value: data?.extra_stats.suppliers ?? 0,
      icon: Briefcase,
      gradient: "from-emerald-600/20 to-green-800/5",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      accent: "bg-emerald-500",
    },
    {
      label: "Publishers",
      value: data?.extra_stats.publishers ?? 0,
      icon: Book,
      gradient: "from-cyan-600/20 to-sky-800/5",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      accent: "bg-cyan-500",
    },
    {
      label: "Categories",
      value: data?.extra_stats.categories ?? 0,
      icon: LayoutGrid,
      gradient: "from-orange-600/20 to-amber-800/5",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      accent: "bg-orange-500",
    },
    {
      label: "Customers",
      value: data?.extra_stats.customers ?? 0,
      icon: Users,
      gradient: "from-rose-600/20 to-pink-800/5",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      accent: "bg-rose-500",
    },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const grandTotal = bills.reduce((s, b) => s + n(b.NetTotal), 0);

  const pos = salesData?.pos ?? {};
  const online = salesData?.online ?? {};
  const combined = salesData?.combined ?? {};

  const channelData = [
    { name: "POS", value: combined.pos_revenue ?? 0 },
    { name: "Online", value: combined.online_revenue ?? 0 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
          {label}
        </p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="tabular-nums">
            {p.name}: LKR {(p.value ?? 0).toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-4">
      <div className="mb-1">
        <p className="text-xs text-neutral-500 font-medium">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-xl font-bold tracking-tight mt-0.5">
          {greeting}, {user?.name ?? "User"}! 👋
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Here is what&apos;s happening at VENPAA BOOK SHOP.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCardsList.map((s, i) => (
          <div
            key={i}
            className="relative group overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-40 dark:opacity-60`}
            />
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                  {s.label}
                </p>
                <div className={`p-1.5 rounded-lg ${s.iconBg}`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.iconColor}`} />
                </div>
              </div>
              <div className="text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
                {s.value.toLocaleString()}
              </div>
              <div
                className={`mt-2 h-0.5 w-8 rounded-full ${s.accent} opacity-60 group-hover:w-14 transition-all duration-500`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Sales Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* POS + Online Sales Trend */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              Sales Trend (14 Days)
            </h2>
          </div>
          <div className="p-4">
            {!salesData?.daily_trend?.length ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-neutral-400">
                No sales data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={salesData.daily_trend}
                  margin={{ left: -10, right: 0, top: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#6366f1"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="50%"
                        stopColor="#6366f1"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="onlineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop
                        offset="50%"
                        stopColor="#f59e0b"
                        stopOpacity={0.12}
                      />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-neutral-100 dark:text-neutral-800"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9 }}
                    className="text-neutral-400"
                    tickFormatter={(v) => format(new Date(v), "dd MMM")}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    className="text-neutral-400"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pos_amount"
                    stroke="#6366f1"
                    fill="url(#posGrad)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#6366f1",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    name="POS Sales"
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="online_revenue"
                    stroke="#f59e0b"
                    fill="url(#onlineGrad)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#f59e0b",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    name="Online Revenue"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center justify-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] text-neutral-500">POS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[10px] text-neutral-500">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* POS vs Online */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <PieChart className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              POS vs Online Revenue
            </h2>
          </div>
          <div className="p-4">
            {channelData.every((d) => d.value === 0) ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-neutral-400">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    strokeWidth={0}
                    cornerRadius={4}
                  >
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={["#3b82f6", "#f97316"][i % 2]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold text-neutral-700 dark:text-neutral-200">
                            {payload[0].name}
                          </p>
                          <p className="tabular-nums text-neutral-500">
                            {lkr(payload[0].value as number)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </RePieChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {channelData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ["#3b82f6", "#f97316"][i] }}
                  />
                  <span className="text-[10px] text-neutral-500">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products by Revenue */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              Top Products by Revenue
            </h2>
          </div>
          <div className="p-4">
            {!data?.top_products?.length ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-neutral-400">
                No product data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.top_products.map((p) => ({
                    name:
                      p.Item_Descrip.length > 18
                        ? p.Item_Descrip.slice(0, 16) + "..."
                        : p.Item_Descrip,
                    amount: p.total_amount,
                  }))}
                  layout="vertical"
                  margin={{ left: 10, right: 10, top: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="prodBarGrad"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-neutral-100 dark:text-neutral-800"
                    horizontal={false}
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    className="text-neutral-400"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={95}
                    className="text-neutral-500"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill="url(#prodBarGrad)"
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── POS Bills Section ── */}
      <Card className="border-none shadow-sm dark:bg-neutral-900/50">
        <CardHeader className="py-3 flex flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">POS Bill Records</h2>
          </div>
          {bills.length > 0 && (
            <span className="text-[10px] text-neutral-400">
              {bills.length} bill{bills.length !== 1 ? "s" : ""} ·{" "}
              {lkr(grandTotal)}
            </span>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* ── Filters ── */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end bg-neutral-50/50 dark:bg-neutral-800/10 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/50">
            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Location
              </Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem
                      key={loc.loca_code}
                      value={loc.loca_code}
                      className="text-xs"
                    >
                      {loc.loca_name} ({loc.loca_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Date From
              </Label>
              <Input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  // If from > to, snap to to
                  if (e.target.value > dateTo) setDateTo(e.target.value);
                }}
                className="h-9"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Date To
              </Label>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Unit
              </Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                placeholder="e.g. 1"
                className="h-9 text-xs"
              />
            </div>

            {/* Payment Category */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Category
              </Label>
              <Select
                value={selectedPayCategory}
                onValueChange={handlePayCategoryChange}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    All
                  </SelectItem>
                  <SelectItem value="CASH" className="text-xs">
                    Cash
                  </SelectItem>
                  <SelectItem value="CREDIT" className="text-xs">
                    Credit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Method
              </Label>
              <Select
                value={selectedPayMethod}
                onValueChange={handlePayMethodChange}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    All
                  </SelectItem>
                  {filteredMethods.map((m) => (
                    <SelectItem
                      key={m.value}
                      value={m.value}
                      className="text-xs"
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <Button
              onClick={handleSearchBills}
              disabled={loadingBills || !selectedLocation}
              className="h-9 text-xs flex items-center justify-center gap-1.5"
            >
              {loadingBills ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Search Bills
            </Button>
          </div>

          {/* ── Results table ── */}
          <div className="border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden">
            {loadingBills ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                <p className="text-xs text-neutral-500">Loading bills…</p>
              </div>
            ) : !hasSearched ? (
              <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                <ScrollText className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                <p>
                  Select filters and click &quot;Search Bills&quot; to load POS
                  transactions.
                </p>
              </div>
            ) : bills.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                <X className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                <p>No bills found for the selected criteria.</p>
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-4">
                <DataTable
                  columns={columns}
                  data={bills}
                  searchable="Receipt_No"
                  onRowClick={setSelectedBill}
                />

                {/* Grand total footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t-2 border-neutral-200 dark:border-neutral-700 pt-4 text-xs font-bold text-neutral-700 dark:text-neutral-200 gap-4">
                  <div>
                    Total ({bills.length} bill{bills.length !== 1 ? "s" : ""})
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full sm:w-auto sm:text-right">
                    <div>
                      <span className="text-neutral-500 font-medium mr-2">
                        Sub Total:
                      </span>
                      {lkr(bills.reduce((s, b) => s + n(b.subTotal), 0))}
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium mr-2">
                        Discount:
                      </span>
                      <span className="text-red-500">
                        {lkr(bills.reduce((s, b) => s + n(b.Discount), 0))}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-500 font-medium mr-2">
                        Net Total:
                      </span>
                      <span className="text-primary">{lkr(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Bill preview popup ── */}
      {selectedBill && (
        <BillPreview
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}
