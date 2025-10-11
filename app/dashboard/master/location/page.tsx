"use client";

import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState, useRef } from "react";
import { DataTable } from "@/components/ui/data-table";
import { MoreVertical, Plus, Pencil } from "lucide-react";
import LocationDialog from "@/components/model/LocationDialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Location {
  loca_code: string;
  loca_name: string;
  location_type: string;
  delivery_address?: string;
  is_active: boolean;
}

export default function LocationPage() {
  const fetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [dialogVariant, setDialogVariant] = useState<"add" | "edit">("add");
  const [selectedLocation, setSelectedLocation] = useState<
    Location | undefined
  >(undefined);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/locations");

      if (!res.success) {
        throw new Error(res.message);
      }

      const mapped: Location[] = res.data.map((loc: Location) => ({
        loca_code: loc.loca_code,
        loca_name: loc.loca_name,
        delivery_address: loc.delivery_address || "",
        location_type: loc.location_type,
        is_active: Boolean(loc.is_active),
      }));

      setLocations(mapped);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    setIsPreparing(true);
    try {
      const { data: res } = await api.get("/locations/generate-code");
      if (res.success) {
        setSelectedLocation({
          loca_code: res.code,
          loca_name: "",
          location_type: "Branch",
          delivery_address: "",
          is_active: true,
        });
        setDialogVariant("add");
        setDialogOpen(true);
      } else {
        throw new Error(res.message || "Failed to generate location code.");
      }
    } catch (error) {
      console.error("Failed to prepare for add:", error);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleEdit = async (location: Location) => {
    setIsPreparing(true);
    try {
      const { data: res } = await api.get(`/locations/${location.loca_code}`);
      if (res.success) {
        setSelectedLocation(res.data);
        setDialogVariant("edit");
        setDialogOpen(true);
      } else {
        throw new Error(res.message || "Failed to fetch location details.");
      }
    } catch (error) {
      console.error("Failed to prepare for edit:", error);
    } finally {
      setIsPreparing(false);
    }
  };

  const columns: ColumnDef<Location>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
      size: 50,
    },
    { accessorKey: "loca_code", header: "Location Code" },
    { accessorKey: "loca_name", header: "Location Name" },
    { accessorKey: "delivery_address", header: "Location" },
    { accessorKey: "location_type", header: "Location Type" },
    {
      id: "actions",
      header: "Actions",
      cell: function ActionCell({ row }) {
        const location = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isPreparing}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[100px]">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleEdit(location);
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

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchLocations();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-lg font-semibold">Locations</div>
          <Button
            type="button"
            className="flex items-center gap-2"
            onClick={handleAddNew}
            disabled={isPreparing}
          >
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={locations} />
        </CardContent>
        {loading || isPreparing ? <Loader /> : null}
      </Card>
      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        variant={dialogVariant}
        location={selectedLocation}
        onSuccess={fetchLocations}
      />
    </div>
  );
}
