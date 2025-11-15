"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { Check, X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  placeholder?: string;
  fetchOptions?: (query: string) => Promise<MultiSelectOption[]>;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  fetchOptions,
}: MultiSelectProps) {
  const [query, setQuery] = React.useState("");
  const [filteredOptions, setFilteredOptions] =
    React.useState<MultiSelectOption[]>(options);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // For keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  // Reference for focusing input
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // LOCAL FILTER
  React.useEffect(() => {
    if (!fetchOptions) {
      setFilteredOptions(
        options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }, [query, options, fetchOptions]);

  // REMOTE API FILTER
  React.useEffect(() => {
    if (fetchOptions && query.trim() !== "") {
      setLoading(true);
      fetchOptions(query)
        .then((res) => setFilteredOptions(res))
        .finally(() => setLoading(false));
    }
  }, [query, fetchOptions]);

  const toggleOption = (option: MultiSelectOption) => {
    const exists = selected.some((s) => s.value === option.value);

    if (exists) {
      onChange(selected.filter((s) => s.value !== option.value));
    } else {
      onChange([...selected, option]);
    }

    // Close list & reset behavior after selecting
    setOpen(false);
    setQuery("");
    setHighlightedIndex(0);

    // refocus input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev + 1 < filteredOptions.length ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) toggleOption(option);
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Select options..."}
        className="input w-full"
      />

      {/* Options dropdown */}
      {open && query && (
        <div className="mt-1 border rounded-md bg-white dark:bg-neutral-900 shadow-md max-h-60 overflow-auto z-50 relative">
          {loading ? (
            <div className="p-2 text-center text-sm text-neutral-500">
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-2 text-center text-sm text-neutral-500">
              No results
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const selectedOption = selected.some(
                (s) => s.value === option.value
              );

              const isHighlighted = highlightedIndex === index;

              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex justify-between items-center px-3 py-2 cursor-pointer rounded",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    selectedOption && "bg-neutral-200 dark:bg-neutral-700",
                    isHighlighted &&
                      "bg-neutral-100 dark:bg-neutral-800 border-l-2 border-neutral-500"
                  )}
                >
                  <span>{option.label}</span>
                  {selectedOption && <Check size={16} />}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-1 mt-3">
        {selected.map((item) => (
          <div
            key={item.value}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800"
          >
            <span>{item.label}</span>
            <button
              type="button"
              onClick={() => toggleOption(item)}
              className="text-neutral-500 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
