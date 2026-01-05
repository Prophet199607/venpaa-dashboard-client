"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  supplierCode?: string;
  locationCode?: string;
  paymentAmount?: string;
}

export function PaymentSetOffModal({
  isOpen,
  onClose,
  onConfirm,
  documents,
  supplierName = "",
  supplierCode,
  locationCode,
  paymentAmount = "0",
}: PaymentSetOffModalProps) {
  const [localDocuments, setLocalDocuments] = useState<SetOffDocument[]>([]);
  const [availableCredits, setAvailableCredits] = useState<any[]>([]);
  const [setOffAmount, setSetOffAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Fetch available credits (advances/returns)
      if (supplierCode && locationCode) {
        const fetchCredits = async () => {
          try {
            const { data: res } = await api.get(
              `/payment-vouchers/available-set-offs/${supplierCode}/${locationCode}`
            );
            if (res.success) {
              const credits = res.data.map((c: any) => ({
                ...c,
                using_amount: "",
              }));
              setAvailableCredits(credits);
            }
          } catch (err) {
            console.error("Failed to fetch available credits", err);
          }
        };
        fetchCredits();
      } else {
        setAvailableCredits([]);
      }

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
  }, [isOpen, documents, supplierName, supplierCode, locationCode]);

  const handleCreditAmountChange = (index: number, value: string) => {
    const newCredits = [...availableCredits];
    const amount = parseFloat(value);
    const balance = parseFloat(newCredits[index].balance_amount);

    if (amount > balance) {
      // Don't allow more than balance
      return;
    }

    newCredits[index].using_amount = value;
    setAvailableCredits(newCredits);
  };

  const totalSetOffAmount = availableCredits.reduce(
    (sum, credit) => sum + (parseFloat(credit.using_amount) || 0),
    0
  );

  const handleConfirm = () => {
    if (totalSetOffAmount <= 0) {
      return;
    }

    onConfirm({
      documents: localDocuments,
      setOffAmount: totalSetOffAmount,
      description: description.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Set Off</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Available Credits Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Set Off Documents</Label>
            <div className="border rounded-md overflow-hidden max-h-[200px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableCredits.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-4 text-gray-500"
                      >
                        No available credits found
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableCredits.map((credit, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">
                          {credit.iid || credit.type}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {credit.doc_no}
                        </TableCell>
                        <TableCell className="text-xs">
                          {credit.transaction_date}
                        </TableCell>

                        <TableCell className="text-right text-xs font-semibold">
                          {Number(credit.balance_amount).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="text-right"
                            value={credit.using_amount}
                            onChange={(e) =>
                              handleCreditAmountChange(index, e.target.value)
                            }
                            placeholder="0.00"
                            min="0"
                            max={credit.balance_amount}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            {availableCredits.length > 0 && (
              <div className="flex items-end gap-2 ml-auto">
                <div className="font-bold text-xs whitespace-nowrap">
                  Total Set Off Amount
                </div>

                <Input
                  type="text"
                  readOnly
                  value={totalSetOffAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  className="w-32 text-right font-bold text-xs"
                />
              </div>
            )}

            {/* Left-aligned Set Off Amount */}
            <div className="flex flex-col items-start space-y-1">
              <Label className="text-xs font-semibold">Set Off Amount</Label>

              <Input
                type="text"
                readOnly
                value={Number(paymentAmount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                className="w-32 text-right font-bold text-xs"
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1">
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
              disabled={
                totalSetOffAmount.toFixed(2) !==
                Number(paymentAmount).toFixed(2)
              }
            >
              Confirm Set Off
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
