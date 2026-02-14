"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { getColumns, SupplierReturnNote } from "./columns";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewSupplierReturnNote from "@/components/model/transactions/view-supplier-return-note";

function SupplierReturnNotePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted",
  );
  const [fetching, setFetching] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [supplierReturnNotes, setSupplierReturnNotes] = useState<
    SupplierReturnNote[]
  >([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/transactions/supplier-return-note?tab=${value}`);
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
        iid: searchParams.get("iid") ?? "SRN",
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

  const fetchSupplierReturnNotes = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(
          "/transactions/load-all-transactions",
          {
            params: {
              iid: "SRN",
              status: status,
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
            },
          },
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

        const formattedData: SupplierReturnNote[] = res.data.map(
          (srn: any) => ({
            docNo: srn.doc_no,
            date: srn.document_date
              ? new Date(srn.document_date).toLocaleDateString("en-CA")
              : "",
            supplier: srn.supplier_name || srn.supplier_code || "",
            netAmount: parseFloat(srn.net_total || 0),
            formattedInvoiceAmount: formatThousandSeparator(
              parseFloat(srn.net_total || 0),
            ),
            grnNo: srn.recall_doc_no || "",
          }),
        );

        setSupplierReturnNotes(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch supplier return notes:", err);
        toast({
          title: "Failed to load supplier return notes",
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
    fetchSupplierReturnNotes(activeTab);
  }, [activeTab, fetchSupplierReturnNotes]);

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "SRN",
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
                <TabsTrigger value="drafted">Drafted SRN</TabsTrigger>
                <TabsTrigger value="applied">Applied SRN</TabsTrigger>
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

            <Link href="/dashboard/transactions/supplier-return-note/create">
              <Button type="button" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New SRN
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <TabsContent value="drafted" className="mt-0">
              <DataTable columns={columns} data={supplierReturnNotes} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={supplierReturnNotes} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      <ViewSupplierReturnNote
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
    </div>
  );
}

export default function SupplierReturnNotePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupplierReturnNotePageContent />
    </Suspense>
  );
}
