/** Strict ISO 8601 / RFC 3339 and exact Unix timestamp utilities. */

export type UnixTimestampUnit =
  | "seconds"
  | "milliseconds"
  | "microseconds"
  | "nanoseconds";

export interface TimestampSources {
  now?: () => number;
  localTimeZone?: () => string;
}

export interface ParsedIsoInstant {
  epochNanoseconds: bigint;
  offsetMinutes: number;
  fractionDigits: number;
}

export interface ZonedDateTimeResolution {
  status: "unique" | "ambiguous" | "invalid";
  timeZone: string;
  candidates: bigint[];
  message?: string;
}

export interface ParsedDateTimeInput extends ZonedDateTimeResolution {
  /** True when the input carried its own RFC 3339 offset. */
  explicitOffset: boolean;
}

const NS_PER_SECOND = BigInt(1_000_000_000);
const NS_PER_MILLISECOND = BigInt(1_000_000);
const UNIT_NANOSECONDS: Record<UnixTimestampUnit, bigint> = {
  seconds: NS_PER_SECOND,
  milliseconds: NS_PER_MILLISECOND,
  microseconds: BigInt(1_000),
  nanoseconds: BigInt(1),
};
const UNIT_FRACTION_DIGITS: Record<UnixTimestampUnit, number> = {
  seconds: 9,
  milliseconds: 6,
  microseconds: 3,
  nanoseconds: 0,
};
const ISO_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/;
const ISO_LOCAL =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?$/;

function floorDiv(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor;
  const remainder = value % divisor;
  return remainder < BigInt(0) ? quotient - BigInt(1) : quotient;
}

function positiveModulo(value: bigint, divisor: bigint): bigint {
  const remainder = value % divisor;
  return remainder < BigInt(0) ? remainder + divisor : remainder;
}

function utcMilliseconds(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond = 0,
): number {
  if (month < 1 || month > 12) throw new Error("Month must be between 01 and 12");
  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error("Time components are outside their valid ranges");
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second ||
    date.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error("Date components do not form a real calendar date");
  }
  return date.getTime();
}

/** Parse only an RFC 3339 instant with T and an explicit Z or numeric offset. */
export function parseIsoInstant(input: string): ParsedIsoInstant {
  const match = ISO_INSTANT.exec(input);
  if (!match) {
    throw new Error(
      "Expected YYYY-MM-DDTHH:mm:ss[.fraction](Z|±HH:MM) with up to 9 fraction digits",
    );
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = "", zone, sign, offsetHourText, offsetMinuteText] = match;
  const [year, month, day, hour, minute, second] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
  ].map(Number);
  if (second === 60) throw new Error("Leap-second input is not supported");
  const baseMilliseconds = utcMilliseconds(year, month, day, hour, minute, second);
  let offsetMinutes = 0;
  if (zone !== "Z") {
    const offsetHours = Number(offsetHourText);
    const offsetMinute = Number(offsetMinuteText);
    if (offsetHours > 23 || offsetMinute > 59) throw new Error("Invalid UTC offset");
    offsetMinutes = (offsetHours * 60 + offsetMinute) * (sign === "-" ? -1 : 1);
  }
  const fractionNanoseconds = BigInt((fraction || "0").padEnd(9, "0"));
  return {
    epochNanoseconds:
      BigInt(baseMilliseconds) * NS_PER_MILLISECOND +
      fractionNanoseconds -
      BigInt(offsetMinutes * 60) * NS_PER_SECOND,
    offsetMinutes,
    fractionDigits: fraction.length,
  };
}

/** Parse a signed Unix value exactly; no floating-point conversion is used. */
export function parseUnixTimestamp(input: string, unit: UnixTimestampUnit): bigint {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(input);
  if (!match) throw new Error("Unix timestamp must be a signed decimal number without exponent notation");
  const fraction = match[3] ?? "";
  const maximumFraction = UNIT_FRACTION_DIGITS[unit];
  if (fraction.length > maximumFraction) {
    throw new Error(`${unit} supports at most ${maximumFraction} fractional digits`);
  }
  const magnitude =
    BigInt(match[2]) * UNIT_NANOSECONDS[unit] +
    (fraction ? BigInt(fraction.padEnd(maximumFraction, "0")) : BigInt(0));
  return match[1] === "-" ? -magnitude : magnitude;
}

