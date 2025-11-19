"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface Product {
  prod_code: string;
  prod_name: string;
  purchase_price: number;
  pack_qty: number;
  qty: number;
  free_qty: number;
  total_qty: number;
  line_wise_discount_value: number;
  unit?: {
    unit_type: "WHOLE" | "DEC" | null;
  };
  amount: number;
}

interface PrintItemRequestContentProps {
  docNo: string;
  status: string;
  iid?: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintItemRequestContent({
  docNo,
  status,
  iid,
  initialData,
  onLoad,
}: PrintItemRequestContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchItemRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await api.get(
          `/item-requests/load-item-request-by-code/${docNo}/${status}/${iid}`
        );
        if (res.success) {
          setData(res.data);
          onLoad?.();
        } else {
          setError("Failed to load item request data");
        }
      } catch (error) {
        console.error("Failed to fetch item request for printing:", error);
        setError("Failed to load item request data");
      } finally {
        setLoading(false);
      }
    };

    fetchItemRequest();
  }, [docNo, status, iid, initialData, onLoad]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-40">
        <Loader />
        <span className="ml-2">Loading item request...</span>
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
        <p>Item Request not found.</p>
      </div>
    );
  }

  const details =
    status === "applied"
      ? data.item_transaction_details || []
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
          <h2 className="text-xl font-bold mb-5">ITEM REQUEST</h2>
          <div className="w-full">
            <div className="flex flex-wrap">
              <div className="w-1/2">
                <p>
                  <strong>Location:</strong> {data.location?.loca_name}
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
                  {new Date(data.document_date).toLocaleDateString()}
                </p>
              </div>
              <div className="w-1/2 text-right">
                <p>
                  <strong>Expected Date:</strong>{" "}
                  {data.expected_date
                    ? new Date(data.expected_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="w-1/2">
                <p>
                  <strong>Payment Method:</strong> {data.payment_mode}
                </p>
              </div>
              <div className="w-1/2 text-right">
                <p>
                  <strong>Delivery Location:</strong>{" "}
                  {data.delivery_location?.loca_name}
                </p>
              </div>
              <div className="w-1/2">
                <p>
                  <strong>Supplier:</strong> {data.supplier?.sup_name}
                </p>
              </div>
              <div className="w-1/2 text-right">
                <p>
                  <strong>Delivery Address:</strong> {data.delivery_address}
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
            <th className="border p-2 text-left">Product</th>
            <th className="border p-2 text-right">Purchase Price</th>
            <th className="border p-2 text-center">Pack Qty</th>
            <th className="border p-2 text-center">Qty</th>
            <th className="border p-2 text-center">Free Qty</th>
            <th className="border p-2 text-center">Total Qty</th>
            <th className="border p-2 text-right">Discount</th>
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
                  ? Math.floor(Number(item.qty)) || 0
                  : Number(item.qty).toFixed(3) || 0}
              </td>
              <td className="border p-2 text-center">
                {item.unit?.unit_type === "WHOLE"
                  ? Math.floor(Number(item.free_qty)) || 0
                  : Number(item.free_qty).toFixed(3) || 0}
              </td>
              <td className="border p-2 text-center">
                {item.unit?.unit_type === "WHOLE"
                  ? Math.floor(Number(item.total_qty)) || 0
                  : Number(item.total_qty).toFixed(3) || 0}
              </td>
              <td className="border p-2 text-right">
                {formatThousandSeparator(item.line_wise_discount_value)}
              </td>
              <td className="border p-2 text-right">
                {formatThousandSeparator(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mt-5 text-right" style={{ lineHeight: "2" }}>
        <p>
          <strong>Sub Total:</strong> {formatThousandSeparator(data.subtotal)}
        </p>
        <p>
          <strong>Discount:</strong>{" "}
          {data.dis_per > 0
            ? `${data.dis_per}%`
            : data.discount > 0
            ? formatThousandSeparator(data.discount)
            : "0"}
        </p>
        <p>
          <strong>Tax:</strong>{" "}
          {data.tax_per > 0
            ? `${data.tax_per}%`
            : data.tax > 0
            ? formatThousandSeparator(data.tax)
            : "0"}
        </p>
        <p>
          <strong>Net Amount:</strong> {formatThousandSeparator(data.net_total)}
        </p>
      </div>

      <div className="mt-5">
        <p>
          <strong>Remarks:</strong> {data.remarks_ref || "N/A"}
        </p>
        {status === "applied" && data.grn_no && (
          <p>
            <strong>GRN No:</strong> {data.grn_no}
          </p>
        )}
      </div>
    </div>
  );
}
