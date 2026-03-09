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
  onYes: () => void;
  onNo: () => void;
  onDismiss: () => void;
}

export function ReturnRefundConfirmModal({
  isOpen,
  onYes,
  onNo,
  onDismiss,
}: ReturnRefundConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Cash Refund</DialogTitle>
          <DialogDescription>
            Please confirm — do you want to proceed with the cash refund?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onNo}>
            No
          </Button>
          <Button onClick={onYes}>Yes, proceed</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
