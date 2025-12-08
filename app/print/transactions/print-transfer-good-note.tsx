"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

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

interface PrintTransferGoodNoteContentProps {
  docNo: string;
  status: string;
  iid?: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintTransferGoodNoteContent({
  docNo,
  status,
  iid,
  initialData,
  onLoad,
}: PrintTransferGoodNoteContentProps) {
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
        <p>Transfer good note transaction not found.</p>
      </div>
    );
  }

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
    <div className="p-4">
      <div className="mb-5">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold mb-5">TRANSFER GOOD NOTE</h2>
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
                <div className="text-right">
                  {data.recall_doc_no && (
                    <span>
                      <strong>Recall Doc No:</strong> {data.recall_doc_no}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between w-full">
                <div className="text-left">
                  <strong>Delivery Location:</strong>{" "}
                  {data.delivery_location?.loca_name}
                </div>
                <div className="text-right">
                  <span>
                    <strong>Net Amount:</strong> {data.net_total}
                  </span>
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
            <th className="border p-2 text-right">Purchase Price</th>
            <th className="border p-2 text-center">Pack Qty</th>
            <th className="border p-2 text-center">Unit Qty</th>
            <th className="border p-2 text-center">Total Qty</th>
            <th className="border p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {details.map((item: Product, index: number) => (
            <tr key={index}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">
                {item.prod_name} <br /> {item.prod_code}{" "}
              </td>
              <td className="border p-2 text-right">
                {formatThousandSeparator(item.purchase_price)}
              </td>
              <td className="border p-2 text-center">
                {item.unit?.unit_type === "WHOLE"
                  ? Math.floor(Number(item.pack_qty)) || 0
                  : Number(item.pack_qty).toFixed(3) || 0}
              </td>
              <td className="border p-2 text-center">
                {item.unit?.unit_type === "WHOLE"
                  ? Math.floor(Number(item.unit_qty)) || 0
                  : Number(item.unit_qty).toFixed(3) || 0}
              </td>
              <td className="border p-2 text-center">
                {item.unit?.unit_type === "WHOLE"
                  ? Math.floor(Number(item.total_qty)) || 0
                  : Number(item.total_qty).toFixed(3) || 0}
              </td>
              <td className="border p-2 text-right">
                {formatThousandSeparator(item.amount)}
              </td>
            </tr>
          ))}
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
