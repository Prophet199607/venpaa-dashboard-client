"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface WebSalesOrder {
  doc_no: string;
  date: string;
  customer_name: string;
  email: string;
  phone: string;
  source: string;
  location: string;
  location_name: string;
  payment_type: number;
  payment_type_name: string;
  iid: string;
  product_value: number;
  discount: number;
  sub_total: number;
  courier_charge: number;
  cod_charge: number;
  net_total: number;
  item_count: number;
  total_qty: number;
}

interface WebSalesResponse {
  orders: WebSalesOrder[];
  totals: {
    total_product_value: number;
    total_discount: number;
    total_sub_total: number;
    total_courier_charge: number;
    total_cod_charge: number;
    total_net_total: number;
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
  const paymentType = searchParams.get("payment_type") || "";

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
        if (paymentType && paymentType !== "ALL")
          params.payment_type = paymentType;

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

  const locName =
    location !== "ALL"
      ? `Location: ${data?.orders?.[0]?.location_name || location}`
      : "All Locations";

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
        <table className="w-full border-collapse border border-black text-[7px]">
          <thead>
            <tr className="bg-gray-100 border-black text-[7px] uppercase font-bold">
              <th className="border border-black p-1 text-left w-[60px]">
                Date
              </th>
              <th className="border border-black p-1 text-left w-[75px]">
                Order No
              </th>
              <th className="border border-black p-1 text-left w-[65px]">
                Customer
              </th>
              <th className="border border-black p-1 text-left w-[55px]">
                Location
              </th>
              <th className="border border-black p-1 text-center w-[60px]">
                Payment
              </th>
              <th className="border border-black p-1 text-center w-[30px]">
                Type
              </th>
              <th className="border border-black p-1 text-right w-[55px]">
                Prod Value
              </th>
              <th className="border border-black p-1 text-right w-[50px]">
                Discount
              </th>
              <th className="border border-black p-1 text-right w-[55px]">
                Sub Total
              </th>
              <th className="border border-black p-1 text-right w-[50px]">
                Courier
              </th>
              <th className="border border-black p-1 text-right w-[45px]">
                COD
              </th>
              <th className="border border-black p-1 text-right w-[60px]">
                Net Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.orders.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 border-b border-gray-200"
              >
                <td className="border border-black p-1 text-left">
                  {row.date}
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
                <td className="border border-black p-1 text-center">
                  {row.payment_type_name}
                </td>
                <td className="border border-black p-1 text-center">
                  {row.iid}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.product_value)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.discount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.sub_total)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.courier_charge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.cod_charge)}
                </td>
                <td className="border border-black p-1 text-right font-medium">
                  {formatCurrency(row.net_total)}
                </td>
              </tr>
            ))}
          </tbody>
          {data?.totals && (
            <tfoot className="font-bold bg-gray-100 uppercase border-t-2 border-black">
              <tr>
                <td className="border border-black p-1 text-left" colSpan={6}>
                  Grand Total ({data.totals.order_count} orders)
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(data.totals.total_product_value)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(data.totals.total_discount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(data.totals.total_sub_total)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(data.totals.total_courier_charge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(data.totals.total_cod_charge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(data.totals.total_net_total)}
                </td>
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
