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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: keyof TData;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState([]);
  const [global, setGlobal] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: global },
    onSortingChange: setSorting as any,
    onGlobalFilterChange: setGlobal as any,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search..."
          value={global ?? ""}
          onChange={(e) => setGlobal(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900/60">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left px-4 py-3 font-medium">
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
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
          )
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
    </div>
  );
}
