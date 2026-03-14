"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus, ReceiptText } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, CustomerReceipt } from "./columns";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ViewCustomerReceipt from "@/components/model/payments/view-customer-receipt";

function CustomerReceiptListingContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [fetching, setFetching] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
  });

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchReceipts = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await api.get("/customer-receipts/load-all-rec", {
        params: {
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
          per_page: 1000,
        },
      });

      if (!res.success) throw new Error(res.message);

      const formatThousandSeparator = (value: number | string) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(numValue as number)) return "0.00";
        return (numValue as number).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      };

      const formattedData: CustomerReceipt[] = res.data.map((item: any) => ({
        orgDocNo: item.org_doc_no,
        date: item.document_date
          ? new Date(item.document_date).toLocaleDateString("en-CA")
          : "",
        customer: item.account_name || "Unknown",
        amount: parseFloat(item.total_amount || 0),
        formattedAmount: formatThousandSeparator(parseFloat(item.total_amount || 0)),
        location: item.location || "",
      }));

      setReceipts(formattedData);
    } catch (err: any) {
      console.error("Failed to fetch receipts:", err);
      toast({
        title: "Failed to load receipts",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast, startDate, endDate]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleView = useCallback((docNo: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
    });
  }, []);

  const columns = getColumns(handleView);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ReceiptText className="h-6 w-6" />
        <h1 className="text-xl font-semibold">Customer Receipts</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <Button variant="outline" size="sm" onClick={() => fetchReceipts()}>
              Filter
            </Button>
          </div>

          <Link href="/dashboard/payments/customer-receipt/create">
            <Button type="button" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Receipt
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={receipts} />
        </CardContent>
      </Card>
      {fetching && <Loader />}

      <ViewCustomerReceipt
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog({ isOpen: false, docNo: "" })}
        docNo={viewDialog.docNo}
      />
    </div>
  );
}

export default function CustomerReceiptListingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerReceiptListingContent />
    </Suspense>
  );
}
