"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { X, Printer } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { openPrintWindow } from "@/utils/print-utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PrintStockAdjustmentContent from "@/app/print/transactions/print-stock-adjustment";

interface Product {
  prod_code: string;
  prod_name: string;
  pack_size: string | number;
  pack_qty: number;
  unit_qty: number;
  physical_pack_qty: number;
  physical_unit_qty: number;
  variance_pack_qty: number;
  variance_unit_qty: number;
  total_qty: number;
  physical_total_qty?: number;
  unit: {
    unit_type: "WHOLE" | "DEC" | null;
  };
}

interface ViewStockAdjustmentProps {
  isOpen: boolean;
  onClose: () => void;
  docNo: string;
  status: string;
  iid?: string;
}

export default function ViewStockAdjustment({
  isOpen,
  onClose,
  docNo,
  status,
  iid,
}: ViewStockAdjustmentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    const fetchStockAdjustment = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`
        );

        if (res.success) {
          const tgnData = res.data;

          const productDetails =
            tgnData.temp_transaction_details ||
            tgnData.transaction_details ||
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
            ...tgnData,
            ...(tgnData.temp_transaction_details
              ? { temp_transaction_details: productsWithUnits }
              : {}),
            ...(tgnData.transaction_details
              ? { transaction_details: productsWithUnits }
              : {}),
          };
          setData(updatedData);
        }
      } catch (error: any) {
        console.error("Failed to fetch stock adjustment:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to load stock adjustment",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && docNo) {
      fetchStockAdjustment();
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
        <PrintStockAdjustmentContent
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

  const calculateVariance = (
    currentPackQty: number,
    currentUnitQty: number,
    physicalPackQty: number,
    physicalUnitQty: number,
    unitType: "WHOLE" | "DEC" | null
  ) => {
    let variancePack = physicalPackQty - currentPackQty;
    let varianceUnit = physicalUnitQty - currentUnitQty;

    if (unitType === "DEC") {
      variancePack = parseFloat(variancePack.toFixed(3));
      varianceUnit = parseFloat(varianceUnit.toFixed(3));
    } else if (unitType === "WHOLE") {
      variancePack = Math.floor(variancePack);
      varianceUnit = Math.floor(varianceUnit);
    }

    return { variancePack, varianceUnit };
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogTitle hidden={isOpen}>Stock Adjustment Details</DialogTitle>
        <DialogDescription hidden={isOpen}>
          Detailed view of a stock adjustment, including products and summary.
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
              <h2 className="text-lg font-semibold">STOCK ADJUSTMENT</h2>
              <p className="text-sm">Location: {data.location?.loca_name}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Doc No: {data.doc_no}</p>
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
            </div>

            <div className="font-semibold"></div>
          </div>

          {/* Products Table */}
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase">
                <tr>
                  <th className="px-4 py-2">No</th>
                  <th className="px-4 py-2">Product Code</th>
                  <th className="px-4 py-2">Product Name</th>
                  <th className="px-4 py-2 text-center">Current Pack Qty</th>
                  <th className="px-4 py-2 text-center">Current Unit Qty</th>
                  <th className="px-4 py-2 text-center">Physical Pack Qty</th>
                  <th className="px-4 py-2 text-center">Physical Unit Qty</th>
                  <th className="px-4 py-2 text-center">Variance Pack Qty</th>
                  <th className="px-4 py-2 text-center">Variance Unit Qty</th>
                </tr>
              </thead>
              <tbody>
                {details.map((item: Product, index: number) => {
                  const { variancePack, varianceUnit } = calculateVariance(
                    Number(item.pack_qty) || 0,
                    Number(item.unit_qty) || 0,
                    Number(item.physical_pack_qty) || 0,
                    Number(item.physical_unit_qty) || 0,
                    item.unit?.unit_type || null
                  );

                  const finalVariancePack = variancePack;
                  const finalVarianceUnit = varianceUnit;

                  return (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{item.prod_code}</td>
                      <td className="px-4 py-2">{item.prod_name}</td>
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
                          ? Math.floor(Number(item.physical_pack_qty))
                          : Number(item.physical_pack_qty).toFixed(3)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.unit?.unit_type === "WHOLE"
                          ? Math.floor(Number(item.physical_unit_qty))
                          : Number(item.physical_unit_qty).toFixed(3)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.unit?.unit_type === "WHOLE"
                          ? Math.floor(finalVariancePack)
                          : Number(finalVariancePack).toFixed(3)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.unit?.unit_type === "WHOLE"
                          ? Math.floor(finalVarianceUnit)
                          : Number(finalVarianceUnit).toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Remark:</label>
              <div className="p-3 border rounded-md bg-gray-50 min-h-[60px]">
                {data.remarks_ref || "No remarks"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
