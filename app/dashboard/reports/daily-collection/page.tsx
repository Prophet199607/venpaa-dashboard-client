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

function DailyCollectionReportPageContent() {
  const { toast } = useToast();
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
      });
      return;
    }

    if (dateFrom > dateTo) {
      toast({
        title: "Invalid date range",
        description: "Date From cannot be after Date To",
      });
      return;
    }

    const formattedFrom = format(dateFrom, "dd/MM/yyyy");
    const formattedTo = format(dateTo, "dd/MM/yyyy");

    const url = `/print/sales/daily-collection?location=${selectedLocation}&dateFrom=${formattedFrom}&dateTo=${formattedTo}`;
    window.open(url, "_blank");
  };

  if (!permissionsLoading && !hasPermission("view daily-collection-report")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold">Daily Collection Report</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="grid gap-2">
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

            <div className="grid gap-2">
              <Label>Date From</Label>
              <DatePicker
                date={dateFrom}
                setDate={setDateFrom}
                placeholder="Select Date From"
                className="h-9"
              />
            </div>

            <div className="grid gap-2">
              <Label>Date To</Label>
              <DatePicker
                date={dateTo}
                setDate={setDateTo}
                placeholder="Select Date To"
                className="h-9"
              />
            </div>

            <Button onClick={handlePrint} className="w-full h-9">
              <Printer className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-20 text-center text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-4 opacity-10" />
          <h3 className="text-base font-medium mb-1">No Report Generated</h3>
          <p className="max-w-xs mx-auto text-xs">
            Select the date range and location above, then click &quot;Generate
            Report&quot; to view the daily collection summary.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DailyCollectionReportPage() {
  return (
    <Suspense fallback={<Loader />}>
      <DailyCollectionReportPageContent />
    </Suspense>
  );
}
