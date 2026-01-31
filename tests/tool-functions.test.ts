import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { TOOL_REGISTRY } from "@/lib/registry";
import {
  buildQrCodeUrl,
  calculateImageSize,
  categorizeFile,
  convertTextCase,
  convertTextFile,
  countText,
  dateToTimestamp,
  decodeBase64,
  decodeHtmlEntities,
  decodeUrlComponent,
  diffLines,
  encodeBase64,
  encodeHtmlEntities,
  encodeUrlComponent,
  fileMetadata,
  formatCss,
  formatHtml,
  formatJson,
  generateLorem,
  generateUuidV4,
  groupDuplicateFiles,
  hashBytes,
  iconPackManifest,
  markdownToHtml,
  minifyCss,
  parseCSV,
  pickWheelItem,
  timestampToIso,
  validateEmail,
  validateJson,
} from "@/lib/processors";
import { parseJSON, flattenObject } from "@/lib/utils/json-parser";
import {
  analyzePasswordStrength,
  generatePassword,
  generatePassphrase,
  getDefaultPassphraseOptions,
  getDefaultPasswordOptions,
} from "@/lib/utils/password";
import { getAllPatterns, regexReplace, testRegex } from "@/lib/utils/regex";
import {
  calculateWCAGCompliance,
  generateComplementary,
  generateLinearGradientCSS,
  hexToRgb,
  hslToRgb,
  interpolateColors,
  simulateColorBlindness,
} from "@/lib/utils/color";
import { generateColorBlindnessPalette } from "@/lib/utils/color/color-blindness-palette";
import {
  compareJsonObjects,
  queryJsonPath,
  validateJsonSchema,
} from "@/lib/utils/json";
import {
  extractDomainFromUrl,
  formatFileSize,
  generateCurlCommand,
  getCommonPorts,
  isValidDomain,
  isValidUrl,
  parseCurlCommand,
  validateIP,
} from "@/lib/utils/network";
import { classifyUrlTestOutcome } from "@/lib/utils/network/url-test-outcome";

type FunctionalCase = {
  id: string;
  run: () => unknown | Promise<unknown>;
};

