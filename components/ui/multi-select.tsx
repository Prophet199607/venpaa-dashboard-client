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
  selected: MultiSelectOption[] | any[];
  onChange: (selected: MultiSelectOption[]) => void;
  placeholder?: string;
  disabled?: boolean;
  fetchOptions?: (query: string) => Promise<MultiSelectOption[]>;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  disabled,
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

  // Normalize selected items to ensure they're in the correct format
  const normalizedSelected = React.useMemo(() => {
    return selected.map((item) => {
      if (typeof item === "object" && item !== null) {
        return {
          value: item.value || item.auth_code || item.id || "",
          label: item.label || item.auth_name || item.name || String(item),
        };
      }
      return {
        value: String(item),
        label: String(item),
      };
    });
  }, [selected]);

  // LOCAL FILTER
  React.useEffect(() => {
    if (!fetchOptions) {
      setFilteredOptions(
        options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase()),
        ),
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
    } else if (fetchOptions && query.trim() === "") {
      setFilteredOptions([]);
    }
  }, [query, fetchOptions]);

  const toggleOption = (option: MultiSelectOption) => {
    const exists = normalizedSelected.some((s) => s.value === option.value);

    let newSelected: MultiSelectOption[];
    if (exists) {
      newSelected = normalizedSelected.filter((s) => s.value !== option.value);
    } else {
      newSelected = [...normalizedSelected, option];
    }

    onChange(newSelected);

    // Close list & reset behavior after selecting
    setOpen(false);
    setQuery("");
    setHighlightedIndex(0);

    // refocus input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeSelected = (value: string) => {
    const newSelected = normalizedSelected.filter((s) => s.value !== value);
    onChange(newSelected);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev + 1 < filteredOptions.length ? prev + 1 : prev,
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

    if (
      e.key === "Backspace" &&
      query === "" &&
      normalizedSelected.length > 0
    ) {
      e.preventDefault();
      const lastSelected = normalizedSelected[normalizedSelected.length - 1];
      removeSelected(lastSelected.value);
    }
  };

  return (
    <div className="w-full">
      {/* Search Input Only */}
      <div className="relative">
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
          disabled={disabled}
          placeholder={placeholder || "Select options..."}
          className="input w-full"
        />
      </div>

      {/* Options dropdown */}
      {open && (query || fetchOptions) && (
        <div className="mt-1 border rounded-md bg-white dark:bg-neutral-900 shadow-md max-h-60 overflow-auto z-[150] relative">
          {loading ? (
            <div className="p-2 text-center text-sm text-neutral-500">
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-2 text-center text-sm text-neutral-500">
              {query ? "No results found" : "Start typing to search..."}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const selectedOption = normalizedSelected.some(
                (s) => s.value === option.value,
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
                      "bg-neutral-100 dark:bg-neutral-800 border-l-2 border-neutral-500",
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

      {/* Selected Tags - Displayed below the input */}
      {normalizedSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {normalizedSelected.map((item) => (
            <div
              key={item.value}
              className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm"
            >
              <span>{item.label}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeSelected(item.value)}
                className="text-neutral-500 hover:text-red-500 focus:outline-none disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
