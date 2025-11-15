"use client";

import * as React from "react";
import { api } from "@/utils/api";
import { useDebounce } from "@/hooks/use-debounce";
import {
  SearchSelect,
  SearchSelectHandle,
} from "@/components/ui/search-select";

interface Publisher {
  pub_code: string;
  pub_name: string;
}

export interface PublisherSearchProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const PublisherSearch = React.forwardRef<
  SearchSelectHandle,
  PublisherSearchProps
>(function PublisherSearch({ value, onValueChange, disabled }, ref) {
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<Publisher[]>([]);
  const [loading, setLoading] = React.useState(false);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    const fetchPublishers = async () => {
      if (!debouncedSearch) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(
          `/publishers/search?query=${debouncedSearch}`
        );
        if (data.success) {
          setItems(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch publishers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishers();
  }, [debouncedSearch]);

  return (
    <SearchSelect
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      onSearch={setSearch}
      items={items.map((item) => ({
        value: item.pub_code,
        label: item.pub_name,
      }))}
      placeholder="Search publisher..."
      searchPlaceholder="Type to search publishers"
      emptyMessage={loading ? "Loading..." : "No publishers found."}
      disabled={disabled}
    />
  );
});

PublisherSearch.displayName = "PublisherSearch";
