"use client";

import { api } from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StockProductSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadingStock, setLoadingStock] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [stockDetails, setStockDetails] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [filters, setFilters] = useState({
    supplier: "",
    publisher: "",
    author: "",
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setSearching(true);
      try {
        const response = await api.get("/products/basic-search", {
          params: { search: debouncedQuery, ...filters },
        });
        if (response.data.success) {
          setResults(response.data.data || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, filters]);

  const handleSelectProduct = async (product: any) => {
    setQuery("");
    setIsOpen(false);
    setSelectedProduct(product);
    setModalOpen(true);
    setLoadingStock(true);
    setStockDetails(null);

    try {
      const response = await api.get(
        `/products/${product.prod_code}/stock-by-location`,
      );

      if (response.data.success) {
        setStockDetails(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelectProduct(results[activeIndex]);
    }
  };

  const locationStocks = Array.isArray(stockDetails)
    ? stockDetails
    : stockDetails?.locations || [];
  const priceLevels = Array.isArray(stockDetails?.price_levels)
    ? stockDetails.price_levels
    : [];
  const levelLocationStocks = Array.isArray(stockDetails?.level_location_stocks)
    ? stockDetails.level_location_stocks
    : [];

  return (
    <>
      <div className="relative w-full max-w-sm ml-4" ref={wrapperRef}>
        <div className="relative flex items-center rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md dark:shadow-none transition-shadow duration-200">
          <Search className="absolute left-3.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search products (code, name, isbn)..."
            className="pl-10 h-9 bg-transparent border-none w-full md:w-[300px] lg:w-[400px]"
            style={{ paddingLeft: "42px" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
          />
          {searching && (
            <Loader2 className="absolute right-10 top-2.5 h-4 w-4 animate-spin text-neutral-500" />
          )}
          {/* <button
            onClick={() => setModalOpen(true)}
            className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button> */}
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-[9999] max-h-80 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-1">
              {results.map((product, index) => (
                <div
                  key={product.prod_code}
                  className={`p-2 cursor-pointer border-b border-neutral-100 dark:border-neutral-800 last:border-0 rounded-lg transition-colors ${
                    activeIndex === index
                      ? "bg-neutral-100 dark:bg-neutral-900"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  }`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                    {product.prod_name}
                  </div>
                  <div className="text-xs text-neutral-500 flex gap-2 mt-1">
                    <span>Code: {product.prod_code}</span>
                    {product.isbn && <span>• ISBN: {product.isbn}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Stock & Filters</DialogTitle>
          </DialogHeader>

          {/* Combined Filter Section in one Dialog */}
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 p-4 mb-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-neutral-500">
                Supplier
              </Label>
              <SupplierSearch
                value={filters.supplier}
                onValueChange={(val) =>
                  setFilters((prev) => ({ ...prev, supplier: val }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-neutral-500">
                Publisher
              </Label>
              <PublisherSearch
                value={filters.publisher}
                onValueChange={(val) =>
                  setFilters((prev) => ({ ...prev, publisher: val }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-neutral-500">
                Author
              </Label>
              <AuthorSearch
                value={filters.author}
                onValueChange={(val) =>
                  setFilters((prev) => ({ ...prev, author: val }))
                }
              />
            </div>
            <div className="flex items-end pr-1">
              <Button
                variant="outline"
                className="w-full text-xs h-9 bg-white dark:bg-neutral-950"
                onClick={() => {
                  setFilters({ supplier: "", publisher: "", author: "" });
                  setQuery("");
                  setSelectedProduct(null);
                  setStockDetails(null);
                }}
              >
                Clear All
              </Button>
            </div>
          </div> */}

          {!selectedProduct && results.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase text-neutral-400 mb-3 px-1 flex items-center gap-2">
                <Search className="w-3 h-3" /> Select a matching product
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {results.map((p) => (
                  <button
                    key={p.id || p.prod_code}
                    onClick={() => handleSelectProduct(p)}
                    className="flex flex-col text-left p-3 border rounded-xl hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md transition-all border-neutral-200 dark:border-neutral-800 bg-neutral-100/30 dark:bg-neutral-900/10"
                  >
                    <span className="font-semibold text-sm line-clamp-1">
                      {p.prod_name}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono mt-1">
                      {p.prod_code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedProduct ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between p-4 rounded-xl border-l-4 gap-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight">
                    {selectedProduct.prod_name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <span className="px-2 py-0.5 rounded border">
                      Code: {selectedProduct.prod_code}
                    </span>
                    {selectedProduct.isbn && (
                      <span className="px-2 py-0.5 rounded border">
                        ISBN: {selectedProduct.isbn}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Selling Price
                  </p>
                  <p className="text-xl font-black">
                    <span className="text-sm font-medium mr-1">Rs.</span>
                    {selectedProduct.selling_price || 0}
                  </p>
                </div>
              </div>

              {loadingStock ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-4 text-neutral-500 border rounded-xl border-dashed">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="font-medium animate-pulse text-xs">
                    Calculating inventory across locations...
                  </p>
                </div>
              ) : locationStocks.length > 0 || priceLevels.length > 0 ? (
                <div className="space-y-6">
                  {/* {locationStocks.length > 0 && (
                    <div className="w-full overflow-hidden border rounded-xl shadow-lg">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-center border-collapse">
                          <thead className="backdrop-blur sticky top-0">
                            <tr>
                              <th className="p-3 font-bold text-left border-r text-neutral-500 uppercase tracking-tight text-[13px]">
                                Location
                              </th>
                              <th className="p-3 font-bold text-center border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Available Stock
                              </th>
                              <th className="p-3 font-bold text-center text-neutral-500 uppercase tracking-tight text-[12px]">
                                Location Selling Price
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {locationStocks.map((stock: any) => (
                              <tr
                                key={stock.loca_code}
                                className="hover:bg-blue-50/5 dark:hover:bg-blue-900/5 transition-colors"
                              >
                                <td className="p-3 text-left border-r dark:border-neutral-800 font-medium text-neutral-900 dark:text-neutral-100">
                                  {stock.loca_name} - {stock.loca_code}
                                </td>
                                <td className="p-3 border-r dark:border-neutral-800 font-black text-sm">
                                  {stock.qty ?? 0}
                                </td>
                                <td className="p-3 font-semibold text-sm">
                                  {stock.selling_price ?? 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )} */}

                  {/* {priceLevels.length > 0 && (
                    <div className="w-full overflow-hidden border rounded-xl shadow-lg">
                      <div className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Price Level Wise
                      </div>
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-center border-collapse">
                          <thead className="backdrop-blur sticky top-0">
                            <tr>
                              <th className="p-3 font-bold text-left border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Level
                              </th>
                              <th className="p-3 font-bold text-center border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Purchase Price
                              </th>
                              <th className="p-3 font-bold text-center border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Selling Price
                              </th>
                              <th className="p-3 font-bold text-center text-neutral-500 uppercase tracking-tight text-[12px]">
                                Wholesale Price
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {priceLevels.map((level: any, index: number) => (
                              <tr
                                key={level.id ?? `price-level-${index}`}
                                className="hover:bg-blue-50/5 dark:hover:bg-blue-900/5 transition-colors"
                              >
                                <td className="p-3 text-left border-r dark:border-neutral-800 font-medium text-neutral-900 dark:text-neutral-100">
                                  {level.label ?? `Level ${index + 1}`}
                                </td>
                                <td className="p-3 border-r dark:border-neutral-800 font-semibold text-sm">
                                  {level.purchase_price ?? 0}
                                </td>
                                <td className="p-3 border-r dark:border-neutral-800 font-semibold text-sm">
                                  {level.selling_price ?? 0}
                                </td>
                                <td className="p-3 font-semibold text-sm">
                                  {level.wholesale_price ?? 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )} */}

                  {levelLocationStocks.length > 0 && (
                    <div className="w-full overflow-hidden border rounded-xl shadow-lg">
                      <div className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Location Wise Stock by Price Level
                      </div>
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-center border-collapse">
                          <thead className="backdrop-blur sticky top-0">
                            <tr>
                              <th className="p-3 font-bold text-left border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Location
                              </th>
                              <th className="p-3 font-bold text-left border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Price Level
                              </th>
                              <th className="p-3 font-bold text-center border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Purchase Price
                              </th>
                              <th className="p-3 font-bold text-center border-r text-neutral-500 uppercase tracking-tight text-[12px]">
                                Selling Price
                              </th>
                              <th className="p-3 font-bold text-center text-neutral-500 uppercase tracking-tight text-[12px]">
                                Available Stock
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {levelLocationStocks.map(
                              (row: any, index: number) => (
                                <tr
                                  key={`${row.loca_code}-${row.level_key}-${index}`}
                                  className="hover:bg-blue-50/5 dark:hover:bg-blue-900/5 transition-colors"
                                >
                                  <td className="p-3 text-left border-r dark:border-neutral-800 font-medium text-xs">
                                    {row.loca_name} - {row.loca_code}
                                  </td>
                                  <td className="p-3 text-left border-r dark:border-neutral-800 font-medium text-xs">
                                    {row.label}
                                  </td>
                                  <td className="p-3 border-r dark:border-neutral-800 font-semibold text-xs">
                                    Rs. {row.purchase_price ?? 0}
                                  </td>
                                  <td className="p-3 border-r dark:border-neutral-800 font-semibold text-xs">
                                    Rs. {row.selling_price ?? 0}
                                  </td>
                                  <td className="p-3 font-black text-xs">
                                    {row.qty ?? 0}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-xl border-dashed">
                  <p className="text-sm text-red-500 font-medium">
                    No stock information found for this product selection.
                  </p>
                </div>
              )}
            </div>
          ) : (
            !results.length &&
            !searching && (
              <div className="py-20 text-center text-neutral-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-xs">
                  Enter search term or apply filters to view product stock
                </p>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
