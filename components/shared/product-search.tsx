"use client";

import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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
          `/products/search?search=${encodeURIComponent(debouncedSearchQuery)}`
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
  }, [value, products.length]);

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
      onSearch={setSearchQuery}
    />
  );
}
