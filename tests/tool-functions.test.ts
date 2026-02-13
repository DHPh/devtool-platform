import { describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { inspectZip } from "@/lib/processors/archive-core";
import JSZip from "jszip";
import { TOOL_REGISTRY } from "@/lib/registry";
import {
  createQrCodeModel,
  calculateConstrainedImageSize,
  calculateTextDiff,
  categorizeFile,
  convertFileContent,
  convertTextToAllCases,
  countText,
  dateTimeInputToUnix,
  decodeBase64,
  decodeHtmlEntities,
  decodeUrlComponent,
  encodeBase64,
  encodeHtmlEntities,
  encodeUrlComponent,
  extractFileMetadata,
  formatCss,
  formatHtml,
  formatJson,
  generateLoremIpsum,
  generateUuidBatch,
  groupDuplicateFiles,
  hashFileContent,
  hashFileForDuplicateDetection,
  ANDROID_ICON_SPECS,
  markdownToHtml,
  minifyCss,
  parseCSV,
  getWheelWinner,
  unixToDateTime,
  validateEmail,
  validateJson,
} from "@/lib/processors";
import { parseJSON } from "@/lib/utils/json-parser";
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
  generateInterpolatedGradientCSS,
  getColorInfo,
  interpolateGradientColorAtPosition,
  simulateColorBlindness,
} from "@/lib/utils/color";
import { generateColorBlindnessPalette } from "@/lib/utils/color/color-blindness-palette";
import { generateOklchPalette } from "@/lib/utils/color/palette-generator";
import {
  compareJsonObjects,
  queryJsonPath,
  validateJsonSchema,
} from "@/lib/utils/json";
import {
  makeHttpRequest,
  parseCurlCommand,
} from "@/lib/utils/network";
import {
  serverDnsLookup,
  serverFileLinkCheck,
  serverIpInfo,
  serverPingHost,
  serverPortScan,
  serverSpeedTest,
  serverUrlTest,
  serverWebSocketTest,
} from "@/lib/utils/network/server-api-client";
import { classifyUrlTestOutcome } from "@/lib/utils/network/url-test-outcome";

type FunctionalCase = {
  id: string;
  run: () => unknown | Promise<unknown>;
};

async function callMockedNetworkRoute<T>(
  route: string,
  expectedBody: unknown,
  responseBody: unknown,
  call: () => Promise<T>,
): Promise<T> {
  const fetchMock = vi.fn<typeof fetch>(
    async (): Promise<Response> =>
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );

  vi.stubGlobal("fetch", fetchMock);
  try {
    const result = await call();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0];
    expect(input).toBe(route);
    expect(init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(init?.body))).toEqual(expectedBody);
    return result;
  } finally {
    vi.unstubAllGlobals();
  }
}

