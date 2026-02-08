/** Shared RFC 4180-style CSV parsing and safe export utilities. */

export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
  /** Reject characters outside a quoted field after its closing quote. */
  strict?: boolean;
  /** Convert canonical numbers/booleans and empty cells to JS values. */
  convertValues?: boolean;
  /** Non-RFC convenience option. RFC 4180 treats spaces as field data. */
  trimUnquotedFields?: boolean;
}

export interface CSVRecordParseOptions {
  strict?: boolean;
  trimUnquotedFields?: boolean;
}

export interface CSVParseIssue {
  row: number;
  expectedColumns: number;
  actualColumns: number;
}

export interface CSVParseResult {
  data: Record<string, unknown>[];
  headers: string[];
  delimiter: string;
  rowCount: number;
  issues: CSVParseIssue[];
}

export interface CSVSerializeOptions {
  delimiter?: string;
  lineEnding?: "\n" | "\r\n";
  /** Prefix spreadsheet-formula-looking cells with an apostrophe. */
  safeSpreadsheet?: boolean;
}

const DELIMITERS = [",", ";", "\t", "|"] as const;

function validateDelimiter(delimiter: string): void {
  if (delimiter.length !== 1 || delimiter === '"' || delimiter === "\r" || delimiter === "\n") {
    throw new Error("CSV delimiter must be one character and cannot be a quote or newline");
  }
}

/** Parse logical records, including quoted fields containing CRLF or LF. */
export function parseCSVRecords(
  text: string,
  delimiter = ",",
  options: CSVRecordParseOptions = {},
): string[][] {
  validateDelimiter(delimiter);
  const strict = options.strict ?? true;
  const trimUnquotedFields = options.trimUnquotedFields ?? false;
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldWasQuoted = false;
  let afterClosingQuote = false;

  const pushField = () => {
    record.push(fieldWasQuoted || !trimUnquotedFields ? field : field.trim());
    field = "";
    fieldWasQuoted = false;
    afterClosingQuote = false;
  };
  const pushRecord = () => {
    pushField();
    records.push(record);
    record = [];
  };

  for (let index = 0; index < source.length; index++) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = false;
          afterClosingQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (afterClosingQuote && character !== delimiter && character !== "\r" && character !== "\n") {
      if (!strict && /[ \t]/.test(character)) continue;
      throw new Error(`Unexpected character after closing quote at offset ${index}`);
    }

    if (character === '"') {
      if (strict ? field !== "" : field.trim() !== "") {
        throw new Error(`Unexpected quote in unquoted field at offset ${index}`);
      }
      field = "";
      fieldWasQuoted = true;
      inQuotes = true;
    } else if (character === delimiter) {
      pushField();
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && source[index + 1] === "\n") index++;
      pushRecord();
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("Unterminated quoted CSV field");
  if (record.length > 0 || field !== "" || fieldWasQuoted || source.endsWith(delimiter)) {
    pushRecord();
  }
  return records;
}

/** Detect a delimiter by consistent logical record width, ignoring quoted delimiters. */
export function detectDelimiter(text: string): string {
  let best = { delimiter: ",", score: -1 };
  for (const delimiter of DELIMITERS) {
    try {
      const records = parseCSVRecords(text, delimiter)
        .filter((record) => record.some((field) => field !== ""))
        .slice(0, 10);
      if (records.length === 0) continue;
      const widths = new Map<number, number>();
      for (const record of records) {
        widths.set(record.length, (widths.get(record.length) ?? 0) + 1);
      }
      const [width, matching] = [...widths.entries()].sort(
        ([widthA, countA], [widthB, countB]) => countB - countA || widthB - widthA,
      )[0];
      if (width < 2) continue;
      // Consistency matters more than raw width: literal commas are common in
      // semicolon-delimited data and must not win merely by creating columns.
      const score = (matching / records.length) * 1000 + matching * 10 + width;
      if (score > best.score) best = { delimiter, score };
    } catch {
      // A candidate delimiter can make otherwise literal quotes invalid.
    }
  }
  return best.delimiter;
}

