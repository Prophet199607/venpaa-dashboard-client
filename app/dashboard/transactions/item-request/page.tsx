"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getColumns, ItemRequest } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewPurchaseOrder from "@/components/model/transactions/view-purchase-order";

function ItemRequestPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted"
  );
  const [fetching, setFetching] = useState(false);
  const [ItemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  const handleTabChange = (Value: string) => {
    setActiveTab(Value);
    router.push(`/dashboard/transactions/item-request?tab=${Value}`);
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const viewDocNo = searchParams.get("view_doc_no");
    if (viewDocNo) {
      setViewDialog({
        isOpen: true,
        docNo: viewDocNo,
        status: "applied",
        iid: searchParams.get("iid") ?? "IR",
      });
    }
  }, [searchParams]);

  const fetchItemRequests = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(
          "/item-requests/load-all-item-requests",
          {
            params: {
              iid: "IR",
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

        const formattedData: ItemRequest[] = res.data.map((item: any) => ({
          docNo: item.doc_no,
          date: item.document_date
            ? new Date(item.document_date).toLocaleDateString("en-CA")
            : "",
          supplier: item.supplier_name || item.supplier_code || "",
          netAmount: parseFloat(item.net_total || 0),
          formattedNetAmount: formatThousandSeparator(
            parseFloat(item.net_total || 0)
          ),
          approvalStatus: item.approval_status || "",
          remark: item.remarks_ref || "",
        }));

        setItemRequests(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch item requests:", err);
        toast({
          title: "Failed to load item requests",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchItemRequests(activeTab);
  }, [activeTab, fetchItemRequests]);

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "IR",
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
              <TabsTrigger value="drafted">Drafted IR</TabsTrigger>
              <TabsTrigger value="applied">Applied IR</TabsTrigger>
            </TabsList>

            <Link href="/dashboard/transactions/item-request/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New IR
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <TabsContent value="drafted" className="mt-0">
              <DataTable columns={columns} data={ItemRequests} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={ItemRequests} />
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

export default function ItemRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItemRequestPageContent />
    </Suspense>
  );
}
