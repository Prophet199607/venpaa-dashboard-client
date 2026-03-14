"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PaymentVoucher = {
  orgDocNo: string;
  date: string;
  supplier: string;
  amount: number;
  formattedAmount: string;
  location: string;
};

export const getColumns = (
  handleView: (docNo: string) => void
): ColumnDef<PaymentVoucher>[] => [
  {
    accessorKey: "orgDocNo",
    header: "Document No",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "formattedAmount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.getValue("formattedAmount")}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => {
      const voucher = row.original;
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
            onClick={() => handleView(voucher.orgDocNo)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
