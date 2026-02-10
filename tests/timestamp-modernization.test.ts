import { describe, expect, it } from "vitest";

import {
  currentUnixTimestamp,
  dateTimeInputToUnix,
  formatInTimeZone,
  formatIsoInstant,
  formatUnixTimestamp,
  isValidTimeZone,
  parseDateTimeInput,
  parseIsoInstant,
  parseUnixTimestamp,
  resolveTimeZone,
  resolveZonedDateTime,
  unixToDateTime,
  type UnixTimestampUnit,
} from "@/lib/processors/timestamp";

const units: UnixTimestampUnit[] = [
  "seconds",
  "milliseconds",
  "microseconds",
  "nanoseconds",
];

describe("exact Unix timestamp conversion", () => {
  it.each([
    ["seconds", "1704067200.123456789"],
    ["milliseconds", "1704067200123.456789"],
    ["microseconds", "1704067200123456.789"],
    ["nanoseconds", "1704067200123456789"],
  ] as const)("preserves %s precision", (unit, input) => {
    const nanoseconds = parseUnixTimestamp(input, unit);
    expect(nanoseconds).toBe(BigInt("1704067200123456789"));
    expect(formatUnixTimestamp(nanoseconds, unit)).toBe(input);
  });

  it("round-trips negative fractional instants", () => {
    const nanoseconds = parseUnixTimestamp("-0.000000001", "seconds");
    expect(nanoseconds).toBe(BigInt(-1));
    expect(formatUnixTimestamp(nanoseconds, "seconds")).toBe("-0.000000001");
    expect(formatIsoInstant(nanoseconds)).toBe("1969-12-31T23:59:59.999999999Z");
  });

  it("rejects exponent notation and excess precision for every unit", () => {
    expect(() => parseUnixTimestamp("1e3", "seconds")).toThrow(/decimal number/);
    for (const unit of units) {
      const valid = unit === "seconds" ? "1.123456789" : unit === "milliseconds" ? "1.123456" : unit === "microseconds" ? "1.123" : "1";
      expect(formatUnixTimestamp(parseUnixTimestamp(valid, unit), unit)).toBe(valid);
    }
    expect(() => parseUnixTimestamp("1.1", "nanoseconds")).toThrow(/at most 0/);
  });
});

describe("strict RFC 3339 parsing", () => {
  it("applies explicit offsets without Date.parse", () => {
    const utc = parseIsoInstant("2024-01-15T03:30:00.123456789Z");
    const offset = parseIsoInstant("2024-01-15T10:30:00.123456789+07:00");
    expect(offset.epochNanoseconds).toBe(utc.epochNanoseconds);
    expect(formatIsoInstant(offset.epochNanoseconds)).toBe("2024-01-15T03:30:00.123456789Z");
  });

  it.each([
    "2024-01-15",
    "2024-01-15 10:30:00Z",
    "January 15, 2024 10:30 AM",
    "01/15/2024 10:30:00",
    "2024-02-30T10:30:00Z",
    "2024-01-15T24:00:00Z",
    "2024-01-15T10:30:60Z",
    "2024-01-15T10:30:00.1234567890Z",
  ])("rejects ambiguous or invalid input %j", (input) => {
    expect(() => parseIsoInstant(input)).toThrow();
  });
});

describe("IANA timezone and DST handling", () => {
  it("validates and resolves UTC, local, and IANA selections deterministically", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Not/A_Zone")).toBe(false);
    expect(resolveTimeZone("local", { localTimeZone: () => "Asia/Ho_Chi_Minh" })).toBe(
      "Asia/Ho_Chi_Minh",
    );
    expect(() => resolveTimeZone("Not/A_Zone")).toThrow(/Unsupported IANA/);
  });

  it("formats the same instant in UTC and an IANA timezone", () => {
    const instant = parseIsoInstant("2024-01-15T03:30:00Z").epochNanoseconds;
    expect(formatInTimeZone(instant, "UTC")).toBe("2024-01-15 03:30:00 UTC");
    expect(formatInTimeZone(instant, "Asia/Ho_Chi_Minh")).toBe(
      "2024-01-15 10:30:00 Asia/Ho_Chi_Minh",
    );
  });

  it("reports nonexistent and repeated New York wall times", () => {
    const gap = resolveZonedDateTime("2024-03-10 02:30:00", "America/New_York");
    expect(gap).toMatchObject({ status: "invalid", candidates: [] });
    expect(gap.message).toMatch(/DST gap/);

    const overlap = resolveZonedDateTime("2024-11-03 01:30:00", "America/New_York");
    expect(overlap.status).toBe("ambiguous");
    expect(overlap.candidates).toHaveLength(2);
    expect(overlap.candidates.map(formatIsoInstant)).toEqual([
      "2024-11-03T05:30:00Z",
      "2024-11-03T06:30:00Z",
    ]);
  });

  it("uses an explicit RFC 3339 offset independently of DST ambiguity", () => {
    const parsed = parseDateTimeInput("2024-11-03T01:30:00-04:00", "America/New_York");
    expect(parsed).toMatchObject({ status: "unique", explicitOffset: true });
    expect(parsed.candidates.map(formatIsoInstant)).toEqual(["2024-11-03T05:30:00Z"]);
  });
});

describe("production conversion API", () => {
  it("converts exact nanoseconds in both directions", () => {
    expect(unixToDateTime("1704067200123456789", "nanoseconds", "UTC")).toMatchObject({
      iso: "2024-01-01T00:00:00.123456789Z",
      zoned: "2024-01-01 00:00:00.123456789 UTC",
    });
    expect(dateTimeInputToUnix("2024-01-01T00:00:00.123456789Z", "nanoseconds", "UTC"))
      .toMatchObject({ values: ["1704067200123456789"], resolution: { status: "unique" } });
  });

  it("injects the clock and local timezone for deterministic results", () => {
    expect(currentUnixTimestamp("milliseconds", { now: () => 1_700_000_000_123 })).toBe(
      "1700000000123",
    );
    const result = dateTimeInputToUnix("2024-01-01 07:00:00", "seconds", "local", {
      localTimeZone: () => "Asia/Ho_Chi_Minh",
    });
    expect(result.values).toEqual(["1704067200"]);
  });
});
