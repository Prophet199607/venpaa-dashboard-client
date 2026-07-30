"use client";

import { CheckCircle2, Clock, Undo2, Eye, MoreVertical } from "lucide-react";
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

export interface CodData {
  id: string;
  orderNo: string;
  type: string;
  customerName: string;
  amount: number;
  formattedAmount: string;
  balanceAmount: number;
  formattedBalanceAmount: string;
  date: string;
  status: "Pending" | "Received" | "Returned";
}

export const getColumns = (
  onStatusChange: (id: string, orderNo: string) => void,
  onReturnChange: (id: string, orderNo: string) => void,
  onView: (id: string, orderNo: string) => void,
): ColumnDef<CodData>[] => [
  {
    accessorKey: "orderNo",
    header: "Order No",
    cell: ({ row }) => (
      <button
        onClick={() => onView(row.original.id, row.original.orderNo)}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left cursor-pointer"
        title="View order details"
      >
        {row.original.orderNo}
      </button>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      if (!type) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge
          variant="outline"
          className={cn(
            "font-medium text-[10px] px-1.5 py-0 h-5",
            type === "POS"
              ? "bg-violet-100 text-violet-800 border-violet-200"
              : type === "WEB"
                ? "bg-cyan-100 text-cyan-800 border-cyan-200"
                : type === "Speed Post"
                  ? "bg-orange-100 text-orange-800 border-orange-200"
                  : "bg-slate-100 text-slate-800 border-slate-200",
          )}
        >
          {type}
        </Badge>
      );
    },
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
    accessorKey: "formattedBalanceAmount",
    header: "Balance",
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.formattedBalanceAmount}
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
              : status === "Returned"
                ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"
                : "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
          )}
          variant="outline"
        >
          {status === "Received" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : status === "Returned" ? (
            <Undo2 className="h-3 w-3" />
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
      const { id, orderNo, status } = row.original;
      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            <DropdownMenuItem onSelect={() => onView(id, orderNo)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {status === "Pending" && (
              <>
                <DropdownMenuItem onSelect={() => onStatusChange(id, orderNo)}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">Received</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onReturnChange(id, orderNo)}>
                  <Undo2 className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="text-blue-600">Return</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
