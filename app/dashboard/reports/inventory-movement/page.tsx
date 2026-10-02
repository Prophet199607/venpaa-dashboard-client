"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { format } from "date-fns";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { usePermissions } from "@/context/permissions";
import { Printer, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { AccessDenied } from "@/components/shared/access-denied";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Location {
  loca_code: string;
  loca_name: string;
}

const ALL_LOCATIONS = "ALL";

function InventoryMovementReportPageContent() {
  const { toast } = useToast();
  const fetchedRef = useRef(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const [selectedLocation, setSelectedLocation] =
    useState<string>(ALL_LOCATIONS);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch locations", error);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchLocations();
  }, [fetchLocations]);

  const buildParams = useCallback(() => {
    return new URLSearchParams({
      location: selectedLocation === ALL_LOCATIONS ? "" : selectedLocation,
      dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
      dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : "",
    });
  }, [selectedLocation, dateFrom, dateTo]);

  const validate = useCallback(() => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Missing filters",
        description: "Please select a date range",
        type: "error",
      });
      return false;
    }

    if (dateFrom > dateTo) {
      toast({
        title: "Invalid date range",
        description: "Date From cannot be after Date To",
        type: "error",
      });
      return false;
    }

    return true;
  }, [dateFrom, dateTo, toast]);

  const handleGenerate = () => {
    if (!validate()) return;

    const url = `/print/sales/inventory-movement?${buildParams().toString()}`;
    window.open(url, "_blank");
  };

  const handleExport = async () => {
    if (!validate()) return;

    try {
      setIsExporting(true);

      const response = await api.get(
        `/reports/inventory-movement-report/export?${buildParams().toString()}`,
        { responseType: "blob" },
      );

      const locSuffix =
        selectedLocation === ALL_LOCATIONS ? "All" : selectedLocation;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Inventory_Movement_Report_${locSuffix}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description:
          error.response?.data?.message ||
          "Could not generate excel file. Please try again.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!permissionsLoading && !hasPermission("view inventory-movement-report")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div className="space-y-1">
            <div className="text-base font-semibold">
              Inventory Movement Report
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="px-6 shadow-sm"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Export Excel"}
            </Button>
            <Button onClick={handleGenerate} className="px-6 shadow-sm">
              <Printer className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-end">
            <div className="grid gap-2">
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
                  <SelectItem value={ALL_LOCATIONS}>All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.loca_code} value={loc.loca_code}>
                      {loc.loca_name} ({loc.loca_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Date From
              </Label>
              <DatePicker
                date={dateFrom}
                setDate={setDateFrom}
                placeholder="Select Date From"
                className="h-9"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">
                Date To
              </Label>
              <DatePicker
                date={dateTo}
                setDate={setDateTo}
                placeholder="Select Date To"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="text-center text-muted-foreground">
          <div className="max-w-md mx-auto p-8">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-emerald-500 opacity-40" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              No Report Generated
            </h3>
            <p className="text-sm">
              Select the location and date range above, then click
              &quot;Generate Report&quot; to open the inventory movement report
              in a new tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryMovementReportPage() {
  return (
    <Suspense fallback={<Loader />}>
      <InventoryMovementReportPageContent />
    </Suspense>
  );
}
