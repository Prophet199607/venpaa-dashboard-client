"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, AcceptGoodsNote } from "./columns";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewAcceptGoodNote from "@/components/model/transactions/view-accept-good-note";

function AcceptGoodsNotePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "pending"
  );
  const [fetching, setFetching] = useState(false);
  const [acceptGoodNotes, setAcceptGoodNotes] = useState<AcceptGoodsNote[]>([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/transactions/accept-good-note?tab=${value}`);
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
        iid: "AGN",
      });
    }
  }, [searchParams]);

  const fetchAcceptGoodNotes = useCallback(
    async (status: string) => {
      try {
        setFetching(true);

        const iid = status === "pending" ? "TGN" : "AGN";

        const { data: res } = await api.get("/accept-good-notes/load-all-agn", {
          params: {
            iid: iid,
            status: status,
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
            parseFloat(agn.net_total || 0)
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
    [toast]
  );

  // Fetch data when activeTab changes
  useEffect(() => {
    fetchAcceptGoodNotes(activeTab);
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
    []
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
          <CardHeader className="flex flex-row items-center justify-between">
            <TabsList>
              <TabsTrigger value="pending">Pending AGN</TabsTrigger>
              <TabsTrigger value="applied">Applied AGN</TabsTrigger>
            </TabsList>
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

export default function AcceptGoodsNotePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptGoodsNotePageContent />
    </Suspense>
  );
}
