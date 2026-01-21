// Test the JSON parser with nested data
// Manually implement the flattening logic to test

const flattenObject = (obj, prefix = "", maxDepth = 10, currentDepth = 0) => {
  const flattened = {};

  if (currentDepth >= maxDepth) {
    return { [prefix || "data"]: JSON.stringify(obj) };
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
        flattened[newKey] = JSON.stringify(value);
      }
    } else if (typeof value === "object" && value !== null) {
      const nestedFlattened = flattenObject(
        value,
        newKey,
        maxDepth,
        currentDepth + 1
      );
      Object.assign(flattened, nestedFlattened);
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
};

const parseJSON = (text, options = {}) => {
  const { maxDepth = 10 } = options;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }

  let dataArray;
  let hasNestedData = false;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { data: [], headers: [], rowCount: 0, hasNestedData: false };
    }
    dataArray = parsed;
  } else if (typeof parsed === "object" && parsed !== null) {
    dataArray = [parsed];
  } else {
    throw new Error("JSON must be an object or array of objects");
  }

  hasNestedData = dataArray.some((item) =>
    Object.values(item).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === "object" && value !== null)
    )
  );

  const flattenedData = dataArray.map((item) => {
    if (typeof item !== "object" || item === null) {
      return { value: item };
    }
    return flattenObject(item, "", maxDepth);
  });

  const headerSet = new Set();
  flattenedData.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });

  const headers = Array.from(headerSet).sort();

  const normalizedData = flattenedData.map((row) => {
    const normalizedRow = {};
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

const testData = `[
  {
    "name": "John",
    "contact": {
      "email": "john@example.com",
      "phone": "+1-555-0123"
    },
    "address": {
      "city": "New York",
      "zip": "10001"
    }
  },
  {
    "name": "Jane", 
    "contact": {
      "email": "jane@example.com",
      "phone": "+1-555-0456"
    },
    "address": {
      "city": "Los Angeles", 
      "zip": "90210"
    }
  }
]`;

console.log("Testing nested JSON parsing...");
try {
  const result = parseJSON(testData, { maxDepth: 15 });
  console.log("Parse result:", {
    rowCount: result.rowCount,
    hasNestedData: result.hasNestedData,
    headers: result.headers,
    firstRow: result.data[0],
  });
} catch (error) {
  console.error("Error:", error.message);
}
