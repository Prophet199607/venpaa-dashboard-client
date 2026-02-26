"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, AcceptGoodsNote } from "./columns";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewAcceptGoodNote from "@/components/model/transactions/view-accept-good-note";

function AcceptGoodNotePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "pending",
  );
  const [fetching, setFetching] = useState(false);
  const previousTabRef = useRef<string | null>(null);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [acceptGoodNotes, setAcceptGoodNotes] = useState<AcceptGoodsNote[]>([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/transactions/accept-good-note?tab=${value}`);
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
        iid: "AGN",
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

  const fetchAcceptGoodNotes = useCallback(
    async (status: string) => {
      try {
        setFetching(true);

        const iid = status === "pending" ? "TGN" : "AGN";

        const { data: res } = await api.get("/accept-good-notes/load-all-agn", {
          params: {
            iid: iid,
            status: status,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            per_page: 1000,
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

        const formattedData: AcceptGoodsNote[] = res.data.map((agn: any) => ({
          docNo: agn.doc_no,
          date: agn.document_date
            ? new Date(agn.document_date).toLocaleDateString("en-CA")
            : "",
          netAmount: parseFloat(agn.net_total || 0),
          formattedNetAmount: formatThousandSeparator(
            parseFloat(agn.net_total || 0),
          ),
          transactionNo: agn.recall_doc_no || "",
          remark: agn.remarks_ref || "",
        }));

        setAcceptGoodNotes(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch accept good notes:", err);
        toast({
          title: "Failed to load accept good notes",
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
      fetchAcceptGoodNotes(activeTab);
    }
  }, [activeTab, fetchAcceptGoodNotes]);

  const handleView = useCallback(
    (docNo: string, status: string, iid: string) => {
      setViewDialog({
        isOpen: true,
        docNo,
        status,
        iid: iid,
      });
    },
    [],
  );

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
                <TabsTrigger value="pending">Pending AGN</TabsTrigger>
                <TabsTrigger value="applied">Applied AGN</TabsTrigger>
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
            <TabsContent value="pending" className="mt-0">
              <DataTable columns={columns} data={acceptGoodNotes} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={acceptGoodNotes} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      <ViewAcceptGoodNote
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
    </div>
  );
}

export default function AcceptGoodNotePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptGoodNotePageContent />
    </Suspense>
  );
}
