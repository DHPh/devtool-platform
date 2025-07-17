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

  // First, try to detect by frequency and consistency
  let bestDelimiter = ",";
  let maxScore = 0;

  for (const delimiter of delimiters) {
    // Count delimiter frequency in first line
    const count = (firstLine.match(new RegExp("\\" + delimiter, "g")) || [])
      .length;

    if (count === 0) continue;

    // Check consistency across multiple lines
    let consistentRows = 0;
    const expectedColumns = count + 1;

    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const rowColumns =
        (lines[i].match(new RegExp("\\" + delimiter, "g")) || []).length + 1;
      if (rowColumns === expectedColumns) {
        consistentRows++;
      }
    }

    // Calculate score: frequency * consistency
    const consistency =
      lines.length > 1 ? consistentRows / Math.min(4, lines.length - 1) : 1;
    const score = count * consistency;

    if (score > maxScore) {
      maxScore = score;
      bestDelimiter = delimiter;
    }
  }

  // Special case: if comma is detected but we have very few columns and lots of commas,
  // it might be commas within data rather than delimiters
  if (bestDelimiter === "," && lines.length > 1) {
    const commaCount = (firstLine.match(/,/g) || []).length;
    const expectedColumns = commaCount + 1;

    // If we have too many columns (>10) and low consistency, try other delimiters
    if (expectedColumns > 10) {
      for (const delimiter of [";", "\t", "|"]) {
        const count = (firstLine.match(new RegExp("\\" + delimiter, "g")) || [])
          .length;
        if (count > 0 && count < commaCount) {
          let consistentRows = 0;
          const expectedCols = count + 1;

          for (let i = 1; i < Math.min(5, lines.length); i++) {
            const rowCols =
              (lines[i].match(new RegExp("\\" + delimiter, "g")) || []).length +
              1;
            if (rowCols === expectedCols) {
              consistentRows++;
            }
          }

          const consistency =
            lines.length > 1
              ? consistentRows / Math.min(4, lines.length - 1)
              : 1;
          if (consistency > 0.7) {
            return delimiter;
          }
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

    // Handle case where we have more values than headers (unquoted commas in data)
    if (values.length > headers.length) {
      // If we have exactly 2 headers but more values, merge extra values into the last column
      if (headers.length === 2) {
        const firstValue = values[0];
        const remainingValues = values.slice(1).join(delimiter);
        row[headers[0]] = convertValue(firstValue);
        row[headers[1]] = convertValue(remainingValues);
      } else {
        // For other cases, merge extra values into the last column
        const normalValues = values.slice(0, headers.length - 1);
        const lastValue = values.slice(headers.length - 1).join(delimiter);

        headers.forEach((header, index) => {
          if (index < normalValues.length) {
            row[header] = convertValue(normalValues[index]);
          } else if (index === headers.length - 1) {
            row[header] = convertValue(lastValue);
          }
        });
      }
    } else {
      // Normal case - each value maps to a header
      headers.forEach((header, index) => {
        const value = values[index] || "";
        row[header] = convertValue(value);
      });
    }

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
