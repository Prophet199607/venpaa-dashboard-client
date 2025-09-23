"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Plus } from "lucide-react";
import type { Location } from "@/lib/data";

interface LocationDialogProps {
  location?: Location;
  variant?: "add" | "edit";
}

export default function LocationDialog({
  location,
  variant = "add",
}: LocationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [locCode, setLocCode] = React.useState("");
  const [locName, setLocName] = React.useState("");
  const [locationName, setLocationName] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (variant === "edit" && location) {
        setLocCode(location.locCode);
        setLocName(location.locName);
        setLocationName(location.location);
        setIsEditing(true);
      } else {
        handleReset();
      }
    }
  }, [open, location, variant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      console.log("Updating location:", {
        id: location?.id,
        locCode,
        locName,
        location: locationName,
      });
      // Add your update API call here
    } else {
      console.log("Creating location:", {
        locCode,
        locName,
        location: locationName,
      });
      // Add your create API call here
    }

    setOpen(false);
    handleReset();
  };

  const handleReset = () => {
    setLocCode("");
    setLocName("");
    setLocationName("");
    setIsEditing(false);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setTimeout(handleReset, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === "edit" ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        ) : (
          <Button type="button" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Location" : "Add New Location"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the location details below."
              : "Fill in the location details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Location Code</Label>
            <Input
              id="locCode"
              value={locCode}
              onChange={(e) => setLocCode(e.target.value)}
              placeholder="Enter location code"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Location Name</Label>
            <Input
              id="locName"
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              placeholder="Enter location name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Location</Label>
            <Input
              id="location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter Location"
              required
            />
          </div>

          <DialogFooter className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit">{isEditing ? "Update" : "Submit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
