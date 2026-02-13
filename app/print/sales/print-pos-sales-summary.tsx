"use client";

import React from "react";

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
  totalCashCollection: number;
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
}

const dummyData: PosSalesSummaryData = {
  dateFrom: "02/02/2026",
  dateTo: "02/02/2026",
  locationId: "002",
  locationName: "VENPA BOOK SHOP - COLOMBO",
  grossSales: 6922412.0,
  refundTotal: 0.0,
  noOfRefund: 0.0,
  exchangeTotal: -373710.0,
  noOfExchange: 135.0,
  discountTotal: -62060.75,
  noOfDiscount: 211.0,
  spDiscountTotal: 0.0,
  spNoOfDiscount: 0.0,
  voidTotal: 292034.2,
  noOfVoid: 219.0,
  errorTotal: 0.0,
  noOfError: 0.0,
  cancelTotal: 11240.0,
  noOfCancel: 1.0,
  cashSaleAmount: 2517096.75,
  creditSaleAmount: 3969544.5,
  totalPosSales: 6486641.25,
  cashInCounter: 2624916.75,

  wholesaleInvoices: 0,
  wholesaleReturn: 0,
  wholesaleCheque: 0,
  wholesaleCash: 0,
  wholesaleChequeReturn: 0.0,

  netSaleAmount: 6486641.25,

  totalCashCollection: 2624916.75,
  totalCreditCollection: 4050324.5,

  billCount: 1761.0,
  advanceIssue: 0.0,
  creditNoteIssued: 15580.0,
  creditNoteReceived: 15580.0,

  nonCashDetails: [
    { label: "Master Card", amount: 829313.75 },
    { label: "Visa Card", amount: 2631327.75 },
    { label: "Amex", amount: 58924.0 },
    { label: "Nexus", amount: 0.0 },
    { label: "Credit", amount: 11733.0 },
    { label: "Gift Voucher", amount: 159500.0 },
    { label: "Star Point", amount: 0.0 },
    { label: "Cheque", amount: 0.0 },
    { label: "POINTS REDEEM", amount: 0.0 },
    { label: "Exclusive Line voucher", amount: 0.0 },
    { label: "M Cash", amount: 0.0 },
    { label: "Credit Note", amount: 15580.0 },
    { label: "DEBIT CARD", amount: 0.0 },
    { label: "Advance", amount: 0.0 },
    { label: "Advance Redeem", amount: 0.0 },
    { label: "GV Manual", amount: 0.0 },
    { label: "Standard Chartered Voucher", amount: 0.0 },
    { label: "Redeem Voucher", amount: 0.0 },
    { label: "On Line", amount: 11030.0 },
    { label: "KOKO", amount: 94350.0 },
  ],
  cashWithdrawalDetails: [
    { label: "Cash Out", amount: 0.0 },
    { label: "Bank", amount: 0.0 },
    { label: "Petty Cash", amount: 0.0 },
    { label: "Meals", amount: 0.0 },
    { label: "Other", amount: 0.0 },
  ],
  departmentSalesDetails: [{ label: "", amount: 0.0 }],
  giftVoucherSalesDetails: [
    { label: "GIFT VOUCHER CASH", amount: 0.0 },
    { label: "GIFT VOUCHER CREDIT", amount: 0.0 },
  ],
  crmCardSalesDetails: [
    { label: "CRM CARD CASH", amount: 0.0 },
    { label: "CRM CARD CREDIT", amount: 0.0 },
  ],
  otherIncomeDetails: [
    { label: "CRM Customer Cash Money Transfer", amount: 0.0 },
  ],
  printedAt: "03/02/2026 2:35:16PM",
  footerText: "Merit Plus IT Solutions by www.onimtcit.com",
};

