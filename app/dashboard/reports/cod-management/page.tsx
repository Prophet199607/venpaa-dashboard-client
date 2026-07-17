"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/utils/api";
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
import { Printer, FileSpreadsheet, Search } from "lucide-react";

interface Location {
  loca_code: string;
  loca_name: string;
}

interface ReportRow {
  doc_no: string;
  customer: string;
  location: string;
  loca_name?: string;
  transaction_date: string;
  transaction_amount: number;
  status: string;
  received_amount: number;
}

const STATUSES = ["All", "Pending", "Received", "Returned"];

export default function CodManagementReportPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.loca_code, l.loca_name])),
    [locations],
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
    } catch {
      console.error("Failed to fetch locations");
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const fetchReport = async () => {
    if (!selectedLocation || !dateFrom || !dateTo) {
      toast({
        title: "Missing filters",
        description: "Please select location and date range",
      });
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string> = {
        location: selectedLocation,
        start_date: dateFrom,
        end_date: dateTo,
      };
      if (selectedStatus !== "All") {
        params.status = selectedStatus;
      }

      const { data: res } = await api.get("/cod-management/report", {
        params,
      });
      if (res.success) {
        setRows(res.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch report data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (rows.length === 0) {
      toast({ title: "No data", description: "Generate the report first" });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = rows
      .map(
        (r) => `<tr>
          <td>${r.doc_no}</td>
          <td>${r.customer}</td>
          <td>${r.loca_name ?? locationMap.get(r.location) ?? r.location}</td>
          <td>${(r.transaction_date ?? "").split(" ")[0]}</td>
          <td style="text-align:right">${Number(r.transaction_amount).toFixed(2)}</td>
          <td>${r.status}</td>
          <td style="text-align:right">${Number(r.received_amount ?? 0).toFixed(2)}</td>
          <td style="text-align:right">${(Number(r.transaction_amount ?? 0) - Number(r.received_amount ?? 0)).toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const totals = rows.reduce(
      (acc, r) => ({
        amount: acc.amount + Number(r.transaction_amount ?? 0),
        received: acc.received + Number(r.received_amount ?? 0),
      }),
      { amount: 0, received: 0 },
    );

    const totalsRow = `<tr class="total-row">
      <td colspan="4" style="text-align:right"><strong>Total</strong></td>
      <td style="text-align:right"><strong>${totals.amount.toFixed(2)}</strong></td>
      <td></td>
      <td style="text-align:right"><strong>${totals.received.toFixed(2)}</strong></td>
      <td style="text-align:right"><strong>${(totals.amount - totals.received).toFixed(2)}</strong></td>
    </tr>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>COD Management Report</title>
          <style>
            @page { margin: 15px; }
            body { font-family: Arial, sans-serif; font-size: 11px; }
            h2 { margin-bottom: 4px; }
            .meta { color: #555; margin-top: 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #bbb; padding: 4px 6px; }
            th { background: #f0f0f0; text-align: left; }
            .total-row td { font-weight: bold; background: #f9f9f9; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h2>COD Management Report</h2>
          <p class="meta">${format(new Date(dateFrom), "dd/MM/yyyy")} - ${format(new Date(dateTo), "dd/MM/yyyy")} | ${selectedStatus === "All" ? "All Statuses" : selectedStatus}</p>
          <table>
            <thead>
              <tr>
                <th>Doc No</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Date</th>
                <th style="text-align:right">Amount</th>
                <th>Status</th>
                <th style="text-align:right">Received</th>
                <th style="text-align:right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${totalsRow}
            </tbody>
          </table>
          <script>
            document.title = "COD Management Report";
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
    if (rows.length === 0) {
      toast({ title: "No data", description: "Generate the report first" });
      return;
    }

    try {
      setLoading(true);
      const params: Record<string, string> = {
        location: selectedLocation,
        start_date: dateFrom,
        end_date: dateTo,
      };
      if (selectedStatus !== "All") {
        params.status = selectedStatus;
      }

      const { data: blob } = await api.get(
        "/cod-management/report/export",
        { params, responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `COD_Management_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Export failed",
        description: "Unable to export the report",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold">COD Management Report</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
              <Label>From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchReport}
              disabled={loading}
              className="gap-2"
            >
              <Search size={14} />
              Generate
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={rows.length === 0}
              className="gap-2"
            >
              <Printer size={14} />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={rows.length === 0 || loading}
              className="gap-2"
            >
              <FileSpreadsheet size={14} />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Doc No</th>
                    <th className="text-left p-3 font-medium">Customer</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Received</th>
                    <th className="text-right p-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-3">{r.doc_no}</td>
                      <td className="p-3">{r.customer}</td>
                      <td className="p-3">{r.loca_name ?? locationMap.get(r.location) ?? r.location}</td>
                      <td className="p-3">{(r.transaction_date ?? "").split(" ")[0]}</td>
                      <td className="p-3 text-right">
                        {Number(r.transaction_amount).toFixed(2)}
                      </td>
                      <td className="p-3">{r.status}</td>
                      <td className="p-3 text-right">
                        {Number(r.received_amount ?? 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        {(Number(r.transaction_amount ?? 0) - Number(r.received_amount ?? 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td colSpan={4} className="p-3 text-right">
                      Total
                    </td>
                    <td className="p-3 text-right">
                      {rows
                        .reduce(
                          (acc, r) => acc + Number(r.transaction_amount ?? 0),
                          0,
                        )
                        .toFixed(2)}
                    </td>
                    <td />
                    <td className="p-3 text-right">
                      {rows
                        .reduce(
                          (acc, r) => acc + Number(r.received_amount ?? 0),
                          0,
                        )
                        .toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      {(rows.reduce((acc, r) => acc + Number(r.transaction_amount ?? 0), 0) - rows.reduce((acc, r) => acc + Number(r.received_amount ?? 0), 0)).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