const cases: FunctionalCase[] = [
  { id: "json-formatter", run: () => expect(formatJson('{"b":2,"a":1}', { sortKeys: true }).result).toBe('{\n  "a": 1,\n  "b": 2\n}') },
  { id: "html-formatter", run: async () => expect(await formatHtml("<main><p>Hello</p></main>")).toBe("<main><p>Hello</p></main>\n") },
  { id: "css-formatter", run: async () => expect(await formatCss("a { color: red; }")).toContain("  color: red;") },
  { id: "markdown-preview", run: () => expect(markdownToHtml("# Title\n\n**bold**")).toBe("<h1>Title</h1>\n<p><strong>bold</strong></p>") },
  { id: "word-counter", run: () => expect(countText("one two\n\nthree")).toMatchObject({ words: 3, lines: 3, paragraphs: 2 }) },
  { id: "case-converter", run: () => expect(convertTextToAllCases("hello world").find(({ name }) => name === "camelCase")?.result).toBe("helloWorld") },
  { id: "diff-checker", run: () => expect(calculateTextDiff("same\nold", "same\nnew")).toMatchObject({ lines: [{ type: "unchanged", text: "same" }, { type: "removed", text: "old" }, { type: "added", text: "new" }], stats: { additions: 1, deletions: 1, changes: 1 } }) },
  { id: "base64-encoder", run: () => expect(decodeBase64(encodeBase64("✓ Node"))).toBe("✓ Node") },
  { id: "url-encoder", run: () => expect(decodeUrlComponent(encodeUrlComponent("a b+c"))).toBe("a b+c") },
  { id: "html-entities", run: () => expect(decodeHtmlEntities(encodeHtmlEntities('<a title="x">&</a>'))).toBe('<a title="x">&</a>') },
  { id: "uuid-generator", run: () => expect(generateUuidBatch("v4", 2, { randomBytes: (length) => new Uint8Array(length) })).toEqual(["00000000-0000-4000-8000-000000000000", "00000000-0000-4000-8000-000000000000"]) },
  { id: "password-generator", run: () => expect(generatePassword({ ...getDefaultPasswordOptions(), length: 24 })).toHaveLength(24) },
  { id: "passphrase-generator", run: () => expect(generatePassphrase({ ...getDefaultPassphraseOptions(), wordCount: 4 }).words).toHaveLength(4) },
  { id: "password-analysis", run: () => expect(analyzePasswordStrength("correct-horse-battery-staple-42!").entropy).toBeGreaterThan(50) },
  { id: "lorem-ipsum", run: () => expect(generateLoremIpsum({ count: 8, unit: "words", startWithLorem: true, random: () => 0.5 }).split(" ")).toHaveLength(8) },
  { id: "qr-generator", run: () => expect(createQrCodeModel("hello world", "H").moduleCount).toBeGreaterThanOrEqual(21) },
  { id: "timestamp-converter", run: () => { const exact = dateTimeInputToUnix("2024-01-15T10:30:00.123456789Z", "nanoseconds", "UTC"); expect(unixToDateTime(exact.values[0], "nanoseconds", "UTC").iso).toBe("2024-01-15T10:30:00.123456789Z"); } },
  { id: "color-converter", run: () => expect(getColorInfo("oklch(60% 0.2 30)")?.cssColor?.space).toBe("oklch") },
  { id: "color-picker", run: () => expect(getColorInfo("color(display-p3 1 0 0)")?.cssColor?.space).toBe("display-p3") },
  { id: "palette-generator", run: () => expect(generateOklchPalette("oklch(60% 0.2 30)", 7, { chromaScale: 0.7 }).colors).toHaveLength(7) },
  { id: "gradient-creator", run: () => expect(generateInterpolatedGradientCSS({ type: "linear", angle: 90, stops: [{ color: "oklch(60% 0.2 30)", position: 0 }, { color: "color(display-p3 0 0.7 1)", position: 100 }] }, { space: "oklch", samplesPerSegment: 2 })).toContain("linear-gradient(90deg") },
  { id: "icon-pack-generator", run: () => expect(ANDROID_ICON_SPECS.legacy.map((icon) => icon.size)).toEqual([48, 72, 96, 144, 192]) },
  { id: "contrast-checker", run: () => expect(calculateWCAGCompliance("#000000", "#ffffff")).toMatchObject({ ratio: 21, level: "AAA", isAccessible: true }) },
  { id: "color-blindness-simulator", run: () => expect(simulateColorBlindness("#ff0000", "achromatopsia")).toMatch(/^#[0-9a-f]{6}$/) },
  { id: "accessibility-palette", run: () => expect(generateColorBlindnessPalette({ colorBlindnessType: "deuteranopia", baseColor: "#336699", colorCount: 5, contrastLevel: "AA", algorithm: "hue-shift" }).colors.length).toBeGreaterThan(0) },
  { id: "gradient-color-picker", run: () => expect(interpolateGradientColorAtPosition([{ color: "hsl(0 100% 50%)", position: 0 }, { color: "oklch(70% 0.15 250)", position: 100 }], 50, { space: "oklch" })).toMatch(/^rgb\(/) },
  { id: "regex-tester", run: () => expect(testRegex("\\d+", "a12 b34", "g").totalMatches).toBe(2) },
  { id: "regex-replace", run: () => expect(regexReplace("a1 b2", "\\d", "#", "g").result).toBe("a# b#") },
  { id: "regex-library", run: () => expect(getAllPatterns().some((pattern) => pattern.pattern.length > 0)).toBe(true) },
  { id: "json-validator", run: () => expect(validateJson('{"valid":true}').isValid).toBe(true) },
  { id: "json-formatter-studio", run: () => expect(formatJson('{"x":1}', { indentSize: 4 }).result).toContain('    "x": 1') },
  { id: "json-path-query", run: () => expect(queryJsonPath({ user: { name: "Ada" } }, "$.user.name").results[0].value).toBe("Ada") },
  { id: "json-schema-validator", run: () => expect(validateJsonSchema({ id: 3 }, { type: "object", required: ["id"], properties: { id: { type: "integer" } } }).isValid).toBe(true) },
  { id: "json-diff-compare", run: () => expect(compareJsonObjects({ a: 1 }, { a: 2 }).differences).toHaveLength(1) },
  { id: "email-validator", run: () => expect(validateEmail("dev@example.com")).toMatchObject({ email: "dev@example.com", normalizedEmail: "dev@example.com", isValid: true, scope: "syntax-only", deliverability: "not-checked" }) },
  { id: "csv-viewer", run: () => expect(parseCSV("name,age\nAda,36").data).toEqual([{ name: "Ada", age: 36 }]) },
  { id: "json-table-viewer", run: () => expect(parseJSON('[{"name":"Ada"}]')).toMatchObject({ rowCount: 1, headers: ["name"] }) },
  { id: "data-explorer", run: () => expect(parseCSV("name,score\nAda,42", { convertValues: false }).data).toEqual([{ name: "Ada", score: "42" }]) },
  { id: "random-wheel", run: () => expect(getWheelWinner([{ text: "a", weight: 1 }, { text: "b", weight: 2 }], 180)?.text).toBe("b") },
  { id: "api-tester", run: () => expect(parseCurlCommand("curl -X POST https://example.com/api")?.method).toBe("POST") },
  { id: "http-client", run: async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('{"ok":true}', {
      status: 201,
      statusText: "Created",
      headers: { "Content-Type": "application/json", "X-Request-Id": "request-1" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const result = await makeHttpRequest({
        url: "https://api.example.com/items",
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
        body: '{"name":"Ada"}',
        timeout: 1000,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/items");
      expect(fetchMock.mock.calls[0][1]).toMatchObject({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: '{"name":"Ada"}',
      });
      expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
      expect(result).toMatchObject({
        success: true,
        response: {
          status: 201,
          statusText: "Created",
          headers: { "content-type": "application/json", "x-request-id": "request-1" },
          data: '{"ok":true}',
          size: 11,
        },
      });
    } finally {
      vi.unstubAllGlobals();
    }
  } },
  { id: "websocket-tester", run: async () => expect(await callMockedNetworkRoute("/api/network/websocket-test", { url: "wss://echo.example.com/socket" }, { url: "wss://echo.example.com/socket", connected: true, responseTime: 18, protocol: "websocket", timestamp: 1 }, () => serverWebSocketTest("wss://echo.example.com/socket"))).toMatchObject({ connected: true, protocol: "websocket", responseTime: 18 }) },
  { id: "dns-lookup", run: async () => expect(await callMockedNetworkRoute("/api/network/dns-lookup", { domain: "example.com", recordType: "AAAA" }, { domain: "example.com", recordType: "AAAA", records: ["2001:db8::1"], success: true, timestamp: 2 }, () => serverDnsLookup("example.com", "AAAA"))).toMatchObject({ success: true, records: ["2001:db8::1"] }) },
  { id: "ip-info", run: async () => expect(await callMockedNetworkRoute("/api/network/ip-info", { ip: "8.8.8.8" }, { ip: "8.8.8.8", country: "United States", countryCode: "US", city: "Mountain View", latitude: 37.4, longitude: -122.1, timestamp: 3 }, () => serverIpInfo("8.8.8.8"))).toMatchObject({ ip: "8.8.8.8", countryCode: "US", city: "Mountain View" }) },
  { id: "port-scanner", run: async () => expect(await callMockedNetworkRoute("/api/network/port-scan", { host: "example.com", ports: [80, 443], timeout: 2500 }, { results: [{ host: "example.com", port: 80, open: false, timestamp: 4 }, { host: "example.com", port: 443, open: true, service: "HTTPS", responseTime: 12, timestamp: 4 }] }, () => serverPortScan("example.com", [80, 443], 2500))).toEqual([{ host: "example.com", port: 80, open: false, timestamp: 4 }, { host: "example.com", port: 443, open: true, service: "HTTPS", responseTime: 12, timestamp: 4 }]) },
  { id: "network-monitor", run: async () => { const ping = await callMockedNetworkRoute("/api/network/ping", { host: "https://example.com", timeout: 3000 }, { host: "https://example.com", alive: true, responseTime: 24, method: "HEAD", timestamp: 5 }, () => serverPingHost("https://example.com", 3000)); const speed = await callMockedNetworkRoute("/api/network/speed-test", { testType: "download", duration: 10 }, { testType: "download", bytesTransferred: 1250000, duration: 1, speedBps: 1250000, speedKbps: 10000, speedMbps: 10, completed: true, timestamp: 6 }, () => serverSpeedTest("download", 10)); expect(ping).toMatchObject({ alive: true, responseTime: 24, method: "HEAD" }); expect(speed).toMatchObject({ completed: true, speedMbps: 10, bytesTransferred: 1250000 }); } },
  { id: "url-tester", run: async () => {
    const result = await callMockedNetworkRoute(
      "/api/network/url-test",
      { url: "https://example.com/resource", timeout: 2500 },
      {
        url: "https://example.com/resource",
        accessible: true,
        statusCode: 406,
        statusText: "Not Acceptable",
        responseTime: 57,
        contentType: "text/html; charset=UTF-8",
        timestamp: 9,
      },
      () => serverUrlTest("https://example.com/resource", 2500),
    );

    expect(result).toMatchObject({
      accessible: true,
      statusCode: 406,
      statusText: "Not Acceptable",
      responseTime: 57,
      contentType: "text/html; charset=UTF-8",
    });
    expect(result.error).toBeUndefined();
    expect(classifyUrlTestOutcome(result)).toBe("http-error");
  } },
  { id: "on-air-checker", run: async () => expect(await callMockedNetworkRoute("/api/network/ping", { host: "https://example.com/health" }, { host: "https://example.com/health", alive: true, responseTime: 31, method: "HEAD", timestamp: 7 }, () => serverPingHost("https://example.com/health"))).toMatchObject({ host: "https://example.com/health", alive: true, responseTime: 31 }) },
  { id: "file-link-checker", run: async () => expect(await callMockedNetworkRoute("/api/network/file-link-check", { url: "https://cdn.example.com/file.zip" }, { url: "https://cdn.example.com/file.zip", exists: true, statusCode: 200, statusText: "OK", contentType: "application/zip", contentLength: 1024, lastModified: "Wed, 01 Jan 2025 00:00:00 GMT", timestamp: 8 }, () => serverFileLinkCheck("https://cdn.example.com/file.zip"))).toMatchObject({ exists: true, statusCode: 200, contentType: "application/zip", contentLength: 1024 }) },
  { id: "image-resizer", run: () => expect(calculateConstrainedImageSize({ width: 1920, height: 1080 }, { width: 640, height: 1080 }, "width", true)).toEqual({ width: 640, height: 360 }) },
  { id: "pdf-tools", run: async () => { const pdf = await PDFDocument.create(); pdf.addPage([200, 300]); const loaded = await PDFDocument.load(await pdf.save()); expect(loaded.getPageCount()).toBe(1); } },
  { id: "file-converter", run: async () => {
    const file = { name: "note.txt", size: 3, type: "text/plain", lastModified: 0 } as File;
    const blob = await convertFileContent(file, "json", {
      readText: async () => "a\nb",
      convertImage: async () => { throw new Error("Unexpected image conversion"); },
    });
    expect(await blob.text()).toBe('{\n  "originalFilename": "note.txt",\n  "content": "a\\nb"\n}');
    expect(blob.type).toBe("application/json");
  } },
  { id: "archive-manager", run: async () => { const zip = new JSZip(); zip.file("hello.txt", "hello"); expect(await inspectZip(await zip.generateAsync({ type: "uint8array" }))).toEqual([{ name: "hello.txt", path: "hello.txt", size: 5, isDirectory: false }]); } },
  { id: "file-hasher", run: async () => { const bytes = new TextEncoder().encode("abc"); expect(await hashFileContent({ arrayBuffer: async () => bytes.buffer }, "sha256")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"); } },
  { id: "metadata-viewer", run: async () => expect(await extractFileMetadata({ name: "report.PDF", size: 42, type: "application/pdf", lastModified: 0 } as File)).toMatchObject({ basic: { extension: "pdf", sizeBytes: 42 } }) },
  { id: "duplicate-finder", run: async () => { const bytes = new TextEncoder().encode("same content"); const file = { arrayBuffer: async () => bytes.buffer }; const hash = await hashFileForDuplicateDetection(file); expect(groupDuplicateFiles([{ name: "a", hash }, { name: "b", hash }])[0].map((entry) => entry.name)).toEqual(["a", "b"]); } },
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
    expect(minifyCss("/* note */ a { color: red; }")).toBe("/* note */a{color:red;}");
  });
});
