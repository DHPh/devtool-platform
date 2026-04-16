import { describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { inspectZip } from "@/lib/processors/archive-core";
import JSZip from "jszip";
import { TOOL_REGISTRY } from "@/lib/registry";
import { isExecutableTool } from "@/lib/tool-registry";
import { createQrCodeModel } from "@/lib/processors/qr-code";
import {
  ANDROID_ICON_SPECS,
  calculateConstrainedImageSize,
  calculateTextDiff,
  getWheelWinner,
} from "@/lib/processors/ui-primitives";
import {
  categorizeFile,
  groupDuplicateFiles,
  hashFileContent,
  hashFileForDuplicateDetection,
} from "@/lib/processors/file-core";
import {
  convertFileContent,
  extractFileMetadata,
} from "@/lib/processors/file-capabilities";
import {
  convertCsvJson,
  convertIntegerBase,
  convertJsonYaml,
  formatToml,
  formatXml,
  formatYaml,
  validateXml,
  validateYaml,
} from "@/lib/processors/serialization-core";
import {
  compareEnvFiles,
  compareSemanticVersions,
  convertChmod,
  inspectCronExpression,
  redactEnvFile,
} from "@/lib/processors/devops-config-core";
import {
  flattenJson,
  jsonToTypeScript,
  unflattenJson,
} from "@/lib/processors/data-api-core";
import {
  convertCssUnit,
  createCssClamp,
  dataUriToSvg,
  formatJavaScript,
  generateOpenGraphTags,
  generateWebManifest,
  svgToDataUri,
} from "@/lib/processors/web-code-core";
import { convertTextToAllCases } from "@/lib/processors/text";
import {
  countText,
  decodeHtmlEntities,
  encodeHtmlEntities,
  formatCss,
  formatHtml,
  markdownToHtml,
  minifyCss,
  validateEmail,
} from "@/lib/processors/tool-core";
import {
  dateTimeInputToUnix,
  unixToDateTime,
} from "@/lib/processors/timestamp";
import {
  buildSelectQuery,
  dataToSql,
  formatGraphql,
  formatSql,
  generateFakeData,
  validateOpenApi,
} from "@/lib/processors/data-workflow-core";
import { decodeBase64, encodeBase64 } from "@/lib/processors/base64";
import { decodeUrlComponent, encodeUrlComponent } from "@/lib/processors/url";
import {
  decodeCertificate,
  decryptText,
  encryptText,
  generateJwt,
  generateSigningKeyPair,
  generateSri,
  generateTotp,
  signText,
  validateTotp,
  verifyJwtSignature,
  verifyTextSignature,
} from "@/lib/processors/advanced-crypto-core";
import { formatJson, validateJson } from "@/lib/processors/json";
import {
  generateDigest,
  generateHmac,
  inspectJwt,
} from "@/lib/processors/crypto-core";
import {
  generateGitignore,
  lintDockerfile,
  validateDockerCompose,
  validateKubernetesManifest,
} from "@/lib/processors/devops-validation-core";
import { generateLoremIpsum } from "@/lib/processors/lorem";
import {
  calculateNumberStats,
  formatGeneratedNumber,
  generateNameBatch,
  generateNumberBatch,
} from "@/lib/processors/random-generators";
import { generateUuidBatch } from "@/lib/processors/uuid";
import {
  minifyJavaScript,
  optimizeSvg,
} from "@/lib/processors/advanced-web-core";
import { parseCSV } from "@/lib/processors/csv";
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
import { compareJsonObjects } from "@/lib/utils/json/json-diff";
import { queryJsonPath } from "@/lib/utils/json/json-path";
import { validateJsonSchema } from "@/lib/utils/json/json-schema";
import { makeHttpRequest, parseCurlCommand } from "@/lib/utils/network";
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
import { runWebsiteDiagnostic } from "@/lib/utils/network/website-inspection-client";

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
  {
    id: "json-formatter",
    run: () =>
      expect(formatJson('{"b":2,"a":1}', { sortKeys: true }).result).toBe(
        '{\n  "a": 1,\n  "b": 2\n}',
      ),
  },
  {
    id: "html-formatter",
    run: async () =>
      expect(await formatHtml("<main><p>Hello</p></main>")).toBe(
        "<main><p>Hello</p></main>\n",
      ),
  },
  {
    id: "css-formatter",
    run: async () =>
      expect(await formatCss("a { color: red; }")).toContain("  color: red;"),
  },
  {
    id: "markdown-preview",
    run: () =>
      expect(markdownToHtml("# Title\n\n**bold**")).toBe(
        "<h1>Title</h1>\n<p><strong>bold</strong></p>",
      ),
  },
  {
    id: "word-counter",
    run: () =>
      expect(countText("one two\n\nthree")).toMatchObject({
        words: 3,
        lines: 3,
        paragraphs: 2,
      }),
  },
  {
    id: "case-converter",
    run: () =>
      expect(
        convertTextToAllCases("hello world").find(
          ({ name }) => name === "camelCase",
        )?.result,
      ).toBe("helloWorld"),
  },
  {
    id: "diff-checker",
    run: () =>
      expect(calculateTextDiff("same\nold", "same\nnew")).toMatchObject({
        lines: [
          { type: "unchanged", text: "same" },
          { type: "removed", text: "old" },
          { type: "added", text: "new" },
        ],
        stats: { additions: 1, deletions: 1, changes: 1 },
      }),
  },
  {
    id: "base64-encoder",
    run: () => expect(decodeBase64(encodeBase64("✓ Node"))).toBe("✓ Node"),
  },
  {
    id: "url-encoder",
    run: () =>
      expect(decodeUrlComponent(encodeUrlComponent("a b+c"))).toBe("a b+c"),
  },
  {
    id: "html-entities",
    run: () =>
      expect(decodeHtmlEntities(encodeHtmlEntities('<a title="x">&</a>'))).toBe(
        '<a title="x">&</a>',
      ),
  },
  {
    id: "uuid-generator",
    run: () =>
      expect(
        generateUuidBatch("v4", 2, {
          randomBytes: (length) => new Uint8Array(length),
        }),
      ).toEqual([
        "00000000-0000-4000-8000-000000000000",
        "00000000-0000-4000-8000-000000000000",
      ]),
  },
  {
    id: "password-generator",
    run: () =>
      expect(
        generatePassword({ ...getDefaultPasswordOptions(), length: 24 }),
      ).toHaveLength(24),
  },
  {
    id: "passphrase-generator",
    run: () =>
      expect(
        generatePassphrase({ ...getDefaultPassphraseOptions(), wordCount: 4 })
          .words,
      ).toHaveLength(4),
  },
  {
    id: "password-analysis",
    run: () =>
      expect(
        analyzePasswordStrength("correct-horse-battery-staple-42!").entropy,
      ).toBeGreaterThan(50),
  },
  {
    id: "lorem-ipsum",
    run: () =>
      expect(
        generateLoremIpsum({
          count: 8,
          unit: "words",
          startWithLorem: true,
          random: () => 0.5,
        }).split(" "),
      ).toHaveLength(8),
  },
  {
    id: "qr-generator",
    run: () =>
      expect(
        createQrCodeModel("hello world", "H").moduleCount,
      ).toBeGreaterThanOrEqual(21),
  },
  {
    id: "timestamp-converter",
    run: () => {
      const exact = dateTimeInputToUnix(
        "2024-01-15T10:30:00.123456789Z",
        "nanoseconds",
        "UTC",
      );
      expect(unixToDateTime(exact.values[0], "nanoseconds", "UTC").iso).toBe(
        "2024-01-15T10:30:00.123456789Z",
      );
    },
  },
  {
    id: "yaml-formatter",
    run: () => {
      const result = formatYaml("service:\n name: api\n ports: [80, 443]", 4);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toContain("    name: api");
      expect(formatYaml("key: [unterminated").ok).toBe(false);
    },
  },
  {
    id: "yaml-validator",
    run: () => {
      expect(validateYaml("enabled: true")).toEqual({ valid: true });
      const invalid = validateYaml("duplicate: 1\nduplicate: 2");
      expect(invalid.valid).toBe(false);
      if (!invalid.valid) expect(invalid.error.line).toBe(2);
    },
  },
  {
    id: "xml-formatter",
    run: () => {
      const result = formatXml('<root id="1"><item>value</item></root>', 2);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toContain("\n  <item>value</item>");
      expect(formatXml("<root><item></root>").ok).toBe(false);
    },
  },
  {
    id: "xml-validator",
    run: () => {
      expect(validateXml('<?xml version="1.0"?><root />')).toEqual({
        valid: true,
      });
      const invalid = validateXml("<root><item></root>");
      expect(invalid.valid).toBe(false);
      if (!invalid.valid) expect(invalid.error.line).toBe(1);
    },
  },
  {
    id: "toml-formatter",
    run: () => {
      const result = formatToml("[server]\nport=3000\nenabled=true");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toContain("port = 3000");
      expect(formatToml("value = [1,").ok).toBe(false);
    },
  },
  {
    id: "json-yaml-converter",
    run: () => {
      const yaml = convertJsonYaml(
        '{"name":"Ada","active":true}',
        "json-to-yaml",
      );
      expect(yaml.ok).toBe(true);
      const json = convertJsonYaml("name: Ada\nactive: true", "yaml-to-json");
      expect(json.ok).toBe(true);
      if (json.ok)
        expect(JSON.parse(json.output)).toEqual({ name: "Ada", active: true });
      expect(convertJsonYaml("{bad", "json-to-yaml").ok).toBe(false);
    },
  },
  {
    id: "csv-json-converter",
    run: () => {
      const json = convertCsvJson(
        'name,notes\nAda,"line 1\nline 2"',
        "csv-to-json",
      );
      expect(json.ok).toBe(true);
      if (json.ok)
        expect(JSON.parse(json.output)[0].notes).toBe("line 1\nline 2");
      const csv = convertCsvJson(
        '[{"name":"Ada","formula":"=1+1"}]',
        "json-to-csv",
      );
      expect(csv.ok).toBe(true);
      if (csv.ok) expect(csv.output).toContain("'=1+1");
    },
  },
  {
    id: "number-base-converter",
    run: () => {
      const result = convertIntegerBase("FFFFFFFFFFFFFFFF", 16);
      expect(result).toMatchObject({
        ok: true,
        value: { decimal: "18446744073709551615" },
      });
      expect(convertIntegerBase("102", 2).ok).toBe(false);
      expect(convertIntegerBase("-10", 10)).toMatchObject({
        ok: true,
        value: { hexadecimal: "-A" },
      });
    },
  },
  {
    id: "cron-expression-builder",
    run: () => {
      const result = inspectCronExpression("0 9 * * 1-5", {
        currentDate: new Date("2026-02-19T00:00:00Z"),
        timezone: "UTC",
        count: 2,
      });
      expect(result).toMatchObject({ ok: true });
      if (result.ok)
        expect(result.value.nextRuns).toEqual([
          "2026-02-19T09:00:00.000Z",
          "2026-02-20T09:00:00.000Z",
        ]);
      expect(inspectCronExpression("bad cron").ok).toBe(false);
    },
  },
  {
    id: "chmod-calculator",
    run: () => {
      expect(convertChmod("755")).toMatchObject({
        ok: true,
        value: { symbolic: "rwxr-xr-x" },
      });
      expect(convertChmod("rw-r-----")).toMatchObject({
        ok: true,
        value: { octal: "640" },
      });
      expect(convertChmod("999").ok).toBe(false);
    },
  },
  {
    id: "env-file-manager",
    run: () => {
      expect(redactEnvFile("API_TOKEN=secret\nDEBUG=true")).toEqual({
        ok: true,
        value: "API_TOKEN=[REDACTED]\nDEBUG=true",
      });
      expect(compareEnvFiles("A=1\nB=2", "A=1\nB=3\nC=4")).toMatchObject({
        ok: true,
        value: { changed: ["B"], onlyRight: ["C"] },
      });
    },
  },
  {
    id: "semver-comparator",
    run: () => {
      expect(
        compareSemanticVersions("v1.5.0", "2.0.0", "^1.0.0"),
      ).toMatchObject({
        ok: true,
        value: { relation: "older", satisfiesRange: true },
      });
      expect(compareSemanticVersions("bad", "2.0.0").ok).toBe(false);
    },
  },
  {
    id: "javascript-formatter",
    run: async () => {
      const result = await formatJavaScript(
        "const answer:number=42",
        "typescript",
        { singleQuote: true },
      );
      expect(result).toEqual({
        ok: true,
        value: "const answer: number = 42;\n",
      });
      await expect(formatJavaScript("const =")).resolves.toMatchObject({
        ok: false,
      });
    },
  },
  {
    id: "javascript-minifier",
    run: async () => {
      const result = await minifyJavaScript(
        "function add(a, b) { return a + b; } console.log(add(1, 2));",
        { mangle: false },
      );
      expect(result).toMatchObject({ ok: true });
      if (result.ok)
        expect(result.value.outputBytes).toBeLessThan(
          result.value.originalBytes,
        );
    },
  },
  {
    id: "svg-optimizer",
    run: async () => {
      const result = await optimizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><!-- note --><path fill="#ff0000" d="M0 0h10v10H0z"/></svg>',
      );
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(result.value.output).not.toContain("note");
    },
  },
  {
    id: "svg-data-uri-converter",
    run: () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>';
      const encoded = svgToDataUri(svg);
      expect(encoded).toMatchObject({ ok: true });
      if (encoded.ok)
        expect(dataUriToSvg(encoded.value)).toEqual({ ok: true, value: svg });
      expect(svgToDataUri("<svg><script/></svg>").ok).toBe(false);
    },
  },
  {
    id: "css-unit-converter",
    run: () => {
      expect(convertCssUnit(2, "rem", { rootFontPx: 16 })).toMatchObject({
        ok: true,
        value: { px: 32, rem: 2 },
      });
      expect(convertCssUnit(1, "px", { rootFontPx: 0 }).ok).toBe(false);
    },
  },
  {
    id: "css-clamp-calculator",
    run: () => {
      expect(createCssClamp(16, 32, 320, 1280)).toEqual({
        ok: true,
        value: {
          css: "clamp(16px, 10.6667px + 1.6667vw, 32px)",
          slope: 5 / 3,
          intercept: 32 / 3,
        },
      });
      expect(createCssClamp(32, 16, 320, 1280).ok).toBe(false);
    },
  },
  {
    id: "open-graph-generator",
    run: () => {
      const result = generateOpenGraphTags({
        title: 'A & "B"',
        description: "Summary",
        url: "https://example.com",
        image: "https://example.com/image.png",
      });
      expect(result).toMatchObject({ ok: true });
      if (result.ok)
        expect(result.value).toContain('content="A &amp; &quot;B&quot;"');
      expect(
        generateOpenGraphTags({
          title: "A",
          description: "B",
          url: "/relative",
          image: "https://example.com/image.png",
        }).ok,
      ).toBe(false);
    },
  },
  {
    id: "web-manifest-generator",
    run: () => {
      const result = generateWebManifest({
        name: "Example",
        shortName: "App",
        startUrl: "/",
        display: "standalone",
        themeColor: "#112233",
        backgroundColor: "#ffffff",
      });
      expect(result).toMatchObject({ ok: true });
      if (result.ok)
        expect(JSON.parse(result.value)).toMatchObject({
          short_name: "App",
          display: "standalone",
        });
      expect(
        generateWebManifest({
          name: "Example",
          shortName: "Way too long name",
          startUrl: "/",
          display: "standalone",
          themeColor: "#112233",
          backgroundColor: "#ffffff",
        }).ok,
      ).toBe(false);
    },
  },
  {
    id: "sql-formatter",
    run: () =>
      expect(formatSql("select id from users where active=true;")).toEqual({
        ok: true,
        value: "SELECT id\nFROM users\nWHERE active = TRUE;\n",
      }),
  },
  {
    id: "sql-query-builder",
    run: () =>
      expect(
        buildSelectQuery({ table: "users", columns: ["id"], limit: 5 }),
      ).toEqual({ ok: true, value: "SELECT id\nFROM users\nLIMIT 5;" }),
  },
  {
    id: "data-sql-generator",
    run: () =>
      expect(dataToSql('[{"id":1,"name":"Ada"}]', "users")).toEqual({
        ok: true,
        value: 'INSERT INTO "users" ("id", "name")\nVALUES\n  (1, \'Ada\');',
      }),
  },
  {
    id: "openapi-validator",
    run: () =>
      expect(
        validateOpenApi(
          "openapi: 3.1.0\ninfo:\n  title: API\n  version: 1.0.0\npaths: {}",
        ),
      ).toEqual({
        ok: true,
        value: {
          version: "3.1.0",
          title: "API",
          paths: 0,
          operations: 0,
          issues: [],
        },
      }),
  },
  {
    id: "graphql-formatter",
    run: async () =>
      expect(await formatGraphql("query{viewer{id}}")).toEqual({
        ok: true,
        value: "query {\n  viewer {\n    id\n  }\n}\n",
      }),
  },
  {
    id: "fake-data-generator",
    run: () => {
      const result = generateFakeData({ count: 3, seed: 1 });
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(JSON.parse(result.value)).toHaveLength(3);
    },
  },
  {
    id: "dockerfile-linter",
    run: () => {
      expect(
        lintDockerfile(
          'FROM node:22-alpine\nUSER node\nCMD ["node", "app.js"]',
        ),
      ).toMatchObject({
        ok: true,
        value: { stages: 1, issues: [] },
      });
      expect(lintDockerfile("COPY . /app")).toMatchObject({
        ok: true,
        value: { stages: 0 },
      });
    },
  },
  {
    id: "docker-compose-validator",
    run: () => {
      expect(
        validateDockerCompose("services:\n  web:\n    image: nginx:1.27"),
      ).toEqual({
        ok: true,
        value: { services: ["web"], issues: [] },
      });
      expect(validateDockerCompose("services: {}").ok).toBe(false);
    },
  },
  {
    id: "kubernetes-manifest-validator",
    run: () => {
      expect(
        validateKubernetesManifest(
          "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config",
        ),
      ).toMatchObject({
        ok: true,
        value: {
          resources: [
            { apiVersion: "v1", kind: "ConfigMap", name: "app-config" },
          ],
          issues: [],
        },
      });
      const result = validateKubernetesManifest(
        "kind: Service\nmetadata: {}\nspec: {}",
      );
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(result.value.issues).toHaveLength(2);
    },
  },
  {
    id: "gitignore-generator",
    run: () => {
      const result = generateGitignore(["node", "nextjs"], ".env");
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(result.value).toContain("node_modules/\n");
      expect(generateGitignore([]).ok).toBe(false);
    },
  },
  {
    id: "json-to-typescript",
    run: () => {
      const result = jsonToTypeScript(
        '{"display-name":"Ada","roles":["admin"]}',
        "User",
      );
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(result.value).toContain('"display-name": string;');
    },
  },
  {
    id: "json-flatten-unflatten",
    run: () => {
      const source = '{"user":{"name":"Ada"},"items":[1,2]}';
      const flat = flattenJson(source);
      expect(flat.ok).toBe(true);
      if (!flat.ok) return;
      const restored = unflattenJson(flat.value);
      expect(restored.ok).toBe(true);
      if (restored.ok)
        expect(JSON.parse(restored.value)).toEqual(JSON.parse(source));
    },
  },
  {
    id: "jwt-inspector",
    run: () => {
      const result = inspectJwt(
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE4OTM0NTYwMDB9.signature",
        new Date("2026-01-01T00:00:00Z"),
      );
      expect(result).toMatchObject({
        ok: true,
        value: { algorithm: "HS256", status: "active" },
      });
      expect(inspectJwt("not-a-jwt").ok).toBe(false);
    },
  },
  {
    id: "jwt-generator",
    run: async () => {
      const result = await generateJwt(
        '{"typ":"JWT"}',
        '{"sub":"123"}',
        "development-only-secret-change-me",
        { algorithm: "HS256", keyType: "hmac" },
      );
      expect(result).toMatchObject({ ok: true, value: { algorithm: "HS256" } });
    },
  },
  {
    id: "hash-hmac-generator",
    run: async () => {
      await expect(generateDigest("abc", "SHA-256")).resolves.toEqual({
        ok: true,
        value:
          "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      });
      const hmac = await generateHmac("message", "secret", "SHA-256");
      expect(hmac).toMatchObject({ ok: true });
      if (hmac.ok) expect(hmac.value).toHaveLength(64);
      await expect(
        generateHmac("message", "", "SHA-256"),
      ).resolves.toMatchObject({ ok: false });
    },
  },
  {
    id: "jwt-signature-verifier",
    run: async () =>
      expect(
        await verifyJwtSignature(
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
          "your-256-bit-secret",
        ),
      ).toMatchObject({
        ok: true,
        value: { verified: true, algorithm: "HS256" },
      }),
  },
  {
    id: "symmetric-encryption",
    run: async () => {
      const encrypted = await encryptText(
        "test password",
        "secret text",
        100_000,
      );
      expect(encrypted).toMatchObject({ ok: true });
      if (encrypted.ok)
        await expect(
          decryptText("test password", encrypted.value),
        ).resolves.toEqual({ ok: true, value: "secret text" });
    },
  },
  {
    id: "keypair-signature-tool",
    run: async () => {
      const pair = await generateSigningKeyPair();
      expect(pair).toMatchObject({ ok: true });
      if (!pair.ok) return;
      const signature = await signText(
        JSON.stringify(pair.value.privateJwk),
        "message",
      );
      expect(signature).toMatchObject({ ok: true });
      if (signature.ok)
        await expect(
          verifyTextSignature(
            JSON.stringify(pair.value.publicJwk),
            "message",
            signature.value,
          ),
        ).resolves.toEqual({ ok: true, value: true });
    },
  },
  {
    id: "sri-generator",
    run: async () =>
      expect(await generateSri("hello", "SHA-256")).toMatchObject({
        ok: true,
        value: expect.stringMatching(/^sha-256-/),
      }),
  },
  {
    id: "totp-tool",
    run: async () => {
      const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
      const result = await generateTotp(secret, 59_000, 8);
      expect(result).toEqual({ ok: true, value: "94287082" });
      await expect(validateTotp(secret, "94287082", 59_000)).resolves.toEqual({
        ok: true,
        value: true,
      });
    },
  },
  {
    id: "certificate-decoder",
    run: async () => {
      await import("reflect-metadata");
      const x509 = await import("@peculiar/x509");
      x509.cryptoProvider.set(crypto);
      const algorithm = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
      const keys = await crypto.subtle.generateKey(algorithm, true, [
        "sign",
        "verify",
      ]);
      const certificate = await x509.X509CertificateGenerator.createSelfSigned({
        serialNumber: "02",
        name: "CN=Contract Test",
        notBefore: new Date("2026-01-01T00:00:00Z"),
        notAfter: new Date("2027-01-01T00:00:00Z"),
        signingAlgorithm: algorithm,
        keys,
      });
      await expect(
        decodeCertificate(
          certificate.toString("pem"),
          new Date("2026-03-15T00:00:00Z"),
        ),
      ).resolves.toMatchObject({
        ok: true,
        value: {
          subject: "CN=Contract Test",
          status: "valid",
          selfSigned: true,
        },
      });
    },
  },
  {
    id: "color-converter",
    run: () =>
      expect(getColorInfo("oklch(60% 0.2 30)")?.cssColor?.space).toBe("oklch"),
  },
  {
    id: "color-picker",
    run: () =>
      expect(getColorInfo("color(display-p3 1 0 0)")?.cssColor?.space).toBe(
        "display-p3",
      ),
  },
  {
    id: "palette-generator",
    run: () =>
      expect(
        generateOklchPalette("oklch(60% 0.2 30)", 7, { chromaScale: 0.7 })
          .colors,
      ).toHaveLength(7),
  },
  {
    id: "gradient-creator",
    run: () =>
      expect(
        generateInterpolatedGradientCSS(
          {
            type: "linear",
            angle: 90,
            stops: [
              { color: "oklch(60% 0.2 30)", position: 0 },
              { color: "color(display-p3 0 0.7 1)", position: 100 },
            ],
          },
          { space: "oklch", samplesPerSegment: 2 },
        ),
      ).toContain("linear-gradient(90deg"),
  },
  {
    id: "icon-pack-generator",
    run: () =>
      expect(ANDROID_ICON_SPECS.legacy.map((icon) => icon.size)).toEqual([
        48, 72, 96, 144, 192,
      ]),
  },
  {
    id: "contrast-checker",
    run: () =>
      expect(calculateWCAGCompliance("#000000", "#ffffff")).toMatchObject({
        ratio: 21,
        level: "AAA",
        isAccessible: true,
      }),
  },
  {
    id: "color-blindness-simulator",
    run: () =>
      expect(simulateColorBlindness("#ff0000", "achromatopsia")).toMatch(
        /^#[0-9a-f]{6}$/,
      ),
  },
  {
    id: "accessibility-palette",
    run: () =>
      expect(
        generateColorBlindnessPalette({
          colorBlindnessType: "deuteranopia",
          baseColor: "#336699",
          colorCount: 5,
          contrastLevel: "AA",
          algorithm: "hue-shift",
        }).colors.length,
      ).toBeGreaterThan(0),
  },
  {
    id: "gradient-color-picker",
    run: () =>
      expect(
        interpolateGradientColorAtPosition(
          [
            { color: "hsl(0 100% 50%)", position: 0 },
            { color: "oklch(70% 0.15 250)", position: 100 },
          ],
          50,
          { space: "oklch" },
        ),
      ).toMatch(/^rgb\(/),
  },
  {
    id: "regex-tester",
    run: () => expect(testRegex("\\d+", "a12 b34", "g").totalMatches).toBe(2),
  },
  {
    id: "regex-replace",
    run: () =>
      expect(regexReplace("a1 b2", "\\d", "#", "g").result).toBe("a# b#"),
  },
  {
    id: "regex-library",
    run: () =>
      expect(
        getAllPatterns().some((pattern) => pattern.pattern.length > 0),
      ).toBe(true),
  },
  {
    id: "json-validator",
    run: () => expect(validateJson('{"valid":true}').isValid).toBe(true),
  },
  {
    id: "json-formatter-studio",
    run: () =>
      expect(formatJson('{"x":1}', { indentSize: 4 }).result).toContain(
        '    "x": 1',
      ),
  },
  {
    id: "json-path-query",
    run: () =>
      expect(
        queryJsonPath({ user: { name: "Ada" } }, "$.user.name").results[0]
          .value,
      ).toBe("Ada"),
  },
  {
    id: "json-schema-validator",
    run: () =>
      expect(
        validateJsonSchema(
          { id: 3 },
          {
            type: "object",
            required: ["id"],
            properties: { id: { type: "integer" } },
          },
        ).isValid,
      ).toBe(true),
  },
  {
    id: "json-diff-compare",
    run: () =>
      expect(compareJsonObjects({ a: 1 }, { a: 2 }).differences).toHaveLength(
        1,
      ),
  },
  {
    id: "email-validator",
    run: () =>
      expect(validateEmail("dev@example.com")).toMatchObject({
        email: "dev@example.com",
        normalizedEmail: "dev@example.com",
        isValid: true,
        scope: "syntax-only",
        deliverability: "not-checked",
      }),
  },
  {
    id: "csv-viewer",
    run: () =>
      expect(parseCSV("name,age\nAda,36").data).toEqual([
        { name: "Ada", age: 36 },
      ]),
  },
  {
    id: "json-table-viewer",
    run: () =>
      expect(parseJSON('[{"name":"Ada"}]')).toMatchObject({
        rowCount: 1,
        headers: ["name"],
      }),
  },
  {
    id: "data-explorer",
    run: () =>
      expect(
        parseCSV("name,score\nAda,42", { convertValues: false }).data,
      ).toEqual([{ name: "Ada", score: "42" }]),
  },
  {
    id: "random-wheel",
    run: () =>
      expect(
        getWheelWinner(
          [
            { text: "a", weight: 1 },
            { text: "b", weight: 2 },
          ],
          180,
        )?.text,
      ).toBe("b"),
  },
  {
    id: "api-tester",
    run: () =>
      expect(
        parseCurlCommand("curl -X POST https://example.com/api")?.method,
      ).toBe("POST"),
  },
  {
    id: "http-client",
    run: async () => {
      const fetchMock = vi.fn<typeof fetch>(
        async () =>
          new Response('{"ok":true}', {
            status: 201,
            statusText: "Created",
            headers: {
              "Content-Type": "application/json",
              "X-Request-Id": "request-1",
            },
          }),
      );
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
        expect(fetchMock.mock.calls[0][0]).toBe(
          "https://api.example.com/items",
        );
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
            headers: {
              "content-type": "application/json",
              "x-request-id": "request-1",
            },
            data: '{"ok":true}',
            size: 11,
          },
        });
      } finally {
        vi.unstubAllGlobals();
      }
    },
  },
  {
    id: "websocket-tester",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/websocket-test",
          { url: "wss://echo.example.com/socket" },
          {
            url: "wss://echo.example.com/socket",
            connected: true,
            responseTime: 18,
            protocol: "websocket",
            timestamp: 1,
          },
          () => serverWebSocketTest("wss://echo.example.com/socket"),
        ),
      ).toMatchObject({
        connected: true,
        protocol: "websocket",
        responseTime: 18,
      }),
  },
  {
    id: "dns-lookup",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/dns-lookup",
          { domain: "example.com", recordType: "AAAA" },
          {
            domain: "example.com",
            recordType: "AAAA",
            records: ["2001:db8::1"],
            success: true,
            timestamp: 2,
          },
          () => serverDnsLookup("example.com", "AAAA"),
        ),
      ).toMatchObject({ success: true, records: ["2001:db8::1"] }),
  },
  {
    id: "ip-info",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/ip-info",
          { ip: "8.8.8.8" },
          {
            ip: "8.8.8.8",
            country: "United States",
            countryCode: "US",
            city: "Mountain View",
            latitude: 37.4,
            longitude: -122.1,
            timestamp: 3,
          },
          () => serverIpInfo("8.8.8.8"),
        ),
      ).toMatchObject({
        ip: "8.8.8.8",
        countryCode: "US",
        city: "Mountain View",
      }),
  },
  {
    id: "port-scanner",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/port-scan",
          { host: "example.com", ports: [80, 443], timeout: 2500 },
          {
            results: [
              { host: "example.com", port: 80, open: false, timestamp: 4 },
              {
                host: "example.com",
                port: 443,
                open: true,
                service: "HTTPS",
                responseTime: 12,
                timestamp: 4,
              },
            ],
          },
          () => serverPortScan("example.com", [80, 443], 2500),
        ),
      ).toEqual([
        { host: "example.com", port: 80, open: false, timestamp: 4 },
        {
          host: "example.com",
          port: 443,
          open: true,
          service: "HTTPS",
          responseTime: 12,
          timestamp: 4,
        },
      ]),
  },
  {
    id: "network-monitor",
    run: async () => {
      const ping = await callMockedNetworkRoute(
        "/api/network/ping",
        { host: "https://example.com", timeout: 3000 },
        {
          host: "https://example.com",
          alive: true,
          responseTime: 24,
          method: "HEAD",
          timestamp: 5,
        },
        () => serverPingHost("https://example.com", 3000),
      );
      const speed = await callMockedNetworkRoute(
        "/api/network/speed-test",
        { testType: "download", duration: 10 },
        {
          testType: "download",
          bytesTransferred: 1250000,
          duration: 1,
          speedBps: 1250000,
          speedKbps: 10000,
          speedMbps: 10,
          completed: true,
          timestamp: 6,
        },
        () => serverSpeedTest("download", 10),
      );
      expect(ping).toMatchObject({
        alive: true,
        responseTime: 24,
        method: "HEAD",
      });
      expect(speed).toMatchObject({
        completed: true,
        speedMbps: 10,
        bytesTransferred: 1250000,
      });
    },
  },
  {
    id: "url-tester",
    run: async () => {
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
    },
  },
  {
    id: "on-air-checker",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/ping",
          { host: "https://example.com/health" },
          {
            host: "https://example.com/health",
            alive: true,
            responseTime: 31,
            method: "HEAD",
            timestamp: 7,
          },
          () => serverPingHost("https://example.com/health"),
        ),
      ).toMatchObject({
        host: "https://example.com/health",
        alive: true,
        responseTime: 31,
      }),
  },
  {
    id: "file-link-checker",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/file-link-check",
          { url: "https://cdn.example.com/file.zip" },
          {
            url: "https://cdn.example.com/file.zip",
            exists: true,
            statusCode: 200,
            statusText: "OK",
            contentType: "application/zip",
            contentLength: 1024,
            lastModified: "Wed, 01 Jan 2025 00:00:00 GMT",
            timestamp: 8,
          },
          () => serverFileLinkCheck("https://cdn.example.com/file.zip"),
        ),
      ).toMatchObject({
        exists: true,
        statusCode: 200,
        contentType: "application/zip",
        contentLength: 1024,
      }),
  },
  {
    id: "redirect-tracer",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/website-inspection",
          { operation: "redirect-tracer", url: "https://example.com" },
          { result: { finalUrl: "https://www.example.com", redirectCount: 1 } },
          () => runWebsiteDiagnostic("redirect-tracer", "https://example.com"),
        ),
      ).toEqual({ finalUrl: "https://www.example.com", redirectCount: 1 }),
  },
  {
    id: "security-header-analyzer",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/website-inspection",
          {
            operation: "security-header-analyzer",
            url: "https://example.com",
          },
          { result: { score: 83, missing: ["content-security-policy"] } },
          () =>
            runWebsiteDiagnostic(
              "security-header-analyzer",
              "https://example.com",
            ),
        ),
      ).toEqual({ score: 83, missing: ["content-security-policy"] }),
  },
  {
    id: "cors-analyzer",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/website-inspection",
          { operation: "cors-analyzer", url: "https://example.com" },
          { result: { allowedOrigin: "*", allowsCredentials: false } },
          () => runWebsiteDiagnostic("cors-analyzer", "https://example.com"),
        ),
      ).toEqual({ allowedOrigin: "*", allowsCredentials: false }),
  },
  {
    id: "robots-inspector",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/website-inspection",
          { operation: "robots-inspector", url: "https://example.com" },
          { result: { groups: 1, sitemaps: ["https://example.com/map.xml"] } },
          () => runWebsiteDiagnostic("robots-inspector", "https://example.com"),
        ),
      ).toEqual({
        groups: 1,
        sitemaps: ["https://example.com/map.xml"],
      }),
  },
  {
    id: "sitemap-validator",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/website-inspection",
          {
            operation: "sitemap-validator",
            url: "https://example.com/sitemap.xml",
          },
          { result: { valid: true, locations: ["https://example.com/"] } },
          () =>
            runWebsiteDiagnostic(
              "sitemap-validator",
              "https://example.com/sitemap.xml",
            ),
        ),
      ).toEqual({ valid: true, locations: ["https://example.com/"] }),
  },
  {
    id: "open-graph-inspector",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/website-inspection",
          { operation: "open-graph-inspector", url: "https://example.com" },
          { result: { title: "Example", openGraph: { "og:type": "website" } } },
          () =>
            runWebsiteDiagnostic("open-graph-inspector", "https://example.com"),
        ),
      ).toEqual({
        title: "Example",
        openGraph: { "og:type": "website" },
      }),
  },
  {
    id: "email-dns-analyzer",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/dns-inspection",
          { operation: "email-dns-analyzer", domain: "example.com" },
          { result: { mx: ["10 mail.example.com"], spf: ["v=spf1 -all"] } },
          () => runWebsiteDiagnostic("email-dns-analyzer", "example.com"),
        ),
      ).toEqual({
        mx: ["10 mail.example.com"],
        spf: ["v=spf1 -all"],
      }),
  },
  {
    id: "dns-propagation-checker",
    run: async () =>
      expect(
        await callMockedNetworkRoute(
          "/api/network/dns-inspection",
          {
            operation: "dns-propagation-checker",
            domain: "example.com",
            recordType: "AAAA",
          },
          { result: { consistent: true, recordType: "AAAA", resolvers: 3 } },
          () =>
            runWebsiteDiagnostic(
              "dns-propagation-checker",
              "example.com",
              "AAAA",
            ),
        ),
      ).toEqual({ consistent: true, recordType: "AAAA", resolvers: 3 }),
  },
  {
    id: "image-resizer",
    run: () =>
      expect(
        calculateConstrainedImageSize(
          { width: 1920, height: 1080 },
          { width: 640, height: 1080 },
          "width",
          true,
        ),
      ).toEqual({ width: 640, height: 360 }),
  },
  {
    id: "pdf-tools",
    run: async () => {
      const pdf = await PDFDocument.create();
      pdf.addPage([200, 300]);
      const loaded = await PDFDocument.load(await pdf.save());
      expect(loaded.getPageCount()).toBe(1);
    },
  },
  {
    id: "file-converter",
    run: async () => {
      const file = {
        name: "note.txt",
        size: 3,
        type: "text/plain",
        lastModified: 0,
      } as File;
      const blob = await convertFileContent(file, "json", {
        readText: async () => "a\nb",
        convertImage: async () => {
          throw new Error("Unexpected image conversion");
        },
      });
      expect(await blob.text()).toBe(
        '{\n  "originalFilename": "note.txt",\n  "content": "a\\nb"\n}',
      );
      expect(blob.type).toBe("application/json");
    },
  },
  {
    id: "archive-manager",
    run: async () => {
      const zip = new JSZip();
      zip.file("hello.txt", "hello");
      expect(
        await inspectZip(await zip.generateAsync({ type: "uint8array" })),
      ).toEqual([
        { name: "hello.txt", path: "hello.txt", size: 5, isDirectory: false },
      ]);
    },
  },
  {
    id: "file-hasher",
    run: async () => {
      const bytes = new TextEncoder().encode("abc");
      expect(
        await hashFileContent(
          { arrayBuffer: async () => bytes.buffer },
          "sha256",
        ),
      ).toBe(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      );
    },
  },
  {
    id: "metadata-viewer",
    run: async () =>
      expect(
        await extractFileMetadata({
          name: "report.PDF",
          size: 42,
          type: "application/pdf",
          lastModified: 0,
        } as File),
      ).toMatchObject({ basic: { extension: "pdf", sizeBytes: 42 } }),
  },
  {
    id: "duplicate-finder",
    run: async () => {
      const bytes = new TextEncoder().encode("same content");
      const file = { arrayBuffer: async () => bytes.buffer };
      const hash = await hashFileForDuplicateDetection(file);
      expect(
        groupDuplicateFiles([
          { name: "a", hash },
          { name: "b", hash },
        ])[0].map((entry) => entry.name),
      ).toEqual(["a", "b"]);
    },
  },
  {
    id: "name-generator",
    run: () => {
      const result = generateNameBatch({
        type: "person",
        gender: "unisex",
        count: 3,
        random: () => 0,
      });
      expect(result).toEqual({
        ok: true,
        value: ["Alex Smith", "Alex Smith", "Alex Smith"],
      });
    },
  },
  {
    id: "number-generator",
    run: () => {
      const result = generateNumberBatch({
        min: 1,
        max: 100,
        count: 2,
        allowDuplicates: true,
        random: () => 0.5,
      });
      expect(result).toEqual({ ok: true, value: [51, 51] });
      expect(formatGeneratedNumber(255, "hex")).toBe("0xFF");
      expect(calculateNumberStats([10, 20, 30])).toMatchObject({
        count: 3,
        sum: "60",
        average: "20",
        median: "20",
      });
    },
  },
  {
    id: "file-organizer",
    run: () =>
      expect([
        categorizeFile("photo.JPG"),
        categorizeFile("notes.unknown"),
      ]).toEqual(["images", "other"]),
  },
];

describe("tool function contracts (Node.js)", () => {
  const executableToolIds = TOOL_REGISTRY.filter(isExecutableTool)
    .map((tool) => tool.id)
    .sort();

  it("has exactly one functional case for every executable registered tool", () => {
    expect(cases.map((testCase) => testCase.id).sort()).toEqual(
      executableToolIds,
    );
    expect(new Set(cases.map((testCase) => testCase.id)).size).toBe(
      cases.length,
    );
  });

  it.each(cases)(
    "$id executes and returns the expected result",
    async ({ run }) => {
      await run();
    },
  );

  it("also verifies CSS minification as the formatter's second operation", () => {
    expect(minifyCss("/* note */ a { color: red; }")).toBe(
      "/* note */a{color:red;}",
    );
  });
});
