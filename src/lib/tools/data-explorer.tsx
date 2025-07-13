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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { parseCSV, getDelimiterDisplayName } from "@/lib/utils/csv-parser";
import { parseJSON } from "@/lib/utils/json-parser";

export const metadata = {
  id: "data-explorer",
  name: "Data Explorer",
  description:
    "Advanced data analysis with statistics, filtering, and visualization",
  category: "Data Processing",
  tags: ["data", "analysis", "statistics", "explorer"],
  path: "/tools/data-explorer",
  icon: "🔍",
};

interface DataRow {
  [key: string]: unknown;
}

interface ColumnStats {
  column: string;
  type: "string" | "number" | "boolean" | "date" | "mixed";
  count: number;
  nullCount: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  avg?: number;
  sum?: number;
  mostCommon?: string;
}

export default function DataExplorer() {
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<DataRow>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [fileName, setFileName] = useState("");
  const [stats, setStats] = useState<ColumnStats[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<
    "auto" | "csv" | "json" | "tsv"
  >("auto");
  const [detectedDelimiter, setDetectedDelimiter] = useState<string>("");
  const [hasNestedData, setHasNestedData] = useState(false);

  const detectColumnType = (values: unknown[]): ColumnStats["type"] => {
    const nonNullValues = values.filter(
      (v) => v !== null && v !== undefined && v !== ""
    );
    if (nonNullValues.length === 0) return "string";

    let numberCount = 0;
    let booleanCount = 0;
    let dateCount = 0;

    for (const value of nonNullValues) {
      const strValue = String(value).trim();

      if (strValue === "true" || strValue === "false") {
        booleanCount++;
      } else if (!isNaN(Number(strValue)) && strValue !== "") {
        numberCount++;
      } else if (!isNaN(Date.parse(strValue))) {
        dateCount++;
      }
    }

    const total = nonNullValues.length;
    if (booleanCount === total) return "boolean";
    if (numberCount === total) return "number";
    if (dateCount === total) return "date";
    if (numberCount > total * 0.8) return "number";
    if (booleanCount > total * 0.8) return "boolean";
    if (dateCount > total * 0.8) return "date";

    return numberCount > 0 || booleanCount > 0 || dateCount > 0
      ? "mixed"
      : "string";
  };

  const calculateStats = (data: DataRow[]): ColumnStats[] => {
    if (data.length === 0) return [];

    const allKeys = new Set<string>();
    data.forEach((row) => Object.keys(row).forEach((key) => allKeys.add(key)));

    return Array.from(allKeys).map((column) => {
      const values = data.map((row) => row[column]);
      const nonNullValues = values.filter(
        (v) => v !== null && v !== undefined && v !== ""
      );
      const type = detectColumnType(values);

      const stat: ColumnStats = {
        column,
        type,
        count: values.length,
        nullCount: values.length - nonNullValues.length,
        uniqueCount: new Set(nonNullValues.map((v) => String(v))).size,
      };

      if (type === "number" || type === "mixed") {
        const numericValues = nonNullValues
          .map((v) => Number(v))
          .filter((n) => !isNaN(n));

        if (numericValues.length > 0) {
          stat.min = Math.min(...numericValues);
          stat.max = Math.max(...numericValues);
          stat.avg =
            numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          stat.sum = numericValues.reduce((a, b) => a + b, 0);
        }
      }

      // Most common value
      const valueCounts = new Map<string, number>();
      nonNullValues.forEach((v) => {
        const strValue = String(v);
        valueCounts.set(strValue, (valueCounts.get(strValue) || 0) + 1);
      });

      if (valueCounts.size > 0) {
        const mostCommonEntry = Array.from(valueCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0];
        stat.mostCommon = mostCommonEntry[0];
      }

      return stat;
    });
  };

  const parseData = (text: string, format: string): DataRow[] => {
    if (
      format === "json" ||
      (format === "auto" && text.trim().startsWith("["))
    ) {
      setDetectedDelimiter(""); // Clear delimiter for JSON
      try {
        const result = parseJSON(text, { maxDepth: 15 });
        setHasNestedData(result.hasNestedData);
        return result.data;
      } catch (error) {
        throw new Error(
          `JSON parsing error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Enhanced CSV/TSV parsing with auto-delimiter detection
    let format_to_use = format;
    if (format === "auto") {
      if (text.trim().startsWith("[")) {
        format_to_use = "json";
      } else if (text.includes("\t")) {
        format_to_use = "tsv";
      } else {
        format_to_use = "csv";
      }
    }

    if (format_to_use === "json") {
      setDetectedDelimiter(""); // Clear delimiter for JSON
      try {
        const result = parseJSON(text, { maxDepth: 15 });
        setHasNestedData(result.hasNestedData);
        return result.data;
      } catch (error) {
        throw new Error(
          `JSON parsing error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Use shared CSV parser
    const result = parseCSV(text, {
      delimiter: format_to_use === "tsv" ? "\t" : undefined, // Let auto-detection work for CSV
      hasHeader: true,
      skipEmptyLines: true,
    });

    console.log("Parse result:", {
      delimiter: result.delimiter,
      rowCount: result.rowCount,
      headers: result.headers,
    });

    // Store detected delimiter for UI display
    setDetectedDelimiter(result.delimiter);
    // CSV data is not nested
    setHasNestedData(false);

    return result.data;
  };

  const createColumns = (data: DataRow[]): ColumnDef<DataRow>[] => {
    if (data.length === 0) return [];

    const columnHelper = createColumnHelper<DataRow>();
    const allKeys = new Set<string>();

    data.forEach((row) => Object.keys(row).forEach((key) => allKeys.add(key)));
    const keys = Array.from(allKeys).sort();

    return keys.map((key) =>
      columnHelper.accessor((row) => row[key], {
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
          const stringValue = String(value);
          if (stringValue.length > 100) {
            return (
              <span title={stringValue} className="truncate block max-w-xs">
                {stringValue.substring(0, 100)}...
              </span>
            );
          }
          return <span>{stringValue}</span>;
        },
      })
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        let format = selectedFormat;
        if (format === "auto") {
          if (file.name.endsWith(".json")) format = "json";
          else if (file.name.endsWith(".tsv")) format = "tsv";
          else format = "csv";
        }

        const parsedData = parseData(text, format);
        setData(parsedData);
        setColumns(createColumns(parsedData));
        setStats(calculateStats(parsedData));
        setFileName(file.name);
        toast.success(`Loaded ${parsedData.length} rows from ${file.name}`);
      } catch {
        toast.error("Error parsing file");
      }
    };
    reader.readAsText(file);
  };

  const handleTextInput = (text: string) => {
    try {
      const parsedData = parseData(text, selectedFormat);
      setData(parsedData);
      setColumns(createColumns(parsedData));
      setStats(calculateStats(parsedData));
      setFileName("Manual Input");
      toast.success(`Loaded ${parsedData.length} rows`);
    } catch {
      toast.error("Error parsing data");
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
        pageSize: 25,
      },
    },
  });

  const exportData = (format: "json" | "csv") => {
    if (data.length === 0) return;

    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      mimeType = "application/json";
      extension = ".json";
    } else {
      const allKeys = new Set<string>();
      data.forEach((row) =>
        Object.keys(row).forEach((key) => allKeys.add(key))
      );
      const headers = Array.from(allKeys).sort();

      const exportDelimiter = detectedDelimiter || ",";

      content = [
        headers.join(exportDelimiter),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              return value === null || value === undefined
                ? ""
                : `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(exportDelimiter)
        ),
      ].join("\n");
      mimeType = "text/csv";
      extension = ".csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName.split(".")[0] || "data") + "_processed" + extension;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Data exported as ${format.toUpperCase()}!`);
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setStats([]);
    setFileName("");
    setDetectedDelimiter("");
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
            Data Input
          </CardTitle>
          <CardDescription>
            Upload or paste data for advanced analysis and exploration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format-select">Data Format</Label>
              <Select
                value={selectedFormat}
                onValueChange={(value: typeof selectedFormat) =>
                  setSelectedFormat(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="tsv">TSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json,.tsv,.txt"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearData}
                disabled={data.length === 0}
              >
                Clear Data
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-text">Or Paste Data</Label>
            <textarea
              id="data-text"
              placeholder='Paste your data here...&#10;&#10;CSV: name,age,city&#10;John,30,NYC&#10;&#10;CSV (;): name;age;city&#10;John;30;NYC&#10;&#10;JSON: [{"name":"John","age":30}]&#10;&#10;Nested JSON: [{"user":{"name":"John","contact":{"email":"john@test.com"}}}]'
              className="w-full h-32 tool-textarea"
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
                  "data-text"
                ) as HTMLTextAreaElement;
                if (textarea && textarea.value.trim()) {
                  handleTextInput(textarea.value);
                }
              }}
            >
              Process Data
            </Button>
          </div>

          {data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.length} rows</Badge>
              <Badge variant="outline">{columns.length} columns</Badge>
              {detectedDelimiter && (
                <Badge variant="outline">
                  Format: {getDelimiterDisplayName(detectedDelimiter)}
                </Badge>
              )}
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

      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Column Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Column</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Count</th>
                    <th className="text-left p-2">Null</th>
                    <th className="text-left p-2">Unique</th>
                    <th className="text-left p-2">Min</th>
                    <th className="text-left p-2">Max</th>
                    <th className="text-left p-2">Avg</th>
                    <th className="text-left p-2">Most Common</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.column} className="border-b">
                      <td className="p-2 font-medium">{stat.column}</td>
                      <td className="p-2">
                        <Badge variant="outline">{stat.type}</Badge>
                      </td>
                      <td className="p-2">{stat.count}</td>
                      <td className="p-2">{stat.nullCount}</td>
                      <td className="p-2">{stat.uniqueCount}</td>
                      <td className="p-2 font-mono">
                        {stat.min !== undefined
                          ? stat.min.toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2 font-mono">
                        {stat.max !== undefined
                          ? stat.max.toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2 font-mono">
                        {stat.avg !== undefined ? stat.avg.toFixed(2) : "-"}
                      </td>
                      <td
                        className="p-2 max-w-xs truncate"
                        title={stat.mostCommon}
                      >
                        {stat.mostCommon || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Data Table
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData("json")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData("csv")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
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
