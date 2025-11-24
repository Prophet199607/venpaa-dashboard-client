"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Pencil, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PurchaseOrder = {
  docNo: string;
  date: string;
  supplier: string;
  netAmount: number;
  formattedNetAmount?: string;
  grnNo?: string;
  remark?: string;
};

export function getColumns(
  status: string,
  onView: (docNo: string, status: string) => void
): ColumnDef<PurchaseOrder>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "supplier", header: "Supplier" },
    {
      accessorKey: "netAmount",
      header: "Net Amount",
      cell: ({ row }) => {
        return (
          row.original.formattedNetAmount ||
          row.original.netAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      },
    },
    // { accessorKey: "grnNo", header: "GRN No" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const docNo = row.original.docNo;
        const [open, setOpen] = useState(false);

        return (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    onView(docNo, status);
                    setOpen(false);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  View
                </DropdownMenuItem>
                {status !== "applied" && (
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push(
                        `/dashboard/transactions/purchase-order/create?doc_no=${docNo}&status=${status}&iid=PO`
                      );
                      setOpen(false);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
