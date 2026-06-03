"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { Download, Printer, Store } from "lucide-react";

interface Location {
  loca_code: string;
  loca_name: string;
}

const ORDER_TYPE_OPTIONS = [
  { label: "All Types", value: "ALL" },
  { label: "WEB", value: "WEB" },
  { label: "APP", value: "APP" },
];

const PAYMENT_TYPE_OPTIONS = [
  { label: "All Payments", value: "ALL" },
  { label: "COD", value: "1" },
  { label: "Card Payment", value: "2" },
  { label: "Mintpay", value: "3" },
];

function WebSalesReportPageContent() {
  const { toast } = useToast();
  const fetchedRef = useRef(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [type, setType] = useState<string>("ALL");
  const [paymentType, setPaymentType] = useState<string>("ALL");

  const fetchLocations = useCallback(async () => {
    try {
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
        if (res.data.length > 0) {
          setSelectedLocation(res.data[0].loca_code);
        }
      }
    } catch {
      console.error("Failed to fetch locations");
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchLocations();
  }, [fetchLocations]);

  const handleGenerate = () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Missing filters",
        description: "Please select a date range",
        type: "error",
      });
      return;
    }

    const params = new URLSearchParams({ dateFrom, dateTo });
    if (selectedLocation && selectedLocation !== "ALL") {
      params.set("location", selectedLocation);
    }
    if (type && type !== "ALL") {
      params.set("type", type);
    }
    if (paymentType && paymentType !== "ALL") {
      params.set("payment_type", paymentType);
    }

    window.open(`/print/sales/web-sales?${params.toString()}`, "_blank");
  };

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Missing filters",
        description: "Please select a date range",
        type: "error",
      });
      return;
    }

    try {
      const exportParams: Record<string, string> = { dateFrom, dateTo };
      if (selectedLocation && selectedLocation !== "ALL") {
        exportParams.location = selectedLocation;
      }
      if (type && type !== "ALL") {
        exportParams.type = type;
      }
      if (paymentType && paymentType !== "ALL") {
        exportParams.payment_type = paymentType;
      }

      const { data: blob } = await api.get(
        "/reports/web-sales-report/export",
        { params: exportParams, responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Web_Sales_Report_${dateFrom}_${dateTo}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Export failed",
        description: "Failed to export web sales report",
        type: "error",
      });
    }
  };

  if (!permissionsLoading && !hasPermission("view web-sales-report")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-lg font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Store className="w-5 h-5" />
            Web Sales Report
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Location
              </Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.loca_code} value={loc.loca_code}>
                      {loc.loca_name} ({loc.loca_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Date From
              </Label>
              <Input
                type="date"
                className="h-9"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Date To
              </Label>
              <Input
                type="date"
                className="h-9"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Payment
              </Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Payment" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-transparent select-none">
                Action
              </Label>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  className="gap-2 transition-all shadow-md flex-1"
                >
                  <Printer className="h-4 w-4" />
                  Generate
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="gap-2 transition-all shadow-md flex-1"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed p-8">
        <CardContent className="p-16 text-center text-muted-foreground">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-6 w-6 text-blue-500 opacity-40" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Web Sales Report
            </h3>
            <p className="text-sm">
              Select filters above and click &quot;Generate&quot; to open the
              report in a new tab with A4 printable layout.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WebSalesReportPage() {
  return (
    <Suspense fallback={<Loader />}>
      <WebSalesReportPageContent />
    </Suspense>
  );
}
