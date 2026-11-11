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
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  RotateCw,
  Layers,
  Sparkles,
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
  Sector,
} from "recharts";
import Loader from "@/components/ui/loader";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lkr } from "./columns";
import { Button } from "@/components/ui/button";
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardHome() {
  const fetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [trendFilterType, setTrendFilterType] = useState<
    "month_wise" | "year_wise"
  >("month_wise");
  const [trendPeriod, setTrendPeriod] = useState<string>("12_months");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [activeTrendBarIndex, setActiveTrendBarIndex] = useState<number | null>(
    null,
  );
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(
    null,
  );
  const { hasPermission, loading: permissionsLoading, user } = usePermissions();

  const fetchSalesTrend = async (
    filterType: "month_wise" | "year_wise",
    period: string,
  ) => {
    setSalesLoading(true);
    try {
      const params: any = {
        filter_type: filterType,
        location: user?.location,
      };
      if (filterType === "month_wise") {
        if (period === "12_months") {
          params.period = "12_months";
        } else {
          params.period = period;
          params.year = period;
        }
      } else {
        params.period = "all";
      }

      const res = await api.get("/dashboard/sales-overview", { params });
      if (res.data.success) {
        setSalesData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch sales overview:", err);
    } finally {
      setSalesLoading(false);
    }
  };

  // ── Init: fetch dashboard stats + locations ───────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const init = async () => {
      try {
        const [statsRes, salesRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/sales-overview", {
            params: {
              filter_type: "month_wise",
              period: "12_months",
              location: user?.location,
            },
          }),
        ]);
        if (statsRes.data.success) setData(statsRes.data.data);
        if (salesRes.data.success) setSalesData(salesRes.data.data);
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user?.location]);

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

  const pos = salesData?.pos ?? {};
  const online = salesData?.online ?? {};
  const combined = salesData?.combined ?? {};

  const trendData: any[] = salesData?.trend ?? [];

  const fourteenDaysData: any[] =
    salesData?.fourteen_days_trend ?? salesData?.daily_trend ?? [];

  const totalPeriodRevenue =
    salesData?.period_summary?.total_revenue ??
    trendData.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);

  const posPeriodRevenue =
    salesData?.period_summary?.pos_revenue ??
    trendData.reduce((acc, curr) => acc + (curr.pos_amount || 0), 0);

  const onlinePeriodRevenue =
    salesData?.period_summary?.online_revenue ??
    trendData.reduce((acc, curr) => acc + (curr.online_revenue || 0), 0);

  const posPeriodPct =
    totalPeriodRevenue > 0
      ? ((posPeriodRevenue / totalPeriodRevenue) * 100).toFixed(1)
      : "0";

  const onlinePeriodPct =
    totalPeriodRevenue > 0
      ? ((onlinePeriodRevenue / totalPeriodRevenue) * 100).toFixed(1)
      : "0";

  const avgRevenue =
    trendData.length > 0
      ? Math.round(totalPeriodRevenue / trendData.length)
      : 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const start12m = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const label12m = `Last 12 Months (${format(start12m, "MMM yyyy")} – ${format(now, "MMM yyyy")})`;

  const availableYears: number[] =
    salesData?.filter?.available_years &&
    salesData.filter.available_years.length > 0
      ? salesData.filter.available_years
      : [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const channelData = [
    { name: "POS", value: posPeriodRevenue || combined.pos_revenue || 0 },
    {
      name: "Online",
      value: onlinePeriodRevenue || combined.online_revenue || 0,
    },
  ];

  const formatCompactLkr = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return `${v}`;
  };

  const CustomTrendTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const pt = payload[0]?.payload;
    if (!pt) return null;

    const fullLabel = pt.label || pt.short_label || pt.key || "";
    const posVal = Number(pt.pos_amount || 0);
    const onlVal = Number(pt.online_revenue || 0);
    const totVal = Number(pt.total_revenue ?? posVal + onlVal);
    const posPct = totVal > 0 ? ((posVal / totVal) * 100).toFixed(1) : "0";
    const onlPct = totVal > 0 ? ((onlVal / totVal) * 100).toFixed(1) : "0";

    return (
      <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-700/80 rounded-2xl p-3.5 shadow-xl text-xs min-w-[220px] space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
            {fullLabel}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {lkr(totVal)}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#1882b4" }}
              />
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                POS Sales
              </span>
            </div>
            <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
              {lkr(posVal)}{" "}
              <span className="text-[10px] text-neutral-400 font-normal">
                ({posPct}%)
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#F6AB27" }}
              />
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                Online Revenue
              </span>
            </div>
            <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
              {lkr(onlVal)}{" "}
              <span className="text-[10px] text-neutral-400 font-normal">
                ({onlPct}%)
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-700/80 rounded-2xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
        <p className="font-bold text-neutral-800 dark:text-neutral-200 pb-1 border-b border-neutral-100 dark:border-neutral-800">
          {label}
        </p>
        {payload.map((p: any, i: number) => (
          <p
            key={i}
            style={{ color: p.color }}
            className="tabular-nums font-medium flex items-center justify-between gap-4"
          >
            <span>{p.name}:</span>
            <span className="font-bold">
              LKR {(p.value ?? 0).toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  };

  const CustomProductTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const rawData = p.payload || {};
    const prodName = rawData.fullName || rawData.name || "Product";
    const amount = Number(p.value) || 0;
    const qty = rawData.qty ?? 0;
    const totalTop =
      data?.top_products?.reduce(
        (acc: number, cur: any) => acc + (cur.total_amount || 0),
        0,
      ) || 1;
    const pct = ((amount / totalTop) * 100).toFixed(1);

    return (
      <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-700/80 rounded-2xl p-3 shadow-xl text-xs min-w-[210px] space-y-2">
        <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
            style={{ backgroundColor: "#1882b4" }}
          />
          <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs truncate max-w-[200px]">
            {prodName}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 text-[11px]">Revenue</span>
          <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
            {lkr(amount)}
          </span>
        </div>
        {qty > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-[11px]">Qty Sold</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
              {qty.toLocaleString()} units
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <span className="text-neutral-500 text-[11px]">Share of Top</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1882b4]/10 text-[#1882b4]">
            {pct}%
          </span>
        </div>
      </div>
    );
  };

  const renderActivePieShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;
    return (
      <g>
        {/* Soft natural depth under active slice */}
        <Sector
          cx={cx}
          cy={cy + 2}
          innerRadius={innerRadius - 1}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="#000000"
          opacity={0.08}
          cornerRadius={6}
        />
        {/* Elevated Active Sector */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#ffffff"
          strokeWidth={2}
          cornerRadius={6}
        />
      </g>
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

      {/* ── Sales Trend Revenue Chart (Full Width) ── */}
      <div className="w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        {/* Card Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-transparent via-neutral-50/40 to-transparent dark:via-neutral-800/10">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-500 ring-1 ring-emerald-500/20 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Sales Trend Revenue
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {trendFilterType === "month_wise"
                    ? "Month-wise"
                    : "Year-wise"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[280px] sm:max-w-none">
                {trendFilterType === "month_wise"
                  ? trendPeriod === "12_months"
                    ? `Rolling 12-Month overview (${format(start12m, "MMM yyyy")} – ${format(now, "MMM yyyy")})`
                    : `Monthly breakdown for Year ${trendPeriod}`
                  : `Annual revenue comparison across years`}
              </p>
            </div>
          </div>

          {/* Filter & View Controls (Inline In-Between) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Pills (Month-wise / Year-wise) */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTrendFilterType("month_wise");
                  fetchSalesTrend("month_wise", trendPeriod);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0",
                  trendFilterType === "month_wise"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                Month-wise
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrendFilterType("year_wise");
                  fetchSalesTrend("year_wise", "all");
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0",
                  trendFilterType === "year_wise"
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Year-wise
              </button>
            </div>

            {/* Range / Year Select */}
            {trendFilterType === "month_wise" && (
              <Select
                value={trendPeriod}
                onValueChange={(val) => {
                  setTrendPeriod(val);
                  fetchSalesTrend("month_wise", val);
                }}
              >
                <SelectTrigger className="h-8 w-[125px] px-2.5 text-xs font-medium rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm shrink-0 [&>span]:truncate">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="12_months">Last 12 Months</SelectItem>
                  {availableYears.map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>
                      Year {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Chart Type Toggle (Area vs Bar) */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setChartType("area")}
                title="Area Chart"
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  chartType === "area"
                    ? "bg-white dark:bg-neutral-900 text-primary shadow-sm"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                title="Bar Chart"
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  chartType === "bar"
                    ? "bg-white dark:bg-neutral-900 text-primary shadow-sm"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                )}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchSalesTrend(trendFilterType, trendPeriod)}
              disabled={salesLoading}
              title="Refresh Sales Data"
              className="h-8.5 w-8.5 rounded-xl border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0"
            >
              <RotateCw
                className={cn(
                  "w-3.5 h-3.5",
                  salesLoading && "animate-spin text-primary",
                )}
              />
            </Button>
          </div>
        </div>

        {/* ── Summary Stats Ribbon ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-neutral-50/60 dark:bg-neutral-950/40 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Period Total Revenue
            </span>
            <div className="text-base lg:text-lg font-bold text-neutral-900 dark:text-white mt-0.5 tabular-nums">
              {lkr(totalPeriodRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <Sparkles className="w-3 h-3" />
              Combined Revenue
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                POS Sales
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#1882b4]/10 text-[#1882b4]">
                {posPeriodPct}%
              </span>
            </div>
            <div className="text-base lg:text-lg font-bold text-neutral-900 dark:text-white mt-0.5 tabular-nums">
              {lkr(posPeriodRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#1882b4" }}
              />
              In-store Point of Sale
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Online Revenue
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F6AB27]/15 text-[#d98e0c]">
                {onlinePeriodPct}%
              </span>
            </div>
            <div className="text-base lg:text-lg font-bold text-neutral-900 dark:text-white mt-0.5 tabular-nums">
              {lkr(onlinePeriodRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#F6AB27" }}
              />
              Web + Mobile App
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {trendFilterType === "month_wise"
                ? "Monthly Average"
                : "Yearly Average"}
            </span>
            <div className="text-base lg:text-lg font-bold text-neutral-900 dark:text-white mt-0.5 tabular-nums">
              {lkr(avgRevenue)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">
              Across {trendData.length}{" "}
              {trendFilterType === "month_wise" ? "months" : "years"}
            </div>
          </div>
        </div>

        {/* ── Chart Container ── */}
        <div className="relative p-5">
          {salesLoading && (
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Updating sales trend...
              </div>
            </div>
          )}

          {!trendData?.length ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-xs text-neutral-400 gap-2">
              <Activity className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
              <span>No sales data available for the selected period</span>
            </div>
          ) : (
            <div className="w-full h-[320px] lg:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart
                    data={trendData}
                    margin={{ left: 5, right: 15, top: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#1882b4"
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="50%"
                          stopColor="#1882b4"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="100%"
                          stopColor="#1882b4"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="onlineGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#F6AB27"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="50%"
                          stopColor="#F6AB27"
                          stopOpacity={0.12}
                        />
                        <stop
                          offset="100%"
                          stopColor="#F6AB27"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-neutral-100 dark:text-neutral-800"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="short_label"
                      tick={{ fontSize: 10 }}
                      className="text-neutral-400"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      className="text-neutral-400"
                      tickFormatter={formatCompactLkr}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip content={<CustomTrendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="pos_amount"
                      stroke="#1882b4"
                      fill="url(#posGrad)"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: "#1882b4",
                        strokeWidth: 1.5,
                        stroke: "#fff",
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#1882b4",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      name="POS Sales"
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="online_revenue"
                      stroke="#F6AB27"
                      fill="url(#onlineGrad)"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: "#F6AB27",
                        strokeWidth: 1.5,
                        stroke: "#fff",
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#F6AB27",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      name="Online Revenue"
                      connectNulls
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={trendData}
                    margin={{ left: 5, right: 15, top: 10, bottom: 5 }}
                    barGap={6}
                    onMouseMove={(state: any) => {
                      if (state?.activeTooltipIndex !== undefined) {
                        setActiveTrendBarIndex(state.activeTooltipIndex);
                      }
                    }}
                    onMouseLeave={() => setActiveTrendBarIndex(null)}
                  >
                    <defs>
                      {/* POS Natural 3D Gradient */}
                      <linearGradient id="posBar3D" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#48a6d4" />
                        <stop offset="45%" stopColor="#1882b4" />
                        <stop offset="100%" stopColor="#105e84" />
                      </linearGradient>
                      {/* POS Hovered 3D Gradient */}
                      <linearGradient
                        id="posBar3DHover"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#6ec0e7" />
                        <stop offset="45%" stopColor="#2c9bd2" />
                        <stop offset="100%" stopColor="#1882b4" />
                      </linearGradient>
                      {/* Online Natural 3D Gradient */}
                      <linearGradient
                        id="onlineBar3D"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#fed77d" />
                        <stop offset="45%" stopColor="#F6AB27" />
                        <stop offset="100%" stopColor="#df9313" />
                      </linearGradient>
                      {/* Online Hovered 3D Gradient */}
                      <linearGradient
                        id="onlineBar3DHover"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#fee685" />
                        <stop offset="45%" stopColor="#f8be52" />
                        <stop offset="100%" stopColor="#F6AB27" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-neutral-100 dark:text-neutral-800"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="short_label"
                      tick={{ fontSize: 10 }}
                      className="text-neutral-400"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      className="text-neutral-400"
                      tickFormatter={formatCompactLkr}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip content={<CustomTrendTooltip />} cursor={false} />
                    <Bar
                      dataKey="pos_amount"
                      name="POS Sales"
                      radius={[6, 6, 0, 0]}
                      className="cursor-pointer"
                    >
                      {trendData.map((_, index) => {
                        const isHovered = activeTrendBarIndex === index;
                        const isAnyHovered = activeTrendBarIndex !== null;
                        return (
                          <Cell
                            key={`pos-${index}`}
                            fill={
                              isHovered
                                ? "url(#posBar3DHover)"
                                : "url(#posBar3D)"
                            }
                            opacity={isAnyHovered && !isHovered ? 0.7 : 1}
                            stroke={isHovered ? "#ffffff" : "transparent"}
                            strokeWidth={isHovered ? 1.5 : 0}
                            className="transition-all duration-200"
                          />
                        );
                      })}
                    </Bar>
                    <Bar
                      dataKey="online_revenue"
                      name="Online Revenue"
                      radius={[6, 6, 0, 0]}
                      className="cursor-pointer"
                    >
                      {trendData.map((_, index) => {
                        const isHovered = activeTrendBarIndex === index;
                        const isAnyHovered = activeTrendBarIndex !== null;
                        return (
                          <Cell
                            key={`online-${index}`}
                            fill={
                              isHovered
                                ? "url(#onlineBar3DHover)"
                                : "url(#onlineBar3D)"
                            }
                            opacity={isAnyHovered && !isHovered ? 0.7 : 1}
                            stroke={isHovered ? "#ffffff" : "transparent"}
                            strokeWidth={isHovered ? 1.5 : 0}
                            className="transition-all duration-200"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Interactive Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-xs"
                style={{ backgroundColor: "#1882b4" }}
              />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                POS Sales
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-xs"
                style={{ backgroundColor: "#F6AB27" }}
              />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Online Revenue
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-Column Charts: 14-Day Sales Trend, POS vs Online & Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* POS + Online Sales Trend (14 Days) */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                Sales Trend (14 Days)
              </h2>
            </div>
          </div>
          <div className="p-4">
            {!fourteenDaysData?.length ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-neutral-400">
                No sales data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={fourteenDaysData}
                  margin={{ left: -10, right: 0, top: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="posGrad14" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#1882b4"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="50%"
                        stopColor="#1882b4"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#1882b4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="onlineGrad14"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#F6AB27" stopOpacity={0.4} />
                      <stop
                        offset="50%"
                        stopColor="#F6AB27"
                        stopOpacity={0.12}
                      />
                      <stop offset="100%" stopColor="#F6AB27" stopOpacity={0} />
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
                    tickFormatter={(v) => {
                      try {
                        return format(new Date(v), "dd MMM");
                      } catch {
                        return v;
                      }
                    }}
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
                    stroke="#1882b4"
                    fill="url(#posGrad14)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#1882b4",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    name="POS Sales"
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="online_revenue"
                    stroke="#F6AB27"
                    fill="url(#onlineGrad14)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#F6AB27",
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
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#1882b4" }}
                />
                <span className="text-[10px] text-neutral-500">POS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#F6AB27" }}
                />
                <span className="text-[10px] text-neutral-500">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* POS vs Online Revenue */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="p-1.5 rounded-lg bg-[#1882b4]/10 text-[#1882b4] ring-1 ring-[#1882b4]/20">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                POS vs Online Revenue
              </h2>
            </div>
          </div>
          <div className="p-4">
            {channelData.every((d) => d.value === 0) ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-neutral-400">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <defs>
                    <radialGradient id="posPie3D" cx="40%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#48a6d4" />
                      <stop offset="50%" stopColor="#1882b4" />
                      <stop offset="100%" stopColor="#105e84" />
                    </radialGradient>
                    <radialGradient
                      id="onlinePie3D"
                      cx="40%"
                      cy="40%"
                      r="60%"
                    >
                      <stop offset="0%" stopColor="#fed77d" />
                      <stop offset="50%" stopColor="#F6AB27" />
                      <stop offset="100%" stopColor="#df9313" />
                    </radialGradient>
                  </defs>
                  <Pie
                    data={channelData}
                    cx="45%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={6}
                    dataKey="value"
                    strokeWidth={1.5}
                    stroke="#ffffff"
                    strokeOpacity={0.2}
                    cornerRadius={6}
                    activeShape={renderActivePieShape}
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                    className="cursor-pointer"
                  >
                    {channelData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === 0 ? "url(#posPie3D)" : "url(#onlinePie3D)"
                        }
                        opacity={
                          activePieIndex !== null && activePieIndex !== i
                            ? 0.7
                            : 1
                        }
                        className="transition-all duration-300"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    allowEscapeViewBox={{ x: true, y: true }}
                    position={
                      activePieIndex === 0 ? { x: 200, y: 65 } : undefined
                    }
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-700/80 rounded-2xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-100">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  payload[0].name === "POS"
                                    ? "#1882b4"
                                    : "#F6AB27",
                              }}
                            />
                            {payload[0].name} Revenue
                          </div>
                          <p className="tabular-nums font-semibold text-neutral-900 dark:text-white">
                            {lkr(payload[0].value as number)}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {totalPeriodRevenue > 0
                              ? `${(((payload[0].value as number) / totalPeriodRevenue) * 100).toFixed(1)}%`
                              : "0%"}{" "}
                            of Total
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </RePieChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center justify-center gap-6 mt-2">
              {channelData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                    style={{ backgroundColor: ["#1882b4", "#F6AB27"][i] }}
                  />
                  <span className="text-[10px] text-neutral-500 font-medium">
                    {d.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products by Revenue */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#1882b4]/10 text-[#1882b4] ring-1 ring-[#1882b4]/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Top Products by Revenue
                </h2>
              </div>
            </div>
            {activeProductIndex !== null &&
              data?.top_products?.[activeProductIndex] && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1882b4]/10 text-[#1882b4] truncate max-w-[150px]">
                  {data.top_products[activeProductIndex].Item_Descrip}
                </span>
              )}
          </div>
          <div className="p-4 flex-1">
            {!data?.top_products?.length ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-neutral-400">
                No product data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.top_products.map((p, idx) => ({
                    rank: idx + 1,
                    name:
                      p.Item_Descrip.length > 18
                        ? p.Item_Descrip.slice(0, 16) + "..."
                        : p.Item_Descrip,
                    fullName: p.Item_Descrip,
                    amount: p.total_amount,
                    qty: p.total_qty,
                  }))}
                  layout="vertical"
                  margin={{ left: 10, right: 10, top: 5, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state?.activeTooltipIndex !== undefined) {
                      setActiveProductIndex(state.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setActiveProductIndex(null)}
                >
                  <defs>
                    {/* Natural 3D Gradient for Horizontal Bars */}
                    <linearGradient
                      id="prodBarGrad3D"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#48a6d4" />
                      <stop offset="45%" stopColor="#1882b4" />
                      <stop offset="100%" stopColor="#105e84" />
                    </linearGradient>
                    {/* Active/Hovered Highlight Gradient */}
                    <linearGradient
                      id="prodBarGrad3DHover"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6ec0e7" />
                      <stop offset="45%" stopColor="#2c9bd2" />
                      <stop offset="100%" stopColor="#1882b4" />
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
                    className="text-neutral-500 font-medium"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomProductTooltip />} cursor={false} />
                  <Bar
                    dataKey="amount"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                    className="cursor-pointer"
                  >
                    {data.top_products.map((_, index) => {
                      const isHovered = activeProductIndex === index;
                      const isAnyHovered = activeProductIndex !== null;
                      return (
                        <Cell
                          key={`prod-${index}`}
                          fill={
                            isHovered
                              ? "url(#prodBarGrad3DHover)"
                              : "url(#prodBarGrad3D)"
                          }
                          opacity={isAnyHovered && !isHovered ? 0.7 : 1}
                          stroke={isHovered ? "#ffffff" : "transparent"}
                          strokeWidth={isHovered ? 1.5 : 0}
                          className="transition-all duration-200"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
