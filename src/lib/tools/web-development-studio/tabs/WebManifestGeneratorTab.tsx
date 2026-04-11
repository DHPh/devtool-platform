"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateWebManifest } from "@/lib/processors/web-code-core";

export function WebManifestGeneratorTab() {
  const [name, setName] = useState("DevTool Platform");
  const [shortName, setShortName] = useState("DevTool");
  const [startUrl, setStartUrl] = useState("/");
  const [display, setDisplay] = useState<
    "standalone" | "fullscreen" | "minimal-ui" | "browser"
  >("standalone");
  const [themeColor, setThemeColor] = useState("#111827");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const result = useMemo(
    () =>
      generateWebManifest({
        name,
        shortName,
        startUrl,
        display,
        themeColor,
        backgroundColor,
      }),
    [name, shortName, startUrl, display, themeColor, backgroundColor],
  );

  const fields: Array<[string, string, (value: string) => void]> = [
    ["Application name", name, setName],
    ["Short name", shortName, setShortName],
    ["Start URL", startUrl, setStartUrl],
    ["Theme color", themeColor, setThemeColor],
    ["Background color", backgroundColor, setBackgroundColor],
  ];

  return (
    <section className="space-y-5">
      <Header
        title="Web Manifest Generator"
        description="Generate and validate core installable web app manifest fields."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([label, current, setter]) => (
          <label key={label} className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            <Input
              value={current}
              onChange={(event) => setter(event.target.value)}
            />
          </label>
        ))}
        <label className="space-y-2">
          <span className="text-sm font-medium">Display mode</span>
          <Select
            value={display}
            onValueChange={(value) => setDisplay(value as typeof display)}
          >
            <SelectTrigger aria-label="Display mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                ["standalone", "fullscreen", "minimal-ui", "browser"] as const
              ).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      {result.ok ? (
        <CopyableResult
          value={result.value}
          label="manifest.webmanifest"
          copyLabel="Copy web manifest"
          rows={14}
        />
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
