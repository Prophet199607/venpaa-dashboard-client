"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface CollectionData {
  Sale_Date: string;
  PosNet_Amt: number;
  PosCash_Amt: number;
  PosCredit_amt: number;
  Card1_Amount: number;
  Card2_Amount: number;
  Card3_Amount: number;
  Card4_Amount: number;
  Card5_Amount: number;
  Card6_Amount: number;
  Card7_Amount: number;
  Card8_Amount: number;
  Card9_Amount: number;
  Card10_Amount: number;
  Card11_Amount: number;
  Card12_Amount: number;
  Card13_Amount: number;
  Card14_Amount: number;
  Card15_Amount: number;
  Card16_Amount: number;
  Card17_Amount: number;
  Card18_Amount: number;
  Card19_Amount: number;
  Card20_Amount: number;
  Loca: string;
  Loca_Descrip: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function DailyCollectionReport() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const [records, setRecords] = useState<CollectionData[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      if (!location || !dateFrom || !dateTo) {
        toast({
          title: "Error",
          description: "Missing required parameters",
        });
        setLoading(false);
        return;
      }

      try {
        const { data: res } = await api.get(
          `/reports/pos-collection-summary-report?location=${location}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
        );

        if (res.success && res.data && res.data.length > 0) {
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
          toast({
            title: "No Data",
            description: "No collection data found for the selected criteria.",
            type: "error",
          });
          setTimeout(() => window.close(), 2000);
        }
      } catch (err: any) {
        let errorMsg = "Failed to fetch report data";
        if (err.response?.data) {
          if (err.response.data.errors) {
            errorMsg = Object.values(err.response.data.errors)
              .flat()
              .join(", ");
          } else {
            let parsedError = err.response.data.error;
            if (
              parsedError &&
              typeof parsedError === "string" &&
              parsedError.includes("1644 ")
            ) {
              const match = parsedError.match(/1644\s+(.*?)(?:\s*\(SQL:|$)/);
              if (match && match[1]) {
                parsedError = match[1].trim();
              }
            }
            errorMsg =
              parsedError ||
              err.response.data.message ||
              "Failed to fetch report data";
          }
        } else if (err.message) {
          errorMsg = err.message;
        }
        if (
          errorMsg.includes("No DayEnd_Pos_Transaction") ||
          errorMsg.includes("No DayEnd")
        ) {
          errorMsg =
            "No transactions found for the selected location and date range.";
        }
        toast({
          title: "Error",
          description: errorMsg,
          type: "error",
        });
        setTimeout(() => window.close(), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location, dateFrom, dateTo, toast]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, curr) => {
        return {
          netAmount: acc.netAmount + Number(curr.PosNet_Amt),
          cashSale: acc.cashSale + Number(curr.PosCash_Amt),
          creditSale: acc.creditSale + Number(curr.PosCredit_amt),
          masterCard: acc.masterCard + Number(curr.Card1_Amount),
          visaCard: acc.visaCard + Number(curr.Card2_Amount),
          amex: acc.amex + Number(curr.Card3_Amount),
          nexus: acc.nexus + Number(curr.Card4_Amount),
          credit: acc.credit + Number(curr.Card5_Amount),
          giftVoucher: acc.giftVoucher + Number(curr.Card6_Amount),
          starPoint: acc.starPoint + Number(curr.Card7_Amount),
          cheque: acc.cheque + Number(curr.Card8_Amount),
          pointsRedeem: acc.pointsRedeem + Number(curr.Card9_Amount),
          lusiveLineVoucher: acc.lusiveLineVoucher + Number(curr.Card10_Amount),
          mCash: acc.mCash + Number(curr.Card11_Amount),
          creditNote: acc.creditNote + Number(curr.Card12_Amount),
          debitCard: acc.debitCard + Number(curr.Card13_Amount),
          advance: acc.advance + Number(curr.Card14_Amount),
          advanceRedeem: acc.advanceRedeem + Number(curr.Card15_Amount),
          gvManual: acc.gvManual + Number(curr.Card16_Amount),
          charteredVoucher: acc.charteredVoucher + Number(curr.Card17_Amount),
          redeemVoucher: acc.redeemVoucher + Number(curr.Card18_Amount),
          promotionVoucher: acc.promotionVoucher + Number(curr.Card19_Amount),
          frimi: acc.frimi + Number(curr.Card20_Amount),
        };
      },
      {
        netAmount: 0,
        cashSale: 0,
        creditSale: 0,
        masterCard: 0,
        visaCard: 0,
        amex: 0,
        nexus: 0,
        credit: 0,
        giftVoucher: 0,
        starPoint: 0,
        cheque: 0,
        pointsRedeem: 0,
        lusiveLineVoucher: 0,
        mCash: 0,
        creditNote: 0,
        debitCard: 0,
        advance: 0,
        advanceRedeem: 0,
        gvManual: 0,
        charteredVoucher: 0,
        redeemVoucher: 0,
        promotionVoucher: 0,
        frimi: 0,
      },
    );
  }, [records]);

  if (loading) return <Loader />;
  const firstRecord = records[0];
  if (!firstRecord) return null;

  return (
    <div className="w-full h-full bg-white text-black p-4 font-sans text-[10px]">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* <div className="no-print fixed top-0 left-0 w-full bg-slate-100 p-2 flex justify-between items-center border-b z-50">
        <span className="font-bold uppercase text-[10px]">
          Daily Collection Report - Preview
        </span>
        <button
          onClick={() => window.print()}
          className="bg-primary text-white px-4 py-1 rounded text-[10px] font-bold"
        >
          Print
        </button>
      </div> */}

      <div className="mt-8">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold underline uppercase">
            Daily Collection Report
          </h1>
          <div className="mt-2 font-bold uppercase space-y-1">
            <div className="flex justify-center gap-8">
              <span>Date From: {dateFrom}</span>
              <span>To: {dateTo}</span>
            </div>
            <div>
              Location:{" "}
              {locationName && locationName !== location
                ? `${locationName} (${location})`
                : firstRecord.Loca_Descrip &&
                    firstRecord.Loca_Descrip !== firstRecord.Loca
                  ? `${firstRecord.Loca_Descrip} (${firstRecord.Loca})`
                  : firstRecord.Loca}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black min-w-[280mm]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-left min-w-[60px]">
                  Date
                </th>
                <th className="border border-black p-1 text-right">Net Amt</th>
                <th className="border border-black p-1 text-right">
                  Cash Sale
                </th>
                <th className="border border-black p-1 text-right">
                  Credit Sale
                </th>
                <th className="border border-black p-1 text-right">Master</th>
                <th className="border border-black p-1 text-right">Visa</th>
                <th className="border border-black p-1 text-right">Amex</th>
                <th className="border border-black p-1 text-right">Nexus</th>
                <th className="border border-black p-1 text-right">Credit</th>
                <th className="border border-black p-1 text-right">
                  Gift Voucher
                </th>
                <th className="border border-black p-1 text-right">
                  Star Point
                </th>
                <th className="border border-black p-1 text-right">Cheque</th>
                <th className="border border-black p-1 text-right">
                  Points Redeem
                </th>
                <th className="border border-black p-1 text-right">
                  Exclusiva Line Voucher
                </th>
                <th className="border border-black p-1 text-right">M Cash</th>
                <th className="border border-black p-1 text-right">
                  Credit Note
                </th>
                <th className="border border-black p-1 text-right">
                  Debit Card
                </th>
                <th className="border border-black p-1 text-right">Advance</th>
                <th className="border border-black p-1 text-right">
                  Advance Redeem
                </th>
                <th className="border border-black p-1 text-right">
                  GV Manual
                </th>
                <th className="border border-black p-1 text-right">
                  Chartered Voucher
                </th>
                <th className="border border-black p-1 text-right">
                  Redeem Voucher
                </th>
                <th className="border border-black p-1 text-right">
                  Promotion Voucher
                </th>
                <th className="border border-black p-1 text-right">Frimi</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-black p-1 text-left">
                    {row.Sale_Date}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.PosNet_Amt)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.PosCash_Amt)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.PosCredit_amt)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card1_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card2_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card3_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card4_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card5_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card6_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card7_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card8_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card9_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card10_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card11_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card12_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card13_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card14_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card15_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card16_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card17_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card18_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card19_Amount)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(row.Card20_Amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold uppercase">
                <td className="border border-black p-1 text-left">Total</td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.netAmount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.cashSale)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.creditSale)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.masterCard)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.visaCard)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.amex)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.nexus)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.credit)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.giftVoucher)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.starPoint)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.cheque)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.pointsRedeem)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.lusiveLineVoucher)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.mCash)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.creditNote)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.debitCard)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.advance)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.advanceRedeem)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.gvManual)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.charteredVoucher)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.redeemVoucher)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.promotionVoucher)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.frimi)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
