"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BillItem {
  Item_Descrip: string;
  Unit_Price: string | number;
  Qty: string | number;
  Amount: string | number;
}

export interface BillRow {
  Receipt_No: string;
  BillDate: string;
  Loca_code: string;
  loca_name: string;
  Unit: string;
  Operator: string;
  PaymentCategory: string | null;
  PaymentType: string | null;
  subTotal: string | number;
  Discount: string | number;
  NetTotal: string | number;
  payment: string | number;
  Balance: string | number;
  ItemCount: string | number;
  items: BillItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const n = (v: string | number | null | undefined) =>
  parseFloat(v as string) || 0;

export const lkr = (v: string | number) =>
  `LKR ${n(v).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

export const formatBillDate = (raw: string): string => {
  try {
    const cleaned = String(raw).split("T")[0];
    const d = parseISO(cleaned);
    return isValid(d) ? format(d, "dd MMM yyyy") : cleaned;
  } catch {
    return String(raw);
  }
};

// ─── Columns ────────────────────────────────────────────────────────────────

export const columns: ColumnDef<BillRow>[] = [
  {
    accessorKey: "Receipt_No",
    header: "Receipt No",
    cell: ({ row }) => (
      <span className="font-semibold text-primary">{row.original.Receipt_No}</span>
    ),
  },
  {
    accessorKey: "BillDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-neutral-500">{formatBillDate(row.original.BillDate)}</span>
    ),
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => (
      <span className="text-neutral-500">
        {row.original.loca_name || row.original.Loca_code}
      </span>
    ),
  },
  {
    accessorKey: "Operator",
    header: "Operator",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.Operator}</span>
    ),
  },
  {
    accessorKey: "ItemCount",
    header: () => <div className="text-right w-full">Items</div>,
    cell: ({ row }) => (
      <div className="text-right w-full text-neutral-500">
        {n(row.original.ItemCount).toFixed(0)}
      </div>
    ),
  },
  {
    accessorKey: "PaymentCategory",
    header: "Payment Type",
    cell: ({ row }) => {
      const cat = row.original.PaymentCategory;
      return cat ? (
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {cat}
        </span>
      ) : (
        <span className="text-neutral-400">&mdash;</span>
      );
    },
  },
  {
    accessorKey: "PaymentType",
    header: "Payment Method",
    cell: ({ row }) => {
      const pt = row.original.PaymentType;
      const cat = row.original.PaymentCategory;
      return pt ? (
        <span
          className={cn(
            "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
            cat === "CASH"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              : cat === "CREDIT"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
          )}
        >
          {pt}
        </span>
      ) : (
        <span className="text-neutral-400">&mdash;</span>
      );
    },
  },
  {
    accessorKey: "subTotal",
    header: () => <div className="text-right w-full">Sub Total</div>,
    cell: ({ row }) => (
      <div className="text-right w-full text-neutral-500">
        {lkr(row.original.subTotal)}
      </div>
    ),
  },
  {
    accessorKey: "Discount",
    header: () => <div className="text-right w-full">Discount</div>,
    cell: ({ row }) => (
      <div className="text-right w-full text-red-500">
        {lkr(row.original.Discount)}
      </div>
    ),
  },
  {
    accessorKey: "NetTotal",
    header: () => <div className="text-right w-full">Net Total</div>,
    cell: ({ row }) => (
      <div className="text-right w-full font-bold text-neutral-900 dark:text-neutral-100">
        {lkr(row.original.NetTotal)}
      </div>
    ),
  },
];