export function formatUnixTimestamp(
  epochNanoseconds: bigint,
  unit: UnixTimestampUnit,
): string {
  const negative = epochNanoseconds < BigInt(0);
  const magnitude = negative ? -epochNanoseconds : epochNanoseconds;
  const divisor = UNIT_NANOSECONDS[unit];
  const whole = magnitude / divisor;
  const remainder = magnitude % divisor;
  if (remainder === BigInt(0)) return `${negative ? "-" : ""}${whole}`;
  const digits = UNIT_FRACTION_DIGITS[unit];
  const fraction = remainder.toString().padStart(digits, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function formatIsoInstant(epochNanoseconds: bigint): string {
  const epochSeconds = floorDiv(epochNanoseconds, NS_PER_SECOND);
  const fraction = positiveModulo(epochNanoseconds, NS_PER_SECOND);
  const milliseconds = epochSeconds * BigInt(1000);
  const numericMilliseconds = Number(milliseconds);
  if (!Number.isSafeInteger(numericMilliseconds)) {
    throw new Error("Instant is outside the exact JavaScript Date range");
  }
  const date = new Date(numericMilliseconds);
  if (!Number.isFinite(date.getTime())) throw new Error("Instant is outside the supported date range");
  const base = date.toISOString().slice(0, 19);
  if (fraction === BigInt(0)) return `${base}Z`;
  const fractionText = fraction.toString().padStart(9, "0").replace(/0+$/, "");
  return `${base}.${fractionText}Z`;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(
  selection: "UTC" | "local" | string,
  sources: Pick<TimestampSources, "localTimeZone"> = {},
): string {
  if (selection === "UTC") return "UTC";
  const timeZone =
    selection === "local"
      ? (sources.localTimeZone ?? (() => Intl.DateTimeFormat().resolvedOptions().timeZone))()
      : selection;
  if (!isValidTimeZone(timeZone)) throw new Error(`Unsupported IANA time zone: ${timeZone}`);
  return timeZone;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(milliseconds: number, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(milliseconds))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<keyof DateParts, number>;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function sameParts(left: DateParts, right: DateParts): boolean {
  return (Object.keys(left) as (keyof DateParts)[]).every((key) => left[key] === right[key]);
}

function offsetAt(milliseconds: number, timeZone: string): number {
  const secondAligned = Math.floor(milliseconds / 1000) * 1000;
  const parts = zonedParts(secondAligned, timeZone);
  return utcMilliseconds(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  ) - secondAligned;
}

/** Resolve a timezone-local wall time without guessing through DST gaps/overlaps. */
export function resolveZonedDateTime(
  input: string,
  timeZone: string,
): ZonedDateTimeResolution {
  if (!isValidTimeZone(timeZone)) throw new Error(`Unsupported IANA time zone: ${timeZone}`);
  const match = ISO_LOCAL.exec(input);
  if (!match) {
    throw new Error("Expected local YYYY-MM-DD HH:mm:ss[.fraction] without an offset");
  }
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  if (second === 60) throw new Error("Leap-second input is not supported");
  const fraction = match[7] ?? "";
  const fractionNanoseconds = BigInt((fraction || "0").padEnd(9, "0"));
  const millisecond = Number(fraction.slice(0, 3).padEnd(3, "0"));
  const localMilliseconds = utcMilliseconds(year, month, day, hour, minute, second, millisecond);
  const desired: DateParts = { year, month, day, hour, minute, second };

  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    offsets.add(offsetAt(localMilliseconds + hours * 3_600_000, timeZone));
  }
  const candidates: bigint[] = [];
  for (const offset of offsets) {
    const candidateMilliseconds = localMilliseconds - offset;
    if (sameParts(zonedParts(candidateMilliseconds, timeZone), desired)) {
      const candidate =
        BigInt(candidateMilliseconds - millisecond) * NS_PER_MILLISECOND +
        fractionNanoseconds;
      if (!candidates.includes(candidate)) candidates.push(candidate);
    }
  }
  candidates.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  if (candidates.length === 0) {
    return {
      status: "invalid",
      timeZone,
      candidates,
      message: "This local time does not exist in the selected zone (DST gap)",
    };
  }
  if (candidates.length > 1) {
    return {
      status: "ambiguous",
      timeZone,
      candidates,
      message: "This local time occurs more than once in the selected zone (DST overlap)",
    };
  }
  return { status: "unique", timeZone, candidates };
}

/**
 * Parse a date/time without falling back to implementation-defined Date parsing.
 * RFC 3339 instants carry their own offset. Offset-less values are interpreted as
 * wall times in the selected UTC, local, or IANA timezone and may be ambiguous or
 * invalid around daylight-saving transitions.
 */
export function parseDateTimeInput(
  input: string,
  timeZoneSelection: "UTC" | "local" | string,
  sources: Pick<TimestampSources, "localTimeZone"> = {},
): ParsedDateTimeInput {
  const normalized = input.trim();
  if (ISO_INSTANT.test(normalized)) {
    const parsed = parseIsoInstant(normalized);
    return {
      status: "unique",
      timeZone: resolveTimeZone(timeZoneSelection, sources),
      candidates: [parsed.epochNanoseconds],
      explicitOffset: true,
    };
  }

  const timeZone = resolveTimeZone(timeZoneSelection, sources);
  const resolution = resolveZonedDateTime(normalized, timeZone);
  return { ...resolution, explicitOffset: false };
}

export function dateTimeInputToUnix(
  input: string,
  unit: UnixTimestampUnit,
  timeZoneSelection: "UTC" | "local" | string,
  sources: Pick<TimestampSources, "localTimeZone"> = {},
): { resolution: ParsedDateTimeInput; values: string[] } {
  const resolution = parseDateTimeInput(input, timeZoneSelection, sources);
  return {
    resolution,
    values: resolution.candidates.map((candidate) => formatUnixTimestamp(candidate, unit)),
  };
}

export function unixToDateTime(
  input: string,
  unit: UnixTimestampUnit,
  timeZoneSelection: "UTC" | "local" | string,
  sources: Pick<TimestampSources, "localTimeZone"> = {},
): { epochNanoseconds: bigint; iso: string; zoned: string; timeZone: string } {
  const epochNanoseconds = parseUnixTimestamp(input.trim(), unit);
  const timeZone = resolveTimeZone(timeZoneSelection, sources);
  return {
    epochNanoseconds,
    iso: formatIsoInstant(epochNanoseconds),
    zoned: formatInTimeZone(epochNanoseconds, timeZone),
    timeZone,
  };
}

export function formatInTimeZone(epochNanoseconds: bigint, timeZone: string): string {
  if (!isValidTimeZone(timeZone)) throw new Error(`Unsupported IANA time zone: ${timeZone}`);
  const milliseconds = floorDiv(epochNanoseconds, NS_PER_MILLISECOND);
  const numericMilliseconds = Number(milliseconds);
  if (!Number.isSafeInteger(numericMilliseconds)) {
    throw new Error("Instant is outside the exact JavaScript Date range");
  }
  const parts = zonedParts(numericMilliseconds, timeZone);
  const fraction = positiveModulo(epochNanoseconds, NS_PER_SECOND);
  const fractionText = fraction === BigInt(0)
    ? ""
    : `.${fraction.toString().padStart(9, "0").replace(/0+$/, "")}`;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(parts.year).padStart(4, "0")}-${pad(parts.month)}-${pad(parts.day)} ${pad(
    parts.hour,
  )}:${pad(parts.minute)}:${pad(parts.second)}${fractionText} ${timeZone}`;
}

export function currentUnixTimestamp(
  unit: UnixTimestampUnit,
  sources: Pick<TimestampSources, "now"> = {},
): string {
  const milliseconds = (sources.now ?? Date.now)();
  if (!Number.isFinite(milliseconds)) throw new Error("Clock returned an invalid value");
  return formatUnixTimestamp(BigInt(Math.trunc(milliseconds)) * NS_PER_MILLISECOND, unit);
}
