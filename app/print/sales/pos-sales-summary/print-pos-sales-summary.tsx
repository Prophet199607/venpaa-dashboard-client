"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface NonCashDetail {
  label: string;
  amount: number;
}

interface CashWithdrawalDetail {
  label: string;
  amount: number;
}

interface DepartmentSalesDetail {
  label: string;
  amount: number;
}

interface GiftVoucherSalesDetail {
  label: string;
  amount: number;
}

interface CrmCardSalesDetail {
  label: string;
  amount: number;
}

interface OtherIncomeDetail {
  label: string;
  amount: number;
}

interface PosSalesSummaryData {
  dateFrom: string;
  dateTo: string;
  locationId: string;
  locationName: string;
  grossSales: number;
  refundTotal: number;
  noOfRefund: number;
  exchangeTotal: number;
  noOfExchange: number;
  discountTotal: number;
  noOfDiscount: number;
  spDiscountTotal: number;
  spNoOfDiscount: number;
  voidTotal: number;
  noOfVoid: number;
  errorTotal: number;
  noOfError: number;
  cancelTotal: number;
  noOfCancel: number;
  cashSaleAmount: number;
  creditSaleAmount: number;
  totalPosSales: number;
  cashInCounter: number;
  // Wholesale
  wholesaleInvoices: number;
  wholesaleReturn: number;
  wholesaleCheque: number;
  wholesaleCash: number;
  wholesaleChequeReturn: number;

  netSaleAmount: number;

  // Collections
  totalCashCollection: number; // In counter? Or something else?
  totalCreditCollection: number;

  billCount: number;
  advanceIssue: number;
  creditNoteIssued: number;
  creditNoteReceived: number;

