"use client";

import React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { usePermissions } from "@/context/permissions";

export type Advance = {
  docNo: string;
  date: string;
  name: string;
  amount: number;
  formattedAmount?: string;
};

export function getColumns(
  type: string,
  handleView: (docNo: string) => void,
): ColumnDef<Advance>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    {
      accessorKey: "name",
      header: type === "supplier" ? "Supplier Name" : "Customer Name",
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right w-full">Amount</div>,
      cell: ({ row }) => {
        const { formattedAmount, amount } = row.original;
        return (
          <div className="text-right w-full">
            {formattedAmount ?? amount.toLocaleString("en-US")}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Action</div>,
      cell: function ActionCell({ row }) {
        const { docNo } = row.original;
        const { hasPermission, loading: permissionsLoading } = usePermissions();

        return (
          <div className="flex justify-center">
            {!permissionsLoading && hasPermission("view advance-payment") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
                onClick={() => handleView(docNo)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
