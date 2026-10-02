"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { openPrintWindow } from "@/utils/print-utils";
import { Printer, FileSpreadsheet, X, Loader2 } from "lucide-react";

interface InventoryMovementRow {
  loca_code: string;
  loca_name: string;
  prod_code: string;
  prod_name: string;
  unit: string;
  open_stock_qty: number;
  open_stock_value: number;
  grn_qty: number;
  grn_value: number;
  transfer_in_qty: number;
  transfer_in_value: number;
  total_in_qty: number;
  total_in_value: number;
  sale_qty: number;
  sale_value: number;
  good_return_qty: number;
  good_return_value: number;
  transfer_out_qty: number;
  transfer_out_value: number;
  product_discard_qty: number;
  product_discard_value: number;
  total_out_qty: number;
  total_out_value: number;
  adjustment_qty: number;
  adjustment_value: number;
  close_stock_qty: number;
  close_stock_value: number;
}

type Totals = Record<string, number>;

interface Filters {
  location: string;
  location_name: string;
  dateFrom: string | null;
  dateTo: string | null;
}

type ColumnKey =
  | "open_stock"
  | "grn"
  | "transfer_in"
  | "total_in"
  | "sale"
  | "good_return"
  | "transfer_out"
  | "product_discard"
  | "total_out"
  | "adjustment"
  | "close_stock";

interface Column {
  key: ColumnKey;
  label: string;
}

/**
 * Total In (GRN + Transfer In) and Total Out (Transfer Out + Discard) are plain
 * sums of the columns printed beside them, so they are left out of the printed
 * layout to keep it legible on A4. Every measure, including those two, is still
 * present in the Excel export.
 */
const COLUMNS: Column[] = [
  { key: "open_stock", label: "Open Stock" },
  { key: "grn", label: "GRN" },
  { key: "transfer_in", label: "Transfer In" },
  { key: "sale", label: "Sale" },
  { key: "good_return", label: "Good Return" },
  { key: "transfer_out", label: "Transfer Out" },
  { key: "product_discard", label: "Product Discard" },
  { key: "adjustment", label: "Adjustment" },
  { key: "close_stock", label: "Close Stock" },
];

const qtyKey = (key: ColumnKey): `${ColumnKey}_qty` => `${key}_qty`;
const valueKey = (key: ColumnKey): `${ColumnKey}_value` => `${key}_value`;

const formatQty = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const formatValue = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return "All";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};

const TH_BORDER = "1px solid #000";

const thBase: React.CSSProperties = {
  border: TH_BORDER,
  padding: "2px 3px",
  fontSize: "8px",
  fontWeight: 700,
  textTransform: "uppercase",
  background: "#f3f4f6",
  verticalAlign: "bottom",
};

const tdBase: React.CSSProperties = {
  border: TH_BORDER,
  padding: "2px 3px",
  fontSize: "7px",
  lineHeight: 1.3,
};

/**
 * Every measure carries both a quantity and a value sub column, so the table is
 * wide. Identity columns get a fixed share and the remainder is split evenly
 * across the 18 numeric columns to keep the A4 landscape layout intact.
 */
const IDENTITY_WIDTHS = ["7%", "6%", "17%", "3%"];
const MEASURE_WIDTH = (100 - 33) / (COLUMNS.length * 2);

const COL_WIDTHS = [
  ...IDENTITY_WIDTHS,
  ...COLUMNS.flatMap(() => [
    `${MEASURE_WIDTH.toFixed(4)}%`,
    `${MEASURE_WIDTH.toFixed(4)}%`,
  ]),
];

const numericCell: React.CSSProperties = {
  ...tdBase,
  textAlign: "right",
  whiteSpace: "nowrap",
};

interface MeasureTableProps {
  rows: InventoryMovementRow[];
  totals: Totals;
}

