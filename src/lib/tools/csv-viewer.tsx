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
import { ToolHeader, QuickActions, ResultCard } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Table,
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
  const [textInput, setTextInput] = useState("");

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
      // First try with auto-detection
      let result = parseCSV(text, {
        hasHeader: true,
        skipEmptyLines: true,
      });

      // If we get too many columns (indicating possible unquoted commas), try other approaches
      if (result.headers.length > 10) {
        // Try with semicolon delimiter
        try {
          const semicolonResult = parseCSV(text, {
            delimiter: ";",
            hasHeader: true,
            skipEmptyLines: true,
          });
          if (
            semicolonResult.headers.length < result.headers.length &&
            semicolonResult.headers.length > 1
          ) {
            result = semicolonResult;
          }
        } catch {
          // Continue with original result
        }

        // Try with tab delimiter
        try {
          const tabResult = parseCSV(text, {
            delimiter: "\t",
            hasHeader: true,
            skipEmptyLines: true,
          });
          if (
            tabResult.headers.length < result.headers.length &&
            tabResult.headers.length > 1
          ) {
            result = tabResult;
          }
        } catch {
          // Continue with original result
        }
      }

      setData(result.data as CSVRow[]);
      setColumns(createColumns(result.data as CSVRow[]));
      setDetectedDelimiter(result.delimiter);
      setFileName("Manual Input");
      toast.success(
        `Loaded ${result.rowCount} rows with ${result.headers.length} columns`
      );

      // Warn if we detected too many columns
      if (result.headers.length > 10) {
        toast.warning(
          "Detected many columns. Data may contain unquoted commas. Consider using proper CSV format with quoted values."
        );
      }
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

  const loadSampleData = () => {
    const sampleCSV = `SIC Code,Description
1110,Growing of cereals (except rice), leguminous crops and oil seeds
1120,Growing of rice
1130,Growing of vegetables and melons, roots and tubers
1140,Growing of sugar cane
1150,Growing of tobacco
1160,Growing of fibre crops
1190,Growing of other non-perennial crops
1210,Growing of grapes
1220,Growing of tropical and subtropical fruits
1230,Growing of citrus fruits`;

    setTextInput(sampleCSV);
    handleTextInput(sampleCSV);
    setFileName("sample-sic-codes.csv");
  };

  const handleTextProcess = () => {
    if (!textInput.trim()) {
      toast.error("Please enter CSV data");
      return;
    }
    handleTextInput(textInput);
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setFileName("");
    setDetectedDelimiter(",");
    setGlobalFilter("");
    setColumnFilters([]);
    setSorting([]);
    setTextInput("");
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="CSV Viewer"
        description="Upload and view CSV files with interactive table features"
        icon={Table}
      />

      <QuickActions
        actions={[
          {
            id: "sample",
            label: "Load Sample CSV",
            onClick: loadSampleData,
            variant: "outline" as const,
          },
          {
            id: "process",
            label: "Process CSV",
            onClick: handleTextProcess,
            disabled: !textInput.trim(),
            variant: "default" as const,
          },
          {
            id: "clear",
            label: "Clear Data",
            onClick: clearData,
            disabled: data.length === 0,
            variant: "outline" as const,
          },
          {
            id: "export",
            label: "Export CSV",
            onClick: exportData,
            disabled: data.length === 0,
            variant: "outline" as const,
          },
        ]}
      />

      <ResultCard
        title="Data Input"
        description="Upload a CSV file or paste CSV data"
        status="info"
      >
        <div className="space-y-4">
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
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste CSV data here...&#10;&#10;Examples:&#10;SIC Code,Description&#10;1110,Growing of cereals&#10;1120,Growing of rice&#10;&#10;Or with semicolons:&#10;name;age;city&#10;John;30;NYC"
              className="w-full h-32 tool-textarea"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              💡 Tip: Use the &quot;Process CSV&quot; button above to parse your
              data manually
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.length} rows</Badge>
              <Badge variant="outline">{columns.length} columns</Badge>
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              >
                📝 {getDelimiterDisplayName(detectedDelimiter)}
              </Badge>
              {columns.length > 10 && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                >
                  ⚠️ Many columns detected
                </Badge>
              )}
              {fileName && <Badge variant="secondary">{fileName}</Badge>}
            </div>
          )}
        </div>
      </ResultCard>

      {data.length > 0 && (
        <ResultCard
          title="Data Table"
          description={`Showing ${data.length} rows with ${columns.length} columns`}
          status="success"
        >
          <div className="space-y-4">
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
          </div>
        </ResultCard>
      )}
    </div>
  );
}
