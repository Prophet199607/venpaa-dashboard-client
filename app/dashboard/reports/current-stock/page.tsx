"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface Location {
  loca_code: string;
  loca_name: string;
}

function CurrentStockReportPageContent() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const [departments, setDepartments] = useState<MultiSelectOption[]>([]);
  const [categories, setCategories] = useState<MultiSelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<MultiSelectOption[]>([]);

  const [selectedDepartments, setSelectedDepartments] = useState<
    MultiSelectOption[]
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<
    MultiSelectOption[]
  >([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    MultiSelectOption[]
  >([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

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

  const fetchFilterData = useCallback(async () => {
    try {
      setIsLoadingFilters(true);
      const [depRes, catRes, supRes] = await Promise.all([
        api.get("/departments"),
        api.get("/categories"),
        api.get("/suppliers"),
      ]);

      if (depRes.data.success) {
        setDepartments(
          depRes.data.data.map((d: any) => ({
            value: d.dep_code,
            label: d.dep_name,
          })),
        );
      }
      if (catRes.data.success) {
        setCategories(
          catRes.data.data.map((c: any) => ({
            value: c.cat_code,
            label: c.cat_name,
          })),
        );
      }
      if (supRes.data.success) {
        setSuppliers(
          supRes.data.data.map((s: any) => ({
            value: s.sup_code,
            label: s.sup_name,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch filter data", error);
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  useEffect(() => {
    if (!fetched.current) {
      fetchLocations();
      fetchFilterData();
      fetched.current = true;
    }
  }, [fetchLocations, fetchFilterData]);

  const handlePrint = () => {
    if (!selectedLocation) {
      toast({
        title: "Missing filters",
        description: "Please select a location.",
        type: "error",
      });
      return;
    }

    const params = new URLSearchParams({
      location: selectedLocation,
      department: selectedDepartments.map((d) => d.value).join(","),
      category: selectedCategories.map((c) => c.value).join(","),
      supplierCodes: selectedSuppliers.map((s) => s.value).join(","),
    });

    const url = `/print/sales/current-stock?${params.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div className="space-y-1">
            <div className="text-base font-semibold">Current Stock Report</div>
            <p className="text-sm text-muted-foreground">
              View the current stock summary for a specific location.
            </p>
          </div>
          <Button onClick={handlePrint} className="px-8 shadow-sm">
            <Printer className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-start">
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
              <Label>Departments</Label>
              <MultiSelect
                options={departments}
                selected={selectedDepartments}
                onChange={setSelectedDepartments}
                placeholder="Select Departments"
                disabled={isLoadingFilters}
              />
            </div>

            <div className="grid gap-2">
              <Label>Categories</Label>
              <MultiSelect
                options={categories}
                selected={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Select Categories"
                disabled={isLoadingFilters}
              />
            </div>

            <div className="grid gap-2">
              <Label>Suppliers</Label>
              <MultiSelect
                options={suppliers}
                selected={selectedSuppliers}
                onChange={setSelectedSuppliers}
                placeholder="Select Suppliers"
                disabled={isLoadingFilters}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-20 text-center text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-4 opacity-10" />
          <h3 className="text-sm font-medium mb-1">No Report Generated</h3>
          <p className="max-w-xs mx-auto text-xs">
            Select the location above, then click &quot;Generate Report&quot; to
            view the current stock summary.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CurrentStockReportPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CurrentStockReportPageContent />
    </Suspense>
  );
}
