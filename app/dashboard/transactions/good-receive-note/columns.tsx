"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type GoodReceivedNote = {
  docNo: string;
  date: string;
  supplier: string;
  invoiceAmount: number;
  poNo?: string;
  remark?: string;
  status?: string;
};

export function getColumns(status: string): ColumnDef<GoodReceivedNote>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "supplier", header: "Supplier" },
    { accessorKey: "invoiceAmount", header: "Invoice Amount" },
    { accessorKey: "poNo", header: "PO No" },
    { accessorKey: "status", header: "Status" },
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                {/* Edit action */}
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/transactions/good-receive-note/create?docNo=${docNo}&status=${status}`
                    );
                    setOpen(false);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
