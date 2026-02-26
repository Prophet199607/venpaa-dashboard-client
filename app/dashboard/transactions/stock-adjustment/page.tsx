"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, StockAdjustment } from "./columns";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewStockAdjustment from "@/components/model/transactions/view-stock-adjustment";

function StockAdjustmentPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted",
  );
  const [fetching, setFetching] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(
    [],
  );
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/transactions/stock-adjustment?tab=${value}`);
  };

  // Sync tab state with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Open view dialog if docNo is in URL
  useEffect(() => {
    const viewDocNo = searchParams.get("view_doc_no");
    if (viewDocNo) {
      setViewDialog({
        isOpen: true,
        docNo: viewDocNo,
        status: "applied",
        iid: searchParams.get("iid") ?? "STA",
      });
    }
  }, [searchParams]);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchStockAdjustments = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(
          "/transactions/load-all-transactions",
          {
            params: {
              iid: "STA",
              status: status,
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
              per_page: 1000,
            },
          },
        );

        if (!res.success) throw new Error(res.message);

        const formattedData: StockAdjustment[] = res.data.map((sta: any) => ({
          docNo: sta.doc_no,
          date: sta.document_date
            ? new Date(sta.document_date).toLocaleDateString("en-CA")
            : "",
          remark: sta.remarks_ref || "",
        }));

        setStockAdjustments(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch stock adjustments:", err);
        toast({
          title: "Failed to load stock adjustments",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast, startDate, endDate],
  );

  // Fetch data when activeTab changes
  useEffect(() => {
    fetchStockAdjustments(activeTab);
  }, [activeTab, fetchStockAdjustments]);

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "STA",
    });
  }, []);

  const columns = getColumns(activeTab, handleView);

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <TabsList>
                <TabsTrigger value="drafted">Drafted Adjustment</TabsTrigger>
                <TabsTrigger value="applied">Applied Adjustment</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2">
              <DatePicker
                date={startDate}
                setDate={setStartDate}
                placeholder="Start Date"
                className="w-[130px]"
              />
              <span className="text-muted-foreground">-</span>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
                placeholder="End Date"
                className="w-[130px]"
              />
            </div>

            <Link href="/dashboard/transactions/stock-adjustment/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Adjustment
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <TabsContent value="drafted" className="mt-0">
              <DataTable columns={columns} data={stockAdjustments} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={stockAdjustments} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      <ViewStockAdjustment
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
    </div>
  );
}

export default function StockAdjustmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StockAdjustmentPageContent />
    </Suspense>
  );
}
