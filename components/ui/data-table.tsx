"use client";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: keyof TData;
}

export function DataTable<TData, TValue>({ columns, data, searchable }: DataTableProps<TData, TValue>) {
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
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input placeholder="Search..." value={global ?? ""} onChange={(e)=> setGlobal(e.target.value)} className="max-w-xs" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=> table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" onClick={()=> table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900/60">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="text-left px-4 py-3 font-medium">
                    {h.isPlaceholder ? null : (
                      <div onClick={h.column.getToggleSortingHandler()} className="cursor-pointer select-none">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{"asc":" ▲","desc":" ▼"}[h.column.getIsSorted() as string] ?? null}
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
    </div>
  );
}
