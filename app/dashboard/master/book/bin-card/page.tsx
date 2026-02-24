"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

const TABLE_PAGE_SIZES = [10, 20, 50, 100];

interface BinCardTransaction {
  transaction: string;
  date: string;
  document: string;
  reference: string;
  cost: string;
  stock_in: string;
  stock_out: string;
  balance: string;
}

interface BinCardData {
  product: { prod_code: string; prod_name: string };
  location: string;
  stores: string;
  purchase_price: string;
  current_balance: string;
  transactions: BinCardTransaction[];
}

function BinCardReportContent() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const prodCode = searchParams.get("prod_code");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BinCardData | null>(null);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZES[0]);

  useEffect(() => {
    if (!prodCode) {
      setError("Product code is required.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: res } = await api.get<{
          success: boolean;
          data?: BinCardData;
          message?: string;
        }>(`/books/${encodeURIComponent(prodCode)}/bin-card`, {
          signal: controller.signal,
        });

        if (res.success && res.data) {
          setData(res.data);
          setPage(1);
        } else {
          setError(res.message || "Failed to load bin card.");
        }
      } catch (err: unknown) {
        if ((err as any)?.name === "CanceledError") return;

        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to load bin card.";

        setError(msg);

        toast({
          title: "Error",
          description: msg,
          type: "error",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [prodCode, toast]);

  // const handlePrint = () => {
  //   window.print();
  // };

  const transactions = useMemo(
    () => data?.transactions ?? [],
    [data?.transactions],
  );
  const totalRows = transactions.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, currentPage, pageSize]);
  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRows);

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="space-y-4 p-6">
        <Link href="/dashboard/master/book">
          <Button type="button" variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Books
          </Button>
        </Link>
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const {
    product,
    location: loc,
    stores,
    purchase_price,
    current_balance,
  } = data;

  return (
    <div className="space-y-2 p-2">
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard/master/book">
            <Button type="button" variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        {/* <Button type="button" variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save as PDF
        </Button> */}
      </div>

      <div
        id="bin-card-report"
        className="mx-auto max-w-5xl bg-white text-black print:max-w-none"
      >
        <h2 className="border-b-2 border-black pb-1 text-center text-base font-bold">
          PRODUCT BIN CARD
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
          <div>
            <span className="font-semibold">PRODUCT:</span> {product.prod_code}
          </div>
          <div>
            <span className="font-semibold">LOCATION:</span> {loc}
          </div>
          <div>
            <span className="font-semibold">Product Name:</span>{" "}
            {product.prod_name}
          </div>
          <div>
            <span className="font-semibold">STORE:</span> {stores || "-"}
          </div>
          <div>
            <span className="font-semibold">PUR PRICE:</span> {purchase_price}
          </div>
          <div>
            <span className="font-semibold">BALANCE STOCK:</span>{" "}
            {current_balance}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1.5 text-left font-semibold">
                  Transaction
                </th>
                <th className="border border-black px-2 py-1.5 text-left font-semibold">
                  Date
                </th>
                <th className="border border-black px-2 py-1.5 text-left font-semibold">
                  Document
                </th>
                <th className="border border-black px-2 py-1.5 text-left font-semibold">
                  Reference
                </th>
                <th className="border border-black px-2 py-1.5 text-right font-semibold">
                  Cost
                </th>
                <th className="border border-black px-2 py-1.5 text-right font-semibold">
                  Stock In
                </th>
                <th className="border border-black px-2 py-1.5 text-right font-semibold">
                  Stock Out
                </th>
                <th className="border border-black px-2 py-1.5 text-right font-semibold">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-black px-2 py-4 text-center text-muted-foreground"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((row, idx) => (
                  <tr key={(currentPage - 1) * pageSize + idx}>
                    <td className="border border-black px-2 py-1">
                      {row.transaction}
                    </td>
                    <td className="border border-black px-2 py-1">
                      {row.date}
                    </td>
                    <td className="border border-black px-2 py-1">
                      {row.document}
                    </td>
                    <td className="border border-black px-2 py-1">
                      {row.reference}
                    </td>
                    <td className="border border-black px-2 py-1 text-right">
                      {row.cost}
                    </td>
                    <td className="border border-black px-2 py-1 text-right">
                      {row.stock_in}
                    </td>
                    <td className="border border-black px-2 py-1 text-right">
                      {row.stock_out ? `-${row.stock_out}` : ""}
                    </td>
                    <td className="border border-black px-2 py-1 text-right">
                      {row.balance}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalRows > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4 print:hidden">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Showing {startRow}–{endRow} of {totalRows} records
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {TABLE_PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[8rem] text-center text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BinCardPage() {
  return (
    <Suspense fallback={<Loader />}>
      <BinCardReportContent />
    </Suspense>
  );
}
