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
import { parseJSON, detectColumnType } from "@/lib/utils/json-parser";

export const metadata = {
  id: "json-table-viewer",
  name: "JSON Table Viewer",
  description:
    "Convert JSON data to interactive table with filtering and sorting",
  category: "Data Processing",
  tags: ["json", "table", "data", "viewer"],
  path: "/tools/json-table-viewer",
  icon: "🗂️",
};

interface JSONRow {
  [key: string]: unknown;
}

export default function JSONTableViewer() {
  const [data, setData] = useState<JSONRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<JSONRow>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [fileName, setFileName] = useState("");
  const [hasNestedData, setHasNestedData] = useState(false);

  const createColumns = (data: JSONRow[]): ColumnDef<JSONRow>[] => {
    if (data.length === 0) return [];

    const columnHelper = createColumnHelper<JSONRow>();
    const allKeys = new Set<string>();

    // Collect all possible keys from all rows
    data.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });

    const keys = Array.from(allKeys).sort();

    return keys.map((key) => {
      // Detect column type for better rendering
      const columnValues = data.map((row) => row[key]);
      const columnType = detectColumnType(columnValues);

      return columnHelper.accessor((row) => row[key], {
        id: key,
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

          if (typeof value === "boolean") {
            return (
              <Badge variant={value ? "default" : "secondary"}>
                {String(value)}
              </Badge>
            );
          }

          if (typeof value === "number") {
            return <span className="font-mono">{value.toLocaleString()}</span>;
          }

          // Handle date values
          if (columnType === "date" && typeof value === "string") {
            return <span className="font-mono text-blue-600">{value}</span>;
          }

          const stringValue = String(value);

          // Handle JSON strings (arrays/objects)
          if (stringValue.startsWith("[") || stringValue.startsWith("{")) {
            return (
              <span
                title={stringValue}
                className="truncate block max-w-xs text-purple-600 font-mono text-sm"
              >
                {stringValue.length > 50
                  ? `${stringValue.substring(0, 50)}...`
                  : stringValue}
              </span>
            );
          }

          // Handle long text
          if (stringValue.length > 100) {
            return (
              <span title={stringValue} className="truncate block max-w-xs">
                {stringValue.substring(0, 100)}...
              </span>
            );
          }

          return <span>{stringValue}</span>;
        },
      });
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const result = parseJSON(text, { maxDepth: 15 });
        setData(result.data);
        setColumns(createColumns(result.data));
        setFileName(file.name);
        setHasNestedData(result.hasNestedData);
        toast.success(
          `Loaded ${result.rowCount} rows from ${file.name}${
            result.hasNestedData ? " (nested data flattened)" : ""
          }`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Error parsing JSON: ${errorMessage}`);
      }
    };
    reader.readAsText(file);
  };

  const handleTextInput = (text: string) => {
    try {
      const result = parseJSON(text, { maxDepth: 15 });
      setData(result.data);
      setColumns(createColumns(result.data));
      setFileName("Manual Input");
      setHasNestedData(result.hasNestedData);
      toast.success(
        `Loaded ${result.rowCount} rows${
          result.hasNestedData ? " (nested data flattened)" : ""
        }`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("JSON parsing error:", error);
      toast.error(`Error parsing JSON: ${errorMessage}`);
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

    const jsonContent = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(".json", "_processed.json") || "data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported!");
  };

  const exportCSV = () => {
    if (data.length === 0) return;

    const allKeys = new Set<string>();
    data.forEach((row) => Object.keys(row).forEach((key) => allKeys.add(key)));
    const headers = Array.from(allKeys).sort();

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return value === null || value === undefined
              ? ""
              : `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(".json", "_converted.csv") || "data.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported as CSV!");
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setFileName("");
    setHasNestedData(false);
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
            JSON Data Input
          </CardTitle>
          <CardDescription>
            Upload a JSON file or paste JSON data to view in an interactive
            table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload JSON File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="json-text">Or Paste JSON Data</Label>
              <textarea
                id="json-text"
                placeholder={`Examples:
Simple: [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]
Nested: [{"user": {"name": "John", "contact": {"email": "john@test.com"}}, "active": true}]
Mixed: [{"id": 1, "data": [1,2,3], "info": {"status": "active"}}]`}
                className="w-full h-24 tool-textarea"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    handleTextInput(e.target.value);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const textarea = document.getElementById(
                    "json-text"
                  ) as HTMLTextAreaElement;
                  if (textarea && textarea.value.trim()) {
                    handleTextInput(textarea.value);
                  }
                }}
              >
                Parse JSON
              </Button>
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.length} rows</Badge>
              <Badge variant="outline">{columns.length} columns</Badge>
              {hasNestedData && (
                <Badge variant="outline" className="text-blue-600">
                  Nested data flattened
                </Badge>
              )}
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
                  Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
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
