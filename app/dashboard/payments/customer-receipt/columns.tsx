"use client";

import { usePermissions } from "@/context/permissions";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export type CustomerReceipt = {
  orgDocNo: string;
  date: string;
  customer: string;
  amount: number;
  formattedAmount: string;
  location: string;
};

export const getColumns = (
  handleView: (docNo: string) => void,
): ColumnDef<CustomerReceipt>[] => [
  {
    accessorKey: "orgDocNo",
    header: "Document No",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "customer",
    header: "Customer",
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
    cell: function ActionCell({ row }) {
      const receipt = row.original;
      const { hasPermission, loading: permissionsLoading } = usePermissions();

      return (
        <div className="flex justify-center">
          {!permissionsLoading && hasPermission("view customer-receipt") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
              onClick={() => handleView(receipt.orgDocNo)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
