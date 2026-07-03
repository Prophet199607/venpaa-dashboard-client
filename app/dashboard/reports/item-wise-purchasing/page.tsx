"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { Printer, Download, Search, Table2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
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

interface ReportRow {
  date: string;
  location: string;
  grn_number: string;
  prod_code: string;
  prod_name: string;
  supplier: string;
  qty: number;
  rate: number;
  amount: number;
}

export default function ItemWisePurchasingPage() {
  const { toast } = useToast();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const fetchedRef = useRef(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>(
    format(
      new Date(new Date().setDate(new Date().getDate() - 30)),
      "yyyy-MM-dd",
    ),
  );
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);

  const fetchLocations = useCallback(async () => {
    try {
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
        if (res.data.length > 0) {
          setSelectedLocation(res.data[0].loca_code);
        }
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

  const fmt = (val: number) =>
    Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const totalQty = useMemo(
    () => reportRows.reduce((sum, row) => sum + Number(row.qty || 0), 0),
    [reportRows],
  );

  const totalAmount = useMemo(
    () => reportRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [reportRows],
  );

  const handlePrint = () => {
    if (reportRows.length === 0) {
      toast({
        title: "No data",
        description: "Generate the report first before printing.",
        type: "error",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = reportRows
      .map(
        (row) => `
        <tr>
          <td>${row.date}</td>
          <td>${row.location}</td>
          <td>${row.grn_number}</td>
          <td>${row.prod_code}</td>
          <td>${row.prod_name}</td>
          <td>${row.supplier}</td>
          <td style="text-align:right">${Number(row.qty)}</td>
          <td style="text-align:right">${fmt(row.rate)}</td>
          <td style="text-align:right">${fmt(row.amount)}</td>
        </tr>`,
      )
      .join("");

    const now = new Date();
    const dateTimeStr =
      now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " | " +
      now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

    printWindow.document.write(`
      <html>
        <head>
          <title>Item Wise Purchasing Report</title>
          <style>
            @page { margin: 15px; }
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 11px; color: #222; }
            .report-title { text-align: center; margin-bottom: 10px; }
            .report-title h2 { margin: 0 0 2px; font-size: 14px; font-weight: 700; }
            .report-title .meta { margin: 0; font-size: 10px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #bbb; padding: 4px 5px; }
            th { background: #f0f0f0; font-weight: 600; text-align: left; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr { page-break-inside: avoid; }
            .total-row { font-weight: 600; background: #f5f5f5; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="report-title">
            <h2>Item Wise Purchasing Report</h2>
            <p class="meta">${dateFrom} to ${dateTo}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Location</th>
                <th>GRN No</th>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Supplier</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Rate</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="6"><strong>Total</strong></td>
                <td style="text-align:right">${Number(totalQty)}</td>
                <td></td>
                <td style="text-align:right">${fmt(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          <script>
            document.title = "Item Wise Purchasing Report";
            window.onafterprint = function () { window.close(); };
            setTimeout(function () { window.print(); }, 300);
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleExport = async () => {
    if (reportRows.length === 0) {
      toast({
        title: "No data",
        description: "Generate the report first before exporting.",
        type: "error",
      });
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        location: selectedLocation,
        product: selectedProduct,
        dateFrom,
        dateTo,
      });

      const { data: blob } = await api.get(
        `/reports/item-wise-purchasing-report/export?${params.toString()}`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Item_Wise_Purchasing_Report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description:
          error.response?.data?.message || "Unable to export the report.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Missing filters",
        description: "Please select both date ranges.",
        type: "error",
      });
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        location: selectedLocation,
        product: selectedProduct,
        dateFrom,
        dateTo,
      });

      const { data: res } = await api.get(
        `/reports/item-wise-purchasing-report?${params.toString()}`,
      );

      if (res.success) {
        setReportRows(res.data || []);
      } else {
        toast({
          title: "Report failed",
          description: res.message || "Unable to generate the report.",
          type: "error",
        });
      }
    } catch (error: any) {
      toast({
        title: "Report failed",
        description:
          error.response?.data?.message || "Unable to generate the report.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (
    !permissionsLoading &&
    !hasPermission("view item-wise-purchasing-report")
  ) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              Item Wise Purchasing Report
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={isLoading || reportRows.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading || reportRows.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.loca_code} value={loc.loca_code}>
                      {loc.loca_name} ({loc.loca_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <BasicProductSearch
                value={selectedProduct === "all" ? "" : selectedProduct}
                onValueChange={(product) =>
                  setSelectedProduct(product ? product.prod_code : "all")
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {reportRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left font-medium">GRN No</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Product Code
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">Rate</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportRows.map((row, index) => (
                    <tr
                      key={`${row.grn_number}-${row.prod_code}-${index}`}
                      className="hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">{row.location}</td>
                      <td className="px-4 py-3">{row.grn_number}</td>
                      <td className="px-4 py-3">{row.prod_code}</td>
                      <td className="px-4 py-3">{row.prod_name}</td>
                      <td className="px-4 py-3">{row.supplier}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(row.qty)}
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(row.rate)}</td>
                      <td className="px-4 py-3 text-right">
                        {fmt(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-medium">
                  <tr>
                    <td className="px-4 py-3" colSpan={6}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-right">{Number(totalQty)}</td>
                    <td className="px-4 py-3 text-right"></td>
                    <td className="px-4 py-3 text-right">{fmt(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3">
                <Table2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  No report generated yet
                </h3>
                <p className="text-sm">
                  Choose the filters above and generate the item-wise GRN
                  purchasing report.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
