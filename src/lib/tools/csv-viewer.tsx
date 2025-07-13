"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { parseCSV, getDelimiterDisplayName } from "@/lib/utils/csv-parser";

export const metadata = {
  id: "csv-viewer",
  name: "CSV Viewer",
  description: "Upload and view CSV files with interactive table features",
  category: "Data Processing",
  tags: ["csv", "table", "data", "viewer"],
  path: "/tools/csv-viewer",
  icon: "📊",
};

interface CSVRow {
  [key: string]: unknown;
}

export default function CSVViewer() {
  const [data, setData] = useState<CSVRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<CSVRow>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [fileName, setFileName] = useState("");
  const [detectedDelimiter, setDetectedDelimiter] = useState(",");

  const createColumns = (data: CSVRow[]): ColumnDef<CSVRow>[] => {
    if (data.length === 0) return [];

    const columnHelper = createColumnHelper<CSVRow>();
    const keys = Object.keys(data[0]);

    return keys.map((key) =>
      columnHelper.accessor(key, {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            {key}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => {
          const value = info.getValue();
          if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">null</span>;
          }
          return typeof value === "number" ? (
            <span className="font-mono">{value.toLocaleString()}</span>
          ) : (
            <span>{String(value)}</span>
          );
        },
      })
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const result = parseCSV(text, {
          hasHeader: true,
          skipEmptyLines: true,
        });
        setData(result.data as CSVRow[]);
        setColumns(createColumns(result.data as CSVRow[]));
        setDetectedDelimiter(result.delimiter);
        setFileName(file.name);
        toast.success(`Loaded ${result.rowCount} rows from ${file.name}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Error parsing CSV: ${errorMessage}`);
      }
    };
    reader.readAsText(file);
  };

  const handleTextInput = (text: string) => {
    try {
      const result = parseCSV(text, {
        hasHeader: true,
        skipEmptyLines: true,
      });
      setData(result.data as CSVRow[]);
      setColumns(createColumns(result.data as CSVRow[]));
      setDetectedDelimiter(result.delimiter);
      setFileName("Manual Input");
      toast.success(`Loaded ${result.rowCount} rows`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error parsing CSV: ${errorMessage}`);
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const exportData = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(detectedDelimiter),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const stringValue = String(value);
            // Escape quotes and wrap in quotes if contains delimiter or quotes
            if (
              stringValue.includes(detectedDelimiter) ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(detectedDelimiter)
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(".csv", "_processed.csv") || "data.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported!");
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setFileName("");
    setDetectedDelimiter(",");
    setGlobalFilter("");
    setColumnFilters([]);
    setSorting([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Data Input
          </CardTitle>
          <CardDescription>
            Upload a CSV file or paste CSV data to view in an interactive table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-text">Or Paste CSV Data</Label>
              <textarea
                id="csv-text"
                placeholder="CSV with commas: name,age,city&#10;John,30,NYC&#10;Jane,25,LA&#10;&#10;Or with semicolons: name;age;city&#10;John;30;NYC&#10;Jane;25;LA"
                className="w-full h-24 tool-textarea"
                onChange={(e) => {
                  if (e.target.value.trim()) {
                    handleTextInput(e.target.value);
                  }
                }}
              />
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.length} rows</Badge>
              <Badge variant="outline">{columns.length} columns</Badge>
              <Badge variant="outline">
                Delimiter: {getDelimiterDisplayName(detectedDelimiter)}
              </Badge>
              {fileName && <Badge variant="secondary">{fileName}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Data Table
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={clearData}>
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Global Search */}
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(event) =>
                  setGlobalFilter(String(event.target.value))
                }
                className="max-w-sm"
              />
            </div>

            {/* Table */}
            <div className="border rounded-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="border-b bg-gray-50 dark:bg-gray-900"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left font-medium"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-900"
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{" "}
                  of {table.getFilteredRowModel().rows.length} entries
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
