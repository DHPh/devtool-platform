"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ArrowUpDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  TwoColumnToolLayout,
  ModeTabs,
  ActionButtons,
  ToolContainer,
  ResponsiveTextArea,
} from "@/components/layout";

export function Base64Encoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const encodeBase64 = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
      toast.success("Text encoded to Base64!");
    } catch {
      toast.error("Failed to encode text");
    }
  };

  const decodeBase64 = () => {
    try {
      const decoded = atob(input);
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

  const swapInputOutput = () => {
    setInput(output);
    setOutput("");
    setMode(mode === "encode" ? "decode" : "encode");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const loadSample = () => {
    if (mode === "encode") {
      setInput("Hello, World! This is a sample text to encode.");
    } else {
      setInput(
        "SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgc2FtcGxlIHRleHQgdG8gZW5jb2RlLg=="
      );
    }
  };

  return (
    <ToolContainer
      title="Base64 Encoder/Decoder"
      description="Convert text to Base64 and back with ease"
      className="space-y-6"
    >
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

      <ActionButtons
        buttons={[
          {
            label: mode === "encode" ? "Encode" : "Decode",
            onClick: handleProcess,
            disabled: !input.trim(),
            variant: "default",
          },
          {
            label: "Swap",
            icon: ArrowUpDown,
            onClick: swapInputOutput,
            disabled: !output,
          },
          {
            label: "Clear All",
            icon: Trash2,
            onClick: clearAll,
          },
          {
            label: "Load Sample",
            onClick: loadSample,
          },
        ]}
      />

      <TwoColumnToolLayout
        leftTitle={mode === "encode" ? "Plain Text" : "Base64 String"}
        leftDescription={
          mode === "encode"
            ? "Enter the text you want to encode"
            : "Enter the Base64 string you want to decode"
        }
        leftChildren={
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
        }
        rightTitle={mode === "encode" ? "Base64 String" : "Plain Text"}
        rightDescription={
          mode === "encode"
            ? "Base64 encoded result"
            : "Decoded plain text result"
        }
        rightActions={[
          {
            label: "Copy",
            icon: <Copy className="h-4 w-4" />,
            onClick: copyToClipboard,
            disabled: !output,
          },
        ]}
        rightChildren={
          <ResponsiveTextArea
            value={output}
            onChange={() => {}} // Read-only
            readOnly={true}
            placeholder={
              mode === "encode"
                ? "Base64 encoded text will appear here..."
                : "Decoded text will appear here..."
            }
            minHeight={300}
            showCharacterCount={true}
          />
        }
      />

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Base64 Encoding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Base64 is a binary-to-text encoding scheme that represents binary
            data in an ASCII string format. It&apos;s commonly used in web
            development, email attachments, and data transmission.
          </p>
          <div className="space-y-1">
            <p>
              <strong>Use cases:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Encoding binary data for transmission over text-based protocols
              </li>
              <li>Embedding images or files in HTML/CSS (data URIs)</li>
              <li>Storing binary data in JSON or XML</li>
              <li>Email attachments (MIME encoding)</li>
            </ul>
          </div>
          <p className="text-xs">
            Note: Base64 encoding increases the size of data by approximately
            33%.
          </p>
        </CardContent>
      </Card>
    </ToolContainer>
  );
}
