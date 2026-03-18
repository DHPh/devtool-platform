"use client";

import { useMemo, useState } from "react";
import { CopyableResult } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  convertCssUnit,
  createCssClamp,
  dataUriToSvg,
  formatJavaScript,
  generateOpenGraphTags,
  generateWebManifest,
  minifyJavaScript,
  optimizeSvg,
  svgToDataUri,
  type CssUnit,
  type JavaScriptLanguage,
} from "@/lib/processors";

function Header({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="text-muted-foreground">{description}</p></div>;
}

function ErrorResult({ message }: { message: string }) {
  return <div role="alert"><CopyableResult value={message} label="Error" copyLabel="Copy error" rows={4} textareaClassName="border-destructive text-destructive" /></div>;
}

export function JavaScriptFormatterTool() {
  const [input, setInput] = useState("const user={name:'Ada',active:true};\nconsole.log(user)");
  const [language, setLanguage] = useState<JavaScriptLanguage>("javascript");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [formatting, setFormatting] = useState(false);
  const format = async () => {
    setFormatting(true);
    const result = await formatJavaScript(input, language);
    if (result.ok) { setOutput(result.value); setError(""); } else { setOutput(""); setError(result.error); }
    setFormatting(false);
  };
  return <section className="space-y-5"><Header title="JavaScript and TypeScript Formatter" description="Format source locally with a parser-backed Prettier engine." /><div className="flex flex-wrap items-end gap-3"><label className="w-48 space-y-2"><span className="text-sm font-medium">Language</span><Select value={language} onValueChange={(value) => setLanguage(value as JavaScriptLanguage)}><SelectTrigger aria-label="Language"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="javascript">JavaScript</SelectItem><SelectItem value="typescript">TypeScript</SelectItem></SelectContent></Select></label><Button type="button" onClick={() => void format()} disabled={formatting}>{formatting ? "Formatting…" : "Format source"}</Button></div><div className="grid gap-4 lg:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Source</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={18} className="font-mono" spellCheck={false} /></label>{error ? <ErrorResult message={error} /> : <CopyableResult value={output} label="Formatted source" copyLabel="Copy formatted source" rows={18} />}</div></section>;
}

const SVG_SAMPLE = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="48" fill="#6366f1"/></svg>';

export function SvgDataUriConverterTool() {
  const [input, setInput] = useState(SVG_SAMPLE);
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [encoding, setEncoding] = useState<"percent" | "base64">("percent");
  const result = useMemo(() => direction === "encode" ? svgToDataUri(input, encoding) : dataUriToSvg(input), [direction, encoding, input]);
  const reverse = () => { if (result.ok) setInput(result.value); setDirection((value) => value === "encode" ? "decode" : "encode"); };
  return <section className="space-y-5"><Header title="SVG Data URI Converter" description="Encode safe SVG markup as a data URI or decode it back to markup." /><div className="flex flex-wrap items-end gap-3">{direction === "encode" && <label className="w-48 space-y-2"><span className="text-sm font-medium">Encoding</span><Select value={encoding} onValueChange={(value) => setEncoding(value as "percent" | "base64")}><SelectTrigger aria-label="Encoding"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">Percent encoded</SelectItem><SelectItem value="base64">Base64</SelectItem></SelectContent></Select></label>}<Button type="button" variant="outline" onClick={reverse}>Reverse direction</Button></div><div className="grid gap-4 lg:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">{direction === "encode" ? "SVG markup" : "SVG data URI"}</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={15} className="font-mono" spellCheck={false} /></label>{result.ok ? <CopyableResult value={result.value} label={direction === "encode" ? "Data URI" : "SVG markup"} copyLabel={direction === "encode" ? "Copy data URI" : "Copy SVG markup"} rows={15} /> : <ErrorResult message={result.error} />}</div></section>;
}

const CSS_UNITS: CssUnit[] = ["px", "rem", "em", "%", "vw", "vh"];

export function CssUnitConverterTool() {
  const [value, setValue] = useState("32");
  const [unit, setUnit] = useState<CssUnit>("px");
  const [rootFont, setRootFont] = useState("16");
  const [elementFont, setElementFont] = useState("16");
  const [parent, setParent] = useState("1200");
  const [viewportWidth, setViewportWidth] = useState("1440");
  const [viewportHeight, setViewportHeight] = useState("900");
  const result = useMemo(() => convertCssUnit(Number(value), unit, { rootFontPx: Number(rootFont), elementFontPx: Number(elementFont), parentPx: Number(parent), viewportWidthPx: Number(viewportWidth), viewportHeightPx: Number(viewportHeight) }), [value, unit, rootFont, elementFont, parent, viewportWidth, viewportHeight]);
  const contexts = [["Root font px", rootFont, setRootFont], ["Element font px", elementFont, setElementFont], ["Parent px", parent, setParent], ["Viewport width px", viewportWidth, setViewportWidth], ["Viewport height px", viewportHeight, setViewportHeight]] as const;
  return <section className="space-y-5"><Header title="CSS Unit Converter" description="Convert CSS lengths using explicit font, parent, and viewport context." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="space-y-2"><span className="text-sm font-medium">Value</span><Input type="number" value={value} onChange={(event) => setValue(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Source unit</span><Select value={unit} onValueChange={(next) => setUnit(next as CssUnit)}><SelectTrigger aria-label="Source unit"><SelectValue /></SelectTrigger><SelectContent>{CSS_UNITS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>{contexts.map(([label, current, setter]) => <label key={label} className="space-y-2"><span className="text-sm font-medium">{label}</span><Input type="number" min="1" value={current} onChange={(event) => setter(event.target.value)} /></label>)}</div>{result.ok ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{CSS_UNITS.map((item) => { const formatted = `${Number(result.value[item].toFixed(6))}${item}`; return <CopyableResult key={item} value={formatted} label={item} copyLabel={`Copy ${item}`} rows={1} />; })}</div> : <ErrorResult message={result.error} />}</section>;
}

export function CssClampCalculatorTool() {
  const [min, setMin] = useState("16"); const [max, setMax] = useState("32"); const [minViewport, setMinViewport] = useState("320"); const [maxViewport, setMaxViewport] = useState("1280");
  const result = useMemo(() => createCssClamp(Number(min), Number(max), Number(minViewport), Number(maxViewport)), [min, max, minViewport, maxViewport]);
  const fields = [["Minimum size px", min, setMin], ["Maximum size px", max, setMax], ["Minimum viewport px", minViewport, setMinViewport], ["Maximum viewport px", maxViewport, setMaxViewport]] as const;
  return <section className="space-y-5"><Header title="CSS Clamp Calculator" description="Generate a fluid clamp expression between explicit viewport bounds." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([label, current, setter]) => <label key={label} className="space-y-2"><span className="text-sm font-medium">{label}</span><Input type="number" value={current} onChange={(event) => setter(event.target.value)} /></label>)}</div>{result.ok ? <div className="grid gap-4 md:grid-cols-3"><CopyableResult value={result.value.css} label="CSS clamp" copyLabel="Copy CSS clamp" rows={2} /><CopyableResult value={`${Number(result.value.slope.toFixed(6))}vw`} label="Slope" copyLabel="Copy slope" rows={2} /><CopyableResult value={`${Number(result.value.intercept.toFixed(6))}px`} label="Intercept" copyLabel="Copy intercept" rows={2} /></div> : <ErrorResult message={result.error} />}</section>;
}

export function OpenGraphGeneratorTool() {
  const [title, setTitle] = useState("DevTool Platform"); const [description, setDescription] = useState("Fast developer utilities that run in your browser."); const [url, setUrl] = useState("https://example.com/tools"); const [image, setImage] = useState("https://example.com/og.png"); const [siteName, setSiteName] = useState("DevTool Platform");
  const result = useMemo(() => generateOpenGraphTags({ title, description, url, image, siteName }), [title, description, url, image, siteName]);
  const fields: Array<[string, string, (value: string) => void]> = [["Title", title, setTitle], ["Site name", siteName, setSiteName], ["Canonical URL", url, setUrl], ["Image URL", image, setImage]];
  return <section className="space-y-5"><Header title="Open Graph Generator" description="Generate escaped Open Graph and Twitter card meta tags." /><div className="grid gap-3 sm:grid-cols-2">{fields.map(([label, current, setter]) => <label key={label} className="space-y-2"><span className="text-sm font-medium">{label}</span><Input value={current} onChange={(event) => setter(event.target.value)} /></label>)}</div><label className="block space-y-2"><span className="text-sm font-medium">Description</span><Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></label>{result.ok ? <CopyableResult value={result.value} label="Meta tags" copyLabel="Copy meta tags" rows={14} /> : <ErrorResult message={result.error} />}</section>;
}

export function WebManifestGeneratorTool() {
  const [name, setName] = useState("DevTool Platform"); const [shortName, setShortName] = useState("DevTool"); const [startUrl, setStartUrl] = useState("/"); const [display, setDisplay] = useState<"standalone" | "fullscreen" | "minimal-ui" | "browser">("standalone"); const [themeColor, setThemeColor] = useState("#111827"); const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const result = useMemo(() => generateWebManifest({ name, shortName, startUrl, display, themeColor, backgroundColor }), [name, shortName, startUrl, display, themeColor, backgroundColor]);
  const fields: Array<[string, string, (value: string) => void]> = [["Application name", name, setName], ["Short name", shortName, setShortName], ["Start URL", startUrl, setStartUrl], ["Theme color", themeColor, setThemeColor], ["Background color", backgroundColor, setBackgroundColor]];
  return <section className="space-y-5"><Header title="Web Manifest Generator" description="Generate and validate core installable web app manifest fields." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, current, setter]) => <label key={label} className="space-y-2"><span className="text-sm font-medium">{label}</span><Input value={current} onChange={(event) => setter(event.target.value)} /></label>)}<label className="space-y-2"><span className="text-sm font-medium">Display mode</span><Select value={display} onValueChange={(value) => setDisplay(value as typeof display)}><SelectTrigger aria-label="Display mode"><SelectValue /></SelectTrigger><SelectContent>{(["standalone", "fullscreen", "minimal-ui", "browser"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label></div>{result.ok ? <CopyableResult value={result.value} label="manifest.webmanifest" copyLabel="Copy web manifest" rows={14} /> : <ErrorResult message={result.error} />}</section>;
}

function CompressionResults({ result, outputLabel, copyLabel }: { result: { output: string; originalBytes: number; outputBytes: number; savedBytes: number; reductionPercent: number }; outputLabel: string; copyLabel: string }) {
  return <div className="space-y-4"><CopyableResult value={result.output} label={outputLabel} copyLabel={copyLabel} rows={16} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><CopyableResult value={String(result.originalBytes)} label="Original bytes" copyLabel="Copy original bytes" rows={1} /><CopyableResult value={String(result.outputBytes)} label="Output bytes" copyLabel="Copy output bytes" rows={1} /><CopyableResult value={String(result.savedBytes)} label="Saved bytes" copyLabel="Copy saved bytes" rows={1} /><CopyableResult value={`${result.reductionPercent}%`} label="Reduction" copyLabel="Copy reduction" rows={1} /></div></div>;
}

export function JavaScriptMinifierTool() {
  const [input, setInput] = useState("function greet(name) {\n  const message = `Hello ${name}`;\n  return message;\n}\nconsole.log(greet('Ada'));\n");
  const [mangle, setMangle] = useState(true);
  const [module, setModule] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof minifyJavaScript>> | null>(null);
  const [working, setWorking] = useState(false);
  const run = async () => { setWorking(true); setResult(await minifyJavaScript(input, { mangle, module })); setWorking(false); };
  return <section className="space-y-5"><Header title="JavaScript Minifier" description="Compress JavaScript locally with Terser and report exact UTF-8 size savings." /><div className="flex flex-wrap items-center gap-4"><Button type="button" onClick={() => void run()} disabled={working}>{working ? "Minifying…" : "Minify JavaScript"}</Button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mangle} onChange={(event) => setMangle(event.target.checked)} />Mangle local names</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={module} onChange={(event) => setModule(event.target.checked)} />ES module</label></div><label className="block space-y-2"><span className="text-sm font-medium">JavaScript source</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={16} className="font-mono" spellCheck={false} /></label>{result?.ok ? <CompressionResults result={result.value} outputLabel="Minified JavaScript" copyLabel="Copy minified JavaScript" /> : result ? <ErrorResult message={result.error} /> : null}</section>;
}

const SVG_OPTIMIZER_SAMPLE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">\n  <!-- decorative circle -->\n  <circle cx="60" cy="60" r="48" fill="#6366f1" />\n</svg>';

export function SvgOptimizerTool() {
  const [input, setInput] = useState(SVG_OPTIMIZER_SAMPLE);
  const [multipass, setMultipass] = useState(true);
  const [preserveViewBox, setPreserveViewBox] = useState(true);
  const [result, setResult] = useState<Awaited<ReturnType<typeof optimizeSvg>> | null>(null);
  const [working, setWorking] = useState(false);
  const run = async () => { setWorking(true); setResult(await optimizeSvg(input, { multipass, preserveViewBox })); setWorking(false); };
  return <section className="space-y-5"><Header title="SVG Optimizer" description="Optimize safe SVG markup locally with SVGO. This rejects active content but is not a general-purpose sanitizer." /><div className="flex flex-wrap items-center gap-4"><Button type="button" onClick={() => void run()} disabled={working}>{working ? "Optimizing…" : "Optimize SVG"}</Button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={multipass} onChange={(event) => setMultipass(event.target.checked)} />Multiple passes</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preserveViewBox} onChange={(event) => setPreserveViewBox(event.target.checked)} />Preserve viewBox</label></div><label className="block space-y-2"><span className="text-sm font-medium">SVG markup</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={16} className="font-mono" spellCheck={false} /></label>{result?.ok ? <CompressionResults result={result.value} outputLabel="Optimized SVG" copyLabel="Copy optimized SVG" /> : result ? <ErrorResult message={result.error} /> : null}</section>;
}
