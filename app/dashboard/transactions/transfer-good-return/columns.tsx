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

export type TransferGoodReturn = {
  docNo: string;
  date: string;
  transactionNo?: string;
  remark?: string;
};

export function getColumns(
  status: string,
  onView: (docNo: string, status: string) => void
): ColumnDef<TransferGoodReturn>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "transactionNo", header: "Transaction No" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const docNo = row.original.docNo;
        const [open, setOpen] = React.useState(false);

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
                        `/dashboard/transactions/transfer-good-return/create?doc_no=${docNo}&status=${status}&iid=TGR`
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
