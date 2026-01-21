// Test with the exact same parameters as the tools use
const { parseJSON } = require("../../src/lib/utils/json-parser.ts");

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
  }
]`;

console.log("Testing with actual tool parameters...");

try {
  const result = parseJSON(testData, { maxDepth: 15 });
  console.log("Success!");
  console.log("Row count:", result.rowCount);
  console.log("Has nested data:", result.hasNestedData);
  console.log("Headers:", result.headers);
  console.log("First row data:", result.data[0]);

  // Check for null values
  const nullValues = Object.entries(result.data[0]).filter(
    ([key, value]) => value === null
  );
  if (nullValues.length > 0) {
    console.log("WARNING: Found null values:", nullValues);
  } else {
    console.log("✅ No unexpected null values found");
  }
} catch (error) {
  console.error("Error:", error.message);
}
