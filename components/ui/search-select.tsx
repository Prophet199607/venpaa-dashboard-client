"use client";

import * as React from "react";
import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { Command as CommandPrimitive } from "cmdk";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchSelectItem {
  value: string;
  label: string;
}

export interface SearchSelectProps {
  items: SearchSelectItem[];
  value?: string;
  onValueChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export interface SearchSelectHandle {
  open: () => void;
  focusInput: () => void;
  openAndFocus: () => void;
  clear: () => void;
}

export const SearchSelect = React.forwardRef<
  SearchSelectHandle,
  SearchSelectProps
>(function SearchSelect(
  {
    items,
    value,
    onValueChange,
    onSearch,
    placeholder = "Select an item...",
    searchPlaceholder = "Search...",
    emptyMessage = "No items found.",
    disabled = false,
  },
  forwardedRef
) {
  const [internalValue, setInternalValue] = React.useState(value || "");
  const [searchQuery, setSearchQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const composedRefs = useComposedRefs(triggerRef);
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  const selectedItem = items.find((item) => item.value === value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
    setSearchQuery("");
    setOpen(false);
  };

  React.useImperativeHandle(
    forwardedRef,
    () => ({
      open: () => setOpen(true),
      focusInput: () => {
        // Delay to ensure popover content is mounted
        setTimeout(() => inputRef.current?.focus(), 0);
      },
      openAndFocus: () => {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      },
      clear: () => {
        onValueChange("");
        setSearchQuery("");
      },
    }),
    [onValueChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          ref={composedRefs as any}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className="w-full inline-flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={cn(
              "truncate",
              selectedItem ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          {(value || searchQuery) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Clear search and selection"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onCloseAutoFocus={(e) => {
          if (document.activeElement !== triggerRef.current) {
            e.preventDefault();
          }
        }}
      >
        <Command
          shouldFilter={!onSearch}
          value={internalValue}
          onValueChange={setInternalValue}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            ref={inputRef}
            onValueChange={(query) => {
              setSearchQuery(query);
              if (onSearch) onSearch(query);
            }}
          />
          <CommandPrimitive.List id={listId}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandPrimitive.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
