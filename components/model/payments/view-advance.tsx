"use client";

import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePermissions } from "@/context/permissions";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";

interface ViewAdvanceProps {
  isOpen: boolean;
  onClose: () => void;
  docNo: string;
}

export default function ViewAdvance({
  isOpen,
  onClose,
  docNo,
}: ViewAdvanceProps) {
  const { toast } = useToast();
  const [printLoading, setPrintLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    const fetchAdvance = async () => {
      if (!docNo) return;

      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/transactions/load-advance-by-code/${docNo}`
        );

        if (res.success) {
          setData(res.data);
        }
      } catch (error: any) {
        console.error("Failed to fetch advance details:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to load advance details",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && docNo) {
      fetchAdvance();
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

  const { advance, account } = data;
  const isSupplier = advance?.acc_type === "supplier";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle hidden={isOpen}>Advance Payment Details</DialogTitle>
        <DialogDescription hidden={isOpen}>
          Detailed view of an advance payment.
        </DialogDescription>
        
        <div className="absolute right-4 top-4 flex gap-2">
          {!permissionsLoading && hasPermission("print advance-payment") && (
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
          )}
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
              <h2 className="text-xl font-bold uppercase tracking-wider">
                {isSupplier ? "Supplier Advance" : "Customer Advance"}
              </h2>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-semibold text-gray-800">
                    {isSupplier ? "Supplier:" : "Customer:"}
                  </span>{" "}
                  {account?.sup_name || account?.customer_name || 'N/A'}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Account Code:</span>{" "}
                  {account?.sup_code || account?.customer_code || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <p>
                <span className="font-semibold text-gray-800">Doc No:</span>{" "}
                <span className="text-base font-bold bg-gray-100 px-2 py-0.5 rounded">
                  {advance?.doc_no}
                </span>
              </p>
              <p>
                <span className="font-semibold text-gray-800">Date:</span>{" "}
                {advance?.document_date
                  ? new Date(advance.document_date).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <span className="block text-sm font-semibold text-gray-500 mb-1">Advance Amount</span>
               <span className="text-2xl font-bold text-gray-800">{formatThousandSeparator(advance?.transaction_amount || 0)}</span>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <span className="block text-sm font-semibold text-gray-500 mb-1">Balance Available</span>
               <span className="text-2xl font-bold text-emerald-600">{formatThousandSeparator(advance?.balance_amount || 0)}</span>
             </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
