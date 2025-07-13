// Test the exact JSON samples that are failing
const testSample1 = `[
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

const testSample2 = `[
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

const testSample3 = `[
{"id": 1, "name": "Alice", "active": true, "score": 95.5, "tags": ["developer", "senior"]},
{"id": 2, "name": "Bob", "active": false, "score": null, "tags": ["designer"]},
{"id": 3, "name": "Charlie", "active": true, "score": 88.2, "tags": []}
]`;

// Simulate the exact parseJSON function
const flattenObject = (obj, prefix = "", maxDepth = 10, currentDepth = 0) => {
  const flattened = {};

  console.log(`Flattening object at depth ${currentDepth}:`, obj);

  if (currentDepth >= maxDepth) {
    return { [prefix || "data"]: JSON.stringify(obj) };
  }

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    console.log(`Processing key: ${key}, value:`, value, `newKey: ${newKey}`);

    if (value === null || value === undefined) {
      flattened[newKey] = null;
      console.log(`Set ${newKey} = null`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        flattened[newKey] = "[]";
      } else {
        flattened[newKey] = JSON.stringify(value);
      }
      console.log(`Set ${newKey} = ${flattened[newKey]} (array)`);
    } else if (typeof value === "object" && value !== null) {
      console.log(`Recursing into nested object for key: ${newKey}`);
      const nestedFlattened = flattenObject(
        value,
        newKey,
        maxDepth,
        currentDepth + 1
      );
      Object.assign(flattened, nestedFlattened);
      console.log(`After recursion, flattened now:`, flattened);
    } else {
      flattened[newKey] = value;
      console.log(`Set ${newKey} = ${value} (primitive)`);
    }
  }

  console.log(`Final flattened result:`, flattened);
  return flattened;
};

console.log("=== Testing Sample 1 (Single nested object) ===");
try {
  const parsed1 = JSON.parse(testSample1);
  console.log("Parsed JSON:", parsed1);
  const flattened1 = flattenObject(parsed1[0], "", 15);
  console.log("Final result:", flattened1);
} catch (error) {
  console.error("Error:", error.message);
}

console.log("\n=== Testing Sample 2 (Multiple nested objects) ===");
try {
  const parsed2 = JSON.parse(testSample2);
  console.log("Parsed JSON:", parsed2);
  const flattened2a = flattenObject(parsed2[0], "", 15);
  console.log("First object result:", flattened2a);
  const flattened2b = flattenObject(parsed2[1], "", 15);
  console.log("Second object result:", flattened2b);
} catch (error) {
  console.error("Error:", error.message);
}
