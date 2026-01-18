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
  ToolHeader,
  QuickActions,
  ResultCard,
  FileUploadZone,
} from "@/components/layout";
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
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BarChart3,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { parseCSV, getDelimiterDisplayName } from "@/lib/processors/csv";
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
  const [textData, setTextData] = useState("");
  const [hasNestedData, setHasNestedData] = useState(false);
  const [detectedDelimiter, setDetectedDelimiter] = useState(",");

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

      if (!isNaN(Number(strValue)) && strValue !== "") {
        numberCount++;
      } else if (
        strValue.toLowerCase() === "true" ||
        strValue.toLowerCase() === "false"
      ) {
        booleanCount++;
      } else if (!isNaN(Date.parse(strValue))) {
        dateCount++;
      }
    }

    const total = nonNullValues.length;
    if (numberCount / total > 0.8) return "number";
    if (booleanCount / total > 0.8) return "boolean";
    if (dateCount / total > 0.8) return "date";
    if (numberCount > 0 || booleanCount > 0 || dateCount > 0) return "mixed";
    return "string";
  };

  const calculateStats = (data: DataRow[]): ColumnStats[] => {
    if (data.length === 0) return [];

    const columnNames = Object.keys(data[0]);
    return columnNames.map((column) => {
      const values = data.map((row) => row[column]);
      const nonNullValues = values.filter(
        (v) => v !== null && v !== undefined && v !== ""
      );
      const type = detectColumnType(values);

      const uniqueValues = [...new Set(values.map((v) => String(v)))];
      const valueCounts = values.reduce((acc: Record<string, number>, val) => {
        const str = String(val);
        acc[str] = (acc[str] || 0) + 1;
        return acc;
      }, {});

      const mostCommon = Object.entries(valueCounts).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];

      const stats: ColumnStats = {
        column,
        type,
        count: values.length,
        nullCount: values.length - nonNullValues.length,
        uniqueCount: uniqueValues.length,
        mostCommon,
      };

      if (type === "number") {
        const numbers = nonNullValues
          .map((v) => Number(v))
          .filter((n) => !isNaN(n));
        if (numbers.length > 0) {
          stats.min = Math.min(...numbers);
          stats.max = Math.max(...numbers);
          stats.avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          stats.sum = numbers.reduce((a, b) => a + b, 0);
        }
      }

      return stats;
    });
  };

  const processData = (text: string, format: string) => {
    let parsedData: DataRow[] = [];
    let delimiter = ",";
    let hasNested = false;

    // Better auto-detection logic
    if (
      format === "csv" ||
      (format === "auto" &&
        !text.trim().startsWith("[") &&
        !text.trim().startsWith("{"))
    ) {
      try {
        const result = parseCSV(text);
        parsedData = result.data as DataRow[];
        delimiter = result.delimiter;
        setDetectedDelimiter(delimiter);
      } catch {
        toast.error("Error parsing CSV data");
        return;
      }
    } else if (
      format === "json" ||
      (format === "auto" &&
        (text.trim().startsWith("[") || text.trim().startsWith("{")))
    ) {
      try {
        const result = parseJSON(text, { maxDepth: 20 });
        parsedData = result.data as DataRow[];
        hasNested = result.hasNestedData;
        setHasNestedData(hasNested);

        // Debug logging
        console.log("Data Explorer - Parsed JSON result:", result);
        console.log("Data Explorer - Sample row:", result.data[0]);
        console.log("Data Explorer - Headers:", result.headers);
      } catch (error) {
        console.error("Data Explorer - JSON parsing error:", error);
        toast.error("Error parsing JSON data");
        return;
      }
    } else if (format === "tsv") {
      try {
        const result = parseCSV(text, { delimiter: "\t" });
        parsedData = result.data as DataRow[];
        delimiter = "\t";
        setDetectedDelimiter(delimiter);
      } catch {
        toast.error("Error parsing TSV data");
        return;
      }
    } else {
      // Default to CSV
      try {
        const result = parseCSV(text);
        parsedData = result.data as DataRow[];
        delimiter = result.delimiter;
        setDetectedDelimiter(delimiter);
      } catch {
        toast.error("Error parsing data");
        return;
      }
    }

    if (parsedData.length === 0) {
      toast.error("Could not parse the data. Please check the format.");
      return;
    }

    setData(parsedData);
    const newStats = calculateStats(parsedData);
    setStats(newStats);

    // Create columns for table
    const columnHelper = createColumnHelper<DataRow>();
    const newColumns = Object.keys(parsedData[0]).map((key) =>
      columnHelper.accessor(
        // Custom accessor function to handle flattened keys
        (row) => row[key],
        {
          id: key,
          header: key,
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
              return (
                <span className="font-mono">{value.toLocaleString()}</span>
              );
            }
            return <span>{String(value)}</span>;
          },
        }
      )
    );
    setColumns(newColumns);

    const formatDisplay =
      format === "auto"
        ? delimiter === "\t"
          ? "TSV"
          : delimiter === ";"
          ? "CSV (;)"
          : "CSV (,)"
        : format.toUpperCase();

    toast.success(
      `Loaded ${parsedData.length} rows with ${
        Object.keys(parsedData[0]).length
      } columns from ${formatDisplay}`
    );

    if (hasNested) {
      toast.info("Nested data has been flattened into columns");
    }
  };

  const handleFileUpload = (content: string, fileName: string) => {
    setFileName(fileName);
    const extension = fileName.split(".").pop()?.toLowerCase();
    const detectedFormat =
      extension === "json" ? "json" : extension === "tsv" ? "tsv" : "csv";
    processData(
      content,
      selectedFormat === "auto" ? detectedFormat : selectedFormat
    );
  };

  const handleTextProcess = () => {
    if (!textData.trim()) {
      toast.error("Please enter some data to process");
      return;
    }
    processData(textData, selectedFormat);
  };

  const loadSampleData = () => {
    const sampleCSV = `name,age,city,salary,active
John Doe,30,New York,75000,true
Jane Smith,25,Los Angeles,65000,false
Bob Johnson,35,Chicago,80000,true
Alice Brown,28,Houston,70000,true
Charlie Wilson,32,Phoenix,72000,false`;

    setTextData(sampleCSV);
    processData(sampleCSV, "csv");
    setFileName("sample-data.csv");
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setStats([]);
    setTextData("");
    setFileName("");
    setGlobalFilter("");
    setSorting([]);
    setColumnFilters([]);
    setHasNestedData(false);
    setDetectedDelimiter(",");
    toast.success("Data cleared");
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error("No data to download");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(detectedDelimiter),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const stringValue = String(
              value === null || value === undefined ? "" : value
            );

            // Escape and quote if necessary
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
    a.download = fileName || "data-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Data Explorer"
        description="Advanced data analysis with statistics, filtering, and visualization"
        icon={BarChart3}
      />

      <QuickActions
        actions={[
          {
            id: "sample",
            label: "Load Sample Data",
            onClick: loadSampleData,
            variant: "outline" as const,
          },
          {
            id: "process",
            label: "Process Data",
            onClick: handleTextProcess,
            disabled: !textData.trim(),
            variant: "default" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearData,
            variant: "outline" as const,
          },
        ]}
      />

      <ResultCard
        title="Data Input"
        description="Upload a file or paste data for analysis"
        status="info"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {fileName && (
              <div className="space-y-2">
                <Label>Current File</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{fileName}</span>
                </div>
              </div>
            )}
          </div>

          <FileUploadZone
            onFileSelect={handleFileUpload}
            acceptedTypes={[".csv", ".json", ".tsv", ".txt"]}
            maxSizeInMB={10}
            placeholder="Upload CSV, JSON, TSV, or text files"
          />

          <div className="space-y-2">
            <Label htmlFor="text-data">Or Paste Data</Label>
            <textarea
              id="text-data"
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              placeholder="Paste CSV, JSON, or TSV data here..."
              className="w-full h-32 p-3 border rounded-lg resize-none font-mono text-sm"
            />
          </div>
        </div>
      </ResultCard>

      {stats.length > 0 && (
        <ResultCard
          title="Data Statistics"
          description={`Analysis of ${data.length} rows and ${stats.length} columns`}
          status="success"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasNestedData && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  >
                    📊 Nested data flattened
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                >
                  📝 {getDelimiterDisplayName(detectedDelimiter)}
                </Badge>
              </div>
              <Button onClick={downloadCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.column} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{stat.column}</h4>
                    <Badge variant="outline">{stat.type}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div>Count: {stat.count}</div>
                    <div>Unique: {stat.uniqueCount}</div>
                    <div>Null: {stat.nullCount}</div>
                    {stat.type === "number" && (
                      <>
                        <div>Min: {stat.min?.toFixed(2)}</div>
                        <div>Max: {stat.max?.toFixed(2)}</div>
                        <div>Avg: {stat.avg?.toFixed(2)}</div>
                      </>
                    )}
                    {stat.mostCommon && (
                      <div>Most common: {stat.mostCommon}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResultCard>
      )}

      {data.length > 0 && (
        <ResultCard
          title="Data Table"
          description={`Showing ${table.getFilteredRowModel().rows.length} of ${
            data.length
          } rows`}
          status="success"
        >
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search across all columns..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="p-3 text-left font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3">
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

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="flex gap-2">
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