function MeasureTable({ rows, totals }: MeasureTableProps) {
  const cell = (raw: unknown, formatter: (value: number) => string) =>
    formatter(Number(raw ?? 0));

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
      }}
    >
      <colgroup>
        {COL_WIDTHS.map((width, index) => (
          <col key={index} style={{ width }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th rowSpan={2} style={{ ...thBase, textAlign: "left" }}>
            Location
          </th>
          <th rowSpan={2} style={{ ...thBase, textAlign: "left" }}>
            Code
          </th>
          <th rowSpan={2} style={{ ...thBase, textAlign: "left" }}>
            Product Name
          </th>
          <th rowSpan={2} style={{ ...thBase, textAlign: "center" }}>
            Unit
          </th>
          {COLUMNS.map((column) => (
            <th
              key={column.key}
              colSpan={2}
              style={{ ...thBase, textAlign: "center" }}
            >
              {column.label}
            </th>
          ))}
        </tr>
        <tr>
          {COLUMNS.map((column) => (
            <React.Fragment key={column.key}>
              <th style={{ ...thBase, textAlign: "right" }}>Qty</th>
              <th style={{ ...thBase, textAlign: "right" }}>Value</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={`${row.loca_code}-${row.prod_code}-${index}`}
            style={{
              background: index % 2 === 1 ? "#fafafa" : "transparent",
            }}
          >
            <td style={{ ...tdBase, textAlign: "left", fontWeight: 600 }}>
              {row.loca_name || row.loca_code}
            </td>
            <td style={{ ...tdBase, textAlign: "left" }}>{row.prod_code}</td>
            <td style={{ ...tdBase, textAlign: "left" }}>{row.prod_name}</td>
            <td style={{ ...tdBase, textAlign: "center" }}>{row.unit}</td>
            {COLUMNS.map((column) => (
              <React.Fragment key={column.key}>
                <td style={numericCell}>
                  {cell(row[qtyKey(column.key)], formatQty)}
                </td>
                <td style={numericCell}>
                  {cell(row[valueKey(column.key)], formatValue)}
                </td>
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ background: "#e5e7eb", fontWeight: 700 }}>
          <td
            style={{
              ...tdBase,
              textAlign: "left",
              textTransform: "uppercase",
            }}
            colSpan={4}
          >
            Total
          </td>
          {COLUMNS.map((column) => (
            <React.Fragment key={column.key}>
              <td style={numericCell}>
                {cell(totals[qtyKey(column.key)], formatQty)}
              </td>
              <td style={numericCell}>
                {cell(totals[valueKey(column.key)], formatValue)}
              </td>
            </React.Fragment>
          ))}
        </tr>
      </tfoot>
    </table>
  );
}

interface ReportDocumentProps {
  rows: InventoryMovementRow[];
  totals: Totals;
  filters: Filters;
}

/**
 * Self contained A4 landscape report. Uses inline styles only so it renders
 * identically on the viewer page and inside the print window opened by
 * openPrintWindow.
 */
function ReportDocument({ rows, totals, filters }: ReportDocumentProps) {
  const summary = [
    `Location: ${filters.location_name || "All Locations"}`,
    `Date From: ${formatDate(filters.dateFrom)}`,
    `Date To: ${formatDate(filters.dateTo)}`,
  ];

  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "6mm",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 700,
            textTransform: "uppercase",
            textDecoration: "underline",
          }}
        >
          Inventory Movement Report
        </h1>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 5,
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {summary.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </div>

      <MeasureTable rows={rows} totals={totals} />

      <div
        style={{
          marginTop: 6,
          paddingTop: 4,
          borderTop: "1px solid #d4d4d8",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8px",
          fontStyle: "italic",
          textTransform: "uppercase",
          color: "#52525b",
        }}
      >
        <span>Printed on: {new Date().toLocaleString()}</span>
        <span>Venpa Back-Office</span>
      </div>
    </div>
  );
}

const PAGE_CSS = `
          @page { size: A4 landscape; margin: 5mm; }
          @media print {
            body { padding: 0 !important; margin: 0 !important; background: #fff !important; }
          }
          table { table-layout: fixed; width: 100%; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        `;

export default function InventoryMovementReport() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const location = searchParams.get("location") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState<InventoryMovementRow[]>([]);
  const [totals, setTotals] = useState<Totals>({});
  const [filters, setFilters] = useState<Filters>({
    location,
    location_name: "",
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  });

  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ location, dateFrom, dateTo });

        const { data: res } = await api.get(
          `/reports/inventory-movement-report?${params.toString()}`,
        );

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setRows(res.data);
          setTotals(res.totals || {});
          if (res.filters) {
            setFilters(res.filters);
          }
        } else {
          toast({
            title: "No Data",
            description:
              "No inventory movement data found for the selected criteria.",
            type: "error",
          });
          setTimeout(() => window.close(), 2000);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to fetch report data",
          type: "error",
        });
        setTimeout(() => window.close(), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location, dateFrom, dateTo, toast]);

  const handlePrint = () => {
    setPrinting(true);

    try {
      const printWindow = openPrintWindow(
        <ReportDocument rows={rows} totals={totals} filters={filters} />,
        {
          title: "Inventory Movement Report",
          autoPrint: true,
          autoClose: true,
          width: 1200,
          height: 800,
          pageCss: PAGE_CSS,
        },
      );

      if (!printWindow) {
        toast({
          title: "Print Error",
          description: "Please allow popups for printing",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Print failed:", error);
      toast({
        title: "Print Error",
        description: "Failed to open print window",
        type: "error",
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const params = new URLSearchParams({ location, dateFrom, dateTo });

      const response = await api.get(
        `/reports/inventory-movement-report/export?${params.toString()}`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Inventory_Movement_Report_${location || "All"}.xlsx`,
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
      setExporting(false);
    }
  };

  if (loading) return <Loader />;

  if (rows.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        No data to display.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
      <style jsx global>{`
        @media print {
          html,
          body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          * {
            -webkit-transition: none !important;
            transition: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          .no-print {
            display: none !important;
          }
          .printable-content {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="sticky top-0 z-10 no-print border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">
              Inventory Movement Report
            </div>
            <div className="text-xs text-muted-foreground">
              {rows.length} record{rows.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={printing}
              variant="outline"
              className="gap-2 shadow-sm"
            >
              {printing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {printing ? "Opening..." : "Print"}
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="gap-2 shadow-sm"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {exporting ? "Exporting..." : "Excel"}
            </Button>
            <Button
              onClick={() => window.close()}
              variant="ghost"
              size="icon"
              aria-label="Close report"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="printable-content border border-zinc-200 bg-white shadow-sm print:border-none print:shadow-none">
          <ReportDocument rows={rows} totals={totals} filters={filters} />
        </div>
      </div>
    </div>
  );
}