/** Parse one logical CSV record. Newlines are allowed only inside quotes. */
export function parseCSVLine(line: string, delimiter: string): string[] {
  const records = parseCSVRecords(line, delimiter);
  if (records.length !== 1) throw new Error("Expected exactly one CSV record");
  return records[0];
}

export function convertValue(value: string): unknown {
  if (value === "") return null;
  const trimmed = value.trim();
  if (trimmed !== value) return value;
  if (trimmed === "true" || trimmed === "false") return trimmed === "true";
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
  }
  return value;
}

function uniqueHeaders(values: string[]): string[] {
  const used = new Set<string>();
  return values.map((value, index) => {
    const base = value || `Column ${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) candidate = `${base} (${suffix++})`;
    used.add(candidate);
    return candidate;
  });
}

export function parseCSV(text: string, options: CSVParseOptions = {}): CSVParseResult {
  const {
    delimiter: requested,
    hasHeader = true,
    skipEmptyLines = true,
    strict = true,
    convertValues = true,
    trimUnquotedFields = false,
  } = options;
  const delimiter = requested ?? detectDelimiter(text);
  let records = parseCSVRecords(text, delimiter, { strict, trimUnquotedFields });
  if (skipEmptyLines) {
    records = records.filter(
      (record) => record.length > 1 || record.some((field) => field !== ""),
    );
  }
  if (records.length === 0) {
    return { data: [], headers: [], delimiter, rowCount: 0, issues: [] };
  }

  const firstWidth = records[0].length;
  const dataRecords = hasHeader ? records.slice(1) : records;
  const maximumWidth = Math.max(firstWidth, ...dataRecords.map((record) => record.length));
  const initialHeaders = hasHeader
    ? records[0]
    : Array.from({ length: firstWidth }, (_, index) => `Column ${index + 1}`);
  const headers = uniqueHeaders([
    ...initialHeaders,
    ...Array.from(
      { length: Math.max(0, maximumWidth - initialHeaders.length) },
      (_, index) => `Column ${initialHeaders.length + index + 1}`,
    ),
  ]);
  const expectedColumns = initialHeaders.length;
  const issues: CSVParseIssue[] = [];

  const data = dataRecords.map((values, index) => {
    if (values.length !== expectedColumns) {
      issues.push({
        row: index + (hasHeader ? 2 : 1),
        expectedColumns,
        actualColumns: values.length,
      });
    }
    return Object.fromEntries(
      headers.map((header, column) => [
        header,
        convertValues ? convertValue(values[column] ?? "") : values[column] ?? "",
      ]),
    );
  });

  return { data, headers, delimiter, rowCount: data.length, issues };
}

export function protectSpreadsheetCell(value: string): string {
  return /^[\s\u0000-\u001f\u007f-\u009f]*[=+\-@]/.test(value)
    ? `'${value}`
    : value;
}

function serializeCell(value: unknown, delimiter: string, safeSpreadsheet: boolean): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (safeSpreadsheet) text = protectSpreadsheetCell(text);
  return /["\r\n]/.test(text) || text.includes(delimiter) || /^\s|\s$/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export function serializeCSV(
  rows: readonly Record<string, unknown>[],
  headers: readonly string[],
  options: CSVSerializeOptions = {},
): string {
  const delimiter = options.delimiter ?? ",";
  const lineEnding = options.lineEnding ?? "\r\n";
  const safeSpreadsheet = options.safeSpreadsheet ?? true;
  validateDelimiter(delimiter);
  return [
    headers.map((header) => serializeCell(header, delimiter, safeSpreadsheet)).join(delimiter),
    ...rows.map((row) =>
      headers.map((header) => serializeCell(row[header], delimiter, safeSpreadsheet)).join(delimiter),
    ),
  ].join(lineEnding);
}

export function getDelimiterDisplayName(delimiter: string): string {
  if (delimiter === ",") return "CSV (,)";
  if (delimiter === ";") return "CSV (;)";
  if (delimiter === "\t") return "TSV (Tab)";
  if (delimiter === "|") return "PSV (|)";
  return "CSV";
}
