"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CopyableResult,
  FormField,
  ModeTabs,
  QuickActions,
  ResponsiveTextArea,
  ResultCard,
  SettingsPanel,
  ToolHeader,
  ValidationMessages,
} from "@/components/layout";
import {
  FormatterSyntaxError,
  formatHtmlSource,
} from "@/lib/processors/source-formatters";

const SAMPLES = {
  basic: `<div><h1>Title</h1><!-- keep --><p>This is <strong>parser-aware</strong> HTML.</p></div>`,
  embedded: `<main><style>.card{--label:"a;b}";color:red}</style><script>const state={text:"};{"};console.log(state)</script><template><section>{{ user.name }}</section></template></main>`,
  form: `<form><label for="email">Email</label><input id="email" type="email" required><button type="submit">Submit</button></form>`,
};

export default function HtmlFormatter() {
  const [input, setInput] = useState(SAMPLES.basic);
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const [indentType, setIndentType] = useState("spaces");
  const [activeTab, setActiveTab] = useState("input");
  const [errors, setErrors] = useState<string[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);

  const runFormatter = async () => {
    if (!input.trim()) {
      setOutput("");
      setErrors([]);
      return;
    }
    setIsFormatting(true);
    try {
      const formatted = await formatHtmlSource(input, {
        indentSize: Number(indentSize),
        useTabs: indentType === "tabs",
      });
      setOutput(formatted);
      setErrors([]);
      setActiveTab("output");
      toast.success("HTML parsed and formatted locally.");
    } catch (error) {
      const message = error instanceof FormatterSyntaxError ? error.message : "Unable to format HTML.";
      setOutput("");
      setErrors([message]);
      toast.error(message);
    } finally {
      setIsFormatting(false);
    }
  };

  const downloadFile = () => {
    const url = URL.createObjectURL(new Blob([output], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "formatted.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader title="HTML Formatter" description="Parser-backed HTML formatting with embedded script, style, and template support" icon={FileText} />
      <QuickActions actions={[
        { id: "basic", label: "Basic HTML", onClick: () => setInput(SAMPLES.basic) },
        { id: "embedded", label: "Embedded Content", onClick: () => setInput(SAMPLES.embedded) },
        { id: "form", label: "HTML Form", onClick: () => setInput(SAMPLES.form) },
        { id: "format", label: isFormatting ? "Formatting…" : "Format HTML", onClick: () => void runFormatter(), variant: "default" as const },
        { id: "clear", label: "Clear", onClick: () => { setInput(""); setOutput(""); setErrors([]); }, variant: "outline" as const },
      ]} />

      <ModeTabs value={activeTab} onValueChange={setActiveTab} options={[{ value: "input", label: "Input" }, { value: "output", label: "Formatted" }]} />
      {activeTab === "input" ? (
        <div>
          <label className="block text-sm font-medium mb-2">HTML Input</label>
          <ResponsiveTextArea placeholder="Enter an HTML document or fragment..." value={input} onChange={setInput} minHeight={300} showCharacterCount showLineCount />
        </div>
      ) : (
        <div className="space-y-4">
          <ResultCard
            title="Formatted Output"
            status={output ? "success" : "info"}
            description="Parser-produced HTML; comments and embedded language content are preserved"
            onDownload={output ? downloadFile : undefined}
            downloadLabel="Download HTML"
          >
            <CopyableResult value={output} placeholder="Formatted HTML will appear here..." fontFamily="mono" rows={15} />
          </ResultCard>
          <ValidationMessages errors={errors} warnings={[]} />
        </div>
      )}

      {activeTab === "input" && errors.length > 0 && <ValidationMessages errors={errors} warnings={[]} />}

      <SettingsPanel title="Formatting Options">
        <FormField label="Indent Size" description="Visual indentation width from 1 to 8 columns">
          <Select value={indentSize} onValueChange={setIndentSize}><SelectTrigger aria-label="Indent size"><SelectValue /></SelectTrigger><SelectContent>{[2, 4, 6, 8].map(value => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select>
        </FormField>
        <FormField label="Indent Type" description="Use spaces or tab characters">
          <Select value={indentType} onValueChange={setIndentType}><SelectTrigger aria-label="Indent type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="spaces">Spaces</SelectItem><SelectItem value="tabs">Tabs</SelectItem></SelectContent></Select>
        </FormField>
      </SettingsPanel>

      <ResultCard title="Parser-backed behavior" description="Formatting is syntax-aware rather than tokenized with regular expressions" status="info">
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Preserves HTML comments and template content</li>
          <li>Parses and formats embedded script and style blocks</li>
          <li>Handles quoted angle brackets, braces, and semicolons safely</li>
          <li>Reports parser locations for invalid syntax</li>
          <li>Runs entirely in your browser</li>
        </ul>
      </ResultCard>
    </div>
  );
}
