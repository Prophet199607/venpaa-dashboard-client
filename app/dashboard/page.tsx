"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";
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
} from "lucide-react";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface DashboardData {
  stats: {
    total_books: { value: number };
    total_sales: { value: number };
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

export default function DashboardHome() {
  const fetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!permissionsLoading && !hasPermission("view dashboard stats")) {
    return <AccessDenied />;
  }

  const mainStats = [
    {
      label: "Total Books",
      value: data?.stats.total_books.value ?? 0,
      icon: Book,
      color: "blue",
    },
    {
      label: "Total Sales",
      value: data?.stats.total_sales.value ?? 0,
      icon: ShoppingCart,
      color: "orange",
    },
  ];

  const miniStats = [
    {
      label: "Authors",
      value: data?.extra_stats.authors ?? 0,
      icon: Users,
      color: "purple",
    },
    {
      label: "Suppliers",
      value: data?.extra_stats.suppliers ?? 0,
      icon: Briefcase,
      color: "green",
    },
    {
      label: "Publishers",
      value: data?.extra_stats.publishers ?? 0,
      icon: Book,
      color: "blue",
    },
    {
      label: "Categories",
      value: data?.extra_stats.categories ?? 0,
      icon: LayoutGrid,
      color: "orange",
    },
    {
      label: "Customers",
      value: data?.extra_stats.customers ?? 0,
      icon: Users,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Dashboard Overview
          </h1>
        </div>
      </div>

      {/* Main Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mainStats.map((stat, i) => (
          <Card
            key={i}
            className="relative overflow-hidden group hover:shadow-md transition-all border-none shadow-sm dark:bg-neutral-900/50"
          >
            <div
              className={cn(
                "absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none transition-all duration-300",
                "opacity-[0.12] dark:opacity-[0.12] group-hover:opacity-[0.14] group-hover:scale-110",
                stat.color === "blue" && "text-blue-600 dark:text-blue-400",
                stat.color === "orange" &&
                  "text-orange-600 dark:text-orange-400",
              )}
            >
              <stat.icon className="w-24 h-24 rotate-12" />
            </div>
            <CardHeader className="pb-2 space-y-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <div
                  className={cn(
                    "p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800",
                    stat.color === "blue" && "text-blue-500",
                    stat.color === "purple" && "text-purple-500",
                    stat.color === "orange" && "text-orange-500",
                    stat.color === "green" && "text-emerald-500",
                  )}
                >
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Recent Transactions */}
        <Card className="md:col-span-2 border-none shadow-sm dark:bg-neutral-900/50">
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h1 className="text-sm font-semibold">
                Recent Backoffice Transactions
              </h1>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="border-t border-neutral-100 dark:border-neutral-800">
              {data?.recent_orders.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No backoffice transactions found
                </div>
              ) : (
                data?.recent_orders.map((order, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-3 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{order.doc_no}</p>
                        <p className="text-[10px] text-neutral-500 uppercase">
                          {order.description} • {order.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500">
                          Amount & Status
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] font-bold">
                            LKR {order.total.toLocaleString()}
                          </p>
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              order.status === "approved"
                                ? "bg-green-500"
                                : "bg-yellow-500",
                            )}
                          />
                          <p className="text-[10px] uppercase font-medium text-neutral-500">
                            {order.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-none shadow-sm dark:bg-neutral-900/50">
          <CardHeader className="py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold">Top Selling Items</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {data?.top_products.length === 0 ? (
                <div className="p-2 text-center text-sm text-neutral-500 italic">
                  Data analysis pending
                </div>
              ) : (
                data?.top_products.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="max-w-[200px]">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors cursor-default">
                          {item.Item_Descrip}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono tracking-tighter">
                          {item.prod_code} • LKR{" "}
                          {item.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Extra Mini Stats */}
        <div className="space-y-3">
          {miniStats.map((stat, i) => (
            <Card
              key={i}
              className="border-none shadow-sm dark:bg-neutral-900/50"
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-1 rounded-md",
                        stat.color === "blue" &&
                          "bg-blue-50 text-blue-500 dark:bg-blue-900/20",
                        stat.color === "purple" &&
                          "bg-purple-50 text-purple-500 dark:bg-purple-900/20",
                        stat.color === "orange" &&
                          "bg-orange-50 text-orange-500 dark:bg-orange-900/20",
                        stat.color === "green" &&
                          "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20",
                      )}
                    >
                      <stat.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-xs font-bold leading-tight">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
