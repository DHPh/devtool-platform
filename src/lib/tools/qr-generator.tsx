"use client";

import { useMemo, useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { ToolHeader, QuickActions, ResultCard } from "@/components/layout";
import {
  createQrCodeModel,
  qrSvgDataUrl,
  renderQrCodePng,
  renderQrCodeSvg,
  validateQrOutputSize,
  type QrCodeModel,
  type QrErrorCorrectionLevel,
} from "@/lib/processors/qr-code";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function QrGenerator() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState("200");
  const [errorLevel, setErrorLevel] = useState<QrErrorCorrectionLevel>("M");
  const [isRenderingPng, setIsRenderingPng] = useState(false);

  const generated = useMemo<{ model: QrCodeModel; svg: string } | { error: string }>(() => {
    try {
      const model = createQrCodeModel(text, errorLevel);
      return { model, svg: renderQrCodeSvg(model) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unable to generate this QR code." };
    }
  }, [text, errorLevel]);

  const pngSizeError = useMemo(() => {
    if (!("model" in generated)) return null;
    try {
      validateQrOutputSize(generated.model, Number(size));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid PNG size.";
    }
  }, [generated, size]);

  const downloadPng = async () => {
    if (!("model" in generated) || pngSizeError) return;
    setIsRenderingPng(true);
    try {
      downloadBlob(await renderQrCodePng(generated.model, Number(size)), "qr-code.png");
      toast.success("PNG generated locally and downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to render PNG.");
    } finally {
      setIsRenderingPng(false);
    }
  };

  const downloadSvg = () => {
    if (!("svg" in generated)) return;
    downloadBlob(new Blob([generated.svg], { type: "image/svg+xml;charset=utf-8" }), "qr-code.svg");
    toast.success("SVG generated locally and downloaded.");
  };

  const copySvg = async () => {
    if (!("svg" in generated)) return;
    try {
      await writeClipboardText(generated.svg);
      toast.success("SVG markup copied.");
    } catch {
      toast.error("Unable to copy SVG markup.");
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

  const model = "model" in generated ? generated.model : null;

  return (
    <div className="space-y-6">
      <ToolHeader title="QR Code Generator" description="Generate QR codes entirely in your browser—your content never leaves this device" icon={QrCode} />

      <QuickActions actions={examples.map((example, index) => ({ id: `example-${index}`, label: example.name, onClick: () => setText(example.value) }))} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ResultCard title="QR Code Settings" description="Configure locally generated QR output" status="info">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="qr-content" className="text-sm font-medium">Text or URL</label>
                <Textarea id="qr-content" placeholder="Enter text, URL, email, or any data..." value={text} onChange={event => setText(event.target.value)} maxLength={10_000} rows={4} className="resize-none" />
                <p className="text-xs text-muted-foreground">
                  {text.length} characters · {new TextEncoder().encode(text).length} UTF-8 bytes
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Privacy: encoding, preview, and downloads happen locally. No QR content is transmitted over the network.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">PNG size</label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger aria-label="PNG size"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[100, 150, 200, 300, 400, 500].map(value => <SelectItem key={value} value={String(value)}>{value}×{value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Error correction</label>
                  <Select value={errorLevel} onValueChange={value => setErrorLevel(value as QrErrorCorrectionLevel)}>
                    <SelectTrigger aria-label="QR error correction level"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (about 7%)</SelectItem>
                      <SelectItem value="M">Medium (about 15%)</SelectItem>
                      <SelectItem value="Q">Quartile (about 25%)</SelectItem>
                      <SelectItem value="H">High (about 30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {"error" in generated && <p role="alert" className="text-sm text-red-600">{generated.error}</p>}
              {pngSizeError && <p role="alert" className="text-sm text-amber-700">PNG: {pngSizeError}</p>}

              <div className="grid sm:grid-cols-3 gap-2 pt-2">
                <Button onClick={() => void downloadPng()} disabled={!model || Boolean(pngSizeError) || isRenderingPng}>
                  <Download className="h-4 w-4 mr-2" />{isRenderingPng ? "Rendering…" : "PNG"}
                </Button>
                <Button onClick={downloadSvg} disabled={!model} variant="outline"><Download className="h-4 w-4 mr-2" />SVG</Button>
                <Button onClick={() => void copySvg()} disabled={!model} variant="outline"><Copy className="h-4 w-4 mr-2" />Copy SVG</Button>
              </div>
            </div>
          </ResultCard>

          <ResultCard title="QR Code Information" description="Details from the local QR encoder" status="info">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">UTF-8 data:</span><p className="text-muted-foreground">{model?.byteLength ?? 0} bytes</p></div>
              <div><span className="font-medium">QR version:</span><p className="text-muted-foreground">{model?.version ?? "—"}</p></div>
              <div><span className="font-medium">Modules:</span><p className="text-muted-foreground">{model ? `${model.moduleCount}×${model.moduleCount}` : "—"}</p></div>
              <div><span className="font-medium">Error correction:</span><p className="text-muted-foreground">Level {errorLevel}</p></div>
              <div><span className="font-medium">Downloads:</span><p className="text-muted-foreground">PNG and SVG</p></div>
              <div><span className="font-medium">Processing:</span><p className="text-muted-foreground">Client only</p></div>
            </div>
          </ResultCard>
        </div>

        <ResultCard title="QR Code Preview" description="Local SVG preview; scan to verify before publishing" status={model ? "success" : "info"}>
          <div className="flex justify-center p-4 border-2 border-dashed border-border rounded-lg min-h-[200px] items-center bg-muted/20">
            {model && "svg" in generated ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSvgDataUrl(generated.svg)} alt="Locally generated QR code" width={Math.min(Number(size), 400)} height={Math.min(Number(size), 400)} className="max-w-full h-auto" data-testid="local-qr-preview" />
            ) : (
              <div className="text-center text-muted-foreground">Enter content that fits the selected error-correction level.</div>
            )}
          </div>
        </ResultCard>
      </div>
    </div>
  );
}
