// Test nested JSON parsing
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

// Manual implementation of flattenObject for testing
function flattenObject(obj, prefix = "", maxDepth = 10, currentDepth = 0) {
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
              item,
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
        value,
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
}

console.log("Testing nested JSON flattening:");
const parsed = JSON.parse(testData);
console.log("Original data:", parsed);

const flattened = parsed.map((item) => flattenObject(item));
console.log("Flattened data:", flattened);

// Check what headers we get
const allKeys = new Set();
flattened.forEach((row) => {
  Object.keys(row).forEach((key) => allKeys.add(key));
});
console.log("Headers:", Array.from(allKeys).sort());
