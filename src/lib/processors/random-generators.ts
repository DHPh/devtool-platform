import type { ProcessorResult } from "./result";

export type NameCategory = "person" | "company" | "project";
export type PersonGender = "male" | "female" | "unisex";
export type NumberOutputFormat = "decimal" | "binary" | "hex" | "octal";

const FIRST_NAMES: Record<PersonGender, readonly string[]> = {
  male: [
    "James", "John", "Robert", "Michael", "William", "David", "Richard",
    "Joseph", "Thomas", "Christopher", "Charles", "Daniel", "Matthew",
    "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
  ],
  female: [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan",
    "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Helen", "Sandra",
    "Donna", "Carol", "Ruth", "Sharon", "Michelle",
  ],
  unisex: [
    "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn",
    "Sage", "River", "Emery", "Phoenix", "Cameron", "Blake", "Rowan", "Jamie",
    "Finley", "Peyton", "Skyler", "Reese",
  ],
};

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
] as const;

const COMPANY_PREFIXES = [
  "Tech", "Digital", "Smart", "Future", "Global", "Creative", "Dynamic",
  "Innovative", "Advanced", "Next",
] as const;

const COMPANY_SUFFIXES = [
  "Solutions", "Systems", "Technologies", "Enterprises", "Corporation",
  "Industries", "Group", "Associates", "Partners", "Holdings",
] as const;

const PROJECT_ADJECTIVES = [
  "Amazing", "Awesome", "Brilliant", "Creative", "Dynamic", "Epic",
  "Fantastic", "Great", "Incredible", "Innovative",
] as const;

const PROJECT_NOUNS = [
  "Project", "App", "Platform", "System", "Tool", "Framework", "Engine",
  "Solution", "Service", "Application",
] as const;

function pickRandom<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(
    items.length - 1,
    Math.max(0, Math.floor(random() * items.length)),
  );
  return items[index];
}

export interface GenerateNamesOptions {
  type?: NameCategory;
  gender?: PersonGender;
  count?: number;
  random?: () => number;
}

export function generateNameBatch(
  options: GenerateNamesOptions = {},
): ProcessorResult<string[]> {
  const type = options.type ?? "person";
  const gender = options.gender ?? "unisex";
  const count = options.count ?? 5;
  const random = options.random ?? Math.random;

  if (!Number.isInteger(count) || count < 1 || count > 50) {
    return { ok: false, error: "Count must be a whole number from 1 to 50." };
  }

  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    if (type === "company") {
      names.push(
        `${pickRandom(COMPANY_PREFIXES, random)} ${pickRandom(COMPANY_SUFFIXES, random)}`,
      );
    } else if (type === "project") {
      names.push(
        `${pickRandom(PROJECT_ADJECTIVES, random)} ${pickRandom(PROJECT_NOUNS, random)}`,
      );
    } else {
      names.push(
        `${pickRandom(FIRST_NAMES[gender], random)} ${pickRandom(LAST_NAMES, random)}`,
      );
    }
  }

  return { ok: true, value: names };
}

export interface GenerateNumbersOptions {
  min?: number;
  max?: number;
  count?: number;
  allowDuplicates?: boolean;
  decimalPlaces?: number;
  random?: () => number;
}

export interface GeneratedNumberStats {
  count: number;
  sum: string;
  average: string;
  median: string;
  min: string;
  max: string;
}

export function generateNumberBatch(
  options: GenerateNumbersOptions = {},
): ProcessorResult<number[]> {
  const min = options.min ?? 1;
  const max = options.max ?? 100;
  const count = options.count ?? 10;
  const allowDuplicates = options.allowDuplicates ?? true;
  const decimalPlaces = options.decimalPlaces ?? 0;
  const random = options.random ?? Math.random;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { ok: false, error: "Minimum and maximum must be finite numbers." };
  }
  if (min > max) {
    return {
      ok: false,
      error: "Minimum cannot be greater than maximum.",
    };
  }
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    return { ok: false, error: "Count must be a whole number from 1 to 1000." };
  }
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 10) {
    return {
      ok: false,
      error: "Decimal places must be a whole number from 0 to 10.",
    };
  }

  if (!allowDuplicates && decimalPlaces === 0) {
    const available = Math.floor(max) - Math.ceil(min) + 1;
    if (count > available) {
      return {
        ok: false,
        error: "Cannot generate unique numbers within the given range.",
      };
    }
  }

  const numbers: number[] = [];
  const used = new Set<number>();

  for (let i = 0; i < count; i++) {
    let candidate = 0;
    let attempts = 0;
    const maxAttempts = 2000;

    do {
      if (decimalPlaces > 0) {
        const raw = random() * (max - min) + min;
        candidate = Number(raw.toFixed(decimalPlaces));
      } else {
        candidate = Math.floor(random() * (max - min + 1)) + min;
      }
      attempts += 1;
    } while (!allowDuplicates && used.has(candidate) && attempts < maxAttempts);

    if (!allowDuplicates && used.has(candidate)) {
      return {
        ok: false,
        error: "Cannot generate unique numbers within the given range.",
      };
    }

    numbers.push(candidate);
    if (!allowDuplicates) used.add(candidate);
  }

  return { ok: true, value: numbers };
}

export function formatGeneratedNumber(
  value: number,
  format: NumberOutputFormat = "decimal",
): string {
  const truncated = Math.trunc(value);
  const sign = truncated < 0 ? "-" : "";
  const magnitude = Math.abs(truncated);

  switch (format) {
    case "binary":
      return `${sign}0b${magnitude.toString(2)}`;
    case "hex":
      return `${sign}0x${magnitude.toString(16).toUpperCase()}`;
    case "octal":
      return `${sign}0o${magnitude.toString(8)}`;
    default:
      return value.toString();
  }
}

export function calculateNumberStats(
  numbers: readonly number[],
  decimalPlaces = 0,
): GeneratedNumberStats | null {
  if (numbers.length === 0) return null;

  const sum = numbers.reduce((acc, num) => acc + num, 0);
  const avg = sum / numbers.length;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return {
    count: numbers.length,
    sum: sum.toFixed(decimalPlaces),
    average: avg.toFixed(decimalPlaces),
    median: median.toFixed(decimalPlaces),
    min: sorted[0].toFixed(decimalPlaces),
    max: sorted[sorted.length - 1].toFixed(decimalPlaces),
  };
}
