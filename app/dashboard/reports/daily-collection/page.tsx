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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer, FileText } from "lucide-react";
import { format } from "date-fns";

interface Location {
  loca_code: string;
  loca_name: string;
}

function DailyCollectionReportPageContent() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );

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

    const formattedFrom = format(new Date(dateFrom), "dd/MM/yyyy");
    const formattedTo = format(new Date(dateTo), "dd/MM/yyyy");

    const url = `/print/sales/daily-collection?location=${selectedLocation}&dateFrom=${formattedFrom}&dateTo=${formattedTo}`;
    window.open(url, "_blank");
  };

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
                <SelectTrigger>
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
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <Button onClick={handlePrint} className="w-full">
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
