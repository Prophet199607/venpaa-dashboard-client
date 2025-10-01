"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useState } from "react";
import { getColumns, StockAdjustment } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const draftedData: StockAdjustment[] = [
  {
    docNo: "STA-001",
    date: "2025-09-20",
    location: "Head Office",
    remark: "Urgent",
  },
];
const appliedData: StockAdjustment[] = [
  {
    docNo: "STA-002",
    date: "2025-09-21",
    location: "Colombo",
    remark: "Confirmed",
  },
];

function StockAdjustmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted"
  );

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

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <TabsList>
              <TabsTrigger value="drafted">Drafted Adjustment</TabsTrigger>
              <TabsTrigger value="applied">Applied Adjustment</TabsTrigger>
            </TabsList>

            <Link href="/dashboard/transactions/stock-adjustment/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Adjustment
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <TabsContent value="drafted" className="mt-0">
              <DataTable columns={getColumns("drafted")} data={draftedData} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={getColumns("applied")} data={appliedData} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
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
