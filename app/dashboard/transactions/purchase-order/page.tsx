"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { getColumns, PurchaseOrder } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const draftedData: PurchaseOrder[] = [
  {
    docNo: "PO-001",
    date: "2025-09-20",
    supplier: "ABC Traders",
    netAmount: 1200,
    grnNo: "GRN-101",
    remark: "Urgent",
  },
];
const appliedData: PurchaseOrder[] = [
  {
    docNo: "PO-002",
    date: "2025-09-21",
    supplier: "XYZ Supplies",
    netAmount: 3400,
    grnNo: "GRN-102",
    remark: "Confirmed",
  },
];

function PurchaseOrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted"
  );

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/transactions/purchase-order?tab=${value}`);
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
              <TabsTrigger value="drafted">Drafted PO</TabsTrigger>
              <TabsTrigger value="applied">Applied PO</TabsTrigger>
            </TabsList>

            <Link href="/dashboard/transactions/purchase-order/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New PO
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

export default function PurchaseOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseOrderPageContent />
    </Suspense>
  );
}
