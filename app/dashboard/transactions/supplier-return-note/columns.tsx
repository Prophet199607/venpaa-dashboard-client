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

export type SupplierReturnNote = {
  docNo: string;
  date: string;
  supplier: string;
  invoiceAmount: number;
  formattedInvoiceAmount?: string;
  grnNo?: string;
  remark?: string;
  status?: string;
};

export function getColumns(
  status: string,
  onView: (docNo: string, status: string) => void
): ColumnDef<SupplierReturnNote>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "supplier", header: "Supplier" },
    {
      accessorKey: "invoiceAmount",
      header: "GRN Net",
      cell: ({ row }) => {
        const { grnNo, formattedInvoiceAmount, invoiceAmount } = row.original;
        if (!grnNo || grnNo === "Without Grn") return null;

        return formattedInvoiceAmount ?? invoiceAmount.toLocaleString("en-US");
      },
    },
    { accessorKey: "grnNo", header: "GRN No" }, // This will now correctly display recall_doc_no
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
                        `/dashboard/transactions/supplier-return-note/create?doc_no=${docNo}&status=${status}&iid=GRN`
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
