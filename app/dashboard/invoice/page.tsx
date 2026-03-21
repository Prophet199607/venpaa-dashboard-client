"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getColumns, Invoice } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewInvoice from "@/components/model/invoice/view-invoice";
import ViewVatInvoice from "@/components/model/invoice/view-vat-invoice";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";

function InvoicePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "pending",
  );
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [fetching, setFetching] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const previousTabRef = useRef<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
    isVat: false,
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/invoice?tab=${value}`);
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
        iid: "INV",
        isVat: searchParams.get("is_vat") === "true",
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

  const fetchInvoices = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get("/invoices/load-all-invoices", {
          params: {
            iid: "INV",
            status: status,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            per_page: 1000,
          },
        });

        // console.log("invoices", res);
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

        const formattedData: Invoice[] = res.data.map((inv: any) => ({
          docNo: inv.doc_no,
          date: inv.document_date
            ? new Date(inv.document_date).toLocaleDateString("en-CA")
            : "",
          customer: inv.customer_name || "Unknown",
          netAmount: parseFloat(inv.net_total || 0),
          formattedNetAmount: formatThousandSeparator(
            parseFloat(inv.net_total || 0),
          ),
          remark: inv.comments || inv.remarks_ref || "",
          isVat: inv.is_vat === 1 || inv.is_vat === true || inv.is_vat === "1",
        }));

        setInvoices(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch invoices:", err);
        toast({
          title: "Failed to load invoices",
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
      fetchInvoices(activeTab);
    }
  }, [activeTab, fetchInvoices]);

  const handleView = useCallback(
    (docNo: string, status: string, iid: string, isVat: boolean) => {
      setViewDialog({
        isOpen: true,
        docNo,
        status,
        iid: iid,
        isVat,
      });
    },
    [],
  );

  const columns = getColumns(activeTab, handleView);

  if (!permissionsLoading && !hasPermission("view invoice")) {
    return <AccessDenied />;
  }

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
              <TabsTrigger value="pending">Pending Invoice</TabsTrigger>
              <TabsTrigger value="applied">Applied Invoice</TabsTrigger>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInvoices(activeTab)}
              >
                Filter
              </Button>
            </div>

            {hasPermission("create invoice") && (
              <Link href="/dashboard/invoice/create">
                <Button type="button" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Invoice
                </Button>
              </Link>
            )}
          </CardHeader>

          <CardContent>
            <TabsContent value="pending" className="mt-0">
              <DataTable columns={columns} data={invoices} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={invoices} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      {viewDialog.isVat ? (
        <ViewVatInvoice
          isOpen={viewDialog.isOpen}
          onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
          docNo={viewDialog.docNo}
        />
      ) : (
        <ViewInvoice
          isOpen={viewDialog.isOpen}
          onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
          docNo={viewDialog.docNo}
          status={viewDialog.status}
          iid={viewDialog.iid}
        />
      )}
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoicePageContent />
    </Suspense>
  );
}