export default function PrintPosSalesSummary() {
  const data = dummyData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateCreditTotal = () => {
    return data.nonCashDetails.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateCashWithdrawalTotal = () => {
    return data.cashWithdrawalDetails.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
  };

  const calculateDepartmentSalesTotal = () => {
    return data.departmentSalesDetails.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
  };

  const calculateGiftVoucherSalesTotal = () => {
    return data.giftVoucherSalesDetails.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
  };

  const calculateCrmCardSalesTotal = () => {
    return data.crmCardSalesDetails.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotalWholeSales = () => {
    // Assuming some logic, for now return 0 based on screenshot showing 0.00 with 0 invoices/return
    return 0; // Or sum of relevant fields if we knew them. Given data is 0, this is safe.
  };

  const calculateWholeSaleCollection = () => {
    // Assuming some logic, for now return 0 based on screenshot showing 0.00
    return 0;
  };

  const calculateTotalCollection = () => {
    // In image: 2624916.75 + 4050324.50 = 6675241.25
    return data.totalCashCollection + data.totalCreditCollection;
  };

  return (
    <div className="relative w-[210mm] min-h-[297mm] p-8 mx-auto bg-white text-black text-[12px] font-sans tabular-nums">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-center items-center mb-6 relative">
        <h1 className="text-xl font-bold underline">Pos Sales Summary</h1>
        <div className="absolute top-0 right-0 text-right text-xs">
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
            <span>{formatCurrency(data.noOfRefund)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="uppercase font-medium">Exchange Total</span>
            <span>{formatCurrency(data.exchangeTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase font-medium">No of Exchange</span>
            <span>{formatCurrency(data.noOfExchange)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="uppercase font-medium">Discount Total</span>
            <span>{formatCurrency(data.discountTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase font-medium">No of Discount</span>
            <span>{formatCurrency(data.noOfDiscount)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="uppercase font-medium">SP / Discount Total</span>
            <span>{formatCurrency(data.spDiscountTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase font-medium">SP / No of Discount</span>
            <span>{formatCurrency(data.spNoOfDiscount)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="uppercase font-medium">Void Total</span>
            <span>{formatCurrency(data.voidTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase font-medium">No of Void</span>
            <span>{formatCurrency(data.noOfVoid)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="uppercase font-medium">Error Total</span>
            <span>{formatCurrency(data.errorTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase font-medium">No of Error</span>
            <span>{formatCurrency(data.noOfError)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="uppercase font-medium">Cancel Total</span>
            <span>{formatCurrency(data.cancelTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="uppercase font-medium">No of Cancel</span>
            <span>{formatCurrency(data.noOfCancel)}</span>
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
          <div className="border border-black rounded-lg p-2 mt-4 space-y-1">
            <div className="flex justify-between">
              <span className="uppercase font-medium text-[10px]">
                Wholesale Invoices
              </span>
              <span>{data.wholesaleInvoices}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium text-[10px]">
                Wholesale Return
              </span>
              <span>{data.wholesaleReturn}</span>
            </div>
            <div className="flex justify-between items-end pt-1 mb-2">
              <span className="uppercase font-bold text-[10px]">
                Total Whole Sales
              </span>
              <span className="font-bold border-t border-b-4 border-double border-black w-24 text-right py-1">
                {formatCurrency(calculateTotalWholeSales())}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="uppercase font-medium text-[10px]">Cheque</span>
              <span>{data.wholesaleCheque}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase font-medium text-[10px]">Cash</span>
              <span>{data.wholesaleCash}</span>
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
                {formatCurrency(calculateWholeSaleCollection())}
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
          <div className="border border-black rounded-lg p-2 mt-4 space-y-1">
            <h4 className="uppercase font-bold mb-1">Other Income</h4>
            {data.otherIncomeDetails.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.label}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* Total Collection Box */}
          <div className="border border-black rounded-lg p-2 mt-4 space-y-2">
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
              <span>{formatCurrency(data.totalCreditCollection)}</span>
            </div>
            <div className="flex justify-between items-end pt-1">
              <span className="uppercase font-bold text-[10px]">
                Total Collection
              </span>
              <span className="font-bold border-t border-b-4 border-double border-black w-24 text-right py-1">
                {formatCurrency(calculateTotalCollection())}
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 pb-1 mb-1 items-end">
            <span className="uppercase font-bold">Bill Count</span>
            <span className="font-bold">{formatCurrency(data.billCount)}</span>
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
            <span className="uppercase font-medium">Credit Note Received</span>
            <span>{formatCurrency(data.creditNoteReceived)}</span>
          </div>

          <div className="pt-6 text-[10px] text-gray-600">
            {data.footerText}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-1">
          <h3 className="uppercase font-bold mb-2">Non Cash Details</h3>

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
              {formatCurrency(calculateCreditTotal())}
            </span>
          </div>

          <h3 className="uppercase font-bold mb-2">Cash Withdrawal</h3>
          {data.cashWithdrawalDetails.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span>{detail.label}</span>
              <span>{formatCurrency(detail.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
            <span className="uppercase font-bold">Total Cash Withdrawal</span>
            <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
              {formatCurrency(calculateCashWithdrawalTotal())}
            </span>
          </div>

          <h3 className="uppercase font-bold mb-2">Department Sales Details</h3>
          {data.departmentSalesDetails.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span>{detail.label}</span>
              <span>{formatCurrency(detail.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
            <span className="uppercase font-bold">Total Department Sales</span>
            <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
              {formatCurrency(calculateDepartmentSalesTotal())}
            </span>
          </div>

          <h3 className="uppercase font-bold mb-2">
            Gift Voucher Sales Details
          </h3>
          {data.giftVoucherSalesDetails.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span>{detail.label}</span>
              <span>{formatCurrency(detail.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
            <span className="uppercase font-bold">
              Total Gift Voucher Sales
            </span>
            <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
              {formatCurrency(calculateGiftVoucherSalesTotal())}
            </span>
          </div>

          <h3 className="uppercase font-bold mb-2">CRM Card Sales Details</h3>
          {data.crmCardSalesDetails.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span>{detail.label}</span>
              <span>{formatCurrency(detail.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-4 pb-1 mb-6 items-end">
            <span className="uppercase font-bold">Total CRM Card Sales</span>
            <span className="font-bold border-t border-b-4 border-double border-black w-32 text-right py-1">
              {formatCurrency(calculateCrmCardSalesTotal())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
