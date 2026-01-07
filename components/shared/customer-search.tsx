"use client";

import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchSelect } from "@/components/ui/search-select";
import { Input } from "@/components/ui/input";

interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  mobile?: string;
  email?: string;
}

interface CustomerSearchProps {
  onValueChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}

export function CustomerSearch({
  onValueChange,
  value,
  disabled = false,
}: CustomerSearchProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect for handling debounced search
  useEffect(() => {
    if (disabled) return;

    const searchCustomers = async () => {
      if (debouncedSearchQuery.length < 2) {
        setCustomers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/customers/search?query=${encodeURIComponent(debouncedSearchQuery)}`
        );
        if (response.data.success) {
          setCustomers(response.data.data);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error("Failed to search customers", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    searchCustomers();
  }, [debouncedSearchQuery, disabled]);

  // Fetch initial customer if value exists
  useEffect(() => {
    const fetchInitialCustomer = async () => {
      if (value && customers.length === 0 && !searchQuery) {
        try {
          const response = await api.get(
            `/customers/search?query=${encodeURIComponent(value)}`
          );
          if (response.data.success && response.data.data.length > 0) {
            setCustomers(response.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch initial customer", error);
        }
      }
    };
    fetchInitialCustomer();
  }, [value, customers.length, searchQuery]);

  const customerOptions = customers.map((customer) => ({
    label: `${customer.customer_name} (${customer.customer_code})`,
    value: customer.customer_code,
  }));

  // If disabled, show a simple disabled input
  if (disabled && value) {
    const selectedCustomer = customers.find((c) => c.customer_code === value);
    return (
      <Input
        disabled
        value={
          selectedCustomer
            ? `${selectedCustomer.customer_name} (${selectedCustomer.customer_code})`
            : value
        }
        className="bg-muted"
      />
    );
  }

  return (
    <SearchSelect
      items={customerOptions}
      onValueChange={onValueChange}
      value={value}
      placeholder={loading ? "Searching..." : "Search customer..."}
      searchPlaceholder="Search customer..."
      emptyMessage="No customer found."
      onSearch={setSearchQuery}
    />
  );
}
