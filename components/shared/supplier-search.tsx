"use client";

import { api } from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { SearchSelect } from "@/components/ui/search-select";

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
}

export function SupplierSearch({ onValueChange, value }: SupplierSearchProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce function
  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    waitFor: number
  ) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>): void => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), waitFor);
    };
  };

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuppliers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/suppliers/search?search=${encodeURIComponent(query)}`
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
    }, 300),
    []
  );

  // Fetch initial supplier if value exists
  useEffect(() => {
    const fetchInitialSupplier = async () => {
      if (value && suppliers.length === 0) {
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
  }, [value]);

  const supplierOptions = suppliers.map((supplier) => ({
    label: `${supplier.sup_name} (${supplier.sup_code})`,
    value: supplier.sup_code,
  }));

  return (
    <SearchSelect
      items={supplierOptions}
      onValueChange={onValueChange}
      value={value}
      placeholder={loading ? "Searching..." : "Search..."}
      searchPlaceholder="Search supplier..."
      emptyMessage="No supplier found."
      onSearch={handleSearch}
    />
  );
}
