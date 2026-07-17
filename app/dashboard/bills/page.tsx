"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";
import { format } from "date-fns";
import { Loader2, Search, ScrollText, X } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BillRow, columns, n, lkr } from "../columns";
import { DataTable } from "@/components/ui/data-table";
import { BillPreview } from "@/components/model/bill-preview";

// ─── Payment method options ───────────────────────────────────────────────────
interface PaymentMethodOption {
  value: string;
  label: string;
  category: "CASH" | "CREDIT";
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: "CASH", label: "Cash", category: "CASH" },
  { value: "PETTY CASH", label: "Petty Cash", category: "CASH" },
  { value: "COD", label: "COD", category: "CREDIT" },
  { value: "VISA", label: "Visa", category: "CREDIT" },
  { value: "MASTER", label: "Master", category: "CREDIT" },
  { value: "BANK TRANSFER", label: "Bank Transfer", category: "CREDIT" },
  { value: "CHEQUE", label: "Cheque", category: "CREDIT" },
];

export default function BillsPage() {
  const fetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Location / date / unit ────────────────────────────────────────────────
  const [locations, setLocations] = useState<
    Array<{ loca_code: string; loca_name: string }>
  >([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const [selectedUnit, setSelectedUnit] = useState<string>("1");
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>("ALL");
  const [selectedPayCategory, setSelectedPayCategory] = useState<string>("ALL");

  // ── Bill state ────────────────────────────────────────────────────────────
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillRow | null>(null);

  // ── Init: fetch locations ───────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const init = async () => {
      try {
        const locsRes = await api.get("/locations");
        if (locsRes.data.success) {
          setLocations(locsRes.data.data);
          if (locsRes.data.data.length > 0)
            setSelectedLocation(locsRes.data.data[0].loca_code);
        }
      } catch (err) {
        console.error("Bills init error:", err);
      }
    };
    init();
  }, []);

  // ── Payment-filter helpers ────────────────────────────────────────────────
  const handlePayCategoryChange = (val: string) => {
    setSelectedPayCategory(val);
    setSelectedPayMethod("ALL");
  };

  const handlePayMethodChange = (val: string) => {
    setSelectedPayMethod(val);
    if (val !== "ALL") {
      const match = PAYMENT_METHODS.find((m) => m.value === val);
      if (match) setSelectedPayCategory(match.category);
    }
  };

  const filteredMethods =
    selectedPayCategory === "ALL"
      ? PAYMENT_METHODS
      : PAYMENT_METHODS.filter((m) => m.category === selectedPayCategory);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchBills = async () => {
    if (!selectedLocation || !dateFrom || !selectedUnit) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBills([]);
    setLoadingBills(true);
    setHasSearched(true);

    try {
      const res = await api.get("/dashboard/bills", {
        params: {
          location: selectedLocation,
          date_from: dateFrom,
          date_to: dateTo !== dateFrom ? dateTo : undefined,
          unit: selectedUnit,
          pay_type:
            selectedPayCategory === "ALL" ? undefined : selectedPayCategory,
          payment_method:
            selectedPayMethod === "ALL" ? undefined : selectedPayMethod,
        },
        signal: controller.signal,
      });
      setBills(res.data.success ? (res.data.data as BillRow[]) : []);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "CanceledError") return;
      console.error("Failed to fetch bills:", err);
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  const grandTotal = bills.reduce((s, b) => s + n(b.NetTotal), 0);

  return (
    <div className="space-y-2 ">
      {/* ── Header ── */}
      <div className="mb-2">
        <h1 className="text-xl font-bold tracking-tight mt-0.5">
          Bills Management
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          View and manage POS bill records across locations.
        </p>
      </div>

      {/* ── POS Bills Section ── */}
      <Card className="border-none shadow-sm dark:bg-neutral-900/50">
        <CardHeader className="py-3 flex flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">POS Bill Records</h2>
          </div>
          {bills.length > 0 && (
            <span className="text-[10px] text-neutral-400">
              {bills.length} bill{bills.length !== 1 ? "s" : ""} ·{" "}
              {lkr(grandTotal)}
            </span>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* ── Filters ── */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end bg-neutral-50/50 dark:bg-neutral-800/10 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/50">
            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Location
              </Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem
                      key={loc.loca_code}
                      value={loc.loca_code}
                      className="text-xs"
                    >
                      {loc.loca_name} ({loc.loca_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Date From
              </Label>
              <Input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  // If from > to, snap to to
                  if (e.target.value > dateTo) setDateTo(e.target.value);
                }}
                className="h-9"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Date To
              </Label>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Unit
              </Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                placeholder="e.g. 1"
                className="h-9 text-xs"
              />
            </div>

            {/* Payment Category */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Category
              </Label>
              <Select
                value={selectedPayCategory}
                onValueChange={handlePayCategoryChange}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    All
                  </SelectItem>
                  <SelectItem value="CASH" className="text-xs">
                    Cash
                  </SelectItem>
                  <SelectItem value="CREDIT" className="text-xs">
                    Credit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">
                Method
              </Label>
              <Select
                value={selectedPayMethod}
                onValueChange={handlePayMethodChange}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    All
                  </SelectItem>
                  {filteredMethods.map((m) => (
                    <SelectItem
                      key={m.value}
                      value={m.value}
                      className="text-xs"
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <Button
              onClick={handleSearchBills}
              disabled={loadingBills || !selectedLocation}
              className="h-9 text-xs flex items-center justify-center gap-1.5"
            >
              {loadingBills ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Search Bills
            </Button>
          </div>

          {/* ── Results table ── */}
          <div className="border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden">
            {loadingBills ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                <p className="text-xs text-neutral-500">Loading bills…</p>
              </div>
            ) : !hasSearched ? (
              <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                <ScrollText className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                <p>
                  Select filters and click &quot;Search Bills&quot; to load POS
                  transactions.
                </p>
              </div>
            ) : bills.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                <X className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                <p>No bills found for the selected criteria.</p>
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-4">
                <DataTable
                  columns={columns}
                  data={bills}
                  searchable="Receipt_No"
                  onRowClick={setSelectedBill}
                />

                {/* Grand total footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t-2 border-neutral-200 dark:border-neutral-700 pt-4 text-xs font-bold text-neutral-700 dark:text-neutral-200 gap-4">
                  <div>
                    Total ({bills.length} bill{bills.length !== 1 ? "s" : ""})
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full sm:w-auto sm:text-right">
                    <div>
                      <span className="text-neutral-500 font-medium mr-2">
                        Sub Total:
                      </span>
                      {lkr(bills.reduce((s, b) => s + n(b.subTotal), 0))}
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium mr-2">
                        Discount:
                      </span>
                      <span className="text-red-500">
                        {lkr(bills.reduce((s, b) => s + n(b.Discount), 0))}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-500 font-medium mr-2">
                        Net Total:
                      </span>
                      <span className="text-primary">{lkr(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Bill preview popup ── */}
      {selectedBill && (
        <BillPreview
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}
