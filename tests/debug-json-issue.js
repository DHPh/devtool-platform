// Debug the JSON parser with the exact data that's failing
const testData1 = `[
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
  }
]`;

const testData2 = `[
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

const testData3 = `[
  {"id": 1, "name": "Alice", "active": true, "score": 95.5, "tags": ["developer", "senior"]},
  {"id": 2, "name": "Bob", "active": false, "score": null, "tags": ["designer"]},
  {"id": 3, "name": "Charlie", "active": true, "score": 88.2, "tags": []}
]`;

// Simulate the exact parsing logic from json-parser.ts
const convertValue = (value, fieldName) => {
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

    // Return as string if no conversion needed (FIXED: removed aggressive date conversion)
    return trimmedValue;
  }

  return value;
};

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

    const flattened = flattenObject(item, "", maxDepth);

    console.log("Before conversion:", flattened);

    // Convert values to appropriate types
    const converted = {};
    for (const [key, value] of Object.entries(flattened)) {
      converted[key] = convertValue(value, key);
    }

    console.log("After conversion:", converted);

    return converted;
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

console.log("🧪 Testing JSON parser with problematic data...\n");

console.log("=== Test 1: Single nested object ===");
try {
  const result1 = parseJSON(testData1, { maxDepth: 15 });
  console.log("Result:", result1);
} catch (error) {
  console.error("Error:", error.message);
}

console.log("\n=== Test 2: Multiple nested objects ===");
try {
  const result2 = parseJSON(testData2, { maxDepth: 15 });
  console.log("Result:", result2);
} catch (error) {
  console.error("Error:", error.message);
}

console.log("\n=== Test 3: Objects with arrays ===");
try {
  const result3 = parseJSON(testData3, { maxDepth: 15 });
  console.log("Result:", result3);
} catch (error) {
  console.error("Error:", error.message);
}
