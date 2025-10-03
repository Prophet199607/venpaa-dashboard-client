"use client";

import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState, useRef } from "react";
import { DataTable } from "@/components/ui/data-table";
import LocationDialog from "@/components/model/LocationDialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Location {
  loca_code: string;
  loca_name: string;
  location_type: string;
  delivery_address?: string;
  is_active: boolean;
}

interface TableLocation {
  locCode: string;
  locName: string;
  locType: string;
  deliveryAddress?: string;
  isActive: boolean;
}

export default function LocationPage() {
  const fetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<TableLocation[]>([]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/locations");

      if (!res.success) {
        throw new Error(res.message);
      }

      const mapped: TableLocation[] = res.data.map((loc: Location) => ({
        locCode: loc.loca_code,
        locName: loc.loca_name,
        deliveryAddress: loc.delivery_address || "",
        locType: loc.location_type,
        isActive: Boolean(loc.is_active),
      }));

      setLocations(mapped);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<TableLocation>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    { accessorKey: "locCode", header: "Location Code" },
    { accessorKey: "locName", header: "Location Name" },
    { accessorKey: "deliveryAddress", header: "Location" },
    { accessorKey: "locType", header: "Location Type" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const location = row.original;
        return (
          <LocationDialog
            location={location}
            variant="edit"
            onSuccess={fetchLocations}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchLocations();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Locations</div>
          <LocationDialog variant="add" onSuccess={fetchLocations} />
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={locations} />
        </CardContent>
      </Card>
    </div>
  );
}
