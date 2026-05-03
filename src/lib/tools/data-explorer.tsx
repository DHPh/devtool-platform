"use client";

import { useState } from "react";
import {
  DataTable,
  FileUploadZone,
  QuickActions,
  ResultCard,
  ToolHeader,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  getDelimiterDisplayName,
  parseCSV,
  serializeCSV,
} from "@/lib/processors/csv";
import { parseJsonTable } from "@/lib/processors/json-table";

type DataRow = Record<string, unknown>;

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
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [stats, setStats] = useState<ColumnStats[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<
    "auto" | "csv" | "json" | "tsv"
  >("auto");
  const [textData, setTextData] = useState("");
  const [hasNestedData, setHasNestedData] = useState(false);
  const [detectedDelimiter, setDetectedDelimiter] = useState(",");
  const [parseIssueCount, setParseIssueCount] = useState(0);

  const detectColumnType = (values: unknown[]): ColumnStats["type"] => {
    const nonNullValues = values.filter(
      (v) => v !== null && v !== undefined && v !== "",
    );
    if (nonNullValues.length === 0) return "string";

    let numberCount = 0;
    let booleanCount = 0;
    let dateCount = 0;

    for (const value of nonNullValues) {
      const rawValue = String(value);
      const strValue = rawValue.trim();

      if (
        rawValue === strValue &&
        /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(strValue) &&
        Number.isFinite(Number(strValue))
      ) {
        numberCount++;
      } else if (
        strValue.toLowerCase() === "true" ||
        strValue.toLowerCase() === "false"
      ) {
        booleanCount++;
      } else if (
        /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(
          strValue,
        ) &&
        Number.isFinite(Date.parse(strValue))
      ) {
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

  const calculateStats = (rows: DataRow[], columns: string[]): ColumnStats[] => {
    if (rows.length === 0) return [];

    return columns.map((column) => {
      const values = rows.map((row) => row[column]);
      const nonNullValues = values.filter(
        (v) => v !== null && v !== undefined && v !== "",
      );
      const type = detectColumnType(values);

      const uniqueValues = [...new Set(values.map((v) => String(v)))];
      const valueCounts = values.reduce((acc: Record<string, number>, val) => {
        const str = String(val);
        acc[str] = (acc[str] || 0) + 1;
        return acc;
      }, {});

      const mostCommon = Object.entries(valueCounts).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0];

      const colStats: ColumnStats = {
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
          colStats.min = Math.min(...numbers);
          colStats.max = Math.max(...numbers);
          colStats.avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          colStats.sum = numbers.reduce((a, b) => a + b, 0);
        }
      }

      return colStats;
    });
  };

  const processData = (text: string, format: string) => {
    let parsedData: DataRow[] = [];
    let parsedHeaders: string[] = [];
    let delimiter = ",";
    let hasNested = false;
    let csvIssueCount = 0;

    if (
      format === "csv" ||
      (format === "auto" &&
        !text.trim().startsWith("[") &&
        !text.trim().startsWith("{"))
    ) {
      try {
        const result = parseCSV(text, { convertValues: false });
        parsedData = result.data as DataRow[];
        parsedHeaders = result.headers;
        delimiter = result.delimiter;
        csvIssueCount = result.issues.length;
        setDetectedDelimiter(delimiter);
      } catch (error) {
        toast.error(
          `Error parsing CSV data: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        return;
      }
    } else if (
      format === "json" ||
      (format === "auto" &&
        (text.trim().startsWith("[") || text.trim().startsWith("{")))
    ) {
      const parsed = parseJsonTable(text, { maxDepth: 20 });
      if (!parsed.ok) {
        toast.error(`Error parsing JSON data: ${parsed.error}`);
        return;
      }
      parsedData = parsed.value.data as DataRow[];
      parsedHeaders = parsed.value.headers;
      hasNested = parsed.value.hasNestedData;
    } else if (format === "tsv") {
      try {
        const result = parseCSV(text, {
          delimiter: "\t",
          convertValues: false,
        });
        parsedData = result.data as DataRow[];
        parsedHeaders = result.headers;
        delimiter = "\t";
        csvIssueCount = result.issues.length;
        setDetectedDelimiter(delimiter);
      } catch (error) {
        toast.error(
          `Error parsing TSV data: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        return;
      }
    } else {
      try {
        const result = parseCSV(text, { convertValues: false });
        parsedData = result.data as DataRow[];
        parsedHeaders = result.headers;
        delimiter = result.delimiter;
        csvIssueCount = result.issues.length;
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

    const resolvedHeaders =
      parsedHeaders.length > 0 ? parsedHeaders : Object.keys(parsedData[0]);

    setData(parsedData);
    setHeaders(resolvedHeaders);
    setHasNestedData(hasNested);
    setParseIssueCount(csvIssueCount);
    setStats(calculateStats(parsedData, resolvedHeaders));

    const formatDisplay =
      format === "auto"
        ? delimiter === "\t"
          ? "TSV"
          : delimiter === ";"
            ? "CSV (;)"
            : "CSV (,)"
        : format.toUpperCase();

    toast.success(
      `Loaded ${parsedData.length} rows with ${resolvedHeaders.length} columns from ${formatDisplay}`,
    );

    if (hasNested) {
      toast.info("Nested data has been flattened into columns");
    }
  };

  const handleFileUpload = (content: string, uploadedName: string) => {
    setFileName(uploadedName);
    const extension = uploadedName.split(".").pop()?.toLowerCase();
    const detectedFormat =
      extension === "json" ? "json" : extension === "tsv" ? "tsv" : "csv";
    processData(
      content,
      selectedFormat === "auto" ? detectedFormat : selectedFormat,
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
    setHeaders([]);
    setStats([]);
    setTextData("");
    setFileName("");
    setHasNestedData(false);
    setDetectedDelimiter(",");
    setParseIssueCount(0);
    toast.success("Data cleared");
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error("No data to download");
      return;
    }

    const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);
    const csvContent = serializeCSV(data, csvHeaders, {
      delimiter: detectedDelimiter,
      safeSpreadsheet: true,
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName
      ? `${fileName.replace(/\.(?:csv|tsv|json|txt)$/i, "")}-export.csv`
      : "data-export.csv";
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    toast.success("Data exported successfully");
  };

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
                <SelectTrigger id="format-select" aria-label="Input data format">
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
                <div className="flex items-center gap-2 p-2 bg-muted/50 border border-border rounded">
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
              className="w-full h-32 p-3 border rounded-lg resize-none font-mono text-sm bg-background"
              spellCheck={false}
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
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
                {parseIssueCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                  >
                    ⚠️ {parseIssueCount} row
                    {parseIssueCount === 1 ? "" : "s"} with unequal columns
                  </Badge>
                )}
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
                  <div className="space-y-1 text-sm text-muted-foreground">
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
          description={`Showing ${data.length} rows`}
          status="success"
        >
          <DataTable
            data={data}
            headers={headers}
            defaultPageSize={10}
            searchPlaceholder="Search across all columns..."
          />
        </ResultCard>
      )}
    </div>
  );
}
