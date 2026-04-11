"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import {
  generateGitignore,
  type GitignorePreset,
} from "@/lib/processors/devops-validation-core";

const GITIGNORE_PRESET_OPTIONS: Array<{ id: GitignorePreset; label: string }> =
  [
    { id: "node", label: "Node.js" },
    { id: "nextjs", label: "Next.js" },
    { id: "python", label: "Python" },
    { id: "go", label: "Go" },
    { id: "rust", label: "Rust" },
    { id: "java", label: "Java" },
    { id: "macos", label: "macOS" },
    { id: "windows", label: "Windows" },
    { id: "vscode", label: "VS Code" },
    { id: "jetbrains", label: "JetBrains" },
  ];

export function GitignoreGeneratorTab() {
  const [presets, setPresets] = useState<GitignorePreset[]>([
    "node",
    "nextjs",
    "macos",
  ]);
  const [custom, setCustom] = useState(".env\n.env.*\n!.env.example");
  const result = useMemo(
    () => generateGitignore(presets, custom),
    [presets, custom],
  );

  const togglePreset = (preset: GitignorePreset) =>
    setPresets((current) =>
      current.includes(preset)
        ? current.filter((item) => item !== preset)
        : [...current, preset],
    );

  return (
    <section className="space-y-5">
      <Header
        title=".gitignore Generator"
        description="Combine technology and editor presets with custom patterns without duplicate entries."
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Presets</legend>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5">
          {GITIGNORE_PRESET_OPTIONS.map(({ id, label }) => (
            <label
              key={id}
              className="flex items-center gap-2 rounded-md border p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={presets.includes(id)}
                onChange={() => togglePreset(id)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Custom patterns</span>
        <Textarea
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          rows={5}
          className="font-mono"
          spellCheck={false}
        />
      </label>
      {result.ok ? (
        <CopyableResult
          value={result.value}
          label=".gitignore"
          copyLabel="Copy .gitignore"
          rows={18}
        />
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
