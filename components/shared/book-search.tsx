"use client";

import { api } from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { SearchSelect } from "@/components/ui/search-select";

interface Book {
  id: number;
  book_code: string;
  title: string;
}

interface BookSearchProps {
  onValueChange: (value: string) => void;
  value: string;
}

export function BookSearch({ onValueChange, value }: BookSearchProps) {
  const [books, setBooks] = useState<Book[]>([]);
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
        setBooks([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/books/search?search=${encodeURIComponent(query)}`
        );
        if (response.data.success) {
          setBooks(response.data.data);
        } else {
          setBooks([]);
        }
      } catch (error) {
        console.error("Failed to search books", error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Fetch initial book if value exists
  useEffect(() => {
    const fetchInitialBook = async () => {
      if (value && books.length === 0) {
        try {
          const response = await api.get(
            `/books/search?search=${encodeURIComponent(value)}`
          );
          if (response.data.success && response.data.data.length > 0) {
            setBooks(response.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch initial book", error);
        }
      }
    };
    fetchInitialBook();
  }, [value]);

  const bookOptions = books.map((book) => ({
    label: `${book.title} (${book.book_code})`,
    value: book.book_code,
  }));

  return (
    <SearchSelect
      items={bookOptions}
      onValueChange={onValueChange}
      value={value}
      placeholder={loading ? "Searching..." : "Search..."}
      searchPlaceholder="Search book..."
      emptyMessage="No book found."
      onSearch={handleSearch}
    />
  );
}
