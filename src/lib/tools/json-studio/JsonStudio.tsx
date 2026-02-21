/**
 * JSON Studio - Complete JSON processing toolkit
 * Features: formatting, validation, path querying, schema validation, and diff comparison
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode, Download } from "lucide-react";
import { ResponsiveTextArea, FileUploadZone } from "@/components/layout";
import { StudioTabs } from "@/components/studio-tabs";
import { validateJson } from "@/lib/utils/json";
import { JSON_STUDIO_MANIFEST } from "./manifest";

interface JsonStudioProps {
  defaultTab?: string;
  className?: string;
}

function JsonStudioContent({
  defaultTab = "formatter",
  className,
}: JsonStudioProps) {
  const [input, setInput] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate JSON on input change
  useEffect(() => {
    if (!input.trim()) {
      setIsValid(false);
      setError(null);
      return;
    }

    const validation = validateJson(input);
    setIsValid(validation.isValid);
    setError(validation.error || null);
  }, [input]);

  // Handle file upload
  const handleFileSelect = (content: string, fileName: string) => {
    setInput(content);
    // Could use fileName for additional features like displaying file name
    console.log(`Loaded JSON file: ${fileName}`);
  };

  // Handle sample data
  const loadSampleData = () => {
    const sampleJson = {
      name: "John Doe",
      age: 30,
      address: {
        street: "123 Main St",
        city: "New York",
        zipCode: "10001",
        coordinates: {
          lat: 40.7128,
          lng: -74.006,
        },
      },
      hobbies: ["reading", "coding", "traveling"],
      isActive: true,
      lastLogin: "2024-01-15T10:30:00Z",
      profile: {
        bio: "Software developer with a passion for creating efficient solutions",
        skills: ["JavaScript", "TypeScript", "React", "Node.js"],
        experience: {
          years: 5,
          companies: [
            {
              name: "Tech Corp",
              role: "Senior Developer",
              duration: "2020-2024",
            },
            {
              name: "StartupXYZ",
              role: "Full Stack Developer",
              duration: "2018-2020",
            },
          ],
        },
      },
      metadata: {
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        version: 1.2,
      },
    };
    setInput(JSON.stringify(sampleJson, null, 2));
  };

  // Download JSON
  const downloadJson = () => {
    if (!input.trim()) return;

    const blob = new Blob([input], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              JSON Input
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={loadSampleData}
                className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Load Sample
              </button>
              {input.trim() && (
                <button
                  onClick={downloadJson}
                  className="text-sm px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Zone */}
          <FileUploadZone
            onFileSelect={handleFileSelect}
            acceptedTypes={[".json"]}
            maxSizeInMB={10}
            className="mb-4"
          />

          {/* Text Input */}
          <ResponsiveTextArea
            value={input}
            onChange={setInput}
            placeholder="Paste your JSON here or drag and drop a JSON file above..."
            className="min-h-[200px] font-mono"
            minHeight={200}
          />

          {/* Validation Status */}
          {input.trim() && (
            <div className="flex items-center gap-2 text-sm">
              {isValid ? (
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Valid JSON</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Invalid JSON</span>
                  {error && <span className="text-xs">- {error}</span>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tools Tabs */}
      <StudioTabs
        manifest={JSON_STUDIO_MANIFEST}
        componentProps={{ input, onInputChange: setInput }}
        defaultTab={defaultTab}
        listClassName="grid w-full grid-cols-4"
        contentClassName="mt-2"
      />
    </div>
  );
}

export function JsonStudio(props: JsonStudioProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JsonStudioContent {...props} />
    </Suspense>
  );
}

export default JsonStudio;
