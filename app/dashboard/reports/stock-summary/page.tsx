"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockSummary {
  prod_code: string;
  prod_name: string;
  unit_name: string;
  total_qty: number;
  selling_price: number;
  stock_value: number;
}

interface Location {
  loca_code: string;
  loca_name: string;
}

function StockSummaryPageContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StockSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const fetchLocations = useCallback(async () => {
    try {
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch locations", error);
    }
  }, []);

  const fetchStockSummary = useCallback(
    async (locationCode: string) => {
      try {
        setLoading(true);
        const locParam = locationCode === "all" ? "" : locationCode;
        const { data: res } = await api.get(
          `/reports/stock-summary?location_code=${locParam}`,
        );

        if (!res.success) {
          throw new Error(res.message);
        }
        setData(res.data);
      } catch (error: any) {
        toast({
          title: "Failed to load stock summary",
          description: error.message,
          type: "error",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchLocations();
    fetchStockSummary("all");
  }, [fetchLocations, fetchStockSummary]);

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    fetchStockSummary(value);
  };

  const columns: ColumnDef<StockSummary>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => <div>{row.index + 1}</div>,
      size: 50,
    },
    {
      accessorKey: "prod_code",
      header: "Code",
    },
    {
      accessorKey: "prod_name",
      header: "Product Name",
    },
    {
      accessorKey: "unit_name",
      header: "Unit",
    },
    {
      accessorKey: "total_qty",
      header: "Qty",
      cell: ({ row }) => (
        <div className="text-right">{row.original.total_qty}</div>
      ),
    },
    {
      accessorKey: "selling_price",
      header: "Price",
      cell: ({ row }) => (
        <div className="text-right">
          {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            row.original.selling_price,
          )}
        </div>
      ),
    },
    {
      accessorKey: "stock_value",
      header: "Value",
      cell: ({ row }) => (
        <div className="text-right font-semibold">
          {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            row.original.stock_value,
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Stock Summary Report</div>
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select
                value={selectedLocation}
                onValueChange={handleLocationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">
                    All Locations
                  </SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.loca_code} value={loc.loca_code}>
                      {loc.loca_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader />
            </div>
          ) : (
            <DataTable columns={columns} data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StockSummaryPage() {
  return (
    <Suspense fallback={<Loader />}>
      <StockSummaryPageContent />
    </Suspense>
  );
}
