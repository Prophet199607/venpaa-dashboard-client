"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AcceptGoodsNote = {
  docNo: string;
  date: string;
  netAmount: number;
  formattedNetAmount?: string;
  transactionNo?: string;
  remark?: string;
};

export function getColumns(
  status: string,
  onView: (docNo: string, status: string, iid: string) => void
): ColumnDef<AcceptGoodsNote>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    {
      accessorKey: "netAmount",
      header: () => <div className="text-right w-full">Net Amount</div>,
      cell: ({ row }) => {
        const { formattedNetAmount, netAmount } = row.original;
        return (
          <div className="text-right w-full">
            {formattedNetAmount ?? netAmount.toLocaleString("en-US")}
          </div>
        );
      },
    },
    { accessorKey: "transactionNo", header: "Transaction No" },
    { accessorKey: "remark", header: "Remark" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const docNo = row.original.docNo;
        const [open, setOpen] = React.useState(false);

        const iid = status === "pending" ? "TGN" : "AGN";

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
                    onView(docNo, status, iid);
                    setOpen(false);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  View
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
