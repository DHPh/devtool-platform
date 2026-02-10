import { describe, expect, it } from "vitest";
import {
  decodeBase64,
  decodeBase64Bytes,
  encodeBase64,
  encodeBase64Bytes,
} from "@/lib/processors/base64";

describe("Base64 and Base64url processing", () => {
  it("round-trips Unicode as UTF-8 using standard Base64", () => {
    const encoded = encodeBase64("✓ xin chào");
    expect(encoded).toBe("4pyTIHhpbiBjaMOgbw==");
    expect(decodeBase64(encoded)).toBe("✓ xin chào");
  });

  it("supports canonical unpadded and padded Base64url", () => {
    expect(encodeBase64("???", { variant: "url" })).toBe("Pz8_");
    expect(encodeBase64("f", { variant: "url" })).toBe("Zg");
    expect(encodeBase64("f", { variant: "url", padding: true })).toBe("Zg==");
    expect(decodeBase64("Zg", { variant: "url" })).toBe("f");
    expect(decodeBase64("Zg==", { variant: "url" })).toBe("f");
  });

  it("distinguishes strict canonical input from forgiving input", () => {
    expect(() => decodeBase64("Zg")).toThrow("Invalid Base64");
    expect(() => decodeBase64(" Zg==\n")).toThrow("Invalid Base64");
    expect(decodeBase64(" Zg\n", { mode: "forgiving" })).toBe("f");
    expect(() => decodeBase64("Zg===", { variant: "url" })).toThrow("Invalid Base64url");
    expect(() => decodeBase64("A", { variant: "url" })).toThrow("Invalid Base64url");
  });

  it("round-trips arbitrary binary bytes without UTF-8 coercion", () => {
    const bytes = Uint8Array.of(0, 255, 128, 1, 2, 3);
    const encoded = encodeBase64Bytes(bytes, { variant: "url" });
    expect(encoded).toBe("AP-AAQID");
    expect(decodeBase64Bytes(encoded, { variant: "url" })).toEqual(bytes);
    expect(() => decodeBase64(encoded, { variant: "url" })).toThrow("not valid UTF-8");
  });

  it("rejects non-zero discarded bits in strict mode", () => {
    expect(decodeBase64("Zg==")).toBe("f");
    expect(() => decodeBase64("Zh==")).toThrow("Invalid Base64");
    expect(() => decodeBase64("Zm9=")).toThrow("Invalid Base64");
  });
});
