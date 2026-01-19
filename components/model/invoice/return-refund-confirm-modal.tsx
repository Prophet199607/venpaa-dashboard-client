"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReturnRefundConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReturnRefundConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: ReturnRefundConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Cash Refund</DialogTitle>
          <DialogDescription>
            Please confirm — do you want to proceed with the cash refund?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            No
          </Button>
          <Button onClick={onConfirm}>Yes, proceed</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
