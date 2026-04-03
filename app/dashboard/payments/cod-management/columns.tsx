"use client";

import { CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CodData {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  formattedAmount: string;
  date: string;
  status: "Pending" | "Received" | "Refund";
}

export const getColumns = (
  onStatusChange: (id: string) => void,
  onRefundChange: (id: string) => void,
): ColumnDef<CodData>[] => [
  {
    accessorKey: "orderNo",
    header: "Order No",
  },
  {
    accessorKey: "customerName",
    header: "Customer Name",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "formattedAmount",
    header: "Amount",
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.formattedAmount}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={cn(
            "flex w-fit items-center gap-1",
            status === "Received"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              : status === "Refund"
                ? "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100"
                : "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
          )}
          variant="outline"
        >
          {status === "Received" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : status === "Refund" ? (
            <RotateCcw className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === "Pending") {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(row.original.id)}
              className="h-8 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
            >
              Received
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefundChange(row.original.id)}
              className="h-8 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"
            >
              Refund
            </Button>
          </div>
        );
      }
      return null;
    },
  },
];
