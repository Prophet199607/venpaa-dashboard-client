"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { X, Printer } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { openPrintWindow } from "@/utils/print-utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Product {
  prod_code: string;
  prod_name: string;
  purchase_price: number;
  pack_qty: number;
  unit_qty: number;
  total_qty: number;
  unit?: {
    unit_type: "WHOLE" | "DEC" | null;
  };
  amount: number;
}

interface ViewProductDiscardProps {
  isOpen: boolean;
  onClose: () => void;
  docNo: string;
  status: string;
  iid?: string;
}

export default function ViewProductDiscard({
  isOpen,
  onClose,
  docNo,
  status,
  iid,
}: ViewProductDiscardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    const fetchProductDiscard = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`,
        );

        if (res.success) {
          const pdData = res.data;

          const productDetails =
            pdData.temp_transaction_details || pdData.transaction_details || [];

          const productsWithUnits = productDetails.map((product: any) => ({
            ...product,
            unit_name: product.product?.unit_name || product.unit_name,
            unit: {
              unit_type:
                product.product?.unit?.unit_type ||
                product.unit?.unit_type ||
                null,
            },
          }));

          const updatedData = {
            ...pdData,
            ...(pdData.temp_transaction_details
              ? { temp_transaction_details: productsWithUnits }
              : {}),
            ...(pdData.transaction_details
              ? { transaction_details: productsWithUnits }
              : {}),
          };
          setData(updatedData);
        }
      } catch (error: any) {
        console.error("Failed to fetch product discard:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to load product discard",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && docNo) {
      fetchProductDiscard();
    }
  }, [isOpen, docNo, status, iid, toast]);

  const handlePrint = async () => {
    toast({
      title: "Coming Soon",
      description: "Printing for Product Discard is not yet implemented.",
      type: "info",
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <Loader />
      </Dialog>
    );
  }

  if (!data) return null;

  const details =
    status === "applied"
      ? data.transaction_details || []
      : data.temp_transaction_details || [];

  const formatThousandSeparator = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue as number)) return "0.00";
    return (numValue as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogTitle hidden={isOpen}>Product Discard Details</DialogTitle>
        <DialogDescription hidden={isOpen}>
          Detailed view of a product discard, including products and summary.
        </DialogDescription>
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={handlePrint}
            disabled={printLoading}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            {printLoading ? <Loader /> : <Printer className="h-4 w-4" />}
            <span className="sr-only">Print</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="space-y-6 py-4 mt-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold">PRODUCT DISCARD NOTE</h2>
              <p className="text-sm">
                Location: {data.location?.loca_name || data.location}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Doc No: {data.doc_no}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="font-semibold">
              <p>
                Post Date:{" "}
                <span className="font-normal">
                  {" "}
                  {data.document_date
                    ? new Date(data.document_date).toLocaleDateString()
                    : "N/A"}
                </span>
              </p>
              <p>
                Discard Type:{" "}
                <span className="font-normal">
                  {" "}
                  {data.remarks_ref || "N/A"}
                </span>
              </p>
            </div>
          </div>

          {/* Products Table */}
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase">
                <tr>
                  <th className="px-4 py-2">No</th>
                  <th className="px-4 py-2">Product Code</th>
                  <th className="px-4 py-2">Product Name</th>
                  <th className="px-4 py-2 text-right">Purchase Price</th>
                  <th className="px-4 py-2 text-center">Pack Qty</th>
                  <th className="px-4 py-2 text-center">Unit Qty</th>
                </tr>
              </thead>
              <tbody>
                {details.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{item.prod_code}</td>
                    <td className="px-4 py-2">{item.prod_name}</td>
                    <td className="px-4 py-2 text-right">
                      {formatThousandSeparator(item.purchase_price)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {item.unit?.unit_type === "WHOLE"
                        ? Math.floor(Number(item.pack_qty))
                        : Number(item.pack_qty).toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {item.unit?.unit_type === "WHOLE"
                        ? Math.floor(Number(item.unit_qty))
                        : Number(item.unit_qty).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
