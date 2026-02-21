"use client";

import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";

interface Product {
  prod_code: string;
  prod_name: string;
  selling_price: number;
  pack_qty: number;
  unit_qty: number;
  free_qty: number;
  total_qty: number;
  line_wise_discount_value: number;
  unit?: {
    unit_type: "WHOLE" | "DEC" | null;
  };
  amount: number;
  type?: string;
}

interface ViewInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  docNo?: string;
  status?: string;
  iid?: string;
}

export default function ViewInvoice({
  isOpen,
  onClose,
  docNo,
  status = "applied",
  iid = "INV",
}: ViewInvoiceProps) {
  const { toast } = useToast();
  const [printLoading, setPrintLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!docNo) return;

      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/invoices/load-invoice-by-code/${docNo}/${status}/${iid}`,
        );

        if (res.success) {
          const invData = res.data;

          const productDetails =
            invData.transaction_sale_details ||
            invData.temp_transaction_sale_details ||
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
            ...invData,
            ...(invData.transaction_sale_details
              ? { transaction_sale_details: productsWithUnits }
              : {}),
            ...(invData.temp_transaction_sale_details
              ? { temp_transaction_sale_details: productsWithUnits }
              : {}),
          };

          setData(updatedData);
        }
      } catch (error: any) {
        console.error("Failed to fetch invoice:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to load invoice details",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && docNo) {
      fetchInvoice();
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
    // Print functionality will be implemented later
    setTimeout(() => {
      setPrintLoading(false);
    }, 1000);
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
      ? data.transaction_sale_details || []
      : data.temp_transaction_sale_details || [];

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
        <DialogTitle hidden={isOpen}>Invoice Details</DialogTitle>
        <DialogDescription hidden={isOpen}>
          Detailed view of an invoice, including products and summary.
        </DialogDescription>
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={handlePrint}
            disabled={printLoading}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
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
              <h2 className="text-lg font-semibold">INVOICE</h2>
              <p className="text-sm">Location: {data.location?.loca_name}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Doc No: {data.doc_no}</p>
              {data.manual_no ? (
                <p className="text-sm">Manual No: {data.manual_no}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="font-semibold">
              <p>
                Document Date:{" "}
                <span className="font-normal">
                  {new Date(data.document_date).toLocaleDateString()}
                </span>
              </p>
              <p>
                Payment Method:{" "}
                <span className="font-normal"> {data.payment_mode}</span>
              </p>
              <p>
                Sale Type:{" "}
                <span className="font-normal"> {data.sale_type}</span>
              </p>
            </div>
            <div className="font-semibold">
              <p>
                Customer:{" "}
                <span className="font-normal">
                  {data.customer?.customer_name || data.customer_name}
                </span>
              </p>
              <p>
                Address:{" "}
                <span className="font-normal"> {data.address || "N/A"}</span>
              </p>
              {data.sales_assistant_code && (
                <p>
                  Sales Assistant:{" "}
                  <span className="font-normal">
                    {" "}
                    {data.sales_assistant_code}
                  </span>
                </p>
              )}
            </div>
            <div className="font-semibold">
              {data.p_order_no && (
                <p>
                  P. Order No:{" "}
                  <span className="font-normal"> {data.p_order_no}</span>
                </p>
              )}
              {data.invoice_date && (
                <p>
                  Invoice Date:{" "}
                  <span className="font-normal">
                    {new Date(data.invoice_date).toLocaleDateString()}
                  </span>
                </p>
              )}
              {data.invoice_no && (
                <p>
                  Invoice No:{" "}
                  <span className="font-normal"> {data.invoice_no}</span>
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
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Product Code</th>
                  <th className="px-4 py-2">Product Name</th>
                  <th className="px-4 py-2 text-right">Selling Price</th>
                  <th className="px-4 py-2 text-center">Pack Qty</th>
                  <th className="px-4 py-2 text-center">Unit Qty</th>
                  <th className="px-4 py-2 text-center">Free Qty</th>
                  <th className="px-4 py-2 text-center">Total Qty</th>
                  <th className="px-4 py-2 text-right">Discount</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-4 text-center text-muted-foreground"
                    >
                      No products in this invoice
                    </td>
                  </tr>
                ) : (
                  details.map((item: Product, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.type === "sales"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {item.type || "sales"}
                        </span>
                      </td>
                      <td className="px-4 py-2">{item.prod_code}</td>
                      <td className="px-4 py-2">{item.prod_name}</td>
                      <td className="px-4 py-2 text-right">
                        {formatThousandSeparator(item.selling_price)}
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
                  ))
                )}
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
              {data.delivery_charges > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Charges:</span>
                  <span>{formatThousandSeparator(data.delivery_charges)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Net Amount:</span>
                <span>{formatThousandSeparator(data.net_total)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {data.comments && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comments:
              </label>
              <div className="p-3 border rounded-md bg-gray-50 min-h-[60px]">
                {data.comments}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
