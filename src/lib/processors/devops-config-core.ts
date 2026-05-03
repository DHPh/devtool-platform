import { CronExpressionParser } from "cron-parser";
import semver from "semver";
import type { ProcessorResult } from "./result";

export interface CronDetails {
  expression: string;
  explanation: string;
  nextRuns: string[];
}

const CRON_FIELD_NAMES = ["minute", "hour", "day of month", "month", "day of week"];

function explainCronField(value: string, name: string): string {
  if (value === "*") return `every ${name}`;
  if (/^\*\/\d+$/.test(value)) return `every ${value.slice(2)} ${name}s`;
  if (value.includes(",")) return `${name} values ${value}`;
  if (value.includes("-")) return `${name} range ${value}`;
  return `${name} ${value}`;
}

export function inspectCronExpression(
  expression: string,
  options: { currentDate?: Date; timezone?: string; count?: number } = {},
): ProcessorResult<CronDetails> {
  const normalized = expression.trim().replace(/\s+/g, " ");
  const fields = normalized.split(" ");
  if (fields.length !== 5) {
    return { ok: false, error: "Use a standard five-field cron expression." };
  }

  try {
    const interval = CronExpressionParser.parse(normalized, {
      currentDate: options.currentDate,
      tz: options.timezone || "UTC",
    });
    const count = Math.max(1, Math.min(options.count ?? 5, 20));
    const nextRuns = interval.take(count).map((date) => date.toDate().toISOString());
    return {
      ok: true,
      value: {
        expression: normalized,
        explanation: fields
          .map((value, index) => explainCronField(value, CRON_FIELD_NAMES[index]))
          .join("; "),
        nextRuns,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid cron expression.",
    };
  }
}

const PERMISSION_VALUES: Record<string, number> = {
  "---": 0,
  "--x": 1,
  "-w-": 2,
  "-wx": 3,
  "r--": 4,
  "r-x": 5,
  "rw-": 6,
  rwx: 7,
};

function permissionTriplet(value: number): string {
  return `${value & 4 ? "r" : "-"}${value & 2 ? "w" : "-"}${value & 1 ? "x" : "-"}`;
}

export interface ChmodDetails {
  octal: string;
  symbolic: string;
  command: string;
  owner: string;
  group: string;
  others: string;
}

export function convertChmod(input: string): ProcessorResult<ChmodDetails> {
  const normalized = input.trim();
  let digits: number[];

  if (/^[0-7]{3}$/.test(normalized)) {
    digits = [...normalized].map(Number);
  } else {
    const symbolic = normalized.startsWith("-") ? normalized.slice(1) : normalized;
    if (symbolic.length !== 9) {
      return { ok: false, error: "Enter permissions such as 755 or rwxr-xr-x." };
    }
    const groups = symbolic.match(/.{3}/g) ?? [];
    if (groups.length !== 3 || groups.some((group) => !(group in PERMISSION_VALUES))) {
      return { ok: false, error: "Symbolic permissions must use r, w, x, and -." };
    }
    digits = groups.map((group) => PERMISSION_VALUES[group]);
  }

  const octal = digits.join("");
  const groups = digits.map(permissionTriplet);
  return {
    ok: true,
    value: {
      octal,
      symbolic: groups.join(""),
      command: `chmod ${octal} file`,
      owner: groups[0],
      group: groups[1],
      others: groups[2],
    },
  };
}

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
}

export interface EnvDocument {
  entries: EnvEntry[];
  errors: string[];
  duplicates: string[];
}

function decodeEnvValue(rawValue: string): string {
  const value = rawValue.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  return value.replace(/\s+#.*$/, "").trimEnd();
}

export function parseEnvFile(input: string): EnvDocument {
  const entries: EnvEntry[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  input.split(/\r?\n/).forEach((sourceLine, index) => {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) return;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) {
      errors.push(`Line ${index + 1}: expected KEY=value.`);
      return;
    }
    const [, key, rawValue] = match;
    const trimmedValue = rawValue.trim();
    if (
      (trimmedValue.startsWith('"') && !trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && !trimmedValue.endsWith("'"))
    ) {
      errors.push(`Line ${index + 1}: unterminated quoted value.`);
      return;
    }
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
    entries.push({ key, value: decodeEnvValue(rawValue), line: index + 1 });
  });

  return { entries, errors, duplicates: [...duplicates].sort() };
}

const SECRET_KEY = /(?:SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|API_KEY|ACCESS_KEY|AUTH)/i;

export function redactEnvFile(input: string): ProcessorResult<string> {
  const parsed = parseEnvFile(input);
  if (parsed.errors.length) return { ok: false, error: parsed.errors.join("\n") };
  return {
    ok: true,
    value: parsed.entries
      .map(({ key, value }) => `${key}=${SECRET_KEY.test(key) && value ? "[REDACTED]" : value}`)
      .join("\n"),
  };
}

export interface EnvComparison {
  onlyLeft: string[];
  onlyRight: string[];
  changed: string[];
  unchanged: string[];
}

export function compareEnvFiles(left: string, right: string): ProcessorResult<EnvComparison> {
  const a = parseEnvFile(left);
  const b = parseEnvFile(right);
  const errors = [...a.errors.map((error) => `Left ${error}`), ...b.errors.map((error) => `Right ${error}`)];
  if (errors.length) return { ok: false, error: errors.join("\n") };
  const leftMap = new Map(a.entries.map(({ key, value }) => [key, value]));
  const rightMap = new Map(b.entries.map(({ key, value }) => [key, value]));
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort();
  return {
    ok: true,
    value: {
      onlyLeft: keys.filter((key) => leftMap.has(key) && !rightMap.has(key)),
      onlyRight: keys.filter((key) => !leftMap.has(key) && rightMap.has(key)),
      changed: keys.filter((key) => leftMap.has(key) && rightMap.has(key) && leftMap.get(key) !== rightMap.get(key)),
      unchanged: keys.filter((key) => leftMap.has(key) && leftMap.get(key) === rightMap.get(key)),
    },
  };
}

export interface SemverDetails {
  left: string;
  right: string;
  comparison: -1 | 0 | 1;
  relation: "older" | "equal" | "newer";
  satisfiesRange?: boolean;
}

export function compareSemanticVersions(
  leftInput: string,
  rightInput: string,
  range?: string,
): ProcessorResult<SemverDetails> {
  const normalizeVersion = (input: string) =>
    semver.valid(input.trim()) ?? semver.valid(semver.coerce(input));
  const left = normalizeVersion(leftInput);
  const right = normalizeVersion(rightInput);
  if (!left || !right) return { ok: false, error: "Enter two valid semantic versions." };
  if (range && !semver.validRange(range)) return { ok: false, error: "Enter a valid semantic-version range." };
  const comparison = Math.sign(semver.compare(left, right)) as -1 | 0 | 1;
  return {
    ok: true,
    value: {
      left,
      right,
      comparison,
      relation: comparison < 0 ? "older" : comparison > 0 ? "newer" : "equal",
      ...(range ? { satisfiesRange: semver.satisfies(left, range) } : {}),
    },
  };
}
