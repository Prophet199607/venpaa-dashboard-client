"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, CodData } from "./columns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock Data (will be replaced by API call)
const INITIAL_COD_DATA: CodData[] = [];

function CodManagementContent() {
  const [data, setData] = useState<CodData[]>(INITIAL_COD_DATA);
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [actionConfirm, setActionConfirm] = useState<{
    type: "received" | "return";
    id: string;
    orderNo: string;
  } | null>(null);
  const [receivedAmount, setReceivedAmount] = useState("");
  const today = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(today);
  const [endDate, setEndDate] = useState<Date | undefined>(today);
  const { toast } = useToast();

  const toDateString = (d: Date | undefined) =>
    d ? d.toISOString().split("T")[0] : undefined;

  const loadData = async (start: Date | undefined, end: Date | undefined) => {
    try {
      const response = await api.get("/cod-management", {
        params: {
          start_date: toDateString(start),
          end_date: toDateString(end),
        },
      });
      const mappedData: CodData[] = response.data
        .map((item: any) => {
          const normalizedStatus = String(
            item.status ?? "Pending",
          ).toLowerCase();
          const statusMap: Record<string, CodData["status"]> = {
            pending: "Pending",
            received: "Received",
            returned: "Returned",
          };

          return {
            id: item.id.toString(),
            orderNo: item.doc_no ?? "N/A",
            customerName: item.customer ?? "N/A",
            amount: parseFloat(
              item.Transaction_amount ?? item.transaction_amount ?? 0,
            ),
            formattedAmount: new Intl.NumberFormat("en-LK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(
              parseFloat(
                item.Transaction_amount ?? item.transaction_amount ?? 0,
              ),
            ),
            balanceAmount: parseFloat(item.Transaction_amount ?? item.transaction_amount ?? 0) - parseFloat(item.received_amount ?? 0),
            formattedBalanceAmount: new Intl.NumberFormat("en-LK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(
              parseFloat(item.Transaction_amount ?? item.transaction_amount ?? 0) - parseFloat(item.received_amount ?? 0)
            ),
            date: (item.transaction_date ?? "").split(" ")[0],
            status: statusMap[normalizedStatus] ?? "Pending",
          };
        })
        .sort(
          (a: CodData, b: CodData) =>
            new Date(b.date).getTime() - new Date(a.date).getTime() ||
            Number(b.id) - Number(a.id),
        );
      setData(mappedData);
    } catch (error) {
      // @ts-ignore
      toast({
        title: "Fetch Error",
        description: "Failed to fetch COD management data.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(startDate, endDate));
    return () => clearTimeout(timer);
  }, [startDate, endDate]);

  const handleStatusChange = async (id: string, orderNo: string) => {
    try {
      await api.put(`/cod-management/${id}/received`, {
        orderNo,
        received_amount: receivedAmount,
      });
      await loadData(startDate, endDate);
      // @ts-ignore
      toast({
        title: "Status Updated",
        description: "Order marked as received successfully.",
        type: "success",
      });
    } catch (error) {
      // @ts-ignore
      toast({
        title: "Update Error",
        description: "Failed to update order status.",
        type: "error",
      });
    }
  };

  const handleReturnStatus = async (id: string, orderNo: string) => {
    try {
      await api.put(`/cod-management/${id}/returned`, { orderNo });
      await loadData(startDate, endDate);
      // @ts-ignore
      toast({
        title: "Status Updated",
        description: "Order marked as returned successfully.",
        type: "success",
      });
    } catch (error) {
      // @ts-ignore
      toast({
        title: "Update Error",
        description: "Failed to update order status.",
        type: "error",
      });
    }
  };

  const requestActionConfirm = (
    type: "received" | "return",
    id: string,
    orderNo: string,
  ) => {
    setActionConfirm({ type, id, orderNo });
    if (type === "received") {
      setReceivedAmount("");
    }
  };

  const executeConfirmedAction = async () => {
    if (!actionConfirm) return;
    const { type, id, orderNo } = actionConfirm;
    setActionConfirm(null);
    if (type === "received") {
      await handleStatusChange(id, orderNo);
    } else if (type === "return") {
      await handleReturnStatus(id, orderNo);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => item.status === activeFilter);
  }, [data, activeFilter]);

  const columns = getColumns(
    (id, orderNo) => requestActionConfirm("received", id, orderNo),
    (id, orderNo) => requestActionConfirm("return", id, orderNo),
  );

  const confirmCopy = actionConfirm
    ? actionConfirm.type === "received"
      ? {
          title: "Mark order as received?",
          description: `Order ${actionConfirm.orderNo} will be marked as payment received. Continue?`,
          confirmLabel: "Yes, mark received",
        }
      : {
          title: "Mark order as returned?",
          description: `Order ${actionConfirm.orderNo} will be marked as returned. Continue?`,
          confirmLabel: "Yes, mark returned",
        }
    : { title: "", description: "", confirmLabel: "Confirm" };

  return (
    <div className="space-y-2">
      <AlertDialog
        open={!!actionConfirm}
        onOpenChange={(open) => !open && setActionConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionConfirm?.type === "received" && (
            <div className="grid gap-2 py-2">
              <Label htmlFor="receivedAmount">Received Amount</Label>
              <Input
                id="receivedAmount"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Enter received amount..."
                autoFocus
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void executeConfirmedAction()}
              disabled={actionConfirm?.type === "received" && !receivedAmount}
            >
              {confirmCopy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <TabsList className="grid grid-cols-3 w-[500px]">
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Received">Received</TabsTrigger>
                <TabsTrigger value="Returned">Returned</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <DatePicker date={startDate} setDate={setStartDate} />
                <span className="text-muted-foreground">-</span>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredData} />
        </CardContent>
      </Card>
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
