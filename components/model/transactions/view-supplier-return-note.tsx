"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { X, Printer } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { openPrintWindow } from "@/utils/print-utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PrintSupplierReturnNoteContent from "@/app/print/transactions/print-supplier-return-note";

interface Product {
  prod_code: string;
  prod_name: string;
  purchase_price: number;
  pack_qty: number;
  unit_qty: number;
  free_qty: number;
  total_qty: number;
  line_wise_discount_value: number;
  unit?: {
    unit_type: "WHOLE" | "DEC" | null;
  };
  amount: number;
}

interface ViewSupplierReturnNoteProps {
  isOpen: boolean;
  onClose: () => void;
  docNo: string;
  status: string;
  iid?: string;
}

export default function ViewSupplierReturnNote({
  isOpen,
  onClose,
  docNo,
  status,
  iid,
}: ViewSupplierReturnNoteProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [printLoading, setPrintLoading] = useState(false);

  const shouldShowGrnAmount =
    !!data &&
    data.recall_doc_no !== undefined &&
    data.recall_doc_no !== "Without Grn";

  useEffect(() => {
    const fetchSupplierReturnNote = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`
        );

        if (res.success) {
          const grnData = res.data;

          const productDetails =
            grnData.temp_transaction_details ||
            grnData.transaction_details ||
            [];

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
            ...grnData,
            ...(grnData.temp_transaction_details
              ? { temp_transaction_details: productsWithUnits }
              : {}),
            ...(grnData.transaction_details
              ? { transaction_details: productsWithUnits }
              : {}),
          };
          setData(updatedData);
        }
      } catch (error: any) {
        console.error("Failed to fetch supplier return note:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            "Failed to load supplier return note",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && docNo) {
      fetchSupplierReturnNote();
    }
  }, [isOpen, docNo, status, iid, toast]);

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

    try {
      const printComponent = (
        <PrintSupplierReturnNoteContent
          docNo={docNo}
          status={status}
          initialData={data}
          onLoad={() => {
            console.log("Print content loaded");
          }}
        />
      );

      const printWindow = openPrintWindow(printComponent, {
        autoPrint: true,
        autoClose: true,
        width: 1000,
        height: 700,
      });

      if (!printWindow) {
        toast({
          title: "Print Error",
          description: "Please allow popups for printing",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Print failed:", error);
      toast({
        title: "Print Error",
        description: "Failed to open print window",
        type: "error",
      });
    } finally {
      setPrintLoading(false);
    }
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
        <DialogTitle hidden={isOpen}>Supplier Return Note Details</DialogTitle>
        <DialogDescription hidden={isOpen}>
          Detailed view of a supplier return note, including products and
          summary.
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
              <h2 className="text-lg font-semibold">SUPPLIER RETURN NOTE</h2>
              <p className="text-sm">Location: {data.location?.loca_name}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Doc No: {data.doc_no}</p>
              {data.recall_doc_no ? (
                <p className="text-sm">Recall Doc No: {data.recall_doc_no}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="font-semibold">
              <p>
                Document Date:{" "}
                <span className="font-normal">
                  {" "}
                  {new Date(data.document_date).toLocaleDateString()}
                </span>
              </p>
              <p>
                Supplier:{" "}
                <span className="font-normal"> {data.supplier?.sup_name}</span>
              </p>
            </div>

            <div className="font-semibold">
              {shouldShowGrnAmount && (
                <p>
                  Invoice Amount:{" "}
                  <span className="font-normal"> {data.net_total}</span>
                </p>
              )}
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
                  <th className="px-4 py-2 text-center">Free Qty</th>
                  <th className="px-4 py-2 text-center">Total Qty</th>
                  <th className="px-4 py-2 text-right">Discount</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {details.map((item: Product, index: number) => (
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
                    <td className="px-4 py-2 text-center">
                      {item.unit?.unit_type === "WHOLE"
                        ? Math.floor(Number(item.free_qty))
                        : Number(item.free_qty).toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {item.unit?.unit_type === "WHOLE"
                        ? Math.floor(Number(item.total_qty))
                        : Number(item.total_qty).toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatThousandSeparator(item.line_wise_discount_value)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatThousandSeparator(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end space-y-2">
            <div className="w-64">
              <div className="flex justify-between">
                <span>Sub Total:</span>
                <span>{formatThousandSeparator(data.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>
                  {data.dis_per > 0
                    ? `${data.dis_per}%`
                    : data.discount > 0
                    ? formatThousandSeparator(data.discount)
                    : "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>
                  {data.tax_per > 0
                    ? `${data.tax_per}%`
                    : data.tax > 0
                    ? formatThousandSeparator(data.tax)
                    : "0"}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Net Amount:</span>
                <span>{formatThousandSeparator(data.net_total)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                SRN Remarks:
              </label>
              <div className="p-3 border rounded-md bg-gray-50 min-h-[60px]">
                {data.srn_remarks || "No remarks"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
