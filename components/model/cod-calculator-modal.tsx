"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { api } from "@/utils/api";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Calculator, Package, Search, Loader2, X } from "lucide-react";

interface Product {
  id: number;
  prod_code: string;
  prod_name: string;
  selling_price: number;
  weight: number;
}

interface SelectedProduct extends Product {
  qty: number;
}

interface CodCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodCalculatorModal({
  isOpen,
  onClose,
}: CodCalculatorModalProps) {
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setProducts([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `/products/basic-search?search=${encodeURIComponent(searchQuery)}`,
        );
        if (response.data.success) {
          setProducts(response.data.data);
          setShowDropdown(true);
          setActiveIndex(-1);
        }
      } catch (error) {
        console.error("Failed to search products", error);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [charges, setCharges] = useState({
    cod_charge: 0,
    courier_charge: 0,
  });
  const [calculating, setCalculating] = useState(false);
  const handleAddProduct = (product: Product) => {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.prod_code === product.prod_code);
      if (existing) {
        return prev.map((p) =>
          p.prod_code === product.prod_code ? { ...p, qty: p.qty + 1 } : p,
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchQuery("");
    setProducts([]);
    setShowDropdown(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleUpdateQty = (prod_code: string, qty: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.prod_code === prod_code ? { ...p, qty: Math.max(0, qty) } : p,
      ),
    );
  };

  const handleRemoveProduct = (prod_code: string) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.prod_code !== prod_code),
    );
  };

  const totalValue = useMemo(() => {
    return selectedProducts.reduce(
      (sum, p) => sum + p.selling_price * p.qty,
      0,
    );
  }, [selectedProducts]);

  const totalWeight = useMemo(() => {
    return selectedProducts.reduce(
      (sum, p) => sum + (p.weight || 0) * p.qty,
      0,
    );
  }, [selectedProducts]);

  const fetchCharges = useCallback(async () => {
    if (selectedProducts.length === 0) {
      setCharges({ cod_charge: 0, courier_charge: 0 });
      return;
    }

    setCalculating(true);
    try {
      const response = await api.post("/dashboard/calculate-charges", {
        total_value: totalValue,
        total_weight: totalWeight,
      });
      if (response.data.success) {
        setCharges({
          cod_charge: Number(response.data.data.cod_charge) || 0,
          courier_charge: Number(response.data.data.courier_charge) || 0,
        });
      }
    } catch (error) {
      console.error("Failed to calculate charges", error);
    } finally {
      setCalculating(false);
    }
  }, [totalValue, totalWeight, selectedProducts.length]);

  const debouncedTotalValue = useDebounce(totalValue, 500);
  const debouncedTotalWeight = useDebounce(totalWeight, 500);

  useEffect(() => {
    fetchCharges();
  }, [debouncedTotalValue, debouncedTotalWeight, fetchCharges]);

  const netTotal = totalValue + charges.cod_charge + charges.courier_charge;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || products.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, products.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleAddProduct(products[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideClose={true}
        className="max-w-4xl w-[95vw] max-h-[100vh] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl md:rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 p-2 relative overflow-hidden shrink-0 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative z-10 flex justify-between items-center">
            <DialogHeader>
              <div className="flex items-center gap-2 p-2">
                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-white">
                  <Calculator size={16} />
                </div>

                <div className="flex flex-col text-left">
                  <DialogTitle className="text-lg font-bold leading-none">
                    COD & Courier Calculator
                  </DialogTitle>
                  <p className="text-[10px] font-medium opacity-70">
                    Calculate shipping and courier charges
                  </p>
                </div>
              </div>
            </DialogHeader>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0 z-50 relative"
                type="button"
                aria-label="Close dialog"
              >
                <X size={18} />
              </Button>
            </DialogClose>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-3">
          {/* Custom inline search — works reliably inside Dialog */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />

              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => products.length > 0 && setShowDropdown(true)}
                placeholder="Search and add products..."
                className="pr-12 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
              />

              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </div>
            {showDropdown && products.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto"
              >
                {products.map((p, i) => (
                  <button
                    key={p.prod_code}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddProduct(p);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex justify-between items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                      activeIndex === i ? "bg-zinc-100 dark:bg-zinc-800" : ""
                    }`}
                  >
                    <span className="text-xs text-zinc-900 dark:text-zinc-100 truncate">
                      {p.prod_name}
                    </span>
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap font-mono">
                      {p.prod_code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableRow className="hover:bg-transparent border-zinc-200 dark:border-zinc-800 h-7">
                    <TableHead className="font-bold text-zinc-600 dark:text-zinc-400 text-[10px] py-0.5 px-2 whitespace-nowrap">
                      Code
                    </TableHead>
                    <TableHead className="font-bold text-zinc-600 dark:text-zinc-400 text-[10px] py-0.5 px-2 whitespace-nowrap">
                      Product Name
                    </TableHead>
                    <TableHead className="text-right font-bold text-zinc-600 dark:text-zinc-400 text-[10px] py-0.5 px-2 whitespace-nowrap">
                      Price
                    </TableHead>
                    <TableHead className="text-right font-bold text-zinc-600 dark:text-zinc-400 text-[10px] py-0.5 px-2 whitespace-nowrap">
                      Weight
                    </TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 dark:text-zinc-400 w-16 md:w-20 text-[10px] py-0.5 px-2 whitespace-nowrap">
                      Qty
                    </TableHead>
                    <TableHead className="text-right font-bold text-zinc-600 dark:text-zinc-400 text-[10px] py-0.5 px-2 whitespace-nowrap">
                      Subtotal
                    </TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 dark:text-zinc-400 text-[10px] py-0.5 px-2 whitespace-nowrap">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-20 text-center text-zinc-400 italic py-2"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Package size={20} className="opacity-20" />
                          <span className="text-[10px]">
                            No products added for calculation
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedProducts.map((p) => (
                      <TableRow
                        key={p.prod_code}
                        className="transition-colors h-9"
                      >
                        <TableCell className="font-medium text-[10px] py-1 px-2">
                          {p.prod_code}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400 text-[10px] py-1 px-2">
                          {p.prod_name}
                        </TableCell>
                        <TableCell className="text-right text-zinc-600 dark:text-zinc-400 text-[10px] py-1 px-2">
                          {p.selling_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right text-[10px] py-1 px-2">
                          {p.weight || 0}g
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <Input
                            type="number"
                            value={p.qty}
                            onChange={(e) =>
                              handleUpdateQty(
                                p.prod_code,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="h-5 w-12 md:w-16 mx-auto text-center rounded-md border-zinc-200 dark:border-zinc-800 text-[10px]"
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs py-0.5 px-2">
                          {(p.selling_price * p.qty).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-center py-1 px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProduct(p.prod_code)}
                            className="h-6 w-6 text-red-500 hover:text-red-300"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            <div className="space-y-2 p-3 rounded-xl border">
              <div className="flex justify-between items-center pb-1.5 border-b">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Order Summary
                </span>
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  {selectedProducts.length} Items
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] md:text-xs">Sub-total Value</span>
                <span className="text-sm md:text-base font-bold">
                  LKR{" "}
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1">
                  <Package size={10} /> Total Weight
                </span>
                <span className="font-semibold">
                  {totalWeight}g ({(totalWeight / 1000).toFixed(2)} kg)
                </span>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-xl border">
              <div className="flex justify-between items-center pb-1.5 border-b">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Charges & Fees
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] md:text-xs">
                  <span>COD Fee</span>
                  <span className="font-medium">
                    LKR {charges.cod_charge.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] md:text-xs">
                  <span>Delivery Fee</span>
                  <span className="font-medium">
                    LKR {charges.courier_charge.toFixed(2)}
                  </span>
                </div>
                <div className="pt-1.5 border-t">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase">
                      Net Total
                    </span>
                    <span className="text-base md:text-lg font-semibold">
                      LKR{" "}
                      {netTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 shrink-0">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="h-8 px-4 text-[10px] md:text-xs font-medium"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="h-8 px-6 font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 text-[10px] md:text-xs shadow-sm"
            onClick={() => {
              setSelectedProducts([]);
              setCharges({ cod_charge: 0, courier_charge: 0 });
            }}
          >
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
