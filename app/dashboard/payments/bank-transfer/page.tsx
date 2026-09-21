"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, BankTransferData } from "./columns";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Landmark, Search, RotateCcw } from "lucide-react";
import {
  ClipboardDocumentListIcon,
  BanknotesIcon,
  TruckIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/solid";
import BankTransferOrderDetailSheet from "@/components/model/bank-transfer/bank-transfer-order-detail-sheet";

function BankTransferContent() {
  const [data, setData] = useState<BankTransferData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<{
    id: string;
    receiptNo: string;
  } | null>(null);

  // Default date range: Last 30 days to today
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState<Date | undefined>(thirtyDaysAgo);
  const [endDate, setEndDate] = useState<Date | undefined>(today);

  const { toast } = useToast();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const toDateString = (d: Date | undefined) =>
    d ? d.toISOString().split("T")[0] : undefined;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/bank-transfer", {
        params: {
          start_date: toDateString(startDate),
          end_date: toDateString(endDate),
          type: activeType !== "All" ? activeType : undefined,
          search: searchQuery.trim() || undefined,
        },
      });

      setData(response.data ?? []);
    } catch (error) {
      // @ts-ignore
      toast({
        title: "Fetch Error",
        description: "Failed to fetch Bank Transfer orders.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, activeType, searchQuery, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleView = (id: string, receiptNo: string) => {
    setSelectedRecord({ id, receiptNo });
  };

  const handleResetFilters = () => {
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
    setActiveType("All");
    setSearchQuery("");
  };

  // Filter data based on active tab locally as well if desired
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (activeType === "All") return true;
      return item.payment_method === activeType;
    });
  }, [data, activeType]);

  // Financial summary metrics
  const metrics = useMemo(() => {
    const totalOrders = filteredData.length;
    const totalAmount = filteredData.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
    const deliveryCount = filteredData.filter((item) =>
      item.payment_method.toLowerCase().includes("delivery"),
    ).length;
    const standardCount = totalOrders - deliveryCount;

    return { totalOrders, totalAmount, deliveryCount, standardCount };
  }, [filteredData]);

  const columns = useMemo(() => getColumns(handleView), []);

  if (!permissionsLoading && !hasPermission("view bank-transfer")) {
    return <AccessDenied />;
  }

  return (
    <>
      {selectedRecord && (
        <BankTransferOrderDetailSheet
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          recordId={selectedRecord.id}
          receiptNo={selectedRecord.receiptNo}
        />
      )}

      <div className="space-y-4">
        {/* Page Title & Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              Bank Transfer Orders
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="self-start sm:self-auto text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </Button>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="group relative overflow-hidden p-4 shadow-sm border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Orders
                </span>
                <div className="text-2xl font-bold mt-1.5 tabular-nums">
                  {metrics.totalOrders}
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 text-white shadow-sm ring-1 ring-inset ring-white/20">
                <ClipboardDocumentListIcon className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden p-4 shadow-sm border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Revenue
                </span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 truncate tabular-nums">
                  LKR{" "}
                  {metrics.totalAmount.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 text-white shadow-sm ring-1 ring-inset ring-white/20">
                <BanknotesIcon className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden p-4 shadow-sm border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Delivery (Bank Transfer)
                </span>
                <div className="text-2xl font-bold mt-1.5 tabular-nums">
                  {metrics.deliveryCount}
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 text-white shadow-sm ring-1 ring-inset ring-white/20">
                <TruckIcon className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden p-4 shadow-sm border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Direct Bank Transfer
                </span>
                <div className="text-2xl font-bold mt-1.5 tabular-nums">
                  {metrics.standardCount}
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 text-white shadow-sm ring-1 ring-inset ring-white/20">
                <BuildingLibraryIcon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and DataTable Card */}
        <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Type Tabs */}
              <Tabs
                value={activeType}
                onValueChange={setActiveType}
                className="w-full lg:w-auto"
              >
                <TabsList className="grid grid-cols-3 w-full sm:w-[420px]">
                  <TabsTrigger value="All" className="text-xs">
                    All Orders
                  </TabsTrigger>
                  <TabsTrigger value="Bank Transfer" className="text-xs">
                    Bank Transfer
                  </TabsTrigger>
                  <TabsTrigger
                    value="Delivery (Bank Transfer)"
                    className="text-xs"
                  >
                    Delivery
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Date Filters & Search Input */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <DatePicker date={startDate} setDate={setStartDate} />
                  <span className="text-muted-foreground text-xs">—</span>
                  <DatePicker date={endDate} setDate={setEndDate} />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2">
            {loading && data.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
                <RotateCcw className="w-5 h-5 animate-spin opacity-50" />
                <span>Loading Bank Transfer records...</span>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredData} dense />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function BankTransferPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-muted-foreground">
          Loading Bank Transfer dashboard...
        </div>
      }
    >
      <BankTransferContent />
    </Suspense>
  );
}
