"use client";

import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";

export type Product = {
  prod_code: string;
  prod_name: string;
};

interface Props {
  products: Product[];
  isDisabled?: boolean;
  isClear?: boolean;
  onSearchProducts: (term: string) => void | Promise<void>;
  onProductClick: (product: Product) => void;
  onClearProduct?: () => void;
}

export type ProductSearchHandle = {
  focus: () => void;
  setSelectedProduct: (p: Product) => void;
};

const ProductSearch = forwardRef<ProductSearchHandle, Props>(
  ({ products, isDisabled = false, isClear = false, onSearchProducts, onProductClick, onClearProduct }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState("");

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      setSelectedProduct: (p: Product) => {
        setQuery(`${p.prod_name}`);
      },
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setQuery(v);
      onSearchProducts(v);
    };

    const handleClick = (p: Product) => {
      setQuery(p.prod_name);
      onProductClick(p);
    };

    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            disabled={isDisabled}
            className="border rounded px-2 py-1 w-full"
            placeholder="Search product..."
          />
          {onClearProduct && (
            <button onClick={onClearProduct} className="px-2 py-1 text-sm">
              Clear
            </button>
          )}
        </div>
        {products && products.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
            {products.map((p) => (
              <li key={p.prod_code} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleClick(p)}>
                <div className="text-sm font-medium">{p.prod_name}</div>
                <div className="text-xs text-gray-500">{p.prod_code}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

ProductSearch.displayName = "ProductSearch";

export function useProductSearch() {
  const ref = useRef<ProductSearchHandle | null>(null);
  function focus() {
    ref.current?.focus();
  }
  function setSelectedProduct(p: Product) {
    ref.current?.setSelectedProduct(p);
  }
  return { ref, focus, setSelectedProduct };
}

export default ProductSearch;
