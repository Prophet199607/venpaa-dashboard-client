"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Called after the field is cleared via the × button. */
  onClear?: () => void;
  containerClassName?: string;
}

/**
 * Text input with a compact border radius and an inline "×" button that
 * appears once there is a value, letting the user clear the search.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      className,
      containerClassName,
      placeholder = "Search...",
      ...props
    },
    ref,
  ) => {
    const hasValue = value.length > 0;

    return (
      <div className={cn("relative w-full max-w-xs", containerClassName)}>
        {/* `!` overrides the base `.input` rule, which is declared after the
            Tailwind utilities and would otherwise win. */}
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("!rounded-lg !pr-8", className)}
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
            className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
