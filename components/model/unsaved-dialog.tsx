"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface SessionDetail {
  doc_no: string;
  location: {
    loca_code: string;
    loca_name: string;
  } | null;
  supplier: {
    sup_code: string;
    sup_name: string;
  } | null;
  product_count: number;
  created_at: string;
}

interface UnsavedChangesModalProps {
  isOpen: boolean;
  sessions: SessionDetail[];
  onContinue: (session: SessionDetail) => void;
  onDiscardAll: (sessions: SessionDetail[]) => void;
  onDiscardSelected: (session: SessionDetail) => void;
  transactionType: string;
}

export function UnsavedChangesModal({
  isOpen,
  sessions,
  onContinue,
  onDiscardAll,
  onDiscardSelected,
  transactionType,
}: UnsavedChangesModalProps) {
  const [selectedSession, setSelectedSession] = useState<SessionDetail>(
    sessions[0]
  );

  useEffect(() => {
    if (sessions.length > 0 && !sessions.includes(selectedSession)) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved {transactionType} Found</AlertDialogTitle>
          <AlertDialogDescription>
            You have {sessions.length} unsaved {transactionType.toLowerCase()}{" "}
            session{sessions.length > 1 ? "s" : ""}. <br /> What would you like
            to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <label
            htmlFor="session-select"
            className="text-sm font-medium text-gray-700"
          >
            Select a session to resume:
          </label>
          <Select
            onValueChange={(value) => {
              const session = sessions.find((s) => s.doc_no === value);
              if (session) setSelectedSession(session);
            }}
            value={selectedSession?.doc_no}
          >
            <SelectTrigger id="session-select" className="mt-1 w-full">
              <SelectValue placeholder="Select a session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.doc_no} value={session.doc_no}>
                  <div className="flex flex-col">
                    <span className="font-medium">{session.doc_no}</span>
                    <span className="text-xs text-muted-foreground">
                      {/* {session.location &&
                        `Location: ${session.location.loca_name} • `}
                      {session.supplier &&
                        `Supplier: ${session.supplier.sup_name} • `} */}
                      {session.product_count} product
                      {session.product_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onDiscardAll(sessions)}>
            Start New & Discard All
          </AlertDialogCancel>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => onDiscardSelected(selectedSession)}
            >
              Discard
            </Button>
            <AlertDialogAction onClick={() => onContinue(selectedSession)}>
              Resume
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
