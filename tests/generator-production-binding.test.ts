import { describe, expect, it } from "vitest";
import { generateLoremIpsum } from "@/lib/processors/lorem";
import { generateUuidBatch } from "@/lib/processors/uuid";
import { convertTextToAllCases } from "@/lib/processors/text";
import {
  generateInterpolatedGradientCSS,
  interpolateGradientColorAtPosition,
} from "@/lib/utils/color";

describe("generator production entry points", () => {
  it("returns every case-converter result through the UI's aggregate entry point", () => {
    const results = convertTextToAllCases("HTTP response-code");
    expect(results).toHaveLength(12);
    expect(results.find(({ name }) => name === "snake_case")?.result).toBe(
      "http_response_code",
    );
  });

  it("generates each lorem unit deterministically with the requested count", () => {
    const random = () => 0;
    expect(
      generateLoremIpsum({ count: 1, unit: "words", startWithLorem: true, random }),
    ).toBe("Lorem");
    expect(
      generateLoremIpsum({ count: 2, unit: "sentences", startWithLorem: true, random })
        .match(/\./g),
    ).toHaveLength(2);
    expect(
      generateLoremIpsum({ count: 2, unit: "paragraphs", startWithLorem: false, random })
        .split("\n\n"),
    ).toHaveLength(2);
  });

  it("rejects malformed lorem settings and adversarial random sources", () => {
    expect(() => generateLoremIpsum({ count: 0, unit: "words" })).toThrow(
      "between 1 and 100",
    );
    expect(() =>
      generateLoremIpsum({ count: 1, unit: "words", startWithLorem: false, random: () => 1 }),
    ).toThrow("[0, 1)");
  });

  it("executes the UUID UI batch path and validates its bounds", () => {
    const batch = generateUuidBatch("v4", 2, {
      randomBytes: (length) => new Uint8Array(length),
    });
    expect(batch).toHaveLength(2);
    expect(batch[0]).toBe("00000000-0000-4000-8000-000000000000");
    expect(() => generateUuidBatch("v7", 1001)).toThrow("between 1 and 1000");
  });
});

describe("gradient production entry points", () => {
  const stops = [
    { color: "#ff0000", position: 0 },
    { color: "#0000ff", position: 100 },
  ];

  it("serializes the same materialized gradient path used by the creator UI", () => {
    const css = generateInterpolatedGradientCSS(
      { type: "linear", angle: 90, stops },
      { space: "oklch", samplesPerSegment: 2 },
    );
    expect(css).toMatch(/^linear-gradient\(90deg,/);
    expect(css.match(/%/g)).toHaveLength(3);
  });

  it("samples unsorted stops and clamps positions to the nearest endpoint", () => {
    const unsorted = [stops[1], stops[0]];
    expect(interpolateGradientColorAtPosition(unsorted, -10)).toBe("#ff0000");
    expect(interpolateGradientColorAtPosition(unsorted, 110)).toBe("#0000ff");
    expect(
      interpolateGradientColorAtPosition(unsorted, 50, { space: "linear-srgb" }),
    ).toMatch(/^rgb\(/);
  });

  it("rejects malformed picker inputs", () => {
    expect(() => interpolateGradientColorAtPosition([], 50)).toThrow(
      "at least one color stop",
    );
    expect(() => interpolateGradientColorAtPosition(stops, Number.NaN)).toThrow(
      "must be finite",
    );
    expect(() =>
      interpolateGradientColorAtPosition(
        [{ color: "not-a-color", position: 0 }, stops[1]],
        50,
      ),
    ).toThrow("Invalid colors");
  });
});
