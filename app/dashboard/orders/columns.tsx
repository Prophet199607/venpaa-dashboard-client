"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  PackageCheck,
  Truck,
  Smartphone,
  Globe,
  MoreVertical,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface Order {
  id: string | number;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  phone?: string;
  totalAmount: number;
  formattedTotal: string;
  status: string;
  paymentMethod?: string;
  orderDate: string;
  itemCount?: number;
  device?: number;
  typeName?: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    className: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className:
      "bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    className:
      "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  },
  delivered: {
    label: "Delivered",
    icon: PackageCheck,
    className:
      "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  canceled: {
    label: "Canceled",
    icon: XCircle,
    className:
      "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  refunded: {
    label: "Refunded",
    icon: XCircle,
    className:
      "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  },
};

export function getStatusConfig(status: string) {
  const key = status?.toLowerCase() ?? "";
  return (
    STATUS_CONFIG[key] ?? {
      label: status ?? "Unknown",
      icon: Clock,
      className:
        "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-100",
    }
  );
}

export const getColumns = (
  onView: (id: string) => void,
): ColumnDef<Order>[] => [
  {
    accessorKey: "orderId",
    header: "Order No",
    cell: ({ row }) => (
      <span className="font-medium text-primary">{row.original.orderId}</span>
    ),
  },
  {
    accessorKey: "device",
    header: "Source",
    cell: ({ row }) => {
      const device = row.original.device;
      if (device === 1) {
        return (
          <Badge
            className="flex w-fit items-center gap-1 
            bg-amber-50 text-amber-700 border-amber-200
dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
          >
            <Smartphone className="h-3 w-3" />
            Android
          </Badge>
        );
      }

      if (device === 2) {
        return (
          <Badge
            className="flex w-fit items-center gap-1 
            bg-rose-50 text-rose-700 border-rose-200 
            dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
          >
            <Smartphone className="h-3 w-3" />
            iOS
          </Badge>
        );
      }

      if (device === 3) {
        return (
          <Badge
            className="flex w-fit items-center gap-1 
              bg-indigo-50 text-indigo-700 border-indigo-200 
              dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
          >
            <Globe className="h-3 w-3" />
            Web
          </Badge>
        );
      }
      return <span className="text-muted-foreground text-xs">—</span>;
    },
  },
  {
    accessorKey: "typeName",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.typeName?.toLowerCase() || "";
      const isPickAndCollect = type.includes("pick");
      return (
        <Badge
          variant="outline"
          className={cn(
            "flex w-fit items-center gap-1",
            isPickAndCollect
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-blue-50 text-blue-700 border-blue-200",
          )}
        >
          {row.original.typeName || "—"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.customerName}</p>
        {row.original.customerEmail && (
          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
            {row.original.customerEmail}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.phone || "—"}</span>
    ),
  },
  {
    accessorKey: "orderDate",
    header: "Order Date",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.original.orderDate}</span>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-center block">{row.original.itemCount ?? "—"}</span>
    ),
  },
  //   {
  //     accessorKey: "paymentMethod",
  //     header: "Payment",
  //     cell: ({ row }) => (
  //       <span className="capitalize text-muted-foreground">
  //         {row.original.paymentMethod || "—"}
  //       </span>
  //     ),
  //   },
  {
    accessorKey: "totalAmount",
    header: () => <div className="text-right w-full">Total</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold">
        {row.original.formattedTotal}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config = getStatusConfig(row.original.status);
      const Icon = config.icon;
      return (
        <Badge
          variant="outline"
          className={cn(
            "flex w-fit items-center gap-1 capitalize",
            config.className,
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const orderId = String(row.original.orderId);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[120px]">
            <DropdownMenuItem onClick={() => onView(orderId)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
