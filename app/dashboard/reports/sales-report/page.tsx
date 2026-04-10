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
import { Printer, FileText, FileSpreadsheet } from "lucide-react";

interface Location {
  loca_code: string;
  loca_name: string;
}

const VIEW_TYPES = [
  { label: "Product", value: "PRODUCT" },
  { label: "Department", value: "DEPARTMENT" },
  { label: "Category", value: "CATEGORY" },
  { label: "Supplier", value: "SUPPLIER" },
];

function SalesReportPageContent() {
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
  const [viewType, setViewType] = useState<string>("PRODUCT");
  const [codeFrom, setCodeFrom] = useState<string>("");
  const [codeTo, setCodeTo] = useState<string>("");

  const fetchLocations = useCallback(async () => {
    try {
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
        if (res.data.length > 0) {
          setSelectedLocation(res.data[0].loca_code);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch locations", error);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchLocations();
  }, [fetchLocations]);

  const handlePrint = () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Missing filters",
        description: "Please select a date range",
        type: "error",
      });
      return;
    }

    const reportLocation = selectedLocation === "ALL" ? " " : selectedLocation;

    const params = new URLSearchParams({
      location: reportLocation,
      dateFrom: format(new Date(dateFrom), "dd/MM/yyyy"),
      dateTo: format(new Date(dateTo), "dd/MM/yyyy"),
      viewType,
      codeFrom,
      codeTo,
    });

    const url = `/print/sales/sales-report?${params.toString()}`;
    window.open(url, "_blank");
    // window.location.href = url;
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

    const reportLocation = selectedLocation === "ALL" ? " " : selectedLocation;

    const params = new URLSearchParams({
      location: reportLocation,
      dateFrom: format(new Date(dateFrom), "yyyy-MM-dd"),
      dateTo: format(new Date(dateTo), "yyyy-MM-dd"),
      viewType,
      codeFrom,
      codeTo,
    });

    try {
      const response = await api.get(
        `/reports/sales-report/export?${params.toString()}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Sales_Report_${format(new Date(), "yyyyMMdd")}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not generate excel file. Please try again.",
        type: "error",
      });
    }
  };

  if (!permissionsLoading && !hasPermission("view sales-report")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-lg font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <FileText className="w-5 h-5" />
            Sales Report
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
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
                View By
              </Label>
              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {VIEW_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Code From (Optional)
              </Label>
              <Input
                placeholder="Start Code"
                className="h-9"
                value={codeFrom}
                onChange={(e) => setCodeFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Code To (Optional)
              </Label>
              <Input
                placeholder="End Code"
                className="h-9"
                value={codeTo}
                onChange={(e) => setCodeTo(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2 transition-all shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
            <Button
              onClick={handlePrint}
              className="gap-2 transition-all shadow-md"
            >
              <Printer className="h-4 w-4" />
              Generate & Print Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-16 text-center text-muted-foreground">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-500 opacity-40" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              No Report Generated
            </h3>
            <p className="text-sm">
              Tailor your report using the filters above and click
              &quot;Generate &amp; Print&quot; to open the detailed sales report
              in a new tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SalesReportPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SalesReportPageContent />
    </Suspense>
  );
}
