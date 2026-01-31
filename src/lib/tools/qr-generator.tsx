"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
} from "@/components/layout";
import { buildQrCodeUrl } from "@/lib/processors";

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
    return buildQrCodeUrl(text, Number(size), errorLevel);
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

  return (
    <div className="space-y-6">
      <ToolHeader
        title="QR Code Generator"
        description="Generate QR codes for URLs, text, email, phone numbers, and more"
        icon={QrCode}
      />

      <QuickActions
        actions={examples.map((example, index) => ({
          id: `example-${index}`,
          label: example.name,
          onClick: () => setText(example.value),
        }))}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <ResultCard
            title="QR Code Settings"
            description="Configure your QR code generation options"
            status="info"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Text or URL</label>
                <Textarea
                  placeholder="Enter text, URL, email, or any data..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {text.length} characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Size (pixels)</label>
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Error Correction</label>
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
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={downloadQr}
                  disabled={!text.trim()}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button
                  onClick={copyQrUrl}
                  disabled={!text.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </div>
          </ResultCard>

          {/* Information Panel */}
          <ResultCard
            title="QR Code Information"
            description="Details about your generated QR code"
            status="info"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data Length:</span>
                  <p className="text-muted-foreground">{text.length} characters</p>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <p className="text-muted-foreground">{size}x{size} pixels</p>
                </div>
                <div>
                  <span className="font-medium">Error Correction:</span>
                  <p className="text-muted-foreground">{errorLevel} Level</p>
                </div>
                <div>
                  <span className="font-medium">Format:</span>
                  <p className="text-muted-foreground">PNG Image</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Higher error correction allows reading even if partially damaged</li>
                  <li>For URLs, include http:// or https://</li>
                  <li>Test with a mobile device before public use</li>
                  <li>Larger sizes are better for printing or distant scanning</li>
                </ul>
              </div>
            </div>
          </ResultCard>
        </div>

        {/* QR Code Preview */}
        <div>
          <ResultCard
            title="QR Code Preview"
            description="Scan with your mobile device to test"
            status={text.trim() ? "success" : "info"}
          >
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
          </ResultCard>
        </div>
      </div>
    </div>
  );
}
