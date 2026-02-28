"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  RefreshCw,
  Printer,
  FileText,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DayEndModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Location {
  id: number;
  loca_code: string;
  loca_name: string;
}

interface PosSalesSummary {
  Unit_No: number;
  Loca: string;
  PosGross_Sales: string | number;
  PosRefund_Tot: string | number;
  PosRefund_No: number;
  PosVoid_Tot: string | number;
  PosVoid_No: number;
  PosError_Tot: string | number;
  PosError_No: number;
  PosCancel_Tot: string | number;
  PosCancel_No: number;
  PosNet_Amt: string | number;
  PosCash_Amt: string | number;
  PosCredit_amt: string | number;
  PosBill_Count: number;
  PosExchange_Tot: string | number;
  PosExchange_No: number;
  PosDiscount_Tot: string | number;
  PosDiscount_No: number;
  Declare_Amount: string | number;
  Pos_CashOut: string | number;
  Card1_Descr: string;
  Card1_Amount: string | number;
  Card2_Descr: string;
  Card2_Amount: string | number;
  Card9_Descr: string;
  Card9_Amount: string | number;
  GvCash: string | number;
  GvCr: string | number;
  Inv: string | number;
  InvCash: string | number;
  InvChq: string | number;
  Cur: string | number;
  RntChq: string | number;
  Loca_Descrip: string;
  Report_Id?: string | number;
}

