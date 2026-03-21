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

export type StockAdjustment = {
  docNo: string;
  date: string;
  location: string;
  remark?: string;
};

export function getColumns(
  status: string,
  onView: (docNo: string, status: string) => void
): ColumnDef<StockAdjustment>[] {
  return [
    { accessorKey: "docNo", header: "Document No" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "remark", header: "Remark" },
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
                {!permissionsLoading && hasPermission("view stock-adjustment") && (
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
                  hasPermission("edit stock-adjustment") &&
                  status !== "applied" && (
                    <DropdownMenuItem
                      onSelect={() => {
                        router.push(
                          `/dashboard/transactions/stock-adjustment/create?doc_no=${docNo}&status=${status}&iid=STA`
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
