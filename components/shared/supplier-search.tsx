"use client";

import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchSelect } from "@/components/ui/search-select";
import { Input } from "@/components/ui/input";

interface Supplier {
  id: number;
  sup_code: string;
  sup_name: string;
  company?: string;
  mobile?: string;
  email?: string;
}

interface SupplierSearchProps {
  onValueChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}

export function SupplierSearch({
  onValueChange,
  value,
  disabled = false,
}: SupplierSearchProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect for handling debounced search
  useEffect(() => {
    if (disabled) return;

    const searchSuppliers = async () => {
      if (debouncedSearchQuery.length < 2) {
        setSuppliers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/suppliers/search?search=${encodeURIComponent(debouncedSearchQuery)}`
        );
        if (response.data.success) {
          setSuppliers(response.data.data);
        } else {
          setSuppliers([]);
        }
      } catch (error) {
        console.error("Failed to search suppliers", error);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };
    searchSuppliers();
  }, [debouncedSearchQuery, disabled]);

  // Fetch initial supplier if value exists
  useEffect(() => {
    if (disabled) return;

    const fetchInitialSupplier = async () => {
      if (value && suppliers.length === 0 && !searchQuery) {
        try {
          const response = await api.get(
            `/suppliers/search?search=${encodeURIComponent(value)}`
          );
          if (response.data.success && response.data.data.length > 0) {
            setSuppliers(response.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch initial supplier", error);
        }
      }
    };
    fetchInitialSupplier();
  }, [value, suppliers.length, searchQuery, disabled]);

  const supplierOptions = suppliers.map((supplier) => ({
    label: `${supplier.sup_name} (${supplier.sup_code})`,
    value: supplier.sup_code,
  }));

  // If disabled, show a simple disabled input
  if (disabled && value) {
    const selectedSupplier = suppliers.find((s) => s.sup_code === value);
    return (
      <Input
        disabled
        value={
          selectedSupplier
            ? `${selectedSupplier.sup_name} (${selectedSupplier.sup_code})`
            : value
        }
        className="bg-muted"
      />
    );
  }

  return (
    <SearchSelect
      items={supplierOptions}
      onValueChange={onValueChange}
      value={value}
      placeholder={loading ? "Searching..." : "Search supplier..."}
      searchPlaceholder="Search supplier..."
      emptyMessage="No supplier found."
      onSearch={setSearchQuery}
    />
  );
}
