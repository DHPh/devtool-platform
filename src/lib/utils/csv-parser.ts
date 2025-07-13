/**
 * Shared CSV parsing utilities for Data Explorer and CSV Viewer
 */

export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
}

export interface CSVParseResult {
  data: Record<string, unknown>[];
  headers: string[];
  delimiter: string;
  rowCount: number;
}

/**
 * Detects the most likely delimiter in CSV text
 * Uses both frequency counting and consistency validation
 */
export const detectDelimiter = (text: string): string => {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return ",";

  const firstLine = lines[0];
  const delimiters = [",", ";", "\t", "|"];

  let maxCount = 0;
  let bestDelimiter = ",";

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp("\\" + delimiter, "g")) || [])
      .length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  // Additional validation: check if delimiter creates consistent column counts
  if (lines.length > 1) {
    const headerCount = firstLine.split(bestDelimiter).length;
    let consistentRows = 0;

    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const rowCount = lines[i].split(bestDelimiter).length;
      if (rowCount === headerCount) {
        consistentRows++;
      }
    }

    // If less than 70% of rows have consistent column count, try other delimiters
    const checkCount = Math.min(4, lines.length - 1);
    if (consistentRows < checkCount * 0.7) {
      for (const delimiter of delimiters) {
        if (delimiter === bestDelimiter) continue;

        const headerCount = firstLine.split(delimiter).length;
        let consistent = 0;

        for (let i = 1; i < Math.min(5, lines.length); i++) {
          const rowCount = lines[i].split(delimiter).length;
          if (rowCount === headerCount) {
            consistent++;
          }
        }

        if (consistent > consistentRows) {
          bestDelimiter = delimiter;
          consistentRows = consistent;
        }
      }
    }
  }

  return bestDelimiter;
};

/**
 * Parses a single CSV line respecting quotes and escaped characters
 */
export const parseCSVLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  // Clean up quoted values
  return result.map((value) => {
    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  });
};

/**
 * Converts a value to appropriate type (string, number, boolean, null)
 */
export const convertValue = (value: string): unknown => {
  // Handle empty values
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const trimmedValue = value.trim();

  // Handle boolean values
  if (trimmedValue === "true" || trimmedValue === "false") {
    return trimmedValue === "true";
  }

  // Handle numeric values
  const numValue = Number(trimmedValue);
  if (!isNaN(numValue) && trimmedValue !== "") {
    return numValue;
  }

  return trimmedValue;
};

/**
 * Parses CSV text into structured data
 */
export const parseCSV = (
  text: string,
  options: CSVParseOptions = {}
): CSVParseResult => {
  const {
    delimiter: providedDelimiter,
    hasHeader = true,
    skipEmptyLines = true,
  } = options;

  let lines = text.trim().split("\n");

  if (skipEmptyLines) {
    lines = lines.filter((line) => line.trim());
  }

  if (lines.length === 0) {
    return {
      data: [],
      headers: [],
      delimiter: ",",
      rowCount: 0,
    };
  }

  // Detect or use provided delimiter
  const delimiter = providedDelimiter || detectDelimiter(text);

  // Parse headers
  const headers = hasHeader
    ? parseCSVLine(lines[0], delimiter).map((h) => h.replace(/"/g, "").trim())
    : Array.from(
        { length: parseCSVLine(lines[0], delimiter).length },
        (_, i) => `Column ${i + 1}`
      );

  // Parse data rows
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const data = dataLines.map((line) => {
    const values = parseCSVLine(line, delimiter);
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      const value = values[index] || "";
      row[header] = convertValue(value);
    });

    // Ensure all headers are present in the row (fill missing with null)
    headers.forEach((header) => {
      if (!(header in row)) {
        row[header] = null;
      }
    });

    return row;
  });

  return {
    data,
    headers,
    delimiter,
    rowCount: data.length,
  };
};

/**
 * Gets delimiter display name for UI
 */
export const getDelimiterDisplayName = (delimiter: string): string => {
  switch (delimiter) {
    case ",":
      return "CSV (,)";
    case ";":
      return "CSV (;)";
    case "\t":
      return "TSV (Tab)";
    case "|":
      return "PSV (|)";
    default:
      return "CSV";
  }
};
