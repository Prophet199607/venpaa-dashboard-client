"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date";
  options?: { value: string; label: string }[];
}

export interface FilterValue {
  key: string;
  value: string;
  label: string;
}

interface DataFilterProps {
  filters: FilterOption[];
  onFilterChange: (filters: FilterValue[]) => void;
  appliedFilters?: FilterValue[];
  triggerClassName?: string;
}

export function DataFilter({
  filters,
  onFilterChange,
  appliedFilters = [],
  triggerClassName,
}: DataFilterProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] =
    useState<FilterValue[]>(appliedFilters);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterValue[] = [];
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setOpen(false);
  };

  const handleRemoveFilter = (filterKey: string) => {
    const updatedFilters = localFilters.filter((f) => f.key !== filterKey);
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const updateFilterValue = (key: string, value: string, label: string) => {
    const existingIndex = localFilters.findIndex((f) => f.key === key);

    if (value === "") {
      // Remove filter if value is empty
      const updatedFilters = localFilters.filter((f) => f.key !== key);
      setLocalFilters(updatedFilters);
    } else {
      const newFilter: FilterValue = { key, value, label };

      if (existingIndex >= 0) {
        // Update existing filter
        const updatedFilters = [...localFilters];
        updatedFilters[existingIndex] = newFilter;
        setLocalFilters(updatedFilters);
      } else {
        // Add new filter
        setLocalFilters([...localFilters, newFilter]);
      }
    }
  };

  const getFilterDisplayValue = (filter: FilterValue) => {
    const filterConfig = filters.find((f) => f.key === filter.key);
    if (filterConfig?.type === "select") {
      const option = filterConfig.options?.find(
        (opt) => opt.value === filter.value
      );
      return option?.label || filter.value;
    }
    return filter.value;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Filter Badges */}
      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {appliedFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-xs">
                {filters.find((f) => f.key === filter.key)?.label}:{" "}
                {getFilterDisplayValue(filter)}
              </span>
              <button
                onClick={() => handleRemoveFilter(filter.key)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className={triggerClassName}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {appliedFilters.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
              >
                {appliedFilters.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filter Data</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label htmlFor={filter.key}>{filter.label}</Label>

                {filter.type === "select" && (
                  <Select
                    value={
                      localFilters.find((f) => f.key === filter.key)?.value ||
                      ""
                    }
                    onValueChange={(value) => {
                      const option = filter.options?.find(
                        (opt) => opt.value === value
                      );
                      updateFilterValue(
                        filter.key,
                        value,
                        option?.label || value
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filter.type === "text" && (
                  <Input
                    id={filter.key}
                    placeholder={`Enter ${filter.label}`}
                    value={
                      localFilters.find((f) => f.key === filter.key)?.value ||
                      ""
                    }
                    onChange={(e) =>
                      updateFilterValue(
                        filter.key,
                        e.target.value,
                        e.target.value
                      )
                    }
                  />
                )}

                {filter.type === "date" && (
                  <Input
                    id={filter.key}
                    type="date"
                    value={
                      localFilters.find((f) => f.key === filter.key)?.value ||
                      ""
                    }
                    onChange={(e) =>
                      updateFilterValue(
                        filter.key,
                        e.target.value,
                        e.target.value
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-8">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1"
            >
              Clear All
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
