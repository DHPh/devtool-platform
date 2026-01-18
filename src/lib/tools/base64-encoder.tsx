"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
  ResponsiveTextArea,
  ModeTabs,
} from "@/components/layout";
import {
  decodeBase64 as decodeBase64Text,
  encodeBase64 as encodeBase64Text,
} from "@/lib/processors/base64";

export const metadata = {
  id: "base64-encoder",
  name: "Base64 Encoder/Decoder",
  description: "Convert text to Base64 and back with ease",
  category: "Encoding",
  tags: ["base64", "encoder", "decoder", "encode", "decode"],
  path: "/tools/base64-encoder",
  icon: "🔐",
};

export default function Base64Encoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const encodeBase64 = () => {
    try {
      const encoded = encodeBase64Text(input);
      setOutput(encoded);
      toast.success("Text encoded to Base64!");
    } catch {
      toast.error("Failed to encode text");
    }
  };

  const decodeBase64 = () => {
    try {
      const decoded = decodeBase64Text(input);
      setOutput(decoded);
      toast.success("Base64 decoded to text!");
    } catch {
      toast.error("Invalid Base64 string");
    }
  };

  const handleProcess = () => {
    if (mode === "encode") {
      encodeBase64();
    } else {
      decodeBase64();
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  const sampleData = {
    encode: "Hello, World! This is a sample text to encode.",
    decode: "SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgc2FtcGxlIHRleHQgdG8gZW5jb2RlLg=="
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const loadSample = () => {
    if (mode === "encode") {
      setInput(sampleData.encode);
    } else {
      setInput(sampleData.decode);
    }
  };

  const swapInputOutput = () => {
    setInput(output);
    setOutput("");
    setMode(mode === "encode" ? "decode" : "encode");
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Base64 Encoder/Decoder"
        description="Convert text to Base64 and back with ease"
        icon={ArrowUpDown}
      />

      <ModeTabs
        value={mode}
        onValueChange={(value) => setMode(value as "encode" | "decode")}
        options={[
          {
            value: "encode",
            label: "Encode",
            description: "Convert plain text to Base64 encoded string",
          },
          {
            value: "decode",
            label: "Decode",
            description: "Convert Base64 encoded string back to plain text",
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            id: "process",
            label: mode === "encode" ? "Encode" : "Decode",
            onClick: handleProcess,
            variant: "default" as const,
          },
          {
            id: "swap",
            label: "Swap",
            onClick: swapInputOutput,
            disabled: !output,
            variant: "outline" as const,
          },
          {
            id: "sample",
            label: "Load Sample",
            onClick: loadSample,
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {mode === "encode" ? "Plain Text" : "Base64 String"}
            </label>
            <ResponsiveTextArea
              value={input}
              onChange={setInput}
              placeholder={
                mode === "encode"
                  ? "Enter text to encode..."
                  : "Enter Base64 string to decode..."
              }
              minHeight={300}
              showCharacterCount={true}
              allowFileUpload={true}
              acceptedFileTypes=".txt,.json,.html,.css,.js,.md"
            />
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <ResultCard
            title={mode === "encode" ? "Base64 String" : "Plain Text"}
            description={
              mode === "encode"
                ? "Base64 encoded result"
                : "Decoded plain text result"
            }
            status={output ? "success" : "info"}
            onCopy={output ? copyToClipboard : undefined}
            copyLabel="Copy Result"
          >
            <CopyableResult
              value={output}
              placeholder={
                mode === "encode"
                  ? "Base64 encoded text will appear here..."
                  : "Decoded text will appear here..."
              }
              fontFamily="mono"
              rows={12}
            />
          </ResultCard>
        </div>
      </div>

      {/* Information */}
      <ResultCard
        title="About Base64 Encoding"
        status="info"
        description="Learn about Base64 encoding and its use cases"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Base64 is a binary-to-text encoding scheme that represents binary
            data in an ASCII string format. It&apos;s commonly used in web
            development, email attachments, and data transmission.
          </p>
          <div className="space-y-2">
            <p className="font-medium">Use cases:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Encoding binary data for transmission over text-based protocols</li>
              <li>Embedding images or files in HTML/CSS (data URIs)</li>
              <li>Storing binary data in JSON or XML</li>
              <li>Email attachments (MIME encoding)</li>
            </ul>
          </div>
          <p className="text-xs bg-muted p-2 rounded">
            <strong>Note:</strong> Base64 encoding increases the size of data by approximately 33%.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
