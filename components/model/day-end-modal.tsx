"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { api } from "@/utils/api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
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

interface SummaryData {
  date: string;
  location: string;
  total_sales: number;
  total_qty: number;
  transaction_count: number;
  total_discount: number;
  breakdown: {
    Tr_Type: string;
    total_amount: number;
    count: number;
  }[];
}

export default function DayEndModal({ isOpen, onClose }: DayEndModalProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Fetch locations
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
    if (!date) return;

    setLoading(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error("Failed to fetch day end summary:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (isOpen && date) {
      fetchSummary();
    }
  }, [isOpen, date, selectedLocation, fetchSummary]);

  const handleRefresh = () => {
    fetchSummary();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Day End Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 flex-1">
              <Label>Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.loca_code}>
                      {loc.loca_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Label>Date</Label>
              <DatePicker date={date} setDate={setDate} />
            </div>

            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Total Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary.total_sales.toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary.transaction_count}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Items Sold
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary.total_qty}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Discount Given
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">
                      {summary.total_discount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown Table if needed */}
              {summary.breakdown && summary.breakdown.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Transaction Type</th>
                        <th className="p-3 text-center">Count</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.breakdown.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">
                            {item.Tr_Type === "S" || item.Tr_Type === "Sales"
                              ? "Sales"
                              : item.Tr_Type === "R" ||
                                  item.Tr_Type === "Return"
                                ? "Return"
                                : item.Tr_Type || "Unknown"}
                          </td>
                          <td className="p-3 text-center">{item.count}</td>
                          <td className="p-3 text-right font-medium">
                            {item.total_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!summary && !loading && (
            <div className="text-center py-10 text-gray-500">
              No data available for the selected date and location.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
