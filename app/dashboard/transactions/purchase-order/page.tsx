"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getColumns, PurchaseOrder } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewPurchaseOrder from "@/components/model/transactions/view-purchase-order";

function PurchaseOrderPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted"
  );
  const [fetching, setFetching] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

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

  // Open view dialog if docNo is in URL
  useEffect(() => {
    const viewDocNo = searchParams.get("view_doc_no");
    if (viewDocNo) {
      setViewDialog({
        isOpen: true,
        docNo: viewDocNo,
        status: "applied",
        iid: searchParams.get("iid") ?? "PO",
      });
    }
  }, [searchParams]);

  const fetchPurchaseOrders = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(
          "/transactions/load-all-transactions",
          {
            params: {
              iid: "PO",
              status: status,
            },
          }
        );

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

        const formattedData: PurchaseOrder[] = res.data.map((po: any) => ({
          docNo: po.doc_no,
          date: po.document_date
            ? new Date(po.document_date).toLocaleDateString("en-CA")
            : "",
          supplier: po.supplier_name || po.supplier_code || "",
          netAmount: parseFloat(po.net_total || 0),
          formattedNetAmount: formatThousandSeparator(
            parseFloat(po.net_total || 0)
          ),
          grnNo: po.grn_no || "",
          remark: po.remarks_ref || "",
        }));

        setPurchaseOrders(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch purchase orders:", err);
        toast({
          title: "Failed to load purchase orders",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast]
  );

  // Fetch data when activeTab changes
  useEffect(() => {
    fetchPurchaseOrders(activeTab);
  }, [activeTab, fetchPurchaseOrders]);

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "PO",
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
              <DataTable columns={columns} data={purchaseOrders} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={purchaseOrders} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      <ViewPurchaseOrder
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
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
