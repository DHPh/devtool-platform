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
  ResponsiveTextArea,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Table,
} from "lucide-react";
import { toast } from "sonner";
import { parseJSON } from "@/lib/utils/json-parser";

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
  const [jsonInput, setJsonInput] = useState("");
  const [data, setData] = useState<JSONRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<JSONRow>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [fileName, setFileName] = useState("");
  const [hasNestedData, setHasNestedData] = useState(false);

  const processJSONData = (text: string) => {
    try {
      const result = parseJSON(text, { maxDepth: 20 });

      if (result.data.length === 0) {
        toast.error("Could not parse JSON data. Please check the format.");
        return;
      }

      setData(result.data);
      setHasNestedData(result.hasNestedData);

      // Create columns
      const columnHelper = createColumnHelper<JSONRow>();
      const newColumns = result.headers.map((header) =>
        columnHelper.accessor(
          // Custom accessor function to handle flattened keys
          (row) => row[header],
          {
            id: header,
            header: header,
            cell: (info) => {
              const value = info.getValue();

              if (value === null)
                return <span className="text-gray-400 italic">null</span>;
              if (value === undefined)
                return <span className="text-gray-400 italic">undefined</span>;
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
              if (typeof value === "string") {
                // Check if it's a JSON string (starts with [ or {)
                if (
                  (value.startsWith("[") && value.endsWith("]")) ||
                  (value.startsWith("{") && value.endsWith("}"))
                ) {
                  return (
                    <span className="font-mono text-purple-600 dark:text-purple-400 text-sm">
                      {value}
                    </span>
                  );
                }
                // Check if it's a date string
                if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                  return (
                    <span className="text-blue-600 dark:text-blue-400">
                      {value}
                    </span>
                  );
                }
                // Truncate long strings
                if (value.length > 100) {
                  return (
                    <span title={value}>{value.substring(0, 100)}...</span>
                  );
                }
              }
              return <span className="break-all">{String(value)}</span>;
            },
          }
        )
      );

      setColumns(newColumns);
      toast.success(
        `Loaded ${result.rowCount} rows with ${result.headers.length} columns`
      );

      if (result.hasNestedData) {
        toast.info("Nested data has been flattened into columns");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error parsing JSON: ${errorMessage}`);
    }
  };

  const handleFileUpload = (content: string, fileName: string) => {
    setJsonInput(content);
    setFileName(fileName);
    processJSONData(content);
  };

  const parseJSONData = () => {
    if (!jsonInput.trim()) {
      toast.error("Please enter JSON data");
      return;
    }
    processJSONData(jsonInput);
  };

  const loadSampleData = () => {
    const sampleJSON = JSON.stringify(
      [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          age: 30,
          active: true,
          address: {
            street: "123 Main St",
            city: "New York",
            zipCode: "10001",
          },
          skills: ["JavaScript", "React", "Node.js"],
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          age: 25,
          active: false,
          address: {
            street: "456 Oak Ave",
            city: "Los Angeles",
            zipCode: "90210",
          },
          skills: ["Python", "Django", "PostgreSQL"],
        },
        {
          id: 3,
          name: "Bob Johnson",
          email: "bob@example.com",
          age: 35,
          active: true,
          address: {
            street: "789 Pine Rd",
            city: "Chicago",
            zipCode: "60601",
          },
          skills: ["Java", "Spring", "MySQL"],
        },
      ],
      null,
      2
    );

    setJsonInput(sampleJSON);
    processJSONData(sampleJSON);
    setFileName("sample-data.json");
  };

  const clearData = () => {
    setJsonInput("");
    setData([]);
    setColumns([]);
    setFileName("");
    setGlobalFilter("");
    setSorting([]);
    setColumnFilters([]);
    setHasNestedData(false);
    toast.success("Data cleared");
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error("No data to download");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const stringValue =
              value === null || value === undefined ? "" : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.json$/i, ".csv") || "json-data.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const downloadJSON = () => {
    if (data.length === 0) {
      toast.error("No data to download");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "processed-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully");
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
        title="JSON Table Viewer"
        description="Convert JSON data to interactive table with filtering and sorting"
        icon={Table}
      />

      <QuickActions
        actions={[
          {
            id: "sample",
            label: "Load Sample JSON",
            onClick: loadSampleData,
            variant: "outline" as const,
          },
          {
            id: "parse",
            label: "Parse JSON",
            onClick: parseJSONData,
            disabled: !jsonInput.trim(),
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
        title="JSON Data Input"
        description="Upload a JSON file or paste JSON data to view in an interactive table"
        status="info"
      >
        <div className="space-y-4">
          {fileName && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{fileName}</span>
            </div>
          )}

          <FileUploadZone
            onFileSelect={handleFileUpload}
            acceptedTypes={[".json"]}
            maxSizeInMB={10}
            placeholder="Upload JSON file"
          />

          <div className="space-y-2">
            <Label htmlFor="json-input">Or Paste JSON Data</Label>
            <ResponsiveTextArea
              value={jsonInput}
              onChange={setJsonInput}
              placeholder="Paste your JSON data here..."
              minHeight={200}
              showCharacterCount={true}
            />
          </div>
        </div>
      </ResultCard>

      {data.length > 0 && (
        <ResultCard
          title="JSON Table"
          description={`Showing ${table.getFilteredRowModel().rows.length} of ${
            data.length
          } rows`}
          status="success"
        >
          <div className="space-y-4">
            {hasNestedData && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                >
                  📊 Nested data flattened
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Complex nested objects have been flattened into columns
                </span>
              </div>
            )}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search across all columns..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                <Button variant="outline" size="sm" onClick={downloadJSON}>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
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
