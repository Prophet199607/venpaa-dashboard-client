"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getColumns, ProductDiscard } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewProductDiscard from "@/components/model/transactions/view-product-discard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";

interface Location {
  id: number;
  loca_code: string;
  loca_name: string;
}

function ProductDiscardPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "drafted",
  );
  const [fetching, setFetching] = useState(false);
  const [productDiscards, setProductDiscards] = useState<ProductDiscard[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/transactions/product-discard?tab=${value}`);
  };

  // Sync tab state with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Open view dialog if docNo is in URL
  useEffect(() => {
    const viewDocNo = searchParams.get("view_doc_no");
    if (viewDocNo) {
      setViewDialog({
        isOpen: true,
        docNo: viewDocNo,
        status: "applied",
        iid: searchParams.get("iid") ?? "PD",
      });
    }
  }, [searchParams]);

  const fetchLocations = useCallback(async () => {
    try {
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  }, []);

  const fetchProductDiscards = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const params: any = {
          iid: "PD",
          status: status,
        };

        if (selectedLocation && selectedLocation !== "all") {
          params.location = selectedLocation;
        }

        if (startDate) {
          params.start_date = startDate.toISOString().split("T")[0];
        }

        if (endDate) {
          params.end_date = endDate.toISOString().split("T")[0];
        }

        const { data: res } = await api.get(
          "/product-discards/load-all-transactions",
          { params },
        );

        if (!res.success) throw new Error(res.message);

        const formattedData: ProductDiscard[] = res.data.map((pd: any) => ({
          docNo: pd.doc_no,
          date: pd.document_date
            ? new Date(pd.document_date).toLocaleDateString("en-CA")
            : "",
          locationName: pd.location_name || pd.location || "",
          remark: pd.remarks_ref || "",
        }));

        setProductDiscards(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch product discards:", err);
        toast({
          title: "Failed to load product discards",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast, selectedLocation, startDate, endDate],
  );

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Fetch data when activeTab or filters change
  useEffect(() => {
    fetchProductDiscards(activeTab);
  }, [activeTab, fetchProductDiscards]);

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "PD",
    });
  }, []);

  const columns = getColumns(activeTab, handleView);

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <TabsList>
                <TabsTrigger value="drafted">Drafted PD</TabsTrigger>
                <TabsTrigger value="applied">Applied PD</TabsTrigger>
              </TabsList>

              <Link href="/dashboard/transactions/product-discard/create">
                <Button type="button" className="flex items-center">
                  <Plus className="h-4 w-4" />
                  Create New PD
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-end items-end gap-2">
              <div className="w-full md:w-48 space-y-2">
                <Label htmlFor="location-filter">Location</Label>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger id="location-filter">
                    <SelectValue placeholder="All Locations" />
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

              <div className="w-full md:w-40 space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  date={startDate}
                  setDate={setStartDate}
                  placeholder="From Date"
                />
              </div>

              <div className="w-full md:w-40 space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  date={endDate}
                  setDate={setEndDate}
                  placeholder="To Date"
                />
              </div>

              <div className="w-full md:w-28">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLocation("all");
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value="drafted" className="mt-0">
              <DataTable columns={columns} data={productDiscards} />
            </TabsContent>

            <TabsContent value="applied" className="mt-0">
              <DataTable columns={columns} data={productDiscards} />
            </TabsContent>
          </CardContent>
        </Card>
        {fetching && <Loader />}
      </Tabs>

      <ViewProductDiscard
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
    </div>
  );
}

export default function ProductDiscardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDiscardPageContent />
    </Suspense>
  );
}
