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
  unit?: {
    unit_type: "WHOLE" | "DEC" | null;
  };
}

interface PrintProductDiscardContentProps {
  docNo: string;
  status: string;
  iid?: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintProductDiscardContent({
  docNo,
  status,
  iid,
  initialData,
  onLoad,
}: PrintProductDiscardContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchProductDiscard = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await api.get(
          `/transactions/load-transaction-by-code/${docNo}/${status}/${iid}`,
        );
        if (res.success) {
          setData(res.data);
          onLoad?.();
        } else {
          setError("Failed to load product discard data");
        }
      } catch (error) {
        console.error("Failed to fetch product discard for printing:", error);
        setError("Failed to load product discard data");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDiscard();
  }, [docNo, status, iid, initialData, onLoad]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-40">
        <Loader />
        <span className="ml-2">Loading product discard...</span>
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
        <p>Product discard not found.</p>
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
          <h2 className="text-xl font-bold mb-5">PRODUCT DISCARD NOTE</h2>
          <div className="w-full">
            <div className="flex flex-wrap">
              <div className="w-1/2">
                <p>
                  <strong>Location:</strong>{" "}
                  {data.location?.loca_name || data.location}
                </p>
              </div>
              <div className="w-1/2 text-right">
                <p>
                  <strong>Doc No:</strong> {data.doc_no}
                </p>
              </div>
              <div className="w-1/2">
                <p>
                  <strong>Post Date:</strong>{" "}
                  {data.document_date
                    ? new Date(data.document_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="w-1/2 text-right">
                <p>
                  <strong>Discard Type:</strong> {data.remarks_ref || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">No</th>
            <th className="border p-2 text-left">Product Code</th>
            <th className="border p-2 text-left">Product Name</th>
            <th className="border p-2 text-right">Purchase Price</th>
            <th className="border p-2 text-center">Pack Qty</th>
            <th className="border p-2 text-center">Unit Qty</th>
          </tr>
        </thead>
        <tbody>
          {details.map((item: any, index: number) => (
            <tr key={index}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{item.prod_code}</td>
              <td className="border p-2">{item.prod_name}</td>
              <td className="border p-2 text-right">
                {formatThousandSeparator(item.purchase_price)}
              </td>
              <td className="border p-2 text-center">
                {item.unit?.unit_type === "WHOLE"
                  ? Math.floor(Number(item.pack_qty))
                  : Number(item.pack_qty).toFixed(3)}
              </td>
              <td className="border p-2 text-center">
                {item.unit?.unit_type === "WHOLE"
                  ? Math.floor(Number(item.unit_qty))
                  : Number(item.unit_qty).toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.remarks && (
        <div className="mt-5">
          <p>
            <strong>Remarks:</strong> {data.remarks}
          </p>
        </div>
      )}
    </div>
  );
}
