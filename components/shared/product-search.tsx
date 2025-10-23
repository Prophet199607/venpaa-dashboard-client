"use client";

import { api } from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { SearchSelect } from "@/components/ui/search-select";

interface Product {
  id: number;
  prod_code: string;
  prod_name: string;
}

interface ProductSearchProps {
  onValueChange: (value: string) => void;
  value: string;
}

export function ProductSearch({ onValueChange, value }: ProductSearchProps) {
  const [products, setProducts] = useState<Product[]>([]);
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
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/products/search?search=${encodeURIComponent(query)}`
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
    }, 300),
    []
  );

  // Fetch initial product if value exists
  useEffect(() => {
    const fetchInitialProduct = async () => {
      if (value && products.length === 0) {
        try {
          const response = await api.get(
            `/products/search?search=${encodeURIComponent(value)}`
          );
          if (response.data.success && response.data.data.length > 0) {
            setProducts(response.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch initial product", error);
        }
      }
    };
    fetchInitialProduct();
  }, [value]);

  const productOptions = products.map((product) => ({
    label: `${product.prod_name} (${product.prod_code})`,
    value: product.prod_code,
  }));

  return (
    <SearchSelect
      items={productOptions}
      onValueChange={onValueChange}
      value={value}
      placeholder={loading ? "Searching..." : "Search..."}
      searchPlaceholder="Search product..."
      emptyMessage="No product found."
      onSearch={handleSearch}
    />
  );
}
