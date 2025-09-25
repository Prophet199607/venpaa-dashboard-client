"use client";

import { locations, type Location } from "@/lib/data";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LocationDialog from "@/components/model/LocationDialog";

type L = Location;

const columns: ColumnDef<L>[] = [
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
  // Renamed to avoid conflict with type
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
