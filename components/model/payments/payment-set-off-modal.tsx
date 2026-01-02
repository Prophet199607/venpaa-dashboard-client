"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SetOffDocument {
  doc_no: string;
  transaction_date: string;
  transaction_amount: number | string;
  balance_amount: number | string;
  paid_amount?: number | string;
  type?: string;
}

interface PaymentSetOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    documents: SetOffDocument[];
    setOffAmount: number;
    description: string;
  }) => void;
  documents: SetOffDocument[];
  supplierName?: string;
}

export function PaymentSetOffModal({
  isOpen,
  onClose,
  onConfirm,
  documents,
  supplierName = "",
}: PaymentSetOffModalProps) {
  const [localDocuments, setLocalDocuments] = useState<SetOffDocument[]>([]);
  const [setOffAmount, setSetOffAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Initialize documents with paid_amount if not present
      const initializedDocs = documents.map((doc) => ({
        ...doc,
        paid_amount: doc.paid_amount ?? 0,
      }));
      setLocalDocuments(initializedDocs);

      // Calculate initial set off amount
      const total = initializedDocs.reduce(
        (sum, doc) => sum + (Number(doc.paid_amount) || 0),
        0
      );
      setSetOffAmount(total.toFixed(2));

      // Set default description
      setDescription(
        supplierName ? `Payment set off for ${supplierName}` : "Payment set off"
      );
    }
  }, [isOpen, documents, supplierName]);

  const handlePaidAmountChange = (index: number, value: string) => {
    const updatedDocs = [...localDocuments];
    const numValue = parseFloat(value) || 0;
    const balanceAmount = Number(updatedDocs[index].balance_amount) || 0;

    // Ensure paid amount doesn't exceed balance amount
    const paidAmount = Math.min(numValue, balanceAmount);

    updatedDocs[index] = {
      ...updatedDocs[index],
      paid_amount: paidAmount,
    };

    setLocalDocuments(updatedDocs);

    // Recalculate total set off amount
    const total = updatedDocs.reduce(
      (sum, doc) => sum + (Number(doc.paid_amount) || 0),
      0
    );
    setSetOffAmount(total.toFixed(2));
  };

  const handleSetOffAmountChange = (value: string) => {
    setSetOffAmount(value);

    // Distribute the amount proportionally or equally
    // For now, we'll let the user manually adjust paid amounts
    // The set off amount is just a display/validation field
  };

  const totalSetOffAmount = localDocuments.reduce(
    (sum, doc) => sum + (Number(doc.paid_amount) || 0),
    0
  );

  const handleConfirm = () => {
    if (totalSetOffAmount <= 0) {
      return;
    }

    onConfirm({
      documents: localDocuments,
      setOffAmount: parseFloat(setOffAmount) || 0,
      description: description.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Set Off</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Set Off Documents Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Set Off Documents</Label>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Transaction Amount
                    </TableHead>
                    <TableHead className="text-right w-[120px]">
                      Balance Amount
                    </TableHead>
                    <TableHead className="text-right w-[120px]">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-4 text-gray-500"
                      >
                        No documents available
                      </TableCell>
                    </TableRow>
                  ) : (
                    localDocuments.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">
                          {doc.type || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="text-blue-600 hover:underline cursor-pointer">
                            {doc.doc_no}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {doc.transaction_date}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {Number(doc.transaction_amount).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {Number(doc.balance_amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="h-8 w-full text-right text-xs"
                            value={doc.paid_amount || 0}
                            onChange={(e) =>
                              handlePaidAmountChange(index, e.target.value)
                            }
                            min={0}
                            max={Number(doc.balance_amount) || 0}
                            step="0.01"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Label className="text-sm font-medium">
                Total Set Off Amount
              </Label>
              <Input
                className="w-32 h-8 text-right text-xs"
                value={totalSetOffAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                readOnly
              />
            </div>
          </div>

          {/* Set Off Amount Section */}
          <div className="space-y-2">
            <Label htmlFor="setOffAmount" className="text-sm font-semibold">
              Set Off Amount
            </Label>
            <Input
              id="setOffAmount"
              type="number"
              className="text-right"
              value={setOffAmount}
              onChange={(e) => handleSetOffAmountChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              type="button"
              disabled={totalSetOffAmount <= 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirm Set Off
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
