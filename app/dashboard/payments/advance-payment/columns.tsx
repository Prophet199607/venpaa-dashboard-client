"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";

export type Advance = {
  docNo: string;
  date: string;
  name: string;
  amount: number;
  formattedAmount?: string;
};

export function getColumns(type: string): ColumnDef<Advance>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { 
      accessorKey: "name", 
      header: type === "supplier" ? "Supplier Name" : "Customer Name" 
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
  ];
}
