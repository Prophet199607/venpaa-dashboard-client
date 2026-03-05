"use client";

import * as React from "react";
import { api } from "@/utils/api";
import { useDebounce } from "@/hooks/use-debounce";
import {
  SearchSelect,
  SearchSelectHandle,
} from "@/components/ui/search-select";

interface Author {
  auth_code: string;
  auth_name: string;
}

export interface AuthorSearchProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  initialData?: Author | null;
}

export const AuthorSearch = React.forwardRef<
  SearchSelectHandle,
  AuthorSearchProps
>(function AuthorSearch({ value, onValueChange, disabled, initialData }, ref) {
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = React.useState<Author | null>(
    initialData || null,
  );
  const [loading, setLoading] = React.useState(false);
  const [prefetching, setPrefetching] = React.useState(false);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    const fetchAuthors = async () => {
      if (!debouncedSearch) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(
          `/authors/search?query=${debouncedSearch}`,
        );
        if (data.success) {
          setItems(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch authors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, [debouncedSearch]);

  React.useEffect(() => {
    if (!value) {
      if (selectedAuthor !== null) setSelectedAuthor(null);
      return;
    }

    if (selectedAuthor?.auth_code === value) return;

    if (initialData && initialData.auth_code === value) {
      setSelectedAuthor(initialData);
      return;
    }

    const existing = items.find((p) => p.auth_code === value);
    if (existing) {
      setSelectedAuthor(existing);
      return;
    }

    let isActive = true;
    (async () => {
      setPrefetching(true);
      try {
        const { data } = await api.get(`/authors/${value}`);
        if (data.success && data.data && isActive) {
          setSelectedAuthor(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch author by code:", error);
      } finally {
        if (isActive) setPrefetching(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [value, items, selectedAuthor, initialData]);

  const authorOptions = React.useMemo(() => {
    const map = new Map<string, Author>();

    if (selectedAuthor) {
      map.set(selectedAuthor.auth_code, selectedAuthor);
    }

    items.forEach((author) => {
      if (!map.has(author.auth_code)) {
        map.set(author.auth_code, author);
      }
    });

    return Array.from(map.values());
  }, [items, selectedAuthor]);

  const handleValueChange = (nextValue: string) => {
    onValueChange(nextValue);

    if (!nextValue) {
      setSelectedAuthor(null);
      return;
    }

    const selected = authorOptions.find(
      (author) => author.auth_code === nextValue,
    );

    setSelectedAuthor(selected ?? null);
  };

  return (
    <SearchSelect
      ref={ref}
      value={value}
      onValueChange={handleValueChange}
      onSearch={setSearch}
      items={authorOptions.map((item) => ({
        value: item.auth_code,
        label: item.auth_name,
      }))}
      placeholder="Search author..."
      searchPlaceholder="Type to search authors"
      emptyMessage={loading || prefetching ? "Loading..." : "No authors found."}
      disabled={disabled}
    />
  );
});

AuthorSearch.displayName = "AuthorSearch";
