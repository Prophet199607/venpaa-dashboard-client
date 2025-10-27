"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchSelectProps {
  items: { label: string; value: any }[];
  placeholder?: string;
  onValueChange: (value: any) => void;
  value: any;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function SearchSelect({
  items,
  placeholder = "Select an item...",
  onValueChange,
  value,
  onSearch,
  searchPlaceholder = "Search...",
  emptyMessage = "No item found.",
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [displayLabel, setDisplayLabel] = useState<string | undefined>(
    undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = useState<string>("auto");

  useEffect(() => {
    if (triggerRef.current) {
      setPopoverWidth(`${triggerRef.current.offsetWidth}px`);
    }
  }, []);

  useEffect(() => {
    if (value) {
      const selectedItem = items.find((item) => item.value === value);
      setDisplayLabel(selectedItem?.label);
    } else {
      setDisplayLabel(undefined);
    }
  }, [value, items]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "input w-full justify-between font-normal bg-background",
            !displayLabel && "text-muted-foreground"
          )}
        >
          {displayLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        style={{ width: popoverWidth }}
        className="p-0 dark:bg-neutral-900"
      >
        <Command shouldFilter={false}>
          {" "}
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={handleSearch}
          />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto dark:text-white">
            {" "}
            {items.map((item) => (
              <CommandItem
                key={item.value}
                value={item.label}
                onSelect={() => {
                  const newValue = item.value === value ? "" : item.value;
                  onValueChange(newValue);
                  setOpen(false);
                  setSearchQuery("");
                }}
                className="dark:hover:bg-neutral-800 dark:data-[selected=true]:bg-accent"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
