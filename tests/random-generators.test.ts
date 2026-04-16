import { describe, expect, it } from "vitest";
import { md5Bytes } from "@/lib/processors/file-core";
import {
  calculateNumberStats,
  formatGeneratedNumber,
  generateNameBatch,
  generateNumberBatch,
} from "@/lib/processors/random-generators";

describe("random generators processor", () => {
  it("generates person, company, and project names deterministically", () => {
    expect(
      generateNameBatch({
        type: "person",
        gender: "female",
        count: 2,
        random: () => 0,
      }),
    ).toEqual({
      ok: true,
      value: ["Mary Smith", "Mary Smith"],
    });

    expect(
      generateNameBatch({ type: "company", count: 1, random: () => 0 }),
    ).toEqual({
      ok: true,
      value: ["Tech Solutions"],
    });

    expect(
      generateNameBatch({ type: "project", count: 1, random: () => 0 }),
    ).toEqual({
      ok: true,
      value: ["Amazing Project"],
    });

    expect(generateNameBatch({ count: 0 }).ok).toBe(false);
    expect(generateNameBatch({ count: 51 }).ok).toBe(false);
  });

  it("generates integer and decimal batches and validates range constraints", () => {
    expect(
      generateNumberBatch({
        min: 10,
        max: 12,
        count: 3,
        allowDuplicates: false,
        random: (() => {
          const seq = [0, 0.5, 0.99];
          let idx = 0;
          return () => seq[idx++ % seq.length];
        })(),
      }),
    ).toEqual({
      ok: true,
      value: [10, 11, 12],
    });

    expect(
      generateNumberBatch({
        min: 1,
        max: 3,
        count: 4,
        allowDuplicates: false,
      }),
    ).toEqual({
      ok: false,
      error: "Cannot generate unique numbers within the given range.",
    });

    expect(generateNumberBatch({ min: 50, max: 10 }).ok).toBe(false);
  });

  it("formats bases and computes statistics accurately", () => {
    expect(formatGeneratedNumber(42, "decimal")).toBe("42");
    expect(formatGeneratedNumber(42, "binary")).toBe("0b101010");
    expect(formatGeneratedNumber(42, "hex")).toBe("0x2A");
    expect(formatGeneratedNumber(42, "octal")).toBe("0o52");
    expect(formatGeneratedNumber(-15, "hex")).toBe("-0xF");

    expect(calculateNumberStats([])).toBeNull();
    expect(calculateNumberStats([2, 4, 6, 8])).toEqual({
      count: 4,
      sum: "20",
      average: "5",
      median: "5",
      min: "2",
      max: "8",
    });
  });

  it("computes RFC 1321 MD5 digests without external dependencies", () => {
    const enc = (text: string) => new TextEncoder().encode(text);
    expect(md5Bytes(enc(""))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5Bytes(enc("a"))).toBe("0cc175b9c0f1b6a831c399e269772661");
    expect(md5Bytes(enc("abc"))).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(md5Bytes(enc("message digest"))).toBe(
      "f96b697d7cb7938d525a2f31aaf161d0",
    );
  });
});
