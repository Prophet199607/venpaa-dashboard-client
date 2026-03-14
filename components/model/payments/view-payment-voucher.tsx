"use client";

import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";

interface ViewPaymentVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  docNo: string;
}

export default function ViewPaymentVoucher({
  isOpen,
  onClose,
  docNo,
}: ViewPaymentVoucherProps) {
  const { toast } = useToast();
  const [printLoading, setPrintLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!docNo) return;

      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/payment-vouchers/load-payment-by-code/${docNo}`
        );

        if (res.success) {
          setData(res.data);
        }
      } catch (error: any) {
        console.error("Failed to fetch payment voucher:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to load voucher details",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && docNo) {
      fetchPayment();
    }
  }, [isOpen, docNo, toast]);

  const handlePrint = async () => {
    if (!docNo) {
      toast({
        title: "Error",
        description: "No document number available for printing",
        type: "error",
      });
      return;
    }

    setPrintLoading(true);
    // Print functionality implementation later
    setTimeout(() => {
      setPrintLoading(false);
    }, 1000);
  };

  const formatThousandSeparator = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue as number)) return "0.00";
    return (numValue as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md hidden items-center justify-center border-none shadow-none bg-transparent">
          <DialogTitle hidden>Loading</DialogTitle>
          <Loader />
        </DialogContent>
      </Dialog>
    );
  }

  if (!data) return null;

  const { details = [], summaries = [], account } = data;
  const isSetOff = details.length > 0 && details[0]?.iid === "CSOF";

  // Compute total paid amount directly from details which represent allocations 
  // (Or if it's setoff, just sum up paid_amount)
  const totalAllocated = details.reduce((sum: number, d: any) => sum + parseFloat(d.paid_amount || 0), 0);

  // Summaries contain payment mode breakdown 
  // To avoid duplication since each summary row might duplicate amount based on allocation rows
  const uniqueSummaries = Array.from(new Map(summaries.map((s: any) => [s.payment_mode + s.amount, s])).values());
  const headerDate = details.length > 0 ? details[0].transaction_date : (summaries.length > 0 ? summaries[0].transaction_date : '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle hidden={isOpen}>Payment Voucher Details</DialogTitle>
        <DialogDescription hidden={isOpen}>
          Detailed view of a payment voucher.
        </DialogDescription>
        
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={handlePrint}
            disabled={printLoading}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {printLoading ? (
              <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            <span className="sr-only">Print</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="space-y-6 pt-4">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider">{isSetOff ? "Supplier Set-Off" : "Payment Voucher"}</h2>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold text-gray-800">Supplier:</span> {account?.sup_name || account?.customer_name || 'N/A'}</p>
                <p><span className="font-semibold text-gray-800">Account Code:</span> {account?.sup_code || account?.customer_code || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <p><span className="font-semibold text-gray-800">Doc No:</span> <span className="text-base font-bold bg-gray-100 px-2 py-0.5 rounded">{docNo}</span></p>
              <p><span className="font-semibold text-gray-800">Date:</span> {headerDate ? new Date(headerDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          {!isSetOff && uniqueSummaries.length > 0 && (
             <div>
               <h3 className="font-semibold text-sm mb-2 text-gray-700 bg-gray-50 p-2 rounded">Payment Breakdown</h3>
               <div className="overflow-x-auto rounded-lg border">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-muted text-xs uppercase text-muted-foreground">
                     <tr>
                       <th className="px-4 py-3 border-b border-r">Payment Mode</th>
                       <th className="px-4 py-3 border-b border-r">Bank Details</th>
                       <th className="px-4 py-3 border-b border-r">Cheque No/Date</th>
                       <th className="px-4 py-3 border-b text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody>
                     {uniqueSummaries.map((sum: any, idx: number) => (
                       <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                         <td className="px-4 py-2 border-r">{sum.payment_mode}</td>
                         <td className="px-4 py-2 border-r">{sum.bank_name || '-'} {sum.branch ? `(${sum.branch})` : ''}</td>
                         <td className="px-4 py-2 border-r">{sum.cheque_no || '-'} {sum.cheque_date ? `/ ${new Date(sum.cheque_date).toLocaleDateString()}` : ''}</td>
                         <td className="px-4 py-2 text-right font-medium">{formatThousandSeparator(sum.amount)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          <div>
             <h3 className="font-semibold text-sm mb-2 text-gray-700 bg-gray-50 p-2 rounded">Bill Allocations</h3>
             <div className="overflow-x-auto rounded-lg border">
               <table className="w-full text-sm text-left">
                 <thead className="bg-muted text-xs uppercase text-muted-foreground">
                   <tr>
                     <th className="px-4 py-3 border-b border-r">No</th>
                     <th className="px-4 py-3 border-b border-r">Bill No</th>
                     <th className="px-4 py-3 border-b border-r">Date</th>
                     <th className="px-4 py-3 border-b border-r text-right">Bill Amount</th>
                     <th className="px-4 py-3 border-b text-right">Paid Amount</th>
                   </tr>
                 </thead>
                 <tbody>
                   {details.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                         No bill allocations for this voucher
                       </td>
                     </tr>
                   ) : (
                     details.map((item: any, index: number) => (
                       <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                         <td className="px-4 py-2 border-r">{index + 1}</td>
                         <td className="px-4 py-2 border-r font-medium text-blue-600">{item.doc_no}</td>
                         <td className="px-4 py-2 border-r text-gray-600">{new Date(item.document_date).toLocaleDateString()}</td>
                         <td className="px-4 py-2 text-right border-r">{formatThousandSeparator(item.transaction_amount)}</td>
                         <td className="px-4 py-2 text-right font-medium text-green-600">{formatThousandSeparator(item.paid_amount)}</td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <div className="w-64 space-y-3">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-700">Total Allocated:</span>
                <span className="font-bold text-lg text-emerald-600">{formatThousandSeparator(totalAllocated)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