  nonCashDetails: NonCashDetail[];
  cashWithdrawalDetails: CashWithdrawalDetail[];
  departmentSalesDetails: DepartmentSalesDetail[];
  giftVoucherSalesDetails: GiftVoucherSalesDetail[];
  crmCardSalesDetails: CrmCardSalesDetail[];
  otherIncomeDetails: OtherIncomeDetail[];
  printedAt: string;
  footerText: string;
  changeMoneyTransfer: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (amount: number) => {
  return currencyFormatter.format(amount || 0);
};

export default function PrintPosSalesSummary() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  const [data, setData] = useState<PosSalesSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!location || !dateFromParam || !dateToParam) {
        setError("Missing required parameters");
        setLoading(false);
        return;
      }

      try {
        const { data: res } = await api.get(
          `/reports/pos-sales-summary-report?location=${location}&dateFrom=${dateFromParam}&dateTo=${dateToParam}`,
        );

        if (res.success && res.data.length > 0) {
          const aggregated = res.data.reduce((acc: any, row: any) => {
            const sumFields = [
              "PosGross_Sales",
              "PosRefund_Tot",
              "PosRefund_No",
              "PosVoid_Tot",
              "PosVoid_No",
              "PosError_Tot",
              "PosError_No",
              "PosCancel_Tot",
              "PosCancel_No",
              "PosNet_Amt",
              "PosCash_Amt",
              "PosCredit_Amt",
              "PosBill_Count",
              "PosExchange_Tot",
              "PosExchange_No",
              "PosDiscount_Tot",
              "PosDiscount_No",
              "Pos_CashOut",
              "GvCash",
              "GvCr",
              "CRNIssued",
              "CRNReceived",
              "ChangeMoneyTransfer",
              "CRMCash",
              "CRMCr",
              "Inv",
              "InvCash",
              "InvChq",
              "Cur",
              "RntChq",
              "AdvanceIssue",
            ];

            sumFields.forEach((field) => {
              acc[field] = (acc[field] || 0) + Number(row[field] || 0);
            });

            for (let i = 1; i <= 20; i++) {
              acc[`Card${i}_Amount`] =
                (acc[`Card${i}_Amount`] || 0) +
                Number(row[`Card${i}_Amount`] || 0);
              if (!acc[`Card${i}_Descr`])
                acc[`Card${i}_Descr`] = row[`Card${i}_Descr`];
            }

            for (let i = 1; i <= 5; i++) {
              acc[`Dept${i}_Amount`] =
                (acc[`Dept${i}_Amount`] || 0) +
                Number(row[`Dept${i}_Amount`] || 0);
              if (!acc[`Dept${i}_Descr`])
                acc[`Dept${i}_Descr`] = row[`Dept${i}_Descr`];
              acc[`CashOut${i}`] =
                (acc[`CashOut${i}`] || 0) + Number(row[`CashOut${i}`] || 0);
              if (!acc[`CashOutDesc${i}`])
                acc[`CashOutDesc${i}`] = row[`CashOutDesc${i}`];
            }

            acc.locationName = row.Loca_Descrip || row.Loca;
            acc.dateFromExport = row.DateFrom;
            acc.dateToExport = row.DateTo;

            return acc;
          }, {});

          const cardDefaults = [
            "Master Card",
            "Visa Card",
            "Amex",
            "Nexus",
            "Credit",
            "Gift Voucher",
            "Star Point",
            "Cheque",
            "POINTS REDEEM",
            "Exclusive Line voucher",
            "M Cash",
            "Credit Note",
            "DEBIT CARD",
            "Advance",
            "Advance Redeem",
            "GV Manual",
            "Standard Chartered Voucher",
            "Redeem Voucher",
            "On Line",
            "KOKO",
          ];
          const nonCashDetails: NonCashDetail[] = [];
          for (let i = 1; i <= 20; i++) {
            nonCashDetails.push({
              label: aggregated[`Card${i}_Descr`] || cardDefaults[i - 1],
              amount: aggregated[`Card${i}_Amount`] || 0,
            });
          }

          const cashOutDefaults = [
            "Cash Out",
            "Bank",
            "Petty Cash",
            "Meals",
            "Other",
          ];
          const cashWithdrawalDetails: CashWithdrawalDetail[] = [];
          for (let i = 1; i <= 5; i++) {
            cashWithdrawalDetails.push({
              label: aggregated[`CashOutDesc${i}`] || cashOutDefaults[i - 1],
              amount: aggregated[`CashOut${i}`] || 0,
            });
          }

          const departmentSalesDetails: DepartmentSalesDetail[] = [];
          for (let i = 1; i <= 5; i++) {
            departmentSalesDetails.push({
              label: aggregated[`Dept${i}_Descr`] || "",
              amount: aggregated[`Dept${i}_Amount`] || 0,
            });
          }

          setData({
            dateFrom: aggregated.dateFromExport,
            dateTo: aggregated.dateToExport,
            locationId: location,
            locationName: aggregated.locationName,
            grossSales: aggregated.PosGross_Sales,
            refundTotal: aggregated.PosRefund_Tot,
            noOfRefund: aggregated.PosRefund_No,
            exchangeTotal: aggregated.PosExchange_Tot,
            noOfExchange: aggregated.PosExchange_No,
            discountTotal: aggregated.PosDiscount_Tot,
            noOfDiscount: aggregated.PosDiscount_No,
            spDiscountTotal: 0,
            spNoOfDiscount: 0,
            voidTotal: aggregated.PosVoid_Tot,
            noOfVoid: aggregated.PosVoid_No,
            errorTotal: aggregated.PosError_Tot,
            noOfError: aggregated.PosError_No,
            cancelTotal: aggregated.PosCancel_Tot,
            noOfCancel: aggregated.PosCancel_No,
            cashSaleAmount: aggregated.PosCash_Amt,
            creditSaleAmount: aggregated.PosCredit_Amt,
            totalPosSales: aggregated.PosGross_Sales,
            cashInCounter: aggregated.PosCash_Amt,
            wholesaleInvoices: aggregated.Inv,
            wholesaleReturn: aggregated.RntChq,
            wholesaleCheque: aggregated.InvChq,
            wholesaleCash: aggregated.InvCash,
            wholesaleChequeReturn: 0,
            netSaleAmount: aggregated.PosNet_Amt,
            totalCashCollection: aggregated.PosCash_Amt,
            totalCreditCollection: aggregated.PosCredit_Amt,
            billCount: aggregated.PosBill_Count,
            advanceIssue: aggregated.AdvanceIssue,
            creditNoteIssued: aggregated.CRNIssued,
            creditNoteReceived: aggregated.CRNReceived,
            nonCashDetails,
            cashWithdrawalDetails,
            departmentSalesDetails,
            giftVoucherSalesDetails: [
              { label: "GIFT VOUCHER CASH", amount: aggregated.GvCash || 0 },
              { label: "GIFT VOUCHER CREDIT", amount: aggregated.GvCr || 0 },
            ],
            crmCardSalesDetails: [
              { label: "CRM CARD CASH", amount: aggregated.CRMCash || 0 },
              { label: "CRM CARD CREDIT", amount: aggregated.CRMCr || 0 },
            ],
            otherIncomeDetails: [
              {
                label: "CRM Customer Cash Money Transfer",
                amount: aggregated.ChangeMoneyTransfer || 0,
              },
            ],
            changeMoneyTransfer: aggregated.ChangeMoneyTransfer,
            printedAt:
              new Date().toLocaleDateString() +
              " " +
              new Date().toLocaleTimeString(),
            footerText: "Venpa Back-Office System",
          });
        } else {
          setError("No data found for the selected criteria.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch report data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location, dateFromParam, dateToParam]);

  // Memoized totals to prevent re-calculating on every render
  const totals = useMemo(() => {
    if (!data) return null;
    const creditTotal = data.nonCashDetails.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    return {
      credit: creditTotal,
      withdrawal: data.cashWithdrawalDetails.reduce(
        (sum, item) => sum + item.amount,
        0,
      ),
      dept: data.departmentSalesDetails.reduce(
        (sum, item) => sum + item.amount,
        0,
      ),
      gift: data.giftVoucherSalesDetails.reduce(
        (sum, item) => sum + item.amount,
        0,
      ),
      crm: data.crmCardSalesDetails.reduce((sum, item) => sum + item.amount, 0),
      wholesale: data.wholesaleInvoices - data.wholesaleReturn,
      wholesaleCollection: data.wholesaleCash + data.wholesaleCheque,
      totalCollection: data.totalCashCollection + creditTotal,
    };
  }, [data]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  if (error)
    return <div className="p-8 text-destructive text-center">{error}</div>;
  if (!data || !totals) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 print:p-0 print:bg-white">
      <div className="relative w-[210mm] min-h-[297mm] p-10 mx-auto bg-white text-black text-[12px] font-sans tabular-nums border shadow-xl print:shadow-none print:border-none print:my-0 pb-16 mt-4">
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              background: white !important;
            }
            .shadow-xl,
            .shadow-lg,
            .border,
            .my-8 {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="flex justify-center items-center mb-8 relative">
          <h1 className="text-xl font-bold underline uppercase">
            Pos Sales Summary
          </h1>
          <div className="absolute top-0 right-0 text-right text-[10px]">
            <span>{data.printedAt}</span>
          </div>
        </div>

        {/* Date and Location Info */}
        <div className="mb-8 text-xs font-bold uppercase space-y-2">
          <div className="flex items-center">
            <span className="w-24">Date From</span>
            <span className="w-32">{data.dateFrom}</span>
            <span className="w-10">To</span>
            <span>{data.dateTo}</span>
          </div>
          <div className="flex items-center">
            <span className="w-24">Location</span>
            <span className="w-10 mr-2">{data.locationId}</span>
            <span>{data.locationName}</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-16">
          {/* Left Column */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="uppercase font-medium">Gross Sales</span>
              <span>{formatCurrency(data.grossSales)}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Refund Total</span>
              <span>{formatCurrency(data.refundTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">No of Refund</span>
              <span>{data.noOfRefund}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Exchange Total</span>
              <span>{formatCurrency(data.exchangeTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">No of Exchange</span>
              <span>{data.noOfExchange}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Discount Total</span>
              <span>{formatCurrency(data.discountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">No of Discount</span>
              <span>{data.noOfDiscount}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">SP / Discount Total</span>
              <span>{formatCurrency(data.spDiscountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">SP / No of Discount</span>
              <span>{data.spNoOfDiscount}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Void Total</span>
              <span>{formatCurrency(data.voidTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">No of Void</span>
              <span>{data.noOfVoid}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Error Total</span>
              <span>{formatCurrency(data.errorTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">No of Error</span>
              <span>{data.noOfError}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Cancel Total</span>
              <span>{formatCurrency(data.cancelTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">No of Cancel</span>
              <span>{data.noOfCancel}</span>
            </div>

            <div className="flex justify-between pt-4">
              <span className="uppercase font-medium">Cash Sale Amount</span>
              <span>{formatCurrency(data.cashSaleAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium">Credit Sale Amount</span>
              <span>{formatCurrency(data.creditSaleAmount)}</span>
            </div>

            <div className="flex justify-between pt-4 pb-1 mb-1 items-end">
              <span className="uppercase font-bold">Total Pos Sales</span>
              <span className="font-bold border-t border-b border-black w-32 text-right py-1">
                {formatCurrency(data.totalPosSales)}
              </span>
            </div>

            <div className="flex justify-between pt-2 pb-1 items-end">
              <span className="uppercase font-bold">Cash In Counter</span>
              <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
                {formatCurrency(data.cashInCounter)}
              </span>
            </div>

            {/* Wholesale Section */}
            <div className="border border-black rounded-lg p-3 mt-4 space-y-1">
              <h4 className="uppercase font-bold mb-1 text-[10px]">
                Wholesale Summary
              </h4>
              <div className="flex justify-between">
                <span className="uppercase font-medium text-[10px]">
                  Wholesale Invoices
                </span>
                <span>{formatCurrency(data.wholesaleInvoices)}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase font-medium text-[10px]">
                  Wholesale Return
                </span>
                <span>{formatCurrency(data.wholesaleReturn)}</span>
              </div>
              <div className="flex justify-between items-end pt-1 mb-2">
                <span className="uppercase font-bold text-[10px]">
                  Total Whole Sales
                </span>
                <span className="font-bold border-t border-b-4 border-double border-black w-24 text-right py-1">
                  {formatCurrency(totals.wholesale)}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="uppercase font-medium text-[10px]">
                  Cheque
                </span>
                <span>{formatCurrency(data.wholesaleCheque)}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase font-medium text-[10px]">Cash</span>
                <span>{formatCurrency(data.wholesaleCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase font-medium text-[10px]">
                  Cheque Return
                </span>
                <span>{formatCurrency(data.wholesaleChequeReturn)}</span>
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="uppercase font-bold text-[10px]">
                  Whole Sale Collection
                </span>
                <span className="font-bold border-t border-b-4 border-double border-black w-24 text-right py-1">
                  {formatCurrency(totals.wholesaleCollection)}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-4 pb-1 mb-1 items-end">
              <span className="uppercase font-bold">Net Sale Amount</span>
              <span className="font-bold">
                {formatCurrency(data.netSaleAmount)}
              </span>
            </div>

            {/* Other Income Box */}
            <div className="border border-black rounded-lg p-3 mt-4 space-y-1">
              <h4 className="uppercase font-bold mb-1 text-[10px]">
                Other Income
              </h4>
              {data.otherIncomeDetails.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-[10px]">{item.label}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>

            {/* Total Collection Box */}
            <div className="border border-black rounded-lg p-3 mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="uppercase font-bold text-[10px]">
                  Total Cash Collection
                </span>
                <span>{formatCurrency(data.totalCashCollection)}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase font-bold text-[10px]">
                  Total Credit Collection
                </span>
                <span>{formatCurrency(totals.credit)}</span>
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="uppercase font-bold text-[10px]">
                  Total Collection
                </span>
                <span className="font-bold border-t border-b-4 border-double border-black w-24 text-right py-1 text-[13px]">
                  {formatCurrency(totals.totalCollection)}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-4 pb-1 mb-1 items-end">
              <span className="uppercase font-bold">Bill Count</span>
              <span className="font-bold">{data.billCount}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Advance Issue</span>
              <span>{formatCurrency(data.advanceIssue)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">Credit Note Issued</span>
              <span>{formatCurrency(data.creditNoteIssued)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium">
                Credit Note Received
              </span>
              <span>{formatCurrency(data.creditNoteReceived)}</span>
            </div>

            <div className="pt-8 text-[9px] text-gray-500 italic uppercase">
              {data.footerText}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-1">
            <h3 className="uppercase font-bold mb-2 border-b border-black">
              Non Cash Details
            </h3>

            <div className="space-y-1">
              {data.nonCashDetails.map((detail, index) => (
                <div key={index} className="flex justify-between">
                  <span>{detail.label}</span>
                  <span>{formatCurrency(detail.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
              <span className="uppercase font-bold">Credit Total</span>
              <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
                {formatCurrency(totals.credit)}
              </span>
            </div>

            <h3 className="uppercase font-bold mb-2 border-b border-black">
              Cash Withdrawal
            </h3>
            <div className="space-y-1">
              {data.cashWithdrawalDetails.map((detail, index) => (
                <div key={index} className="flex justify-between">
                  <span>{detail.label}</span>
                  <span>{formatCurrency(detail.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
              <span className="uppercase font-bold">Total Cash Withdrawal</span>
              <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
                {formatCurrency(totals.withdrawal)}
              </span>
            </div>

            <h3 className="uppercase font-bold mb-2 border-b border-black">
              Department Sales Details
            </h3>
            <div className="space-y-1">
              {data.departmentSalesDetails.map((detail, index) => (
                <div key={index} className="flex justify-between">
                  <span>{detail.label}</span>
                  <span>{formatCurrency(detail.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
              <span className="uppercase font-bold text-[10px]">
                Total Department Sales
              </span>
              <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
                {formatCurrency(totals.dept)}
              </span>
            </div>

            <h3 className="uppercase font-bold mb-2 border-b border-black">
              Gift Voucher Sales
            </h3>
            <div className="space-y-1">
              {data.giftVoucherSalesDetails.map((detail, index) => (
                <div key={index} className="flex justify-between text-[10px]">
                  <span>{detail.label}</span>
                  <span>{formatCurrency(detail.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
              <span className="uppercase font-bold text-[10px]">
                Total Gift Voucher Sales
              </span>
              <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
                {formatCurrency(totals.gift)}
              </span>
            </div>

            <h3 className="uppercase font-bold mb-2 border-b border-black text-[10px]">
              CRM Card Sales
            </h3>
            <div className="space-y-1">
              {data.crmCardSalesDetails.map((detail, index) => (
                <div key={index} className="flex justify-between text-[10px]">
                  <span>{detail.label}</span>
                  <span>{formatCurrency(detail.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
              <span className="uppercase font-bold text-[10px]">
                Total CRM Card Sales
              </span>
              <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
                {formatCurrency(totals.crm)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Page numbering */}
        <div className="absolute bottom-10 right-10 text-[12px]">
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
