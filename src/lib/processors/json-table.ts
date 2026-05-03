/**
 * Shared JSON parsing & flattening utilities for table viewers and data explorer
 */

import { tryProcess, type ProcessorResult } from "./result";

export interface JSONParseOptions {
  maxDepth?: number;
  preserveArrays?: boolean;
  dateFields?: string[];
}

export interface JSONParseResult {
  data: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
  hasNestedData: boolean;
}

/**
 * Safely converts a value to a string representation
 */
export const safeStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }

  return String(value);
};

/**
 * Deep flattens a nested object into a flat structure
 * Handles arrays, nested objects, and maintains proper type information
 */
export const flattenObject = (
  obj: Record<string, unknown>,
  prefix = "",
  maxDepth = 15,
  currentDepth = 0,
): Record<string, unknown> => {
  const flattened: Record<string, unknown> = {};

  if (currentDepth >= maxDepth) {
    return { [prefix || "data"]: safeStringify(obj) };
  }

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = null;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        flattened[newKey] = "[]";
      } else {
        const allObjects = value.every(
          (item) =>
            typeof item === "object" && item !== null && !Array.isArray(item),
        );

        if (allObjects) {
          value.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
              const arrayItemFlattened = flattenObject(
                item as Record<string, unknown>,
                `${newKey}[${index}]`,
                maxDepth,
                currentDepth + 1,
              );
              Object.assign(flattened, arrayItemFlattened);
            }
          });
        } else if (
          value.every(
            (item) =>
              typeof item === "string" ||
              typeof item === "number" ||
              typeof item === "boolean",
          )
        ) {
          flattened[newKey] = JSON.stringify(value);
        } else {
          value.forEach((item, index) => {
            if (
              typeof item === "object" &&
              item !== null &&
              !Array.isArray(item)
            ) {
              const arrayItemFlattened = flattenObject(
                item as Record<string, unknown>,
                `${newKey}[${index}]`,
                maxDepth,
                currentDepth + 1,
              );
              Object.assign(flattened, arrayItemFlattened);
            } else {
              flattened[`${newKey}[${index}]`] = item;
            }
          });
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const nestedFlattened = flattenObject(
        value as Record<string, unknown>,
        newKey,
        maxDepth,
        currentDepth + 1,
      );
      Object.assign(flattened, nestedFlattened);
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
};

/**
 * Determines if a value represents a date and converts it
 */
export const convertDateValue = (
  value: unknown,
  fieldName?: string,
): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const dateFieldPatterns = [
    /date/i,
    /time/i,
    /created/i,
    /updated/i,
    /modified/i,
    /timestamp/i,
  ];

  const isLikelyDateField =
    fieldName && dateFieldPatterns.some((pattern) => pattern.test(fieldName));

  if (isLikelyDateField && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const dateValue = new Date(value);
    if (!Number.isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split("T")[0];
    }
  }

  return value;
};

/**
 * Converts data values to appropriate types with better type detection
 */
export const convertValue = (value: unknown, fieldName?: string): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      return null;
    }

    if (trimmedValue === "true" || trimmedValue === "false") {
      return trimmedValue === "true";
    }

    if (trimmedValue.toLowerCase() === "null") {
      return null;
    }

    if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
      const numValue = Number(trimmedValue);
      if (!Number.isNaN(numValue)) {
        return numValue;
      }
    }

    return convertDateValue(trimmedValue, fieldName);
  }

  return value;
};

/**
 * Parses JSON data into a flat table structure
 */
export const parseJSON = (
  text: string,
  options: JSONParseOptions = {},
): JSONParseResult => {
  const { maxDepth = 15 } = options;

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }

  let dataArray: Record<string, unknown>[];

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return {
        data: [],
        headers: [],
        rowCount: 0,
        hasNestedData: false,
      };
    }
    dataArray = parsed.filter(
      (item) => typeof item === "object" && item !== null,
    ) as Record<string, unknown>[];
  } else if (typeof parsed === "object" && parsed !== null) {
    dataArray = [parsed as Record<string, unknown>];
  } else {
    throw new Error("JSON must be an object or array of objects");
  }

  const hasNestedData = dataArray.some((item) =>
    Object.values(item).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === "object" && value !== null),
    ),
  );

  const flattenedData = dataArray.map((item) => {
    if (typeof item !== "object" || item === null) {
      return { value: item };
    }

    const flattened = flattenObject(
      item as Record<string, unknown>,
      "",
      maxDepth,
    );

    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(flattened)) {
      converted[key] = convertValue(value, key);
    }

    return converted;
  });

  const headerSet = new Set<string>();
  flattenedData.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });

  const headers = Array.from(headerSet).sort();

  const normalizedData = flattenedData.map((row) => {
    const normalizedRow: Record<string, unknown> = {};
    headers.forEach((header) => {
      normalizedRow[header] = Object.prototype.hasOwnProperty.call(row, header)
        ? row[header]
        : null;
    });
    return normalizedRow;
  });

  return {
    data: normalizedData,
    headers,
    rowCount: normalizedData.length,
    hasNestedData,
  };
};

/** Safe ProcessorResult wrapper around parseJSON for tabular viewers. */
export const parseJsonTable = (
  text: string,
  options: JSONParseOptions = {},
): ProcessorResult<JSONParseResult> =>
  tryProcess(() => parseJSON(text, options), "Failed to parse JSON table.");

/**
 * Detects the type of a column based on its values
 */
export const detectColumnType = (
  values: unknown[],
): "string" | "number" | "boolean" | "date" | "mixed" => {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);

  if (nonNullValues.length === 0) return "string";

  let numberCount = 0;
  let booleanCount = 0;
  let dateCount = 0;
  let stringCount = 0;

  for (const value of nonNullValues) {
    if (typeof value === "boolean") {
      booleanCount++;
    } else if (typeof value === "number") {
      numberCount++;
    } else if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || !Number.isNaN(Date.parse(value))) {
        dateCount++;
      } else {
        stringCount++;
      }
    } else {
      stringCount++;
    }
  }

  const total = nonNullValues.length;

  if (booleanCount >= total * 0.8) return "boolean";
  if (numberCount >= total * 0.8) return "number";
  if (dateCount >= total * 0.8) return "date";
  if (stringCount >= total * 0.8) return "string";

  return "mixed";
};
