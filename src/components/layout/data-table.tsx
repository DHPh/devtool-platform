"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TableRowRecord = Record<string, unknown>;

export interface DataTableProps {
  data: TableRowRecord[];
  headers?: string[];
  defaultPageSize?: number;
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;
  className?: string;
}

function renderCellValue(value: unknown) {
  if (value === null) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (value === undefined) {
    return <span className="text-muted-foreground italic">undefined</span>;
  }
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"}>{String(value)}</Badge>
    );
  }
  if (typeof value === "number") {
    return <span className="font-mono">{value.toLocaleString()}</span>;
  }
  if (typeof value === "string") {
    if (
      (value.startsWith("[") && value.endsWith("]")) ||
      (value.startsWith("{") && value.endsWith("}"))
    ) {
      return (
        <span className="font-mono text-purple-700 dark:text-purple-400 text-sm">
          {value}
        </span>
      );
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return (
        <span className="text-blue-700 dark:text-blue-400">{value}</span>
      );
    }
    if (value.length > 100) {
      return <span title={value}>{value.substring(0, 100)}…</span>;
    }
  }
  return <span className="break-all">{String(value)}</span>;
}

export function DataTable({
  data,
  headers,
  defaultPageSize = 15,
  searchPlaceholder = "Search all columns...",
  toolbarActions,
  className,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [prevData, setPrevData] = useState(data);

  if (prevData !== data) {
    setPrevData(data);
    if (pagination.pageIndex !== 0) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }

  const columnKeys = useMemo(() => {
    if (headers && headers.length > 0) return headers;
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data, headers]);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TableRowRecord>();
    return columnKeys.map((key) =>
      columnHelper.accessor((row) => row[key], {
        id: key,
        header: ({ column }) => {
          const sorted = column.getIsSorted();
          return (
            <button
              type="button"
              onClick={column.getToggleSortingHandler()}
              className="inline-flex items-center gap-1.5 font-semibold text-left hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <span>{key}</span>
              {sorted === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 shrink-0" />
              ) : sorted === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </button>
          );
        },
        cell: (info) => renderCellValue(info.getValue()),
      }),
    );
  }, [columnKeys]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table manages table instance state internally
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startEntry = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const endEntry = Math.min((pageIndex + 1) * pageSize, totalFiltered);
  const pageCount = Math.max(1, table.getPageCount());

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="search"
            aria-label="Search table rows"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="pl-9"
          />
        </div>
        {toolbarActions && (
          <div className="flex flex-wrap items-center gap-2">
            {toolbarActions}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto max-h-[28rem]">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 sticky top-0 z-10 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3.5 py-2.5 text-left font-medium whitespace-nowrap text-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-muted/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3.5 py-2.5 align-top">
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
                  <td
                    colSpan={Math.max(1, columnKeys.length)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No matching rows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & Page Size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span>
            Showing {startEntry} to {endEntry} of {totalFiltered} entries
          </span>
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) =>
                setPagination({ pageIndex: 0, pageSize: Number(value) })
              }
            >
              <SelectTrigger aria-label="Rows per page" className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs sm:text-sm mr-1">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
