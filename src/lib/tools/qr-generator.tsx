"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  ToolContainer,
  SettingsPanel,
  FormField,
  ActionButtons,
  ResponsiveTextArea,
} from "@/components/layout";

export const metadata = {
  id: "qr-generator",
  name: "QR Code Generator",
  description: "Generate QR codes for text, URLs, and more",
  category: "Utilities",
  tags: ["qr", "code", "generator", "url"],
  path: "/tools/qr-generator",
  icon: "📱",
};

export default function QrGenerator() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState("200");
  const [errorLevel, setErrorLevel] = useState("M");

  // Using a free QR code API service
  const getQrUrl = () => {
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&ecc=${errorLevel}`;
  };

  const downloadQr = () => {
    const link = document.createElement("a");
    link.href = getQrUrl();
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded!");
  };

  const copyQrUrl = async () => {
    try {
      await navigator.clipboard.writeText(getQrUrl());
      toast.success("QR code URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const examples = [
    { name: "Website URL", value: "https://example.com" },
    { name: "Email", value: "mailto:contact@example.com" },
    { name: "Phone", value: "tel:+1234567890" },
    { name: "SMS", value: "sms:+1234567890" },
    { name: "WiFi", value: "WIFI:T:WPA;S:NetworkName;P:password;;" },
    { name: "Plain Text", value: "Hello, World!" },
  ];

  // Action buttons configuration
  const actionButtons = [
    {
      label: "Download PNG",
      onClick: downloadQr,
      icon: Download,
      variant: "default" as const,
      disabled: !text.trim(),
    },
    {
      label: "Copy URL",
      onClick: copyQrUrl,
      icon: Copy,
      variant: "outline" as const,
      disabled: !text.trim(),
    },
  ];

  return (
    <ToolContainer
      title="QR Code Generator"
      description="Generate QR codes for URLs, text, email, phone numbers, and more"
    >
      {/* Settings Panel */}
      <SettingsPanel title="QR Code Settings">
        <FormField
          label="Text or URL"
          description="Enter text, URL, email, or any data to encode"
        >
          <ResponsiveTextArea
            placeholder="Enter text, URL, email, or any data..."
            value={text}
            onChange={(value) => setText(value)}
            minHeight={100}
            showCharacterCount={true}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Size (pixels)" description="QR code dimensions">
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100x100</SelectItem>
                <SelectItem value="150">150x150</SelectItem>
                <SelectItem value="200">200x200</SelectItem>
                <SelectItem value="300">300x300</SelectItem>
                <SelectItem value="400">400x400</SelectItem>
                <SelectItem value="500">500x500</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Error Correction"
            description="Error correction level"
          >
            <Select value={errorLevel} onValueChange={setErrorLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low (7%)</SelectItem>
                <SelectItem value="M">Medium (15%)</SelectItem>
                <SelectItem value="Q">Quartile (25%)</SelectItem>
                <SelectItem value="H">High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField
          label="Quick Examples"
          description="Click to use predefined examples"
        >
          <div className="grid grid-cols-2 gap-2">
            {examples.map((example) => (
              <Button
                key={example.name}
                variant="outline"
                size="sm"
                onClick={() => setText(example.value)}
                className="justify-start text-xs"
              >
                {example.name}
              </Button>
            ))}
          </div>
        </FormField>

        <ActionButtons buttons={actionButtons} />
      </SettingsPanel>

      {/* QR Code Preview */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
          <CardDescription>
            Scan with your mobile device to test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg min-h-[200px] items-center">
            {text.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getQrUrl()}
                alt="QR Code"
                className="max-w-full h-auto"
                style={{ maxHeight: "400px" }}
              />
            ) : (
              <div className="text-center text-muted-foreground">
                Enter text to generate QR code
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Information */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Data Length:</span>
              <p>{text.length} characters</p>
            </div>
            <div>
              <span className="font-medium">Size:</span>
              <p>
                {size}x{size} pixels
              </p>
            </div>
            <div>
              <span className="font-medium">Error Correction:</span>
              <p>{errorLevel} Level</p>
            </div>
            <div>
              <span className="font-medium">Format:</span>
              <p>PNG Image</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Tips:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Higher error correction allows the QR code to be read even if
                partially damaged
              </li>
              <li>For URLs, make sure to include http:// or https://</li>
              <li>
                Test your QR code with a mobile device before using it publicly
              </li>
              <li>Larger sizes are better for printing or distant scanning</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </ToolContainer>
  );
}
