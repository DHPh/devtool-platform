"use client";

import { useState } from "react";
import {
  CodeEditor,
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatJavaScript,
  type JavaScriptLanguage,
} from "@/lib/processors/web-code-core";

export function JavaScriptFormatterTab() {
  const [input, setInput] = useState(
    "const user={name:'Ada',active:true};\nconsole.log(user)",
  );
  const [language, setLanguage] = useState<JavaScriptLanguage>("javascript");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [formatting, setFormatting] = useState(false);

  const format = async () => {
    setFormatting(true);
    const result = await formatJavaScript(input, language);
    if (result.ok) {
      setOutput(result.value);
      setError("");
    } else {
      setOutput("");
      setError(result.error);
    }
    setFormatting(false);
  };

  return (
    <section className="space-y-5">
      <Header
        title="JavaScript and TypeScript Formatter"
        description="Format source locally with a parser-backed Prettier engine."
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="w-48 space-y-2">
          <span className="text-sm font-medium">Language</span>
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as JavaScriptLanguage)}
          >
            <SelectTrigger aria-label="Language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <Button
          type="button"
          onClick={() => void format()}
          disabled={formatting}
        >
          {formatting ? "Formatting…" : "Format source"}
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <span className="block text-sm font-medium">Source</span>
          <CodeEditor
            value={input}
            onChange={setInput}
            language={language === "typescript" ? "typescript" : "javascript"}
            aria-label="Source code"
            rows={18}
          />
        </div>
        {error ? (
          <ErrorResult message={error} />
        ) : (
          <CopyableResult
            value={output}
            label="Formatted source"
            copyLabel="Copy formatted source"
            language={language === "typescript" ? "typescript" : "javascript"}
            rows={18}
          />
        )}
      </div>
    </section>
  );
}
