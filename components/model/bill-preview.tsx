"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BillRow, n, lkr, formatBillDate } from "@/app/dashboard/columns";

interface BillPreviewProps {
  bill: BillRow;
  onClose: () => void;
}

export function BillPreview({ bill, onClose }: BillPreviewProps) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-xl [&>button]:hidden">
        <div className="flex flex-col">
          {/* ── Modal header ── */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Bill Preview &mdash; {bill.Receipt_No}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Receipt body ── */}
          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 bg-white dark:bg-neutral-950/20 text-neutral-900 dark:text-neutral-100">
            {/* Store */}
            <div className="text-center border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-widest">
                Venpa Bookshop
              </h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                {bill.loca_name}
              </p>
              <p className="text-[10px] text-neutral-500">
                POS Counter Unit: {bill.Unit}
              </p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-y-2 text-[10px] border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-4">
              <div>
                <span className="text-neutral-500 uppercase">Receipt No:</span>{" "}
                <span className="font-mono font-semibold">
                  {bill.Receipt_No}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 uppercase">Date:</span>{" "}
                <span className="font-semibold">
                  {formatBillDate(bill.BillDate)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 uppercase">Operator:</span>{" "}
                <span className="font-semibold">{bill.Operator}</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 uppercase">Payment:</span>{" "}
                <span className="font-semibold">{bill.PaymentType ?? "—"}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-bold text-neutral-500 uppercase tracking-wider pb-1 border-b border-neutral-200 dark:border-neutral-800">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              <div className="divide-y divide-dashed divide-neutral-100 dark:divide-neutral-800/40">
                {bill.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 text-[10px] py-1.5 text-neutral-700 dark:text-neutral-300"
                  >
                    <div className="col-span-6 font-medium leading-tight">
                      {item.Item_Descrip}
                    </div>
                    <div className="col-span-2 text-right font-semibold">
                      {n(item.Qty).toFixed(0)}
                    </div>
                    <div className="col-span-2 text-right">
                      {n(item.Unit_Price).toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-bold">
                      {n(item.Amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-4 space-y-2 text-[10px]">
              <div className="flex justify-between text-neutral-500">
                <span>Sub Total</span>
                <span>{lkr(bill.subTotal)}</span>
              </div>
              <div className="flex justify-between text-red-400 font-medium">
                <span>Discount</span>
                <span>{lkr(bill.Discount)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Paid Amount</span>
                <span>{lkr(bill.payment)}</span>
              </div>
              {n(bill.Balance) > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Balance</span>
                  <span>{lkr(bill.Balance)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black border-t border-double border-neutral-300 dark:border-neutral-700 pt-2">
                <span>NET TOTAL</span>
                <span>{lkr(bill.NetTotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-neutral-500 dark:text-neutral-300 border-b border-double border-neutral-300 dark:border-neutral-700 pb-2">
                <span>NO OF QTY SOLD</span>
                <span>{n(bill.ItemCount).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
