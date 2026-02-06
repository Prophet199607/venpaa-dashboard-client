"use client";

import { api } from "@/utils/api";
import React, { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  SearchSelect,
  type SearchSelectHandle,
} from "@/components/ui/search-select";

interface Product {
  id: number;
  prod_code: string;
  prod_name: string;
  barcode?: string;
  isbn?: string;
  purchase_price: number;
  selling_price: number;
  pack_size: string | number | null;
  unit_name: string;
  unit: {
    unit_type: "WHOLE" | "DEC" | null;
  };
}

interface BasicProductSearchProps {
  onValueChange: (product: Product | null) => void;
  value: string | undefined;
  disabled?: boolean;
}

export const BasicProductSearch = React.forwardRef<
  SearchSelectHandle,
  BasicProductSearchProps
>(function ProductSearch({ onValueChange, value, disabled }, forwardedRef) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect for handling debounced search
  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedSearchQuery.length < 2) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/products/basic-search?search=${encodeURIComponent(
            debouncedSearchQuery,
          )}`,
        );
        if (response.data.success) {
          setProducts(response.data.data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to search products", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    searchProducts();
  }, [debouncedSearchQuery]);

  // Fetch initial product if value exists
  useEffect(() => {
    const fetchInitialProduct = async () => {
      if (value) {
        try {
          const response = await api.get(
            `/products/basic-search?search=${encodeURIComponent(value)}`,
          );
          if (response.data.success && response.data.data.length > 0) {
            const foundProduct = response.data.data.find(
              (p: Product) => p.prod_code === value,
            );
            if (foundProduct) {
              setProducts([foundProduct]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch initial product", error);
        }
      } else {
        // Clear products and search query if value is cleared (e.g. after adding product)
        setProducts([]);
        setSearchQuery("");
      }
    };
    fetchInitialProduct();
  }, [value]);

  const productOptions = products.map((product) => ({
    label: `${product.prod_name} (${product.prod_code})`,
    value: product.prod_code,
  }));

  const handleSelect = (selectedValue: string) => {
    const selectedProduct =
      products.find((p) => p.prod_code === selectedValue) || null;
    onValueChange(selectedProduct);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    // Immediate clearing logic for barcode scanners
    if (query.length > 0 && products.length > 0) {
      const lowerQuery = query.toLowerCase();
      const stillMatches = products.some(
        (p) =>
          p.prod_code.toLowerCase().includes(lowerQuery) ||
          p.prod_name.toLowerCase().includes(lowerQuery) ||
          p.barcode?.toLowerCase().includes(lowerQuery) ||
          p.isbn?.toLowerCase().includes(lowerQuery),
      );

      if (!stillMatches) {
        setProducts([]);
      }
    }
  };

  return (
    <SearchSelect
      ref={forwardedRef}
      items={productOptions}
      onValueChange={handleSelect}
      value={value}
      placeholder={loading ? "Searching..." : "Search product..."}
      searchPlaceholder="Search product..."
      emptyMessage="No product found."
      onSearch={handleSearchChange}
      disabled={disabled}
    />
  );
});
BasicProductSearch.displayName = "BasicProductSearch";
