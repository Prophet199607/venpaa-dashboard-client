"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { getColumns, TransferGoodReturn } from "./columns";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewTransferGoodReturn from "@/components/model/transactions/view-transfer-good-return";

function TransferGoodReturnPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted",
  );
  const [fetching, setFetching] = useState(false);
  const previousTabRef = useRef<string | null>(null);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [transferGoodReturns, setTransferGoodReturns] = useState<
    TransferGoodReturn[]
  >([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/transactions/transfer-good-return?tab=${value}`);
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
        iid: searchParams.get("iid") ?? "TGR",
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

  const fetchTransferGoodReturn = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(
          "/transactions/load-all-transactions",
          {
            params: {
              iid: "TGR",
              status: status,
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
              per_page: 1000,
            },
          },
        );

        if (!res.success) throw new Error(res.message);

        const formattedData: TransferGoodReturn[] = res.data.map(
          (tgr: any) => ({
            docNo: tgr.doc_no,
            date: tgr.document_date
              ? new Date(tgr.document_date).toLocaleDateString("en-CA")
              : "",
            transactionNo: tgr.recall_doc_no || "",
          }),
        );

        setTransferGoodReturns(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch transfer good return:", err);
        toast({
          title: "Failed to load transfer good return",
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
      fetchTransferGoodReturn(activeTab);
    }
  }, [activeTab, fetchTransferGoodReturn]);

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "TGR",
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
                <TabsTrigger value="drafted">Pending TGR</TabsTrigger>
                <TabsTrigger value="applied">Applied TGR</TabsTrigger>
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
          </CardHeader>

          <CardContent>
            <TabsContent value="drafted" className="mt-0">
              <DataTable columns={columns} data={transferGoodReturns} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={transferGoodReturns} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      <ViewTransferGoodReturn
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
    </div>
  );
}

export default function TransferGoodReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransferGoodReturnPageContent />
    </Suspense>
  );
}
