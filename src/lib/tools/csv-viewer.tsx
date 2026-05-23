"use client";

import { useState } from "react";
import { DataTable, QuickActions, ResultCard, ToolHeader } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table } from "lucide-react";
import { FileTextIcon as PhosphorFileText } from "@phosphor-icons/react/FileText";
import { LightbulbIcon as Lightbulb } from "@phosphor-icons/react/Lightbulb";
import { WarningIcon as Warning } from "@phosphor-icons/react/Warning";
import { toast } from "sonner";
import {
  getDelimiterDisplayName,
  parseCSV,
  serializeCSV,
} from "@/lib/processors/csv";

type CSVRow = Record<string, unknown>;

export default function CSVViewer() {
  const [data, setData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [detectedDelimiter, setDetectedDelimiter] = useState(",");
  const [parseIssueCount, setParseIssueCount] = useState(0);
  const [textInput, setTextInput] = useState("");

  const applyParsedResult = (
    result: ReturnType<typeof parseCSV>,
    sourceName: string,
  ) => {
    const rows = result.data as CSVRow[];
    setData(rows);
    setHeaders(
      result.headers.length > 0
        ? result.headers
        : Object.keys(rows[0] ?? {}),
    );
    setDetectedDelimiter(result.delimiter);
    setParseIssueCount(result.issues.length);
    setFileName(sourceName);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
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
          convertValues: false,
        });
        applyParsedResult(result, file.name);
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
      let result = parseCSV(text, {
        hasHeader: true,
        skipEmptyLines: true,
        convertValues: false,
      });

      if (result.headers.length > 10) {
        for (const delimiter of [";", "\t"] as const) {
          try {
            const candidate = parseCSV(text, {
              delimiter,
              hasHeader: true,
              skipEmptyLines: true,
              convertValues: false,
            });
            if (
              candidate.headers.length < result.headers.length &&
              candidate.headers.length > 1
            ) {
              result = candidate;
            }
          } catch {
            // Ignore fallback delimiter parse errors
          }
        }
      }

      applyParsedResult(result, "Manual Input");
      toast.success(
        `Loaded ${result.rowCount} rows with ${result.headers.length} columns`,
      );

      if (result.headers.length > 10) {
        toast.warning(
          "Detected many columns. Data may contain unquoted commas. Consider using proper CSV format with quoted values.",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error parsing CSV: ${errorMessage}`);
    }
  };

  const exportData = () => {
    if (data.length === 0) return;

    const exportHeaders = headers.length > 0 ? headers : Object.keys(data[0]);
    const csvContent = serializeCSV(data, exportHeaders, {
      delimiter: detectedDelimiter,
      safeSpreadsheet: true,
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      fileName && fileName !== "Manual Input"
        ? `${fileName.replace(/\.csv$/i, "")}_processed.csv`
        : "data.csv";
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    toast.success("Data exported!");
  };

  const loadSampleData = () => {
    const sampleCSV = `SIC Code,Description
1110,"Growing of cereals (except rice), leguminous crops and oil seeds"
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
    setHeaders([]);
    setFileName("");
    setDetectedDelimiter(",");
    setParseIssueCount(0);
    setTextInput("");
  };

  const columnCount =
    headers.length > 0 ? headers.length : Object.keys(data[0] ?? {}).length;

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
              spellCheck={false}
            />
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lightbulb aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>
                Tip: Use the &quot;Process CSV&quot; button above to parse your
                data manually
              </span>
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.length} rows</Badge>
              <Badge variant="outline">{columnCount} columns</Badge>
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              >
                <PhosphorFileText
                  aria-hidden="true"
                  className="h-3.5 w-3.5 mr-1"
                />
                {getDelimiterDisplayName(detectedDelimiter)}
              </Badge>
              {columnCount > 10 && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                >
                  <Warning aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
                  Many columns detected
                </Badge>
              )}
              {parseIssueCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                >
                  <Warning aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
                  {parseIssueCount} row{parseIssueCount === 1 ? "" : "s"}{" "}
                  with unequal columns
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
          description={`Showing ${data.length} rows with ${columnCount} columns`}
          status="success"
        >
          <DataTable
            data={data}
            headers={headers}
            defaultPageSize={20}
            searchPlaceholder="Search all columns..."
          />
        </ResultCard>
      )}
    </div>
  );
}
