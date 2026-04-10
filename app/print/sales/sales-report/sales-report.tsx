"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface ReportHeader {
  Report_Title: string;
  Report_Type: string;
  Loca_Filter: string;
  Code_From: string;
  Code_To: string;
  Date_From: string;
  Date_To: string;
}

interface ReportDetail {
  Loca: string;
  Loca_Name: string;
  BillDate: string;
  Sale_Type: string;
  CODE: string;
  Description: string;
  Unit_Price: number;
  Qty: number;
  Order_Value: number;
  COD_Charge: number;
  Courier_Charge: number;
  Postal_Cost: number;
  Gross_Amount: number;
  Discount: number;
  Sales_After_Discount: number;
  VAT: number;
  Net_Amount: number;
}

interface ReportTotals {
  Total_Unit_Price: number;
  Total_Qty: number;
  Order_Value: number;
  COD_Charge: number;
  Courier_Charge: number;
  Postal_Cost: number;
  Gross_Amount: number;
  Discount: number;
  Sales_After_Discount: number;
  VAT: number;
  Net_Amount: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function SalesReport() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const location = searchParams.get("location");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const viewType = searchParams.get("viewType") || "PRODUCT";
  const codeFrom = searchParams.get("codeFrom") || "";
  const codeTo = searchParams.get("codeTo") || "";

  const [header, setHeader] = useState<ReportHeader | null>(null);
  const [records, setRecords] = useState<ReportDetail[]>([]);
  const [totals, setTotals] = useState<ReportTotals | null>(null);

  const { toast } = useToast();
  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      if (location === null || !dateFrom || !dateTo) {
        toast({
          title: "Error",
          description: "Missing required parameters",
          type: "error",
        });
        setLoading(false);
        return;
      }

      try {
        const { data: res } = await api.get("/reports/sales-report", {
          params: { location, dateFrom, dateTo, viewType, codeFrom, codeTo },
        });

        if (res.success && res.data) {
          setHeader(res.data.header);
          setRecords(res.data.details);
          setTotals(res.data.totals);
        } else {
          toast({
            title: "No Data",
            description: "No sales data found for the selected criteria.",
            type: "error",
          });
          setTimeout(() => window.close(), 2000);
        }
      } catch (err: any) {
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
  }, [location, dateFrom, dateTo, viewType, codeFrom, codeTo, toast]);

  if (loading) return <Loader />;

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
        {/* Header Section */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-xl font-bold uppercase underline">
            {header?.Report_Title || "Sales Report"}
          </h1>
          <div className="mt-4 grid grid-cols-2 text-xs font-bold uppercase gap-y-1">
            <div className="text-left font-bold truncate max-w-[300px]">
              Location: {header?.Loca_Filter || "ALL"}
              {header?.Loca_Filter !== "ALL" && records.length > 0 && (
                <span className="ml-1 text-zinc-600">
                  - {records[0].Loca_Name}
                </span>
              )}
            </div>
            <div className="text-right">
              Date: {header?.Date_From} - {header?.Date_To}
            </div>
            <div className="text-left">View By: {header?.Report_Type}</div>
            <div className="text-right">
              {header?.Code_From === "0" && header?.Code_To === "ZZZ" ? (
                <span className="text-transparent">N/A</span>
              ) : (
                <>
                  Range: {header?.Code_From} To {header?.Code_To}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full border-collapse border border-black text-[8px] table-fixed">
          <thead>
            <tr className="bg-gray-100 border-black text-[8px] uppercase font-bold">
              <th className="border border-black p-1 text-left w-[70px]">
                Sale Date
              </th>
              <th className="border border-black p-1 text-left w-[80px]">
                Location
              </th>
              <th className="border border-black p-1 text-left">Product</th>
              <th className="border border-black p-1 text-left w-[70px]">
                Sale Type
              </th>
              <th className="border border-black p-1 text-right w-[60px]">
                Unit Price
              </th>
              <th className="border border-black p-1 text-right w-[30px]">
                Qty
              </th>
              <th className="border border-black p-1 text-right w-[60px]">
                Order Value
              </th>
              <th className="border border-black p-1 text-right w-[50px]">
                COD Fee
              </th>
              <th className="border border-black p-1 text-right w-[55px]">
                Courier
              </th>
              <th className="border border-black p-1 text-right w-[55px]">
                Postal Cost
              </th>
              <th className="border border-black p-1 text-right w-[70px]">
                Gross Amt
              </th>
              <th className="border border-black p-1 text-right w-[50px]">
                Discount
              </th>
              <th className="border border-black p-1 text-right w-[70px]">
                After Disc
              </th>
              <th className="border border-black p-1 text-right w-[60px]">
                VAT
              </th>
              <th className="border border-black p-1 text-right w-[75px]">
                Net Amt
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 border-b border-gray-200"
              >
                <td className="border border-black p-1 text-left">
                  {row.BillDate}
                </td>
                <td className="border border-black p-1 text-left">
                  <span className="font-bold text-[8px] uppercase block">
                    {row.Loca_Name}
                  </span>
                  <span className="text-[9px] text-zinc-800">
                    Loca: {row.Loca}
                  </span>
                </td>
                <td className="border border-black p-1 text-left">
                  <span className="font-bold text-[8px] uppercase block">
                    {row.Description}
                  </span>
                  <span className="text-[9px] text-zinc-800">{row.CODE}</span>
                </td>
                <td className="border border-black p-1 text-left">
                  {row.Sale_Type}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Unit_Price)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Qty)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Order_Value)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.COD_Charge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Courier_Charge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Postal_Cost)}
                </td>
                <td className="border border-black p-1 text-right font-medium">
                  {formatCurrency(row.Gross_Amount)}
                </td>
                <td className="border border-black p-1 text-right text-red-600">
                  {formatCurrency(row.Discount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Sales_After_Discount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.VAT)}
                </td>
                <td className="border border-black p-1 text-right font-bold">
                  {formatCurrency(row.Net_Amount)}
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot className="font-bold bg-gray-100 uppercase border-t-2 border-black">
              <tr>
                <td className="border border-black p-1 text-left" colSpan={4}>
                  Total
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Total_Unit_Price)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Total_Qty)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Order_Value)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.COD_Charge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Courier_Charge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Postal_Cost)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Gross_Amount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Discount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Sales_After_Discount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.VAT)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.Net_Amount)}
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
            className="no-print bg-black text-white px-4 py-1 rounded non-italic font-bold"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
