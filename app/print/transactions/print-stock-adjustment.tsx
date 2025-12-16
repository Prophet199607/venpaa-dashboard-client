"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

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

interface PrintStockAdjustmentContentProps {
  docNo: string;
  status: string;
  iid?: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintStockAdjustmentContent({
  docNo,
  status,
  iid,
  initialData,
  onLoad,
}: PrintStockAdjustmentContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchTransferGoodNote = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`
        );
        if (res.success) {
          setData(res.data);
          onLoad?.();
        } else {
          setError("Failed to load transactioin data");
        }
      } catch (error) {
        console.error("Failed to fetch transactioin for printing:", error);
        setError("Failed to load transactioin data");
      } finally {
        setLoading(false);
      }
    };

    fetchTransferGoodNote();
  }, [docNo, status, iid, initialData, onLoad]);

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
      <div className="p-8 flex justify-center items-center h-40">
        <Loader />
        <span className="ml-2">Loading transaction request...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <h2 className="text-lg font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p>Stock adjustment transaction not found.</p>
      </div>
    );
  }

  const details =
    status === "applied"
      ? data.transaction_details || []
      : data.temp_transaction_details || [];

  return (
    <div className="p-4">
      <div className="mb-5">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold mb-5">STOCK ADJUSTMENT</h2>
          <div className="w-full">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between w-full">
                <div className="text-left">
                  <strong>Location:</strong> {data.location?.loca_name}
                </div>
                <div className="text-right">
                  <strong>Doc No:</strong> {data.doc_no}
                </div>
              </div>
              <div className="flex justify-between w-full">
                <div className="text-left">
                  <strong>Document Date:</strong>{" "}
                  {new Date(data.document_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">No</th>
            <th className="border p-2 text-left">Product</th>
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

      <div>
        <p className="mt-6">
          <strong>Remark:</strong> {data.remarks_ref || "No remarks"}
        </p>
      </div>
    </div>
  );
}
