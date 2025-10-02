"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState, useRef } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LocationDialog from "@/components/model/LocationDialog";
import { api } from "@/utils/api";

type Location = {
  id: number;
  locCode: string;
  locName: string;
  location: string;
  locType: string;
};

const columns: ColumnDef<Location>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "locCode", header: "Location Code" },
  { accessorKey: "locName", header: "Location Name" },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "locType", header: "Location Type" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const location = row.original;
      return <LocationDialog location={location} variant="edit" />;
    },
  },
];

export default function LocationPage() {
  const fetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchLocations = async () => {
      try {
        const { data } = await api.get("/locations");

        const mapped = data.data.map((loc: any) => ({
          id: loc.id,
          locCode: loc.loca_code,
          locName: loc.loca_name,
          location: loc.delivery_address,
          locType: loc.location_type,
        }));

        setLocations(mapped);
        console.log("Mapped locations:", mapped);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Locations</div>
          <LocationDialog variant="add" />
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={locations} />
        </CardContent>
      </Card>
    </div>
  );
}
