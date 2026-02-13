"use client";

import React from "react";

interface CollectionData {
  date: string;
  netAmount: number;
  cashSale: number;
  creditSale: number;
  masterCard: number;
  visaCard: number;
  amex: number;
  nexus: number;
  credit: number;
  giftVoucher: number;
  starPoint: number;
  cheque: number;
  pointsRedeem: number;
  lusiveLineVoucher: number;
  mCash: number;
  creditNote: number;
  debitCard: number;
  advance: number;
  advanceRedeem: number;
  gvManual: number;
  charteredVoucher: number;
  redeemVoucher: number;
  promotionVoucher: number;
  frimi: number;
}

interface DailyCollectionReportData {
  locationId: string;
  locationName: string;
  dateFrom: string;
  dateTo: string;
  records: CollectionData[];
}

const dummyData: DailyCollectionReportData = {
  locationId: "01",
  locationName: "ONIMTA MAHARAGAMA",
  dateFrom: "03/07/2024",
  dateTo: "03/07/2024",
  records: [
    {
      date: "03/07/2024",
      netAmount: 1815559.75,
      cashSale: 1162993.25,
      creditSale: 652566.5,
      masterCard: 187569.0,
      visaCard: 422662.5,
      amex: 14480.0,
      nexus: 0.0,
      credit: 0.0,
      giftVoucher: 21000.0,
      starPoint: 0.0,
      cheque: 0.0,
      pointsRedeem: 6855.0,
      lusiveLineVoucher: 0.0,
      mCash: 0.0,
      creditNote: 0.0,
      debitCard: 0.0,
      advance: 0.0,
      advanceRedeem: 0.0,
      gvManual: 0.0,
      charteredVoucher: 0.0,
      redeemVoucher: 0.0,
      promotionVoucher: 0.0,
      frimi: 0.0,
    },
  ],
};

export default function DailyCollectionReport() {
  const data = dummyData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotal = (key: keyof CollectionData) => {
    return data.records.reduce((sum, record) => {
      const value = record[key];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[297mm] w-fit p-8 mx-auto text-xs whitespace-nowrap">
        <style jsx global>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>

        {/* Title */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-bold uppercase border-b-2 border-gray-400 pb-1 inline-block">
            Daily Collection Report
          </h1>
        </div>

        {/* Header Info */}
        <div className="mb-6 font-bold">
          <div className="flex mb-2">
            <span className="w-24">Location</span>
            <span className="w-16 text-center">{data.locationId}</span>
            <span>{data.locationName}</span>
          </div>
          <div className="flex">
            <span className="w-24">Date From</span>
            <span className="w-32 text-center">{data.dateFrom}</span>
            <span className="w-16 text-center">To</span>
            <span>{data.dateTo}</span>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="border-t-2 border-black border-b">
              <th className="py-2 px-1 text-left">Date</th>
              <th className="py-2 px-1 text-right">Net Amount</th>
              <th className="py-2 px-1 text-right">Cash Sale</th>
              <th className="py-2 px-1 text-right">Credit Sale</th>
              <th className="py-2 px-1 text-right">Master Card</th>
              <th className="py-2 px-1 text-right">Visa Card</th>
              <th className="py-2 px-1 text-right">Amex</th>
              <th className="py-2 px-1 text-right">Nexus</th>
              <th className="py-2 px-1 text-right">Credit</th>
              <th className="py-2 px-1 text-right">Gift Voucher</th>
              <th className="py-2 px-1 text-right">Star Point</th>
              <th className="py-2 px-1 text-right">Cheque</th>
              <th className="py-2 px-1 text-right uppercase">Points Redeem</th>
              <th className="py-2 px-1 text-right">Lusive Line Voucher</th>
              <th className="py-2 px-1 text-right">M Cash</th>
              <th className="py-2 px-1 text-right">Credit Note</th>
              <th className="py-2 px-1 text-right">Debit Card</th>
              <th className="py-2 px-1 text-right">Advance</th>
              <th className="py-2 px-1 text-right">Advance Redeem</th>
              <th className="py-2 px-1 text-right">GV Manual</th>
              <th className="py-2 px-1 text-right">Chartered Voucher</th>
              <th className="py-2 px-1 text-right">Redeem Voucher</th>
              <th className="py-2 px-1 text-right">Promotion Voucher</th>
              <th className="py-2 px-1 text-right">Frimi</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((record, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-1 px-1 text-left">{record.date}</td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.netAmount)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.cashSale)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.creditSale)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.masterCard)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.visaCard)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.amex)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.nexus)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.credit)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.giftVoucher)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.starPoint)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.cheque)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.pointsRedeem)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.lusiveLineVoucher)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.mCash)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.creditNote)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.debitCard)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.advance)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.advanceRedeem)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.gvManual)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.charteredVoucher)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.redeemVoucher)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.promotionVoucher)}
                </td>
                <td className="py-1 px-1 text-right">
                  {formatCurrency(record.frimi)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black border-b-4 border-double font-bold">
              <td className="py-2 px-1 text-left">Total</td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("netAmount"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("cashSale"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("creditSale"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("masterCard"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("visaCard"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("amex"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("nexus"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("credit"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("giftVoucher"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("starPoint"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("cheque"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("pointsRedeem"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("lusiveLineVoucher"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("mCash"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("creditNote"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("debitCard"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("advance"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("advanceRedeem"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("gvManual"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("charteredVoucher"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("redeemVoucher"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("promotionVoucher"))}
              </td>
              <td className="py-2 px-1 text-right">
                {formatCurrency(calculateTotal("frimi"))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
