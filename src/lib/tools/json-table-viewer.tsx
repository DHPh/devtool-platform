"use client";

import { useState } from "react";
import {
  DataTable,
  FileUploadZone,
  QuickActions,
  ResponsiveTextArea,
  ResultCard,
  ToolHeader,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Table, Upload } from "lucide-react";
import { TreeStructureIcon as TreeStructure } from "@phosphor-icons/react/TreeStructure";
import { toast } from "sonner";
import { parseJsonTable } from "@/lib/processors/json-table";

type JSONRow = Record<string, unknown>;

export default function JSONTableViewer() {
  const [jsonInput, setJsonInput] = useState("");
  const [data, setData] = useState<JSONRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [hasNestedData, setHasNestedData] = useState(false);

  const processJSONData = (text: string) => {
    const parsed = parseJsonTable(text, { maxDepth: 20 });
    if (!parsed.ok) {
      toast.error(`Error parsing JSON: ${parsed.error}`);
      return;
    }

    const result = parsed.value;
    if (result.data.length === 0) {
      toast.error("Could not parse JSON data. Please check the format.");
      return;
    }

    setData(result.data);
    setHeaders(result.headers);
    setHasNestedData(result.hasNestedData);

    toast.success(
      `Loaded ${result.rowCount} rows with ${result.headers.length} columns`,
    );

    if (result.hasNestedData) {
      toast.info("Nested data has been flattened into columns");
    }
  };

  const handleFileUpload = (content: string, uploadedName: string) => {
    setJsonInput(content);
    setFileName(uploadedName);
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
      2,
    );

    setJsonInput(sampleJSON);
    processJSONData(sampleJSON);
    setFileName("sample-data.json");
  };

  const clearData = () => {
    setJsonInput("");
    setData([]);
    setHeaders([]);
    setFileName("");
    setHasNestedData(false);
    toast.success("Data cleared");
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error("No data to download");
      return;
    }

    const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);
    const csvContent = [
      csvHeaders.join(","),
      ...data.map((row) =>
        csvHeaders
          .map((header) => {
            const value = row[header];
            const stringValue =
              value === null || value === undefined ? "" : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.json$/i, ".csv") || "json-data.csv";
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
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
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    toast.success("JSON exported successfully");
  };

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
            <div className="flex items-center gap-2 p-2 bg-muted/50 border border-border rounded">
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
            <Label htmlFor="json-table-input">Or Paste JSON Data</Label>
            <ResponsiveTextArea
              id="json-table-input"
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
          description={`Showing ${data.length} rows with ${headers.length} columns`}
          status="success"
        >
          <div className="space-y-4">
            {hasNestedData && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                >
                  <TreeStructure
                    aria-hidden="true"
                    className="h-3.5 w-3.5 mr-1"
                  />
                  Nested data flattened
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Complex nested objects have been flattened into columns
                </span>
              </div>
            )}

            <DataTable
              data={data}
              headers={headers}
              defaultPageSize={10}
              searchPlaceholder="Search across all columns..."
              toolbarActions={
                <>
                  <Button variant="outline" size="sm" onClick={downloadCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadJSON}>
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </>
              }
            />
          </div>
        </ResultCard>
      )}
    </div>
  );
}
