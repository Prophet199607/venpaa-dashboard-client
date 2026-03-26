"use client";

import { Suspense, useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, CodData } from "./columns";
import { useToast } from "@/hooks/use-toast";

// Mock Data
const INITIAL_COD_DATA: CodData[] = [
  {
    id: "1",
    orderNo: "ORD-20240325-001",
    customerName: "John Doe",
    amount: 15400.0,
    formattedAmount: "15,400.00",
    date: "2024-03-25",
    status: "Pending",
  },
  {
    id: "2",
    orderNo: "ORD-20240325-002",
    customerName: "Jane Smith",
    amount: 8250.5,
    formattedAmount: "8,250.50",
    date: "2024-03-25",
    status: "Pending",
  },
  {
    id: "3",
    orderNo: "ORD-20240324-089",
    customerName: "Robert Wilson",
    amount: 1200.0,
    formattedAmount: "1,200.00",
    date: "2024-03-24",
    status: "Received",
  },
  {
    id: "4",
    orderNo: "ORD-20240324-045",
    customerName: "Lisa Taylor",
    amount: 4500.25,
    formattedAmount: "4,500.25",
    date: "2024-03-24",
    status: "Pending",
  },
  {
    id: "5",
    orderNo: "ORD-20240323-012",
    customerName: "Michael Brown",
    amount: 9800.0,
    formattedAmount: "9,800.00",
    date: "2024-03-23",
    status: "Received",
  },
];

function CodManagementContent() {
  const [data, setData] = useState<CodData[]>(INITIAL_COD_DATA);
  const [activeFilter, setActiveFilter] = useState("Pending");
  const { toast } = useToast();

  const handleStatusChange = (id: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Received" } : item,
      ),
    );
    // @ts-ignore
    toast({
      title: "Status Updated",
      description: "Order marked as received successfully.",
      type: "success",
    });
  };

  const filteredData = useMemo(() => {
    if (activeFilter === "All") return data;
    return data.filter((item) => item.status === activeFilter);
  }, [data, activeFilter]);

  const columns = getColumns(handleStatusChange);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">COD Management</h1>
      </div>

      <Card>
        <CardHeader>
          <Tabs
            value={activeFilter}
            onValueChange={setActiveFilter}
            className="w-full"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="grid grid-cols-3 w-[400px]">
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Received">Received</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredData} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CodManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CodManagementContent />
    </Suspense>
  );
}
