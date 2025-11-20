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
  const [selectedPublisher, setSelectedPublisher] =
    React.useState<Publisher | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [prefetching, setPrefetching] = React.useState(false);
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

  React.useEffect(() => {
    if (!value) {
      setSelectedPublisher(null);
      return;
    }

    if (selectedPublisher?.pub_code === value) {
      return;
    }

    const existingPublisher = items.find(
      (publisher) => publisher.pub_code === value
    );

    if (existingPublisher) {
      setSelectedPublisher(existingPublisher);
      return;
    }

    let isActive = true;
    const fetchPublisherByCode = async () => {
      setPrefetching(true);
      try {
        const { data } = await api.get(`/publishers/${value}`);
        if (data.success && data.data && isActive) {
          setSelectedPublisher(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch publisher by code:", error);
      } finally {
        if (isActive) {
          setPrefetching(false);
        }
      }
    };

    fetchPublisherByCode();

    return () => {
      isActive = false;
    };
  }, [value, items, selectedPublisher]);

  const publisherOptions = React.useMemo(() => {
    const map = new Map<string, Publisher>();

    if (selectedPublisher) {
      map.set(selectedPublisher.pub_code, selectedPublisher);
    }

    items.forEach((publisher) => {
      if (!map.has(publisher.pub_code)) {
        map.set(publisher.pub_code, publisher);
      }
    });

    return Array.from(map.values());
  }, [items, selectedPublisher]);

  const handleValueChange = (nextValue: string) => {
    onValueChange(nextValue);

    if (!nextValue) {
      setSelectedPublisher(null);
      return;
    }

    const selected = publisherOptions.find(
      (publisher) => publisher.pub_code === nextValue
    );

    setSelectedPublisher(selected ?? null);
  };

  return (
    <SearchSelect
      ref={ref}
      value={value}
      onValueChange={handleValueChange}
      onSearch={setSearch}
      items={publisherOptions.map((item) => ({
        value: item.pub_code,
        label: item.pub_name,
      }))}
      placeholder="Search publisher..."
      searchPlaceholder="Type to search publishers"
      emptyMessage={
        loading || prefetching ? "Loading..." : "No publishers found."
      }
      disabled={disabled}
    />
  );
});

PublisherSearch.displayName = "PublisherSearch";
