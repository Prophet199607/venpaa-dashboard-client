"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useSearchParams } from "next/navigation";

interface CurrentStockData {
  Loca: string;
  Prod_Code: string;
  Stock_Qty: number;
  Stock_Amount: number;
  Purchase_Price: number;
  Selling_Price: number;
  Department: string;
  Category: string;
  Supplier: string;
  Loca_Descrip?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CurrentStockReport() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const location = searchParams.get("location");
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<CurrentStockData[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!location) {
        setError("Missing required parameters: Location");
        setLoading(false);
        return;
      }

      try {
        const { data: res } = await api.get(
          `/reports/current-stock-report?location=${location}`,
        );

        if (res.success) {
          setRecords(res.data);

          try {
            const { data: locRes } = await api.get(`/locations/${location}`);
            if (locRes.success) {
              setLocationName(locRes.data.loca_name);
            }
          } catch (e) {
            setLocationName(location);
          }
        } else {
          setError(res.message || "Failed to fetch report data");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch report data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, curr) => ({
        qty: acc.qty + Number(curr.Stock_Qty || 0),
        amount: acc.amount + Number(curr.Stock_Amount || 0),
      }),
      { qty: 0, amount: 0 },
    );
  }, [records]);

  if (loading) return <Loader />;
  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;
  if (records.length === 0)
    return (
      <div className="p-8 text-gray-500 font-bold">
        No data found for this location.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 print:p-0 print:bg-white print:min-h-0">
      <style jsx global>{`
        @media print {
          html,
          body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            -webkit-transition: none !important;
            transition: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          .printable-content {
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
          }
        }
      `}</style>

      {/* <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-[100] no-print flex justify-between items-center px-8 py-3 shadow-sm print:hidden">
        <span className="font-bold text-gray-800 uppercase text-xs">
          Current Stock Report Viewer
        </span>
        <button
          onClick={() => window.print()}
          className="text-xs bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg font-bold"
        >
          Print Report
        </button>
      </nav> */}

      <div className="printable-content relative w-[210mm] mx-auto bg-white p-10 text-black text-[12px] font-sans border shadow-xl print:shadow-none print:border-none">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold underline uppercase">
            Current Stock Report
          </h1>
          <div className="mt-4 text-xs font-bold uppercase space-y-1">
            <div>
              Location: {location} - {locationName || location}
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="border border-black p-2 text-left w-24">
                Prod Code
              </th>
              <th className="border border-black p-2 text-left">Department</th>
              <th className="border border-black p-2 text-left">Category</th>
              <th className="border border-black p-2 text-left">Supplier</th>
              <th className="border border-black p-2 text-right">
                Selling Price
              </th>
              <th className="border border-black p-2 text-right">
                Purchase Price
              </th>
              <th className="border border-black p-2 text-right w-20">
                Stock Qty
              </th>
              <th className="border border-black p-2 text-right w-24">
                Stock Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.Prod_Code} className="hover:bg-gray-50">
                <td className="border border-black p-1 text-left">
                  {row.Prod_Code}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.Department}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.Category}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.Supplier}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Selling_Price)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Purchase_Price)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Stock_Qty)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Stock_Amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-100 uppercase border-t-2 border-black">
              <td className="border border-black p-2 text-left" colSpan={6}>
                Total
              </td>
              <td className="border border-black p-2 text-right">
                {formatCurrency(totals.qty)}
              </td>
              <td className="border border-black p-2 text-right">
                {formatCurrency(totals.amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 pt-8 border-t border-gray-200 text-[9px] text-gray-500 italic flex justify-between uppercase">
          <span>Printed on: {new Date().toLocaleString()}</span>
          <span>Venpa Back-Office System</span>
        </div>
      </div>
    </div>
  );
}
