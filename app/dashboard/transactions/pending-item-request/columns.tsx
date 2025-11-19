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

export type PendingItemRequest = {
  docNo: string;
  date: string;
  supplier: string;
  netAmount: number;
  formattedNetAmount?: string;
  grnNo?: string;
  approvalStatus?: string;
  remark?: string;
};

export function getColumns({
  status,
  onView,
}: {
  status: string;
  onView: (docNo: string, status: string) => void;
}): ColumnDef<PendingItemRequest>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "supplier", header: "Supplier" },
    {
      accessorKey: "netAmount",
      header: "Net Amount",
      cell: ({ row }) => {
        return (
          <div style={{ textAlign: "right", width: "100%" }}>
            {row.original.formattedNetAmount ||
              row.original.netAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </div>
        );
      },
    },
    {
      accessorKey: "approvalStatus",
      header: "Approval Status",
      cell: ({ row }) => {
        const status = row.original.approvalStatus;
        let color = "bg-blue-100 text-blue-700";
        let text = "Pending";
        if (status && status.toLowerCase() === "approved") {
          color = "bg-green-100 text-green-800";
          text = "Approved";
        }
        if (status && status.toLowerCase() === "rejected") {
          color = "bg-red-100 text-red-800";
          text = "Rejected";
        }
        return (
          <div style={{ textAlign: "center", width: "100%" }}>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${color}`}
              style={{ minWidth: 100, textAlign: "center" }}
            >
              {status ? text : "Pending"}
            </span>
          </div>
        );
      },
    },
    { accessorKey: "remark", header: "Remark" },
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
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(
                      `/dashboard/transactions/pending-item-request/create?doc_no=${docNo}&status=${status}&iid=IR`
                    );
                    setOpen(false);
                  }}
                >
                  <Pencil className="w-4 h-4" />
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
