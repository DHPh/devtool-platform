"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateOpenGraphTags } from "@/lib/processors/web-code-core";

export function OpenGraphGeneratorTab() {
  const [title, setTitle] = useState("DevTool Platform");
  const [description, setDescription] = useState(
    "Fast developer utilities that run in your browser.",
  );
  const [url, setUrl] = useState("https://example.com/tools");
  const [image, setImage] = useState("https://example.com/og.png");
  const [siteName, setSiteName] = useState("DevTool Platform");

  const result = useMemo(
    () =>
      generateOpenGraphTags({
        title,
        description,
        url,
        image,
        siteName,
      }),
    [title, description, url, image, siteName],
  );

  const fields: Array<[string, string, (value: string) => void]> = [
    ["Title", title, setTitle],
    ["Site name", siteName, setSiteName],
    ["Canonical URL", url, setUrl],
    ["Image URL", image, setImage],
  ];

  return (
    <section className="space-y-5">
      <Header
        title="Open Graph Generator"
        description="Generate escaped Open Graph and Twitter card meta tags."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([label, current, setter]) => (
          <label key={label} className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            <Input
              value={current}
              onChange={(event) => setter(event.target.value)}
            />
          </label>
        ))}
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Description</span>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </label>
      {result.ok ? (
        <CopyableResult
          value={result.value}
          label="Meta tags"
          copyLabel="Copy meta tags"
          rows={14}
        />
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