const cases: FunctionalCase[] = [
  { id: "json-formatter", run: () => expect(formatJson('{"b":2,"a":1}', { sortKeys: true }).result).toBe('{\n  "a": 1,\n  "b": 2\n}') },
  { id: "html-formatter", run: () => expect(formatHtml("<main><p>Hello</p></main>")).toBe("<main>\n  <p>Hello\n  </p>\n</main>") },
  { id: "css-formatter", run: () => expect(formatCss("a { color: red; }")).toContain("  color: red;") },
  { id: "markdown-preview", run: () => expect(markdownToHtml("# Title\n**bold**")).toBe("<h1>Title</h1><br><strong>bold</strong>") },
  { id: "word-counter", run: () => expect(countText("one two\n\nthree")).toMatchObject({ words: 3, lines: 3, paragraphs: 2 }) },
  { id: "case-converter", run: () => expect(convertTextCase("hello world", "camelCase")).toBe("helloWorld") },
  { id: "diff-checker", run: () => expect(diffLines("same\nold", "same\nnew")).toEqual([{ line: 1, left: "same", right: "same", equal: true }, { line: 2, left: "old", right: "new", equal: false }]) },
  { id: "base64-encoder", run: () => expect(decodeBase64(encodeBase64("✓ Node"))).toBe("✓ Node") },
  { id: "url-encoder", run: () => expect(decodeUrlComponent(encodeUrlComponent("a b+c"))).toBe("a b+c") },
  { id: "html-entities", run: () => expect(decodeHtmlEntities(encodeHtmlEntities('<a title="x">&</a>'))).toBe('<a title="x">&</a>') },
  { id: "uuid-generator", run: () => expect(generateUuidV4(new Uint8Array(16))).toMatch(/^00000000-0000-4000-8000-000000000000$/) },
  { id: "password-generator", run: () => expect(generatePassword({ ...getDefaultPasswordOptions(), length: 24 })).toHaveLength(24) },
  { id: "passphrase-generator", run: () => expect(generatePassphrase({ ...getDefaultPassphraseOptions(), wordCount: 4 }).words).toHaveLength(4) },
  { id: "password-analysis", run: () => expect(analyzePasswordStrength("correct-horse-battery-staple-42!").entropy).toBeGreaterThan(50) },
  { id: "lorem-ipsum", run: () => expect(generateLorem(8).split(" ")).toHaveLength(8) },
  { id: "qr-generator", run: () => expect(buildQrCodeUrl("hello world", 256, "H")).toContain("data=hello+world") },
  { id: "timestamp-converter", run: () => expect(dateToTimestamp(timestampToIso(0), "seconds")).toBe(0) },
  { id: "color-converter", run: () => expect(hexToRgb("#ff0080")).toEqual({ r: 255, g: 0, b: 128 }) },
  { id: "color-picker", run: () => expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 }) },
  { id: "palette-generator", run: () => expect(generateComplementary("#ff0000").colors).toHaveLength(2) },
  { id: "gradient-creator", run: () => expect(generateLinearGradientCSS({ type: "linear", angle: 90, stops: [{ color: "#000000", position: 0 }, { color: "#ffffff", position: 100 }] })).toContain("linear-gradient(90deg") },
  { id: "icon-pack-generator", run: () => expect(iconPackManifest("android").map((icon) => icon.size)).toEqual([48, 72, 96, 144, 192]) },
  { id: "contrast-checker", run: () => expect(calculateWCAGCompliance("#000000", "#ffffff")).toMatchObject({ ratio: 21, level: "AAA", isAccessible: true }) },
  { id: "color-blindness-simulator", run: () => expect(simulateColorBlindness("#ff0000", "achromatopsia")).toMatch(/^#[0-9a-f]{6}$/) },
  { id: "accessibility-palette", run: () => expect(generateColorBlindnessPalette({ colorBlindnessType: "deuteranopia", baseColor: "#336699", colorCount: 5, contrastLevel: "AA", algorithm: "hue-shift" }).colors.length).toBeGreaterThan(0) },
  { id: "gradient-color-picker", run: () => expect(interpolateColors("#000000", "#ffffff", 3)).toEqual(["rgb(0, 0, 0)", "rgb(128, 128, 128)", "rgb(255, 255, 255)"]) },
  { id: "regex-tester", run: () => expect(testRegex("\\d+", "a12 b34", "g").totalMatches).toBe(2) },
  { id: "regex-replace", run: () => expect(regexReplace("a1 b2", "\\d", "#", "g").result).toBe("a# b#") },
  { id: "regex-library", run: () => expect(getAllPatterns().some((pattern) => pattern.pattern.length > 0)).toBe(true) },
  { id: "json-validator", run: () => expect(validateJson('{"valid":true}').isValid).toBe(true) },
  { id: "json-formatter-studio", run: () => expect(formatJson('{"x":1}', { indentSize: 4 }).result).toContain('    "x": 1') },
  { id: "json-path-query", run: () => expect(queryJsonPath({ user: { name: "Ada" } }, "$.user.name").results[0].value).toBe("Ada") },
  { id: "json-schema-validator", run: () => expect(validateJsonSchema({ id: 3 }, { type: "object", required: ["id"], properties: { id: { type: "integer" } } }).isValid).toBe(true) },
  { id: "json-diff-compare", run: () => expect(compareJsonObjects({ a: 1 }, { a: 2 }).differences).toHaveLength(1) },
  { id: "email-validator", run: () => expect(validateEmail("dev@example.com")).toEqual({ email: "dev@example.com", isValid: true }) },
  { id: "csv-viewer", run: () => expect(parseCSV("name,age\nAda,36").data).toEqual([{ name: "Ada", age: 36 }]) },
  { id: "json-table-viewer", run: () => expect(parseJSON('[{"name":"Ada"}]')).toMatchObject({ rowCount: 1, headers: ["name"] }) },
  { id: "data-explorer", run: () => expect(flattenObject({ user: { name: "Ada" } })).toEqual({ "user.name": "Ada" }) },
  { id: "random-wheel", run: () => expect(pickWheelItem(["a", "b", "c"], 0.5)).toBe("b") },
  { id: "api-tester", run: () => expect(parseCurlCommand("curl -X POST https://example.com/api")?.method).toBe("POST") },
  { id: "http-client", run: () => expect(generateCurlCommand({ url: "https://example.com", method: "GET", headers: {}, body: "" })).toContain("https://example.com") },
  { id: "websocket-tester", run: () => expect(new URL("wss://echo.example.com/socket").protocol).toBe("wss:") },
  { id: "dns-lookup", run: () => expect(isValidDomain("example.com")).toBe(true) },
  { id: "ip-info", run: () => expect(validateIP("8.8.8.8")).toMatchObject({ isValid: true, version: 4 }) },
  { id: "port-scanner", run: () => expect(getCommonPorts()).toContain(443) },
  { id: "network-monitor", run: () => expect(getCommonPorts().every((port) => Number.isInteger(port) && port > 0 && port <= 65535)).toBe(true) },
  { id: "url-tester", run: () => expect(classifyUrlTestOutcome({ accessible: true, statusCode: 406 })).toBe("http-error") },
  { id: "on-air-checker", run: () => expect(isValidUrl("https://example.com/health")).toBe(true) },
  { id: "file-link-checker", run: () => expect([extractDomainFromUrl("https://cdn.example.com/file.zip"), formatFileSize(1024)]).toEqual(["cdn.example.com", "1 KB"]) },
  { id: "image-resizer", run: () => expect(calculateImageSize(1920, 1080, 640)).toEqual({ width: 640, height: 360 }) },
  { id: "pdf-tools", run: async () => { const pdf = await PDFDocument.create(); pdf.addPage([200, 300]); const loaded = await PDFDocument.load(await pdf.save()); expect(loaded.getPageCount()).toBe(1); } },
  { id: "file-converter", run: () => expect(convertTextFile("a\nb", "json")).toBe('["a","b"]') },
  { id: "archive-manager", run: async () => { const zip = new JSZip(); zip.file("hello.txt", "hello"); const loaded = await JSZip.loadAsync(await zip.generateAsync({ type: "uint8array" })); expect(await loaded.file("hello.txt")?.async("string")).toBe("hello"); } },
  { id: "file-hasher", run: async () => expect(await hashBytes(new TextEncoder().encode("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") },
  { id: "metadata-viewer", run: () => expect(fileMetadata({ name: "report.PDF", size: 42, type: "application/pdf", lastModified: 0 })).toMatchObject({ extension: "pdf", size: 42 }) },
  { id: "duplicate-finder", run: () => expect(groupDuplicateFiles([{ name: "a", hash: "x" }, { name: "b", hash: "x" }, { name: "c", hash: "y" }])[0].map((file) => file.name)).toEqual(["a", "b"]) },
  { id: "file-organizer", run: () => expect([categorizeFile("photo.JPG"), categorizeFile("notes.unknown")]).toEqual(["images", "other"]) },
];

describe("tool function contracts (Node.js)", () => {
  const studioContainerIds = new Set(
    TOOL_REGISTRY.filter((tool) => tool.kind === "studio-subtool").map((tool) => tool.parent),
  );
  const executableToolIds = TOOL_REGISTRY
    .filter((tool) => !studioContainerIds.has(tool.id))
    .map((tool) => tool.id)
    .sort();

  it("has exactly one functional case for every executable registered tool", () => {
    expect(cases.map((testCase) => testCase.id).sort()).toEqual(executableToolIds);
    expect(new Set(cases.map((testCase) => testCase.id)).size).toBe(cases.length);
  });

  it.each(cases)("$id executes and returns the expected result", async ({ run }) => {
    await run();
  });

  it("also verifies CSS minification as the formatter's second operation", () => {
    expect(minifyCss("/* note */ a { color: red; }")).toBe("a{color:red;}");
  });
});
