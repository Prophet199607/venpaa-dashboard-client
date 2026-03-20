"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PriceLevelOption = {
  id: number;
  purchase_price: number;
  selling_price: number;
  wholesale_price: number;
  has_expiry?: boolean;
  expiry_date?: string | null;
};

interface PriceLevelSelectModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  priceLevels: PriceLevelOption[];
  onSelect: (pl: PriceLevelOption) => void;
  onDefaultSelect: () => void;
  defaultSellingPrice?: number;
  defaultPurchasePrice?: number;
  type?: "PURCHASE" | "SALES";
  saleType?: "RETAIL" | "WHOLE";
}

export function PriceLevelSelectModal({
  isOpen,
  onDismiss,
  priceLevels,
  onSelect,
  onDefaultSelect,
  defaultSellingPrice = 0,
  defaultPurchasePrice = 0,
  type = "SALES",
  saleType = "RETAIL",
}: PriceLevelSelectModalProps) {
  const format = (value: number) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const pickDisplayPrice = (pl: PriceLevelOption) => {
    if (type === "PURCHASE") return Number(pl.purchase_price || 0);
    return saleType === "WHOLE"
      ? Number(pl.wholesale_price || 0)
      : Number(pl.selling_price || 0);
  };

  const defaultPrice = type === "PURCHASE" 
    ? defaultPurchasePrice 
    : (saleType === "WHOLE" ? 0 : defaultSellingPrice); // Added 0 for wholesale default if not provided

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Price</DialogTitle>
          <DialogDescription>
            Choose a price level or keep the default price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            onClick={onDefaultSelect}
          >
            <span className="font-medium">Default {type === "PURCHASE" ? "(Purchase)" : "(Retail)"}</span>
            <span className="font-mono flex items-center gap-4">
              {type === "SALES" && defaultPurchasePrice > 0 && (
                <span className="text-[10px] text-muted-foreground uppercase">Cost: {format(defaultPurchasePrice)}</span>
              )}
              Rs {format(defaultPrice || defaultSellingPrice)}
            </span>
          </Button>

          {priceLevels.map((pl) => {
            const selected = pickDisplayPrice(pl);
            return (
              <Button
                key={pl.id}
                type="button"
                variant="secondary"
                className="w-full justify-between h-auto py-2"
                onClick={() => onSelect(pl)}
              >
                <div className="flex flex-col items-start gap-0.5">
                   <span className="font-medium">Price Level #{pl.id}</span>
                   {pl.has_expiry && pl.expiry_date && (
                     <span className="text-[10px] text-yellow-600">Exp: {pl.expiry_date}</span>
                   )}
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm">
                    Rs {format(selected)}
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      (P:{format(pl.purchase_price)} / R:{format(pl.selling_price)} / W:{format(pl.wholesale_price || 0)})
                    </span>
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
