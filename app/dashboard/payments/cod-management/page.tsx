"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, CodData } from "./columns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Mock Data (will be replaced by API call)
const INITIAL_COD_DATA: CodData[] = [];

function CodManagementContent() {
  const [data, setData] = useState<CodData[]>(INITIAL_COD_DATA);
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get("/cod-management");
      const mappedData: CodData[] = response.data.map((item: any) => ({
        id: item.id.toString(),
        orderNo: item.ref_doc_no,
        customerName: item.customer?.name || "N/A",
        amount: parseFloat(item.balance_amount),
        formattedAmount: new Intl.NumberFormat("en-LK", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(parseFloat(item.balance_amount)),
        date: item.transaction_date,
        status: "Pending",
      }));
      setData(mappedData);
    } catch (error) {
      // @ts-ignore
      toast({
        title: "Fetch Error",
        description: "Failed to fetch COD management data.",
        type: "error",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (id: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Received" } : item,
      ),
    );
    // @ts-ignore
    toast({
      title: "Status Updated",
      description: "Order marked as received successfully.",
      type: "success",
    });
  };

  const handleRefund = (id: string) => {
    setActiveOrderId(id);
    setRefundAmount("");
    setIsRefundDialogOpen(true);
  };

  const confirmRefund = () => {
    if (!activeOrderId) return;
    setData((prev) =>
      prev.map((item) =>
        item.id === activeOrderId ? { ...item, status: "Refund" } : item,
      ),
    );
    setIsRefundDialogOpen(false);
    setActiveOrderId(null);
    // @ts-ignore
    toast({
      title: "Status Updated",
      description: "Order marked as refund successfully.",
      type: "success",
    });
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => item.status === activeFilter);
  }, [data, activeFilter]);

  const columns = getColumns(handleStatusChange, handleRefund);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">COD Management</h1>
      </div>

      <Card>
        <CardHeader>
          <Tabs
            value={activeFilter}
            onValueChange={setActiveFilter}
            className="w-full"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="grid grid-cols-3 w-[400px]">
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Received">Received</TabsTrigger>
                <TabsTrigger value="Refund">Refund</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredData} />
        </CardContent>
      </Card>

      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Refund with Courier Charge</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && refundAmount) {
                    confirmRefund();
                  }
                }}
                className="col-span-3"
                placeholder="Enter amount..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            {!refundAmount ? (
              <Button
                variant="outline"
                onClick={() => setIsRefundDialogOpen(false)}
                className="w-20 bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"
              >
                NO
              </Button>
            ) : (
              <Button
                onClick={confirmRefund}
                className="w-20 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                YES
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CodManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CodManagementContent />
    </Suspense>
  );
}
