"use client";

import { type ChangeEvent, useState } from "react";
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
  decodeBase64Bytes,
  decodeBase64 as decodeBase64Text,
  encodeBase64Bytes,
  encodeBase64 as encodeBase64Text,
  type Base64DecodeMode,
  type Base64Variant,
} from "@/lib/processors/base64";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const metadata = {
  id: "base64-encoder",
  name: "Base64 Encoder/Decoder",
  description: "Encode text or binary files as Base64/Base64url and decode in strict or forgiving mode",
  category: "Encoding",
  tags: ["base64", "encoder", "decoder", "encode", "decode"],
  path: "/tools/base64-encoder",
  icon: "🔐",
};

export default function Base64Encoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [decodeMode, setDecodeMode] = useState<Base64DecodeMode>("strict");
  const [decodedBytes, setDecodedBytes] = useState<Uint8Array | null>(null);
  const [binaryFileName, setBinaryFileName] = useState("");

  const encodeBase64 = () => {
    try {
      const encoded = encodeBase64Text(input, { variant });
      setOutput(encoded);
      setDecodedBytes(null);
      toast.success(`Text encoded to ${variant === "url" ? "Base64url" : "Base64"}!`);
    } catch {
      toast.error("Failed to encode text");
    }
  };

  const decodeBase64 = () => {
    try {
      const options = { variant, mode: decodeMode } as const;
      const bytes = decodeBase64Bytes(input, options);
      setDecodedBytes(bytes);
      try {
        setOutput(decodeBase64Text(input, options));
        toast.success("Encoded data decoded as UTF-8 text!");
      } catch {
        setOutput(`Binary data decoded (${bytes.length} bytes). Use “Download decoded bytes” to save it.`);
        toast.success("Binary data decoded successfully");
      }
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

  const sampleData = {
    encode: "Hello, World! This is a sample text to encode.",
    decode: "SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgc2FtcGxlIHRleHQgdG8gZW5jb2RlLg=="
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setDecodedBytes(null);
    setBinaryFileName("");
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
    setDecodedBytes(null);
  };

  const encodeBinaryFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setOutput(encodeBase64Bytes(bytes, { variant }));
      setBinaryFileName(file.name);
      setDecodedBytes(null);
      toast.success(`Encoded ${file.name} (${bytes.length} bytes) locally`);
    } catch {
      toast.error("Failed to encode the selected file");
    } finally {
      event.target.value = "";
    }
  };

  const downloadDecodedBytes = () => {
    if (!decodedBytes) return;
    const url = URL.createObjectURL(new Blob([decodedBytes.slice().buffer]));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "decoded.bin";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Base64 Encoder/Decoder"
        description="Encode UTF-8 text or binary files with Base64/Base64url, or decode bytes in strict and forgiving modes"
        icon={ArrowUpDown}
      />

      <ModeTabs
        value={mode}
        onValueChange={(value) => {
          setMode(value as "encode" | "decode");
          setOutput("");
          setDecodedBytes(null);
        }}
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

      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Alphabet</Label>
          <Select value={variant} onValueChange={(value) => setVariant(value as Base64Variant)}>
            <SelectTrigger aria-label="Base64 alphabet"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Base64 (+, /, padded)</SelectItem>
              <SelectItem value="url">Base64url (-, _, unpadded)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode === "decode" ? (
          <div className="space-y-2">
            <Label>Decode mode</Label>
            <Select value={decodeMode} onValueChange={(value) => setDecodeMode(value as Base64DecodeMode)}>
              <SelectTrigger aria-label="Base64 decode mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">Strict canonical</SelectItem>
                <SelectItem value="forgiving">Forgiving whitespace/padding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="base64-binary-file">Binary file input</Label>
            <input id="base64-binary-file" type="file" onChange={encodeBinaryFile} className="block w-full text-sm" />
            {binaryFileName && <p className="text-xs text-muted-foreground">Encoded locally: {binaryFileName}</p>}
          </div>
        )}
      </div>

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
          ...(mode === "decode" && decodedBytes
            ? [{
                id: "download-bytes",
                label: "Download decoded bytes",
                onClick: downloadDecodedBytes,
                variant: "outline" as const,
              }]
            : []),
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
            <strong>Note:</strong> Base64url changes the alphabet for URLs and commonly omits padding. Strict mode requires canonical input; forgiving mode accepts ASCII whitespace and missing padding. Base64 is encoding, not encryption.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
