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

interface UnsavedChangesModalProps {
  isOpen: boolean;
  sessions: string[];
  onContinue: (sessionId: string) => void;
  onDiscardAll: (sessionIds: string[]) => void;
  onDiscardSelected: (sessionId: string) => void;
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
  const [selectedSession, setSelectedSession] = useState<string>(
    sessions[0] || ""
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
            You have one or more unsaved {transactionType.toLowerCase()}
            sessions. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <label
            htmlFor="session-select"
            className="text-sm font-medium text-gray-700"
          >
            Select a session to resume:
          </label>
          <Select onValueChange={setSelectedSession} value={selectedSession}>
            <SelectTrigger id="session-select" className="mt-1 sm:w-48">
              <SelectValue placeholder="Select a session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session} value={session}>
                  {session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onDiscardAll(sessions)}>
            Start New & Discard All
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => onDiscardSelected(selectedSession)}
          >
            Discard
          </Button>
          <AlertDialogAction onClick={() => onContinue(selectedSession)}>
            Resume
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
