"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface CollectionData {
  BillDate: string;
  PosGross_Sales: string;
  PosRefund_Tot: string;
  PosRefund_No: string;
  PosVoidAmt: string;
  PosVoidCount: string;
  PosErrAmt: string;
  PosErrCount: string;
  PosCancelAmt: string;
  PosCancelCount: string;
  PosNet_Amt: string;
  PosCash_Amt: string;
  PosCredit_amt: string;
  PosBill_Count: number;
  PosExchange_Tot: string;
  PosExchange_No: string;
  PosDiscount_Tot: string;
  PosDiscount_No: string;
  OrderValuesChargeAmt: string;
  CourierChargeAmt: string;
  Declare_Amount: number;
  Pos_CashOut: string;
  CRNIssued: string;
  CRNReceived: string;
  ChangeMoneyTransfer: string;
  MasterCardAmt: string;
  VisaCardAmt: string;
  AmexAmt: string;
  NexusAmt: string;
  CreditAmt: string;
  GiftVoucherAmt: string;
  StarPointAmt: string;
  ChequeAmt: number;
  PointsRedeemAmt: string;
  ExclusiveLineVoucherAmt: number;
  MCashAmt: number;
  CreditNoteAmt: string;
  DebitCardAmt: string;
  AdvanceAmt: number;
  AdvanceRedeemAmt: string;
  GVManualAmt: string;
  StandardCharteredVoucherAmt: number;
  RedeemVoucherAmt: number;
  OnLineAmt: string;
  KOKOAmt: string;
  MintpayAmt: string;
  CODAmt: string;
  OtherCreditAmt: number;
  CreditTotal: number;
  AdvanceIssue: string;
  Inv: string;
  Cur: string;
  RntChq: string;
  InvChq: string;
  InvCash: string;
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
      (acc, curr) => ({
        grossSales: acc.grossSales + Number(curr.PosGross_Sales),
        refundTot: acc.refundTot + Number(curr.PosRefund_Tot),
        voidAmt: acc.voidAmt + Number(curr.PosVoidAmt),
        errAmt: acc.errAmt + Number(curr.PosErrAmt),
        cancelAmt: acc.cancelAmt + Number(curr.PosCancelAmt),
        netAmount: acc.netAmount + Number(curr.PosNet_Amt),
        cashSale: acc.cashSale + Number(curr.PosCash_Amt),
        creditSale: acc.creditSale + Number(curr.PosCredit_amt),
        billCount: acc.billCount + Number(curr.PosBill_Count),
        exchangeTot: acc.exchangeTot + Number(curr.PosExchange_Tot),
        discountTot: acc.discountTot + Number(curr.PosDiscount_Tot),
        orderValuesCharge:
          acc.orderValuesCharge + Number(curr.OrderValuesChargeAmt),
        courierCharge: acc.courierCharge + Number(curr.CourierChargeAmt),
        declareAmount: acc.declareAmount + Number(curr.Declare_Amount),
        cashOut: acc.cashOut + Number(curr.Pos_CashOut),
        crnIssued: acc.crnIssued + Number(curr.CRNIssued),
        crnReceived: acc.crnReceived + Number(curr.CRNReceived),
        changeMoneyTransfer:
          acc.changeMoneyTransfer + Number(curr.ChangeMoneyTransfer),
        masterCard: acc.masterCard + Number(curr.MasterCardAmt),
        visaCard: acc.visaCard + Number(curr.VisaCardAmt),
        amex: acc.amex + Number(curr.AmexAmt),
        nexus: acc.nexus + Number(curr.NexusAmt),
        credit: acc.credit + Number(curr.CreditAmt),
        giftVoucher: acc.giftVoucher + Number(curr.GiftVoucherAmt),
        starPoint: acc.starPoint + Number(curr.StarPointAmt),
        cheque: acc.cheque + Number(curr.ChequeAmt),
        pointsRedeem: acc.pointsRedeem + Number(curr.PointsRedeemAmt),
        exclusiveLineVoucher:
          acc.exclusiveLineVoucher + Number(curr.ExclusiveLineVoucherAmt),
        mCash: acc.mCash + Number(curr.MCashAmt),
        creditNote: acc.creditNote + Number(curr.CreditNoteAmt),
        debitCard: acc.debitCard + Number(curr.DebitCardAmt),
        advance: acc.advance + Number(curr.AdvanceAmt),
        advanceRedeem: acc.advanceRedeem + Number(curr.AdvanceRedeemAmt),
        gvManual: acc.gvManual + Number(curr.GVManualAmt),
        standardCharteredVoucher:
          acc.standardCharteredVoucher +
          Number(curr.StandardCharteredVoucherAmt),
        redeemVoucher: acc.redeemVoucher + Number(curr.RedeemVoucherAmt),
        onLineAmt: acc.onLineAmt + Number(curr.OnLineAmt),
        kokoAmt: acc.kokoAmt + Number(curr.KOKOAmt),
        mintpayAmt: acc.mintpayAmt + Number(curr.MintpayAmt),
        codAmt: acc.codAmt + Number(curr.CODAmt),
        otherCredit: acc.otherCredit + Number(curr.OtherCreditAmt),
        creditTotal: acc.creditTotal + Number(curr.CreditTotal),
        advanceIssue: acc.advanceIssue + Number(curr.AdvanceIssue),
        inv: acc.inv + Number(curr.Inv),
        cur: acc.cur + Number(curr.Cur),
        rntChq: acc.rntChq + Number(curr.RntChq),
        invChq: acc.invChq + Number(curr.InvChq),
        invCash: acc.invCash + Number(curr.InvCash),
      }),
      {
        grossSales: 0,
        refundTot: 0,
        voidAmt: 0,
        errAmt: 0,
        cancelAmt: 0,
        netAmount: 0,
        cashSale: 0,
        creditSale: 0,
        billCount: 0,
        exchangeTot: 0,
        discountTot: 0,
        orderValuesCharge: 0,
        courierCharge: 0,
        declareAmount: 0,
        cashOut: 0,
        crnIssued: 0,
        crnReceived: 0,
        changeMoneyTransfer: 0,
        masterCard: 0,
        visaCard: 0,
        amex: 0,
        nexus: 0,
        credit: 0,
        giftVoucher: 0,
        starPoint: 0,
        cheque: 0,
        pointsRedeem: 0,
        exclusiveLineVoucher: 0,
        mCash: 0,
        creditNote: 0,
        debitCard: 0,
        advance: 0,
        advanceRedeem: 0,
        gvManual: 0,
        standardCharteredVoucher: 0,
        redeemVoucher: 0,
        onLineAmt: 0,
        kokoAmt: 0,
        mintpayAmt: 0,
        codAmt: 0,
        otherCredit: 0,
        creditTotal: 0,
        advanceIssue: 0,
        inv: 0,
        cur: 0,
        rntChq: 0,
        invChq: 0,
        invCash: 0,
      },
    );
  }, [records]);

  if (loading) return <Loader />;
  if (records.length === 0) return null;

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
            <div>Location: {locationName || location}</div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black min-w-[380mm]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-left min-w-[70px]">
                  Date
                </th>
                <th className="border border-black p-1 text-right">
                  Gross Sales
                </th>
                <th className="border border-black p-1 text-right">Net Amt</th>
                <th className="border border-black p-1 text-right">Cash</th>
                <th className="border border-black p-1 text-right">Credit</th>
                <th className="border border-black p-1 text-right">Master</th>
                <th className="border border-black p-1 text-right">Visa</th>
                <th className="border border-black p-1 text-right">Amex</th>
                <th className="border border-black p-1 text-right">Nexus</th>
                <th className="border border-black p-1 text-right">
                  Credit Card
                </th>
                <th className="border border-black p-1 text-right">
                  Gift Vchr
                </th>
                <th className="border border-black p-1 text-right">StarPt</th>
                <th className="border border-black p-1 text-right">Cheque</th>
                <th className="border border-black p-1 text-right">
                  Pts Redeem
                </th>
                <th className="border border-black p-1 text-right">
                  Excl Vchr
                </th>
                <th className="border border-black p-1 text-right">M Cash</th>
                <th className="border border-black p-1 text-right">Cr Note</th>
                <th className="border border-black p-1 text-right">Debit</th>
                <th className="border border-black p-1 text-right">Advance</th>
                <th className="border border-black p-1 text-right">
                  Adv Redeem
                </th>
                <th className="border border-black p-1 text-right">GV Man</th>
                <th className="border border-black p-1 text-right">
                  Std Chart
                </th>
                <th className="border border-black p-1 text-right">Red Vchr</th>
                <th className="border border-black p-1 text-right">Online</th>
                <th className="border border-black p-1 text-right">KOKO</th>
                <th className="border border-black p-1 text-right">Mintpay</th>
                <th className="border border-black p-1 text-right">COD</th>
                <th className="border border-black p-1 text-right">Oth Cr</th>
                <th className="border border-black p-1 text-right">Exchange</th>
                <th className="border border-black p-1 text-right">Discount</th>
                {/* <th className="border border-black p-1 text-right">
                  Ordr Chrg
                </th>
                <th className="border border-black p-1 text-right">
                  Couri Chrg
                </th> */}
                <th className="border border-black p-1 text-right">Declare</th>
                <th className="border border-black p-1 text-right">CashOut</th>
                <th className="border border-black p-1 text-right">Refund</th>
                <th className="border border-black p-1 text-right">Void</th>
                <th className="border border-black p-1 text-right">Error</th>
                <th className="border border-black p-1 text-right">Cancel</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-black p-1 text-left">
                    {row.BillDate}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosGross_Sales))}
                  </td>
                  <td className="border border-black p-1 text-right font-bold">
                    {formatCurrency(Number(row.PosNet_Amt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosCash_Amt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosCredit_amt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.MasterCardAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.VisaCardAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.AmexAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.NexusAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.CreditAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.GiftVoucherAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.StarPointAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.ChequeAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PointsRedeemAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.ExclusiveLineVoucherAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.MCashAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.CreditNoteAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.DebitCardAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.AdvanceAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.AdvanceRedeemAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.GVManualAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.StandardCharteredVoucherAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.RedeemVoucherAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.OnLineAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.KOKOAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.MintpayAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.CODAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.OtherCreditAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosExchange_Tot))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosDiscount_Tot))}
                  </td>
                  {/* <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.OrderValuesChargeAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.CourierChargeAmt))}
                  </td> */}
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.Declare_Amount))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.Pos_CashOut))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosRefund_Tot))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosVoidAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosErrAmt))}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatCurrency(Number(row.PosCancelAmt))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold uppercase">
                <td className="border border-black p-1 text-left">Total</td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.grossSales)}
                </td>
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
                  {formatCurrency(totals.exclusiveLineVoucher)}
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
                  {formatCurrency(totals.standardCharteredVoucher)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.redeemVoucher)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.onLineAmt)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.kokoAmt)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.mintpayAmt)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.codAmt)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.otherCredit)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.exchangeTot)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.discountTot)}
                </td>
                {/* <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.orderValuesCharge)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.courierCharge)}
                </td> */}
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.declareAmount)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.cashOut)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.refundTot)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.voidAmt)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.errAmt)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(totals.cancelAmt)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
