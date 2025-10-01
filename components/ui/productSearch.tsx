"use client";

import React, { useState, useCallback } from "react";
import ProductSearch, { Product, useProductSearch } from "./product-search";

interface Props {
  initialProducts?: Product[];
  isDisabled?: boolean;
  isClear?: boolean;
  showControls?: boolean; // whether to show demo control buttons
  onSearchProducts?: (searchTerm: string) => Promise<void> | void;
  onProductClick?: (product: Product) => void;
  onClearProduct?: () => void;
}

const ProductSearchContainer: React.FC<Props> = ({
  initialProducts = [],
  isDisabled = false,
  isClear = false,
  showControls = true,
  onSearchProducts,
  onProductClick,
  onClearProduct,
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const productSearch = useProductSearch();

  const handleSearchProducts = useCallback(
    async (searchTerm: string) => {
      if (onSearchProducts) {
        return onSearchProducts(searchTerm);
      }
      // Default behavior: fetch from /api/products
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(searchTerm)}`
        );
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Search failed:", error);
        setProducts([]);
      }
    },
    [onSearchProducts]
  );

  const handleProductClick = useCallback(
    (product: Product) => {
      if (onProductClick) return onProductClick(product);
      console.log("Product selected:", product);
    },
    [onProductClick]
  );

  const handleClearProduct = useCallback(() => {
    if (onClearProduct) return onClearProduct();
    setProducts([]);
  }, [onClearProduct]);

  const handleFocusSearch = () => {
    productSearch.focus();
  };

  const handleSetProduct = () => {
    productSearch.setSelectedProduct({
      prod_code: "EXAMPLE",
      prod_name: "Example Product",
    });
  };

  return (
    <div className="p-4">
      {showControls && (
        <div className="mb-4 space-x-2">
          <button
            onClick={handleFocusSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Focus Search
          </button>
          <button
            onClick={handleSetProduct}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Set Example Product
          </button>
        </div>
      )}

      <ProductSearch
        ref={productSearch.ref}
        products={products}
        isDisabled={isDisabled}
        isClear={isClear}
        onSearchProducts={handleSearchProducts}
        onProductClick={handleProductClick}
        onClearProduct={handleClearProduct}
      />
    </div>
  );
};

export default ProductSearchContainer;
