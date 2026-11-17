"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";

interface Location {
  loca_code: string;
  loca_name: string;
}

function PosSalesSummaryReportPageContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

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
    fetchLocations();
  }, [fetchLocations]);

  const handlePrint = () => {
    if (!selectedLocation || !dateFrom || !dateTo) {
      toast({
        title: "Missing filters",
        description: "Please select location and date range",
        type: "error",
      });
      return;
    }

    if (dateFrom > dateTo) {
      toast({
        title: "Invalid date range",
        description: "Date From cannot be after Date To",
        type: "error",
      });
      return;
    }

    // Format dates to dd/MM/yyyy for the SP
    const formattedFrom = format(dateFrom, "dd/MM/yyyy");
    const formattedTo = format(dateTo, "dd/MM/yyyy");

    const url = `/print/sales/pos-sales-summary?location=${selectedLocation}&dateFrom=${formattedFrom}&dateTo=${formattedTo}`;
    window.open(url, "_blank");
  };

  if (!permissionsLoading && !hasPermission("view pos-sales-summary-report")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-2">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold">
            POS Sales Summary Report
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.loca_code} value={loc.loca_code}>
                      {loc.loca_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <DatePicker
                date={dateFrom}
                setDate={setDateFrom}
                placeholder="Select Date From"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <DatePicker
                date={dateTo}
                setDate={setDateTo}
                placeholder="Select Date To"
                className="h-9"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePrint} className="flex-1 h-9">
                <Printer className="mr-2 h-4 w-4" />
                Generate & Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-4 opacity-20" />
          <p className="text-xs">
            Adjust filters and click &quot;Generate &amp; Print&quot; to view
            the report.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PosSalesSummaryReportPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PosSalesSummaryReportPageContent />
    </Suspense>
  );
}