export default function DayEndModal({ isOpen, onClose }: DayEndModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [summaries, setSummaries] = useState<PosSalesSummary[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get("/locations");
        if (response.data.success) {
          setLocations(response.data.data);

          const storedLoc = localStorage.getItem("userLocation");
          if (storedLoc) {
            const exists = response.data.data.find(
              (l: Location) => l.loca_code === storedLoc,
            );
            if (exists) setSelectedLocation(storedLoc);
          }
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      }
    };

    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchSummary = useCallback(async () => {
    if (selectedLocation === "all") return;

    setLoading(true);
    try {
      const response = await api.get("/Sales/pos-sales-summary", {
        params: {
          Loca: selectedLocation,
        },
      });

      if (response.data.success) {
        setSummaries(response.data.data);
      } else {
        setSummaries([]);
        toast({
          title: "Notice",
          description: response.data.message || "Failed to fetch summary data",
          type: "info",
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch day end summary:", error);
      setSummaries([]);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load summary data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, toast]);

  useEffect(() => {
    if (isOpen && selectedLocation !== "all") {
      fetchSummary();
    }
  }, [isOpen, selectedLocation, fetchSummary]);

  const handleDayend = () => {
    if (selectedLocation === "all") return;
    setIsConfirmOpen(true);
  };

  const executeDayend = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    try {
      const response = await api.post("/Sales/process-day-end", {
        Loca: selectedLocation,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
          type: "success",
        });
        fetchSummary();
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to process day end",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Day end process failed:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "An unexpected error occurred during day end",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSummary();
  };

  const formatCurrency = (amount: string | number) => {
    return Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Sort summaries by Terminal
  const sortedSummaries = [...summaries].sort((a, b) => a.Unit_No - b.Unit_No);

  // Aggregate totals
  const totalGross = summaries.reduce(
    (acc, curr) => acc + Number(curr.PosGross_Sales),
    0,
  );
  const totalNet = summaries.reduce(
    (acc, curr) => acc + Number(curr.PosNet_Amt),
    0,
  );
  const totalBills = summaries.reduce(
    (acc, curr) => acc + Number(curr.PosBill_Count),
    0,
  );
  const totalDiscount = summaries.reduce(
    (acc, curr) => acc + Number(curr.PosDiscount_Tot),
    0,
  );
  const totalCash = summaries.reduce(
    (acc, curr) => acc + Number(curr.PosCash_Amt),
    0,
  );
  const totalCredit = summaries.reduce(
    (acc, curr) => acc + Number(curr.PosCredit_amt),
    0,
  );

  const totalInv = summaries.reduce((acc, curr) => acc + Number(curr.Inv), 0);
  const totalInvCash = summaries.reduce(
    (acc, curr) => acc + Number(curr.InvCash),
    0,
  );
  const totalInvChq = summaries.reduce(
    (acc, curr) => acc + Number(curr.InvChq),
    0,
  );
  const totalCur = summaries.reduce((acc, curr) => acc + Number(curr.Cur), 0);
  const totalRntChq = summaries.reduce(
    (acc, curr) => acc + Number(curr.RntChq),
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Sales Summary - {summaries[0]?.Loca_Descrip || selectedLocation}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Filters */}
          <div className="flex flex-col xl:flex-row gap-2 items-end p-2 rounded-lg">
            <div className="space-y-2 w-full xl:max-w-xs">
              <Label>Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.loca_code}>
                      {loc.loca_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full xl:flex-1">
              <div className="flex items-center italic text-slate-500 text-xs">
                Showing all pending day-end records for the selected location.
              </div>
            </div>

            <div className="flex gap-2 w-full xl:w-auto xl:justify-end">
              <Button
                onClick={handleRefresh}
                disabled={loading || selectedLocation === "all"}
                variant="outline"
                className="flex-1 xl:flex-none hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Refresh Summary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                )}
              </Button>

              {/* <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `/print/sales?loca=${selectedLocation}&from=${format(dateFrom || new Date(), "yyyy-MM-dd")}&to=${format(dateTo || new Date(), "yyyy-MM-dd")}`,
                    "_blank",
                  )
                }
                title="POS Sales Summary"
                className="flex-1 xl:flex-none hover:bg-green-50 hover:text-green-600 transition-colors"
                disabled={selectedLocation === "all"}
              >
                <Printer className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `/print/sales/daily-collection?loca=${selectedLocation}&from=${format(dateFrom || new Date(), "yyyy-MM-dd")}&to=${format(dateTo || new Date(), "yyyy-MM-dd")}`,
                    "_blank",
                  )
                }
                title="Daily Collection Report"
                className="flex-1 xl:flex-none hover:bg-amber-50 hover:text-amber-600 transition-colors"
                disabled={selectedLocation === "all"}
              >
                <FileText className="h-4 w-4 text-amber-600" />
              </Button> */}
            </div>
          </div>

          {/* Summary Cards */}
          {summaries.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase">
                      Gross Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base font-bold">
                      LKR {formatCurrency(totalGross)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase">
                      Net Sales (Cash + Credit)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* <div className="text-xs text-slate-400 mt-1">
                      Cash: {formatCurrency(totalCash)} | Credit:{" "}
                      {formatCurrency(totalCredit)}
                    </div> */}
                    <div className="text-base font-bold">
                      LKR {formatCurrency(totalNet)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase">
                      Total Bills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base font-bold">{totalBills}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs uppercase">
                      Total Discounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base font-bold text-rose-600">
                      LKR {formatCurrency(totalDiscount)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Units Table */}
              <div className="border rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Terminal Breakdown</h3>
                  <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    Pending Records (Unprocessed)
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-medium whitespace-nowrap">
                          Report ID
                        </th>
                        <th className="p-3 text-left font-medium">Unit No</th>
                        <th className="p-3 text-center font-medium">Bills</th>
                        <th className="p-3 text-right font-medium">
                          Gross Sales
                        </th>
                        <th className="p-3 text-right font-medium">Refunds</th>
                        <th className="p-3 text-right font-medium">
                          Discounts
                        </th>
                        <th className="p-3 text-right font-medium">
                          Net Sales
                        </th>
                        <th className="p-3 text-right font-medium">Cash</th>
                        <th className="p-3 text-right font-medium">Credit</th>
                        <th className="p-3 text-center font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSummaries.map((unit) => (
                        <tr
                          key={unit.Unit_No}
                          className="border-b last:border-0"
                        >
                          <td className="p-3 text-left font-medium text-slate-500 whitespace-nowrap">
                            {unit.Report_Id || "-"}
                          </td>
                          <td className="p-3 text-center">{unit.Unit_No}</td>
                          <td className="p-3 text-center">
                            {unit.PosBill_Count}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(unit.PosGross_Sales)}
                          </td>
                          <td className="p-3 text-right text-rose-500">
                            {formatCurrency(unit.PosRefund_Tot)}
                          </td>
                          <td className="p-3 text-right text-amber-600">
                            {formatCurrency(unit.PosDiscount_Tot)}
                          </td>
                          <td className="p-3 text-right font-bold">
                            {formatCurrency(unit.PosNet_Amt)}
                          </td>
                          <td className="p-3 text-right font-medium text-emerald-600">
                            {formatCurrency(unit.PosCash_Amt)}
                          </td>
                          <td className="p-3 text-right font-medium text-blue-600">
                            {formatCurrency(unit.PosCredit_amt)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              onClick={handleDayend}
                              disabled={loading}
                              className="text-xs font-semibold"
                            >
                              Dayend
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Wholesale / Other info */}
              <Card className="bg-indigo-50/30 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Wholesale & Recievables Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-indigo-500 uppercase font-bold">
                        Invoices
                      </p>
                      <p className="text-sm font-bold">
                        LKR {formatCurrency(totalInv)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-emerald-500 uppercase font-bold">
                        Collected Cash
                      </p>
                      <p className="text-sm font-bold">
                        LKR {formatCurrency(totalInvCash)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-blue-500 uppercase font-bold">
                        Collected Cheque
                      </p>
                      <p className="text-sm font-bold">
                        LKR {formatCurrency(totalInvChq)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-amber-500 uppercase font-bold">
                        Current Receipts
                      </p>
                      <p className="text-sm font-bold">
                        LKR {formatCurrency(totalCur)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-purple-500 uppercase font-bold">
                        Returns (RntChq)
                      </p>
                      <p className="text-sm font-bold">
                        LKR {formatCurrency(totalRntChq)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            !loading &&
            selectedLocation !== "all" && (
              <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed">
                <h3 className="text-base font-medium">No Data Found</h3>
                <p className="text-sm text-slate-500 max-w-xs text-center mt-2">
                  There are no pending sales records for the selected location.
                </p>
              </div>
            )
          )}

          {selectedLocation === "all" && (
            <div className="text-center text-sm py-10 text-slate-400 italic">
              Please select a location to view the summary.
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {locations.find((l) => l.loca_code === selectedLocation)
                  ?.loca_name || selectedLocation}
              </span>
              . This will finalize all transactions for the current business
              period. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDayend}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Run Day End
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
