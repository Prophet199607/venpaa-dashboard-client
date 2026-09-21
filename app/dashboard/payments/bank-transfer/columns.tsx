"use client";

import { Eye, MoreVertical, CheckCircle2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BankTransferData {
  id: string;
  receipt_no: string;
  order_no: string;
  location: string;
  location_name: string;
  transaction_date: string;
  bill_date: string;
  bill_time: string;
  payment_method: string;
  reference_no: string;
  customer_code: string;
  customer_name: string;
  customer_mobile: string;
  operator: string;
  amount: number;
  status: string;
  report_id?: number | null;
}

export const getColumns = (
  onView: (id: string, receiptNo: string) => void,
): ColumnDef<BankTransferData>[] => [
  {
    accessorKey: "receipt_no",
    header: "Receipt No",
    cell: ({ row }) => (
      <button
        onClick={() => onView(row.original.id, row.original.receipt_no)}
        className="hover:underline font-semibold text-left cursor-pointer"
        title="View order details"
      >
        {row.original.receipt_no || "—"}
      </button>
    ),
  },
  {
    accessorKey: "payment_method",
    header: "Method / Type",
    cell: ({ row }) => {
      const method = row.original.payment_method;
      const isDelivery = method.toLowerCase().includes("delivery");
      return (
        <Badge
          variant="outline"
          className={cn(
            "font-medium text-[11px] px-2 py-0.5 whitespace-nowrap",
            isDelivery
              ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          )}
        >
          {method}
        </Badge>
      );
    },
  },
  // {
  //   accessorKey: "reference_no",
  //   header: "Bank Ref / Slip",
  //   cell: ({ row }) => {
  //     const ref = row.original.reference_no;
  //     if (!ref) return <span className="text-muted-foreground text-xs">—</span>;
  //     return (
  //       <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
  //         {ref}
  //       </span>
  //     );
  //   },
  // },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.original.customer_name;
      const code = row.original.customer_code;
      const mobile = row.original.customer_mobile;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
            {name || "DEFAULT"}
          </span>
          {/* <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {code && <span>{code}</span>}
            {code && mobile && <span>•</span>}
            {mobile && <span>{mobile}</span>}
          </div> */}
        </div>
      );
    },
  },
  {
    accessorKey: "location_name",
    header: "Location",
    cell: ({ row }) => (
      <div className="text-xs">
        <span className="font-medium text-neutral-800 dark:text-neutral-200">
          {row.original.location_name}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "transaction_date",
    header: "Date & Time",
    cell: ({ row }) => {
      const billDate = row.original.bill_date;
      const billTime = row.original.bill_time;
      return (
        <div className="text-xs">
          <div className="font-medium text-neutral-800 dark:text-neutral-200">
            {billDate || row.original.transaction_date.split(" ")[0]}
          </div>
          {billTime && (
            <div className="text-[11px] text-muted-foreground">{billTime}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "operator",
    header: "Operator",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground font-medium">
        {row.original.operator || "—"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount (LKR)</div>,
    cell: ({ row }) => {
      const amt = Number(row.original.amount || 0);
      return (
        <div className="text-right font-semibold text-sm">
          {amt.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => (
  //     <Badge
  //       variant="outline"
  //       className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex w-fit items-center gap-1 text-[11px]"
  //     >
  //       <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
  //       {row.original.status || "Completed"}
  //     </Badge>
  //   ),
  // },
  {
    id: "actions",
    header: () => (
      <div className="flex w-full items-center justify-end">Actions</div>
    ),
    cell: function ActionCell({ row }) {
      const { id, receipt_no } = row.original;

      return (
        <div className="flex w-full items-center justify-end">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[140px]">
              <DropdownMenuItem onSelect={() => onView(id, receipt_no)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
