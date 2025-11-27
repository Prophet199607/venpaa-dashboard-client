"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, GoodReceivedNote } from "./columns";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewGoodReceiveNote from "@/components/model/transactions/view-good-receive-note";

function GoodReceiveNoteContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted"
  );
  const [fetching, setFetching] = useState(false);
  const [goodReceiveNotes, setGoodReceiveNotes] = useState<GoodReceivedNote[]>(
    []
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
    router.push(`/dashboard/transactions/good-receive-note?tab=${value}`);
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
        iid: searchParams.get("iid") ?? "GRN",
      });
    }
  }, [searchParams]);

  const fetchGoodReceiveNotes = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(
          "/good-receive-notes/load-all-good-receive-notes",
          {
            params: {
              iid: "GRN",
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

        const formattedData: GoodReceivedNote[] = res.data.map((grn: any) => ({
          docNo: grn.doc_no,
          date: grn.document_date
            ? new Date(grn.document_date).toLocaleDateString("en-CA")
            : "",
          supplier: grn.supplier_name || grn.supplier_code || "",
          netAmount: parseFloat(grn.net_total || 0),
          formattedInvoiceAmount: formatThousandSeparator(
            parseFloat(grn.net_total || 0)
          ),
          grnNo: grn.grn_no || "",
          remark: grn.remarks_ref || "",
        }));

        setGoodReceiveNotes(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch good receive notes:", err);
        toast({
          title: "Failed to load good receive notes",
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
    fetchGoodReceiveNotes(activeTab);
  }, [activeTab, fetchGoodReceiveNotes]);

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "GRN",
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
              <TabsTrigger value="drafted">Drafted GRN</TabsTrigger>
              <TabsTrigger value="applied">Applied GRN</TabsTrigger>
            </TabsList>

            <Link href="/dashboard/transactions/good-receive-note/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New GRN
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <TabsContent value="drafted" className="mt-0">
              <DataTable columns={columns} data={goodReceiveNotes} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={goodReceiveNotes} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      <ViewGoodReceiveNote
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
    </div>
  );
}

export default function GoodReceiveNotePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoodReceiveNoteContent />
    </Suspense>
  );
}
