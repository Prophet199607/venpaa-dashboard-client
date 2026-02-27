"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  allowFuture?: boolean;
  allowPast?: boolean;
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  disabled = false,
  className,
  required = false,
  allowFuture = false,
  allowPast = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDate = (date?: Date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isDateDisabled = (date: Date) => {
    if (disabled) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (!allowFuture && targetDate > today) return true;
    if (!allowPast && targetDate < today) return true;

    return false;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "w-full justify-between font-normal dark:bg-neutral-900 dark:disabled:bg-neutral-800",
            !date && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          {formatDate(date)}
          <CalendarDays className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[200] pointer-events-auto" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="pointer-events-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate);
              setIsOpen(false);
            }}
            disabled={isDateDisabled}
            initialFocus
            required={required}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
