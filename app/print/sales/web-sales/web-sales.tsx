"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface WebSalesItem {
  doc_no: string;
  transaction_date: string;
  prod_code: string;
  prod_name: string;
  qty: number;
  selling_price: number;
  amount: number;
  iid: string;
  location: string;
  location_name: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  source: string;
}

interface WebSalesOrder {
  doc_no: string;
  date: string;
  customer_name: string;
  email: string;
  phone: string;
  iid: string;
  source: string;
  location?: string;
  location_name?: string;
  order_total: number;
  item_count: number;
  total_qty: number;
  total_amount: number;
}

interface WebSalesResponse {
  details: WebSalesItem[];
  orders: WebSalesOrder[];
  totals: {
    total_qty: number;
    total_amount: number;
    record_count: number;
    order_count: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatQty = (qty: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(qty);
};

export default function WebSalesReport() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WebSalesResponse | null>(null);
  const fetchedRef = useRef(false);

  const location = searchParams.get("location") || "ALL";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const type = searchParams.get("type") || "ALL";

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      if (!dateFrom || !dateTo) {
        toast({
          title: "Error",
          description: "Missing required parameters",
          type: "error",
        });
        setLoading(false);
        return;
      }

      try {
        const params: Record<string, string> = { dateFrom, dateTo };
        if (location && location !== "ALL") params.location = location;
        if (type && type !== "ALL") params.type = type;

        const { data: res } = await api.get("/reports/web-sales-report", {
          params,
        });

        if (res.success && res.data) {
          setData(res.data);
        } else {
          toast({
            title: "No Data",
            description: "No web sales data found.",
            type: "error",
          });
          setTimeout(() => window.close(), 2000);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch report data",
          type: "error",
        });
        setTimeout(() => window.close(), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loader />;

  const locationName =
    data?.orders?.[0]?.location_name ||
    data?.details?.[0]?.location_name ||
    location;

  const locName =
    location !== "ALL" ? `Location: ${locationName}` : "All Locations";

  return (
    <div className="min-h-screen bg-white py-8 px-4 print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-[297mm] mx-auto bg-white p-4 text-black font-sans">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-xl font-bold uppercase underline">
            Web Sales Report
          </h1>
          <div className="mt-4 grid grid-cols-3 text-xs font-bold uppercase gap-y-1">
            <div className="text-left">{locName}</div>
            <div className="text-center">
              Date: {dateFrom} - {dateTo}
            </div>
            <div className="text-right">
              Type: {type === "ALL" ? "WEB & APP" : type}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full border-collapse border border-black text-[8px]">
          <thead>
            <tr className="bg-gray-100 border-black text-[8px] uppercase font-bold">
              <th className="border border-black p-1 text-left w-[70px]">
                Date
              </th>
              <th className="border border-black p-1 text-left w-[90px]">
                Order No
              </th>
              <th className="border border-black p-1 text-left w-[70px]">
                Customer
              </th>
              <th className="border border-black p-1 text-left w-[80px]">
                Location
              </th>
              <th className="border border-black p-1 text-left">Product</th>
              <th className="border border-black p-1 text-right w-[40px]">
                Qty
              </th>
              <th className="border border-black p-1 text-right w-[60px]">
                Price
              </th>
              <th className="border border-black p-1 text-right w-[65px]">
                Amount
              </th>
              <th className="border border-black p-1 text-center w-[40px]">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.details.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 border-b border-gray-200"
              >
                <td className="border border-black p-1 text-left">
                  {row.transaction_date}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.doc_no}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.customer_name}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.location_name}
                </td>
                <td className="border border-black p-1 text-left">
                  <span className="font-bold text-[8px] uppercase block">
                    {row.prod_name}
                  </span>
                  <span className="text-[7px] text-zinc-700">
                    {row.prod_code}
                  </span>
                </td>
                <td className="border border-black p-1 text-right">
                  {formatQty(row.qty)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.selling_price)}
                </td>
                <td className="border border-black p-1 text-right font-medium">
                  {formatCurrency(row.amount)}
                </td>
                <td className="border border-black p-1 text-center font-bold">
                  {row.iid}
                </td>
              </tr>
            ))}
          </tbody>
          {data?.totals && (
            <tfoot className="font-bold bg-gray-100 uppercase border-t-2 border-black">
              <tr>
                <td className="border border-black p-1 text-left" colSpan={5}>
                  Grand Total ({data.totals.record_count} lines,{" "}
                  {data.totals.order_count} orders)
                </td>
                <td className="border border-black p-1 text-right">
                  {formatQty(data.totals.total_qty)}
                </td>
                <td className="border border-black p-1 text-right"></td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(data.totals.total_amount)}
                </td>
                <td className="border border-black p-1 text-center"></td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-[10px] italic flex justify-between uppercase">
          <span>Printed on: {new Date().toLocaleString()}</span>
          <span>Venpa Back-Office</span>
          <button
            onClick={() => window.print()}
            className="no-print bg-black text-white px-4 py-1 rounded non-italic font-bold cursor-pointer"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
