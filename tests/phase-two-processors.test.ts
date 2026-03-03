import { describe, expect, it } from "vitest";
import {
  compareEnvFiles,
  compareSemanticVersions,
  convertChmod,
  flattenJson,
  generateDigest,
  generateHmac,
  inspectCronExpression,
  inspectJwt,
  jsonToTypeScript,
  parseEnvFile,
  redactEnvFile,
  unflattenJson,
} from "@/lib/processors";

describe("DevOps quick-tool processors", () => {
  it("previews cron runs deterministically and rejects malformed fields", () => {
    const result = inspectCronExpression("*/30 8-9 * * 1-5", {
      currentDate: new Date("2026-02-19T08:00:00Z"),
      timezone: "UTC",
      count: 3,
    });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.value.nextRuns).toHaveLength(3);
    expect(inspectCronExpression("0 0 0 * * *").ok).toBe(false);
  });

  it("round-trips supported chmod representations", () => {
    const numeric = convertChmod("640");
    expect(numeric).toMatchObject({ ok: true, value: { symbolic: "rw-r-----" } });
    expect(convertChmod("rw-r-----")).toMatchObject({ ok: true, value: { octal: "640" } });
    expect(convertChmod("rwxr-x").ok).toBe(false);
  });

  it("parses comments, quoted values, duplicates, and invalid lines", () => {
    expect(parseEnvFile('# note\nA="hello world"\nA=second')).toMatchObject({
      entries: [{ key: "A", value: "hello world" }, { key: "A", value: "second" }],
      duplicates: ["A"],
    });
    expect(parseEnvFile('A="unterminated').errors[0]).toContain("unterminated");
  });

  it("redacts secret-like keys and compares environments", () => {
    expect(redactEnvFile("PASSWORD=p\nPUBLIC=value")).toEqual({ ok: true, value: "PASSWORD=[REDACTED]\nPUBLIC=value" });
    expect(compareEnvFiles("A=1", "A=2")).toMatchObject({ ok: true, value: { changed: ["A"] } });
  });

  it("compares prereleases and validates ranges", () => {
    expect(compareSemanticVersions("1.0.0-beta.1", "1.0.0", ">=1.0.0-beta")).toMatchObject({ ok: true, value: { relation: "older", satisfiesRange: true } });
    expect(compareSemanticVersions("1.0.0", "2.0.0", "not a range").ok).toBe(false);
  });
});

describe("Data quick-tool processors", () => {
  it("infers nested, array, union, and quoted TypeScript properties", () => {
    const result = jsonToTypeScript('{"display-name":"Ada","values":[1,"two"],"meta":{"ok":true}}', "api result");
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.value).toContain("export type ApiResult");
      expect(result.value).toContain('"display-name": string');
      expect(result.value).toContain("(number | string)[]");
    }
    expect(jsonToTypeScript("{bad").ok).toBe(false);
  });

  it.each([
    '{"user":{"first.name":"Ada"},"items":[{"id":1},{"id":2}]}',
    '[{"id":1},{"id":2}]',
    '[]',
    '{}',
    '42',
  ])("round-trips flattened JSON: %s", (source) => {
    const flat = flattenJson(source);
    expect(flat.ok).toBe(true);
    if (!flat.ok) return;
    const restored = unflattenJson(flat.value);
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(JSON.parse(restored.value)).toEqual(JSON.parse(source));
  });

  it("rejects conflicting unflatten paths", () => {
    expect(unflattenJson('{"a":1,"a.b":2}').ok).toBe(false);
  });
});

describe("Security quick-tool processors", () => {
  it("decodes active and expired JWT claims without claiming verification", () => {
    const token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwiZXhwIjoxNzAwMDAwMDAwfQ.";
    const result = inspectJwt(token, new Date("2024-01-01T00:00:00Z"));
    expect(result).toMatchObject({ ok: true, value: { algorithm: "none", status: "expired" } });
    if (result.ok) expect(result.value.warning).toContain("not been verified");
    expect(inspectJwt("broken").ok).toBe(false);
  });

  it("generates known SHA-2 and HMAC vectors", async () => {
    await expect(generateDigest("abc", "SHA-256")).resolves.toEqual({
      ok: true,
      value: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    });
    await expect(generateHmac("The quick brown fox jumps over the lazy dog", "key", "SHA-256")).resolves.toEqual({
      ok: true,
      value: "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    });
  });
});