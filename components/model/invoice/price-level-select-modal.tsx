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
  selling_price: number;
  wholesale_price: number;
  has_expiry?: boolean;
  expiry_date?: string | null;
};

interface PriceLevelSelectModalProps {
  isOpen: boolean;
  saleType: "WHOLE" | "RETAIL";
  defaultSellingPrice: number;
  priceLevels: PriceLevelOption[];
  onSelectPrice: (price: number) => void;
  onDismiss: () => void;
}

export function PriceLevelSelectModal({
  isOpen,
  saleType,
  defaultSellingPrice,
  priceLevels,
  onSelectPrice,
  onDismiss,
}: PriceLevelSelectModalProps) {
  const format = (value: number) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const pickPrice = (pl: PriceLevelOption) =>
    saleType === "WHOLE"
      ? Number(pl.wholesale_price || 0)
      : Number(pl.selling_price || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Price</DialogTitle>
          <DialogDescription>
            Choose a price level or keep the default selling price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            onClick={() => onSelectPrice(Number(defaultSellingPrice || 0))}
          >
            <span className="font-medium">Default</span>
            <span className="font-mono">Rs {format(defaultSellingPrice)}</span>
          </Button>

          {priceLevels.map((pl) => {
            const selected = pickPrice(pl);
            return (
              <Button
                key={pl.id}
                type="button"
                variant="secondary"
                className="w-full justify-between"
                onClick={() => onSelectPrice(selected)}
              >
                <span className="font-medium">Price Level #{pl.id}</span>
                <span className="font-mono">
                  Rs {format(selected)}
                  <span className="ml-3 text-xs text-muted-foreground">
                    (R:{format(Number(pl.selling_price || 0))} / W:
                    {format(Number(pl.wholesale_price || 0))})
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

