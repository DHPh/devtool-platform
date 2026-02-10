import { describe, expect, it } from "vitest";

import {
  createUuidV4,
  createUuidV7Generator,
  generateUuidBatch,
  inspectUuid,
  isValidUuid,
} from "@/lib/processors/uuid";

const zeroBytes = (length: number) => new Uint8Array(length);

describe("RFC 9562 UUID generation", () => {
  it("sets UUIDv4 version and RFC variant bits", () => {
    const uuid = createUuidV4({ randomBytes: zeroBytes });
    expect(uuid).toBe("00000000-0000-4000-8000-000000000000");
    expect(inspectUuid(uuid)).toMatchObject({
      valid: true,
      version: 4,
      variant: "RFC 4122/9562",
    });
  });

  it("encodes a 48-bit Unix millisecond timestamp in UUIDv7", () => {
    const timestamp = 1_700_000_000_123;
    const uuid = createUuidV7Generator({
      now: () => timestamp,
      randomBytes: zeroBytes,
    }).next();
    expect(uuid).toBe("018bcfe5-687b-7000-8000-000000000000");
    expect(inspectUuid(uuid)).toMatchObject({
      valid: true,
      version: 7,
      variant: "RFC 4122/9562",
      timestampMs: timestamp,
      timestamp: new Date(timestamp).toISOString(),
    });
  });

  it("is strictly monotonic within repeated and backwards milliseconds", () => {
    const times = [1000, 1000, 999, 1001];
    const generator = createUuidV7Generator({
      now: () => times.shift()!,
      randomBytes: zeroBytes,
    });
    const uuids = Array.from({ length: 4 }, () => generator.next());
    expect(uuids).toEqual([...uuids].sort());
    expect(new Set(uuids).size).toBe(4);
    expect(uuids.map((uuid) => inspectUuid(uuid).timestampMs)).toEqual([
      1000,
      1000,
      1000,
      1001,
    ]);
  });

  it("advances the logical millisecond when the 74-bit counter overflows", () => {
    const generator = createUuidV7Generator({
      now: () => 42,
      randomBytes: (length) => new Uint8Array(length).fill(0xff),
    });
    const first = generator.next();
    const second = generator.next();
    expect(second > first).toBe(true);
    expect(inspectUuid(second).timestampMs).toBe(43);
  });

  it("generates bounded batches with a shared monotonic generator", () => {
    const generator = createUuidV7Generator({ now: () => 100, randomBytes: zeroBytes });
    const batch = generateUuidBatch("v7", 5, { v7Generator: generator });
    expect(batch).toEqual([...batch].sort());
    expect(() => generateUuidBatch("v4", 0)).toThrow(/between 1 and 1000/);
    expect(() => generateUuidBatch("v4", 1001)).toThrow(/between 1 and 1000/);
  });

  it("rejects invalid clocks and random sources", () => {
    expect(() => createUuidV7Generator({ now: () => -1 }).next()).toThrow(/clock/);
    expect(() => createUuidV4({ randomBytes: () => new Uint8Array(4) })).toThrow(
      /exactly 16 bytes/,
    );
  });
});

describe("strict UUID inspection", () => {
  it.each([
    ["00000000-0000-4000-0000-000000000000", "NCS"],
    ["00000000-0000-4000-8000-000000000000", "RFC 4122/9562"],
    ["00000000-0000-4000-c000-000000000000", "Microsoft"],
    ["00000000-0000-4000-e000-000000000000", "Future"],
  ] as const)("reports the variant for %s", (uuid, variant) => {
    expect(inspectUuid(uuid)).toMatchObject({ valid: true, version: 4, variant });
  });

  it("recognizes nil and max UUID special values", () => {
    expect(inspectUuid("00000000-0000-0000-0000-000000000000")).toMatchObject({
      valid: true,
      version: null,
      variant: "NCS",
    });
    expect(inspectUuid("ffffffff-ffff-ffff-ffff-ffffffffffff")).toMatchObject({
      valid: true,
      version: null,
      variant: "Future",
    });
  });

  it.each([
    "",
    " 550e8400-e29b-41d4-a716-446655440000 ",
    "550e8400e29b41d4a716446655440000",
    "{550e8400-e29b-41d4-a716-446655440000}",
    "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-z716-446655440000",
    "550e8400-e29b-91d4-a716-446655440000",
  ])("rejects non-canonical or unsupported UUID %j", (uuid) => {
    expect(isValidUuid(uuid)).toBe(false);
    expect(inspectUuid(uuid).error).toBeTruthy();
  });
});
