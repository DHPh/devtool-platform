// Complete test of the JSON parsing flow with the problematic data
console.log("=== Complete JSON Parsing Flow Test ===\n");

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

// Import the actual functions from the file
import("../src/lib/utils/json-parser.ts")
  .then((module) => {
    const { parseJSON } = module;

    console.log("Testing with problematic nested JSON...");
    console.log("Input:", testData1);

    try {
      const result = parseJSON(testData1, { maxDepth: 15 });
      console.log("\n✅ Parse successful!");
      console.log("Row count:", result.rowCount);
      console.log("Has nested data:", result.hasNestedData);
      console.log("Headers:", result.headers);
      console.log("Data:", result.data);

      // Check for null values
      result.data.forEach((row, index) => {
        console.log(`\nRow ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          if (value === null) {
            console.log(`  ❌ ${key}: null`);
          } else {
            console.log(`  ✅ ${key}: ${JSON.stringify(value)}`);
          }
        });
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  })
  .catch((err) => {
    console.error("Failed to import:", err);
  });
