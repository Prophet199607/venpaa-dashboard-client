"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Printer, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { openPrintWindow } from "@/utils/print-utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/model/confirmation-dialog";
import PrintItemRequestContent from "@/app/print/transactions/print-item-request";

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

interface ViewItemRequestProps {
  isOpen: boolean;
  onClose: () => void;
  docNo: string;
  status: string;
  iid?: string;
  onActionComplete?: () => void;
}

export default function ViewItemRequest({
  isOpen,
  onClose,
  docNo,
  status,
  iid,
  onActionComplete,
}: ViewItemRequestProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [approvalRemark, setApprovalRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  useEffect(() => {
    const fetchItemRequest = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/item-requests/load-item-request-by-code/${docNo}/${status}/${iid}`
        );

        if (res.success) {
          const irData = res.data;

          const productDetails =
            irData.temp_transaction_details ||
            irData.item_req_trans_details ||
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
            ...irData,
            ...(irData.temp_transaction_details
              ? { temp_transaction_details: productsWithUnits }
              : {}),
            ...(irData.item_req_trans_details
              ? { item_req_trans_details: productsWithUnits }
              : {}),
          };
          setData(updatedData);
        }
      } catch (error: any) {
        console.error("Failed to fetch item transaction:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to load item transaction",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && docNo) {
      fetchItemRequest();
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
        <PrintItemRequestContent
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

  const handleEdit = () => {
    router.push(
      `/dashboard/transactions/pending-item-request/create?doc_no=${docNo}&status=${status}&iid=IR`
    );
    onClose();
  };

  const handleApprove = async () => {
    if (!data) return;

    const payload = {
      ...data,
      approval_remarks: approvalRemark,
      iid: "IR",
    };

    setActionLoading(true);
    try {
      const response = await api.post("/item-requests/store-item-req", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description:
            "Item request has been approved and PO created successfully.",
          type: "success",
        });
        const poNumber = response.data.data.po_number;
        onClose();

        if (onActionComplete) {
          onActionComplete();
        }

        router.push(
          `/dashboard/transactions/purchase-order?tab=applied&view_doc_no=${poNumber}`
        );
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not approve the IR.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
      setConfirmApprove(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;

    const payload = {
      ...data,
      location: data.location?.loca_name || data.location || "",
      delivery_location:
        data.delivery_location?.loca_name || data.delivery_location || "",
      approval_remarks: approvalRemark,
      approval_status: "rejected",
      is_approved: false,
      iid: "IR",
    };

    setActionLoading(true);
    try {
      const response = await api.post("/item-requests/reject-ir", payload);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Item request has been rejected successfully.",
          type: "success",
        });
        onClose();

        if (onActionComplete) {
          onActionComplete();
        }

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description:
          error.response?.data?.message || "Could not reject the IR.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
      setConfirmReject(false);
    }
  };

  const showApproveConfirmation = () => {
    setConfirmApprove(true);
  };

  const showRejectConfirmation = () => {
    if (!approvalRemark.trim()) {
      toast({
        title: "Approval Remark Required",
        description: "Please enter an approval remark before rejecting.",
        type: "error",
      });
      return;
    }
    setConfirmReject(true);
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
      ? data.item_req_trans_details || []
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogTitle hidden={isOpen}>Item Request Details</DialogTitle>
          <DialogDescription hidden={isOpen}>
            Detailed view of a item request, including products and summary.
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
                <h2 className="text-lg font-semibold">ITEM REQUEST NOTE</h2>
                <p className="text-sm">Location: {data.location?.loca_name}</p>
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
                    {new Date(data.document_date).toLocaleDateString()}
                  </span>
                </p>
                <p>
                  Payment Method:{" "}
                  <span className="font-normal"> {data.payment_mode}</span>
                </p>
                <p>
                  Supplier:{" "}
                  <span className="font-normal">
                    {" "}
                    {data.supplier?.sup_name}
                  </span>
                </p>
              </div>
              <div className="font-semibold">
                <p>
                  Expected Date:{" "}
                  <span className="font-normal">
                    {data.expected_date
                      ? new Date(data.expected_date).toLocaleDateString()
                      : "N/A"}
                  </span>
                </p>
                <p>
                  Delivery Location:{" "}
                  <span className="font-normal">
                    {" "}
                    {data.delivery_location?.loca_name}
                  </span>
                </p>

                <p>
                  Delivery Address:{" "}
                  <span className="font-normal"> {data.delivery_address}</span>
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
            <div className="space-y-2">
              <p>
                <strong>Remarks:</strong> {data.remarks_ref || "N/A"}
              </p>
              {status === "applied" && data.grn_no && (
                <p>
                  <strong>GRN No:</strong> {data.grn_no}
                </p>
              )}
            </div>

            {status === "applied" &&
              data?.approval_status?.toLowerCase() !== "approved" &&
              data?.approval_status?.toLowerCase() !== "rejected" && (
                <div className="flex justify-between items-end pt-4 border-t">
                  {/* Edit Button - Left side */}
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    disabled={actionLoading}
                    className="flex items-center gap-3"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>

                  {/* Approval Section - Right side */}
                  <div className="flex items-end gap-4">
                    <div className="grid w-full max-w-md items-center gap-1.5">
                      <Label htmlFor="approval_remark">Approval Remark</Label>
                      <Textarea
                        id="approval_remark"
                        placeholder="Type your remark here."
                        value={approvalRemark}
                        onChange={(e) => setApprovalRemark(e.target.value)}
                        disabled={actionLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={showRejectConfirmation}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "REJECTING..." : "REJECT"}
                      </Button>
                      <Button
                        onClick={showApproveConfirmation}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "APPROVING..." : "APPROVE"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={handleApprove}
        title="Approve Item Request"
        description={`Are you sure you want to approve this item request (${docNo})? This action will create a Purchase Order.`}
        confirmText={actionLoading ? "APPROVING..." : "APPROVE"}
        variant="default"
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmReject}
        onClose={() => setConfirmReject(false)}
        onConfirm={handleReject}
        title="Reject Item Request"
        description={`Are you sure you want to reject this item request (${docNo})? This action cannot be undone.`}
        confirmText={actionLoading ? "REJECTING..." : "REJECT"}
        variant="destructive"
      />
    </>
  );
}
