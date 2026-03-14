"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getColumns, Advance } from "./columns";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AdvancePaymentPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "customer",
  );
  const [fetching, setFetching] = useState(false);
  const previousTabRef = useRef<string | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/payments/advance-payment?tab=${value}`);
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  const fetchAdvances = useCallback(
    async (type: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get("/transactions/load-all-advances", {
          params: {
            type: type,
            per_page: 50,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
          },
        });

        if (!res.success) throw new Error(res.message);

        const formatThousandSeparator = (value: number | string) => {
          const numValue =
            typeof value === "string" ? parseFloat(value) : value;
          if (isNaN(numValue as number)) return "0.00";
          return (numValue as number).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        };

        const formattedData: Advance[] = res.data.map((adv: any) => ({
          docNo: adv.doc_no,
          date: adv.document_date
            ? new Date(adv.document_date).toLocaleDateString("en-CA")
            : "",
          name: adv.name || "Unknown",
          amount: parseFloat(adv.transaction_amount || 0),
          formattedAmount: formatThousandSeparator(
            parseFloat(adv.transaction_amount || 0),
          ),
        }));

        setAdvances(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch advances:", err);
        // @ts-ignore
        toast({
          title: "Failed to load advances",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast, startDate, endDate],
  );

  useEffect(() => {
    if (previousTabRef.current !== activeTab) {
      previousTabRef.current = activeTab;
      fetchAdvances(activeTab);
    }
  }, [activeTab, fetchAdvances]);

  const columns = getColumns(activeTab);

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <TabsList>
                <TabsTrigger value="customer">Customer Advances</TabsTrigger>
                <TabsTrigger value="supplier">Supplier Advances</TabsTrigger>
              </TabsList>

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
                <Button variant="outline" size="sm" onClick={() => fetchAdvances(activeTab)}>
                  Filter
                </Button>
              </div>
            </div>

            <Link href="/dashboard/payments/advance-payment/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Advance
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <TabsContent value="customer" className="mt-0">
              <DataTable columns={columns} data={advances} />
            </TabsContent>

            <TabsContent value="supplier" className="mt-0">
              <DataTable columns={columns} data={advances} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>
    </div>
  );
}

export default function AdvancePaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdvancePaymentPageContent />
    </Suspense>
  );
}
