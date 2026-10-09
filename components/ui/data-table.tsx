"use client";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: keyof TData;
  onRowClick?: (row: TData) => void;
  dense?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  totalRows?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable,
  onRowClick,
  dense,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  pageCount: serverPageCount,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState([]);
  const [internalSearch, setInternalSearch] = React.useState("");

  const isServerPagination = serverPageCount !== undefined;
  const serverPageIndex = controlledPageIndex ?? 0;
  const serverPageSize = controlledPageSize ?? pageSizeOptions[0] ?? 10;

  const isControlled = searchValue !== undefined;
  const global = isControlled ? (searchValue ?? "") : internalSearch;

  const handleSearchChange = (value: string) => {
    if (!isControlled) setInternalSearch(value);
    onSearchChange?.(value);
  };

  const filteredData = React.useMemo(() => {
    // When search is controlled, the consumer owns filtering (typically a
    // server-side search), so the table must not filter the data again.
    if (isControlled || !global) return data;

    const query = global.toString().toLowerCase().trim();

    return data.filter((row) => {
      if (!row) return false;

      // If a specific searchable key is provided, only search that field
      if (searchable) {
        const value = (row as any)[searchable];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      }

      // Otherwise, search across all field values
      return Object.values(row as any).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, global, searchable, isControlled]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: isServerPagination
      ? {
          sorting,
          pagination: { pageIndex: serverPageIndex, pageSize: serverPageSize },
        }
      : { sorting },
    onSortingChange: setSorting as any,
    ...(isServerPagination
      ? {
          manualPagination: true,
          pageCount: serverPageCount,
          onPaginationChange: (updater) => {
            const current = {
              pageIndex: serverPageIndex,
              pageSize: serverPageSize,
            };
            const next =
              typeof updater === "function"
                ? (updater as (prev: typeof current) => typeof current)(current)
                : updater;

            if (next.pageSize !== current.pageSize) {
              onPageSizeChange?.(next.pageSize);
              onPageChange?.(0);
              return;
            }
            if (next.pageIndex !== current.pageIndex) {
              onPageChange?.(next.pageIndex);
            }
          },
        }
      : { getPaginationRowModel: getPaginationRowModel() }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  React.useEffect(() => {
    if (isServerPagination) return;
    if (table.getState().pagination.pageIndex !== 0) {
      table.setPageIndex(0);
    }
  }, [global, filteredData, table, isServerPagination]);

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const paginationRange = React.useMemo(() => {
    const delta = 1;
    const range = [];
    for (let i = 0; i < pageCount; i++) {
      if (
        i === 0 ||
        i === pageCount - 1 ||
        (i >= pageIndex - delta && i <= pageIndex + delta)
      ) {
        range.push(i);
      }
    }

    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }, [pageCount, pageIndex]);

  const paginationControls = (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>
      {paginationRange.map((page, idx) =>
        typeof page === "number" ? (
          <Button
            key={idx}
            variant={pageIndex === page ? "default" : "outline"}
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => table.setPageIndex(page)}
          >
            {page + 1}
          </Button>
        ) : (
          <span key={idx} className="px-2 text-xs text-muted-foreground">
            ...
          </span>
        ),
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {!isControlled && (
        <div className="flex items-center justify-between gap-2">
          <SearchInput
            placeholder={searchPlaceholder}
            value={global ?? ""}
            onChange={handleSearchChange}
          />
        </div>
      )}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap min-w-max">
          <thead className="bg-neutral-50 dark:bg-neutral-900/60">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className={cn(
                      "text-left px-4 font-medium",
                      dense ? "py-1.5" : "py-3",
                    )}
                  >
                    {h.isPlaceholder ? null : (
                      <div
                        onClick={h.column.getToggleSortingHandler()}
                        className="cursor-pointer select-none"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: " ▲", desc: " ▼" }[
                          h.column.getIsSorted() as string
                        ] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "border-t border-neutral-100 dark:border-neutral-800",
                    onRowClick &&
                      "cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn("px-4", dense ? "py-1.5" : "py-3")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isServerPagination ? (
        <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <select
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (next === pageSize) return;
                onPageSizeChange?.(next);
                onPageChange?.(0);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            {totalRows !== undefined && (
              <span>
                {totalRows === 0
                  ? "0 records"
                  : `Showing ${pageIndex * pageSize + 1}–${Math.min(
                      (pageIndex + 1) * pageSize,
                      totalRows,
                    )} of ${totalRows}`}
              </span>
            )}
          </div>
          {paginationControls}
        </div>
      ) : (
        paginationControls
      )}
    </div>
  );
}
