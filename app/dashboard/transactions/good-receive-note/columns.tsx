"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { usePermissions } from "@/context/permissions";
import { Eye, MoreVertical, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type GoodReceivedNote = {
  docNo: string;
  date: string;
  supplier: string;
  invoiceAmount: number;
  formattedInvoiceAmount?: string;
  poNo?: string;
  remark?: string;
  status?: string;
};

export function getColumns(
  status: string,
  onView: (docNo: string, status: string) => void
): ColumnDef<GoodReceivedNote>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "supplier", header: "Supplier" },
    {
      accessorKey: "invoiceAmount",
      header: "Invoice Amount",
      cell: ({ row }) => {
        return (
          row.original.formattedInvoiceAmount ||
          row.original.invoiceAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      },
    },
    { accessorKey: "poNo", header: "PO No" },
    { accessorKey: "status", header: "Status" },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const router = useRouter();
        const docNo = row.original.docNo;
        const [open, setOpen] = React.useState(false);
        const { hasPermission, loading: permissionsLoading } = usePermissions();

        return (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuGroup>
                {!permissionsLoading && hasPermission("view good-receive-note") && (
                  <DropdownMenuItem
                    onSelect={() => {
                      onView(docNo, status);
                      setOpen(false);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </DropdownMenuItem>
                )}
                {!permissionsLoading &&
                  hasPermission("edit good-receive-note") &&
                  status !== "applied" && (
                    <DropdownMenuItem
                      onSelect={() => {
                        router.push(
                          `/dashboard/transactions/good-receive-note/create?doc_no=${docNo}&status=${status}&iid=GRN`
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
