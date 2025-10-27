"use client";

import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchSelect } from "@/components/ui/search-select";

interface Product {
  id: number;
  prod_code: string;
  prod_name: string;
  purchase_price: number;
  pack_size: string | number | null;
}

interface ProductSearchProps {
  onValueChange: (product: Product | null) => void;
  value: string | undefined;
  supplier?: string;
  disabled?: boolean;
}

export function ProductSearch({
  onValueChange,
  value,
  supplier,
}: ProductSearchProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect for handling debounced search
  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedSearchQuery.length < 2 || !supplier) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/products/search?search=${encodeURIComponent(
            debouncedSearchQuery
          )}&supplier=${supplier}`
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
  }, [debouncedSearchQuery, supplier]);

  // Fetch initial product if value exists
  useEffect(() => {
    const fetchInitialProduct = async () => {
      if (value && supplier && products.length === 0) {
        try {
          const response = await api.get(
            `/products/search?search=${encodeURIComponent(
              value
            )}&supplier=${supplier}`
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
  }, [value, products.length, supplier]);

  const productOptions = products.map((product) => ({
    label: `${product.prod_name} (${product.prod_code})`,
    value: product.prod_code,
  }));

  const handleSelect = (selectedValue: string) => {
    const selectedProduct =
      products.find((p) => p.prod_code === selectedValue) || null;
    onValueChange(selectedProduct);
  };

  return (
    <SearchSelect
      items={productOptions}
      onValueChange={handleSelect}
      value={value}
      placeholder={
        !supplier
          ? "Select a supplier first"
          : loading
          ? "Searching..."
          : "Search..."
      }
      searchPlaceholder="Search product..."
      emptyMessage="No product found."
      onSearch={setSearchQuery}
      disabled={!supplier}
    />
  );
}
