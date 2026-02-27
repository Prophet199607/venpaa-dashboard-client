"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { api } from "@/utils/api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, RefreshCw, Printer, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
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
  DateFrom: string;
  DateTo: string;
  Loca_Descrip: string;
}

export default function DayEndModal({ isOpen, onClose }: DayEndModalProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [summaries, setSummaries] = useState<PosSalesSummary[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get("/locations");
        if (response.data.success) {
          setLocations(response.data.data);

          // Try to set default location from local storage or first location
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
    if (!dateFrom || !dateTo || selectedLocation === "all") return;

    setLoading(true);
    try {
      const formattedFrom = format(dateFrom, "yyyy-MM-dd");
      const formattedTo = format(dateTo, "yyyy-MM-dd");

      const response = await api.get("/Sales/pos-sales-summary", {
        params: {
          Loca: selectedLocation,
          DateFrom: formattedFrom,
          DateTo: formattedTo,
        },
      });

      if (response.data.success) {
        setSummaries(response.data.data);
      } else {
        setSummaries([]);
      }
    } catch (error) {
      console.error("Failed to fetch day end summary:", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedLocation]);

  useEffect(() => {
    if (isOpen && dateFrom && dateTo && selectedLocation !== "all") {
      fetchSummary();
    }
  }, [isOpen, dateFrom, dateTo, selectedLocation, fetchSummary]);

  const handleRefresh = () => {
    fetchSummary();
  };

  const formatCurrency = (amount: string | number) => {
    return Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Sort summaries by Date then Terminal
  const sortedSummaries = [...summaries].sort((a, b) => {
    // Compare dates (convert dd/mm/yyyy to yyyy-mm-dd for string comparison)
    const dateA = a.DateFrom.split("/").reverse().join("-");
    const dateB = b.DateFrom.split("/").reverse().join("-");
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return a.Unit_No - b.Unit_No;
  });

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
          <div className="flex flex-col xl:flex-row gap-2 items-end p-2 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
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
              <div className="space-y-2 flex-1">
                <Label>Date From</Label>
                <DatePicker
                  date={dateFrom}
                  setDate={setDateFrom}
                  allowFuture
                  allowPast
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Date To</Label>
                <DatePicker
                  date={dateTo}
                  setDate={setDateTo}
                  allowFuture
                  allowPast
                />
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
              <Button
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
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {summaries.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Gross Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                      LKR {formatCurrency(totalGross)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Net Sales (Cash + Credit)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* <div className="text-xs text-slate-400 mt-1">
                      Cash: {formatCurrency(totalCash)} | Credit:{" "}
                      {formatCurrency(totalCredit)}
                    </div> */}
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                      LKR {formatCurrency(totalNet)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Bills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {totalBills}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-rose-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
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
              <div className="border rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-950">
                <div className="bg-slate-50 p-4 border-b dark:bg-slate-900 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    Terminal Breakdown
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {format(dateFrom || new Date(), "dd MMM yyyy")} -{" "}
                    {format(dateTo || new Date(), "dd MMM yyyy")}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 border-b">
                        <th className="p-4 text-left font-medium whitespace-nowrap">
                          Report ID
                        </th>
                        <th className="p-4 text-left font-medium whitespace-nowrap">
                          Date
                        </th>
                        <th className="p-4 text-left font-medium">Terminal</th>
                        <th className="p-4 text-center font-medium">Bills</th>
                        <th className="p-4 text-right font-medium">Gross</th>
                        <th className="p-4 text-right font-medium">Refunds</th>
                        <th className="p-4 text-right font-medium">
                          Discounts
                        </th>
                        <th className="p-4 text-right font-medium">
                          Net Sales
                        </th>
                        <th className="p-4 text-right font-medium">Cash</th>
                        <th className="p-4 text-right font-medium">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSummaries.map((unit, index) => (
                        <tr
                          key={`${unit.Unit_No}-${unit.DateFrom}-${index}`}
                          className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="p-4 font-mono text-xs text-blue-600 dark:text-blue-400">
                            RPT-{unit.Loca}-{unit.Unit_No}-
                            {unit.DateFrom.replace(/\//g, "")}
                          </td>
                          <td className="p-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {unit.DateFrom === unit.DateTo
                              ? unit.DateFrom
                              : `${unit.DateFrom} - ${unit.DateTo}`}
                          </td>
                          <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                            Terminal {unit.Unit_No}
                          </td>
                          <td className="p-4 text-center">
                            {unit.PosBill_Count}
                          </td>
                          <td className="p-4 text-right">
                            {formatCurrency(unit.PosGross_Sales)}
                          </td>
                          <td className="p-4 text-right text-rose-500">
                            {formatCurrency(unit.PosRefund_Tot)}
                          </td>
                          <td className="p-4 text-right text-amber-600">
                            {formatCurrency(unit.PosDiscount_Tot)}
                          </td>
                          <td className="p-4 text-right font-bold">
                            {formatCurrency(unit.PosNet_Amt)}
                          </td>
                          <td className="p-4 text-right">
                            {formatCurrency(unit.PosCash_Amt)}
                          </td>
                          <td className="p-4 text-right">
                            {formatCurrency(unit.PosCredit_amt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Wholesale / Other info */}
              <Card className="bg-indigo-50/30 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-semibold text-indigo-900 dark:text-indigo-300">
                    Wholesale & Recievables Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-indigo-500 uppercase font-bold">
                        Invoices
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        LKR {formatCurrency(totalInv)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-emerald-500 uppercase font-bold">
                        Collected Cash
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        LKR {formatCurrency(totalInvCash)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-blue-500 uppercase font-bold">
                        Collected Cheque
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        LKR {formatCurrency(totalInvChq)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-amber-500 uppercase font-bold">
                        Current Receipts
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        LKR {formatCurrency(totalCur)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-purple-500 uppercase font-bold">
                        Returns (RntChq)
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
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
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4 dark:bg-slate-950">
                  <RefreshCw className="h-2 w-2 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  No Data Found
                </h3>
                <p className="text-slate-500 max-w-xs text-center mt-2">
                  There are no sales records for the selected location between{" "}
                  {format(dateFrom || new Date(), "dd/MM/yyyy")} and{" "}
                  {format(dateTo || new Date(), "dd/MM/yyyy")}.
                </p>
              </div>
            )
          )}

          {selectedLocation === "all" && (
            <div className="text-center py-20 text-slate-400 italic">
              Please select a location to view the summary.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
