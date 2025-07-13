/**
 * Shared JSON parsing utilities for JSON Table Viewer
 */

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
  maxDepth = 10,
  currentDepth = 0
): Record<string, unknown> => {
  const flattened: Record<string, unknown> = {};

  // Prevent infinite recursion
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
      // Handle arrays - flatten if they contain objects, otherwise stringify
      if (value.length === 0) {
        flattened[newKey] = "[]";
      } else if (
        value.every(
          (item) =>
            typeof item === "object" && item !== null && !Array.isArray(item)
        )
      ) {
        // Array of objects - flatten each with index
        value.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            const arrayItemFlattened = flattenObject(
              item as Record<string, unknown>,
              `${newKey}[${index}]`,
              maxDepth,
              currentDepth + 1
            );
            Object.assign(flattened, arrayItemFlattened);
          } else {
            flattened[`${newKey}[${index}]`] = item;
          }
        });
      } else {
        // Mixed array or array of primitives - stringify
        flattened[newKey] = JSON.stringify(value);
      }
    } else if (typeof value === "object" && value !== null) {
      // Nested object - recursively flatten
      const nestedFlattened = flattenObject(
        value as Record<string, unknown>,
        newKey,
        maxDepth,
        currentDepth + 1
      );
      Object.assign(flattened, nestedFlattened);
    } else {
      // Primitive value
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
  fieldName?: string
): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  // Common date field patterns
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

  // Only try to parse as date if it looks like a date field AND matches strict date patterns
  if (isLikelyDateField && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split("T")[0]; // Return YYYY-MM-DD format
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

    // Handle empty strings
    if (trimmedValue === "") {
      return null;
    }

    // Handle boolean values
    if (trimmedValue === "true" || trimmedValue === "false") {
      return trimmedValue === "true";
    }

    // Handle null strings
    if (trimmedValue.toLowerCase() === "null") {
      return null;
    }

    // Handle numeric values
    if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
      const numValue = Number(trimmedValue);
      if (!isNaN(numValue)) {
        return numValue;
      }
    }

    // Try date conversion
    return convertDateValue(trimmedValue, fieldName);
  }

  return value;
};

/**
 * Parses JSON data into a flat table structure
 */
export const parseJSON = (
  text: string,
  options: JSONParseOptions = {}
): JSONParseResult => {
  const { maxDepth = 10 } = options;

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  let dataArray: Record<string, unknown>[];
  let hasNestedData = false;

  // Convert to array format
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return {
        data: [],
        headers: [],
        rowCount: 0,
        hasNestedData: false,
      };
    }
    dataArray = parsed;
  } else if (typeof parsed === "object" && parsed !== null) {
    dataArray = [parsed as Record<string, unknown>];
  } else {
    throw new Error("JSON must be an object or array of objects");
  }

  // Check for nested data
  hasNestedData = dataArray.some((item) =>
    Object.values(item).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === "object" && value !== null)
    )
  );

  // Flatten each object
  const flattenedData = dataArray.map((item) => {
    if (typeof item !== "object" || item === null) {
      return { value: item };
    }

    const flattened = flattenObject(
      item as Record<string, unknown>,
      "",
      maxDepth
    );

    // Convert values to appropriate types
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(flattened)) {
      converted[key] = convertValue(value, key);
    }

    return converted;
  });

  // Get all unique headers
  const headerSet = new Set<string>();
  flattenedData.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });

  const headers = Array.from(headerSet).sort();

  // Ensure all rows have all headers
  const normalizedData = flattenedData.map((row) => {
    const normalizedRow: Record<string, unknown> = {};
    headers.forEach((header) => {
      normalizedRow[header] = row[header] ?? null;
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

/**
 * Detects the type of a column based on its values
 */
export const detectColumnType = (
  values: unknown[]
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
      // Check if it's a date string
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value))) {
        dateCount++;
      } else {
        stringCount++;
      }
    } else {
      stringCount++;
    }
  }

  const total = nonNullValues.length;

  // If 80% or more are of the same type, return that type
  if (booleanCount >= total * 0.8) return "boolean";
  if (numberCount >= total * 0.8) return "number";
  if (dateCount >= total * 0.8) return "date";
  if (stringCount >= total * 0.8) return "string";

  return "mixed";
};
