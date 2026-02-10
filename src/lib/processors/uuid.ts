/** RFC 9562 UUID generation, validation, and inspection. */

export interface UuidSources {
  now?: () => number;
  randomBytes?: (length: number) => Uint8Array;
}

export type UuidVariant =
  | "NCS"
  | "RFC 4122/9562"
  | "Microsoft"
  | "Future";

export interface UuidInspection {
  valid: boolean;
  normalized?: string;
  version: number | null;
  variant: UuidVariant | null;
  timestampMs?: number;
  timestamp?: string;
  error?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const RANDOM_74_MASK = (BIGINT_ONE << BigInt(74)) - BIGINT_ONE;
const RANDOM_62_MASK = (BIGINT_ONE << BigInt(62)) - BIGINT_ONE;
const MAX_TIMESTAMP = (BIGINT_ONE << BigInt(48)) - BIGINT_ONE;

function defaultRandomBytes(length: number): Uint8Array {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Cryptographic randomness is unavailable in this environment");
  }
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

function getRandomBytes(source: UuidSources["randomBytes"], length: number): Uint8Array {
  const bytes = (source ?? defaultRandomBytes)(length);
  if (!(bytes instanceof Uint8Array) || bytes.length !== length) {
    throw new Error(`Random source must return exactly ${length} bytes`);
  }
  return new Uint8Array(bytes);
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

function bigintToUuid(value: bigint): string {
  const hex = value.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

function randomBigInt(bytes: Uint8Array): bigint {
  let value = BIGINT_ZERO;
  for (const byte of bytes) value = (value << BigInt(8)) | BigInt(byte);
  return value;
}

/** Generate an RFC 9562 UUIDv4 using cryptographically secure random bytes. */
export function createUuidV4(sources: Pick<UuidSources, "randomBytes"> = {}): string {
  const bytes = getRandomBytes(sources.randomBytes, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

export interface UuidV7Generator {
  next(): string;
}

/**
 * Create a stateful UUIDv7 generator. Within one generator, UUIDs remain
 * lexicographically monotonic when the clock repeats or moves backwards.
 */
export function createUuidV7Generator(sources: UuidSources = {}): UuidV7Generator {
  const now = sources.now ?? Date.now;
  let lastTimestamp = -BIGINT_ONE;
  let random74 = BIGINT_ZERO;

  const reseed = () => randomBigInt(getRandomBytes(sources.randomBytes, 10)) & RANDOM_74_MASK;

  return {
    next(): string {
      const clockValue = now();
      if (!Number.isFinite(clockValue) || clockValue < 0) {
        throw new Error("UUIDv7 clock must return a non-negative finite timestamp");
      }
      let timestamp = BigInt(Math.trunc(clockValue));
      if (timestamp > MAX_TIMESTAMP) throw new Error("UUIDv7 timestamp exceeds 48 bits");

      if (timestamp > lastTimestamp) {
        lastTimestamp = timestamp;
        random74 = reseed();
      } else {
        timestamp = lastTimestamp;
        random74 += BIGINT_ONE;
        if (random74 > RANDOM_74_MASK) {
          if (lastTimestamp === MAX_TIMESTAMP) throw new Error("UUIDv7 monotonic state exhausted");
          lastTimestamp += BIGINT_ONE;
          timestamp = lastTimestamp;
          random74 = reseed();
        }
      }

      const randA = random74 >> BigInt(62);
      const randB = random74 & RANDOM_62_MASK;
      const value =
        (timestamp << BigInt(80)) |
        (BigInt(7) << BigInt(76)) |
        (randA << BigInt(64)) |
        (BigInt(2) << BigInt(62)) |
        randB;
      return bigintToUuid(value);
    },
  };
}

export type GeneratedUuidVersion = "v4" | "v7";

export function generateUuidBatch(
  version: GeneratedUuidVersion,
  count: number,
  options: UuidSources & { v7Generator?: UuidV7Generator } = {},
): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    throw new Error("UUID batch count must be an integer between 1 and 1000");
  }
  const v7 = options.v7Generator ?? createUuidV7Generator(options);
  return Array.from({ length: count }, () =>
    version === "v4" ? createUuidV4(options) : v7.next(),
  );
}

function variantFromNibble(nibble: number): UuidVariant {
  if ((nibble & 0x8) === 0) return "NCS";
  if ((nibble & 0xc) === 0x8) return "RFC 4122/9562";
  if ((nibble & 0xe) === 0xc) return "Microsoft";
  return "Future";
}

export function inspectUuid(input: string): UuidInspection {
  const value = input;
  if (!UUID_PATTERN.test(value)) {
    return {
      valid: false,
      version: null,
      variant: null,
      error: "Expected canonical 8-4-4-4-12 hexadecimal UUID format",
    };
  }

  const normalized = value.toLowerCase();
  const compact = normalized.replace(/-/g, "");
  const isNil = /^0{32}$/.test(compact);
  const isMax = /^f{32}$/.test(compact);
  const version = isNil || isMax ? null : Number.parseInt(compact[12], 16);
  const variant = variantFromNibble(Number.parseInt(compact[16], 16));
  if (variant === "RFC 4122/9562" && version !== null && (version < 1 || version > 8)) {
    return {
      valid: false,
      normalized,
      version,
      variant,
      error: `Unsupported RFC UUID version ${version}`,
    };
  }
  const result: UuidInspection = { valid: true, normalized, version, variant };

  if (version === 7 && variant === "RFC 4122/9562") {
    const timestampMs = Number(BigInt(`0x${compact.slice(0, 12)}`));
    const date = new Date(timestampMs);
    result.timestampMs = timestampMs;
    result.timestamp = date.toISOString();
  }
  return result;
}

export function isValidUuid(input: string): boolean {
  return inspectUuid(input).valid;
}
