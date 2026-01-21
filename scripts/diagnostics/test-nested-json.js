import { parseJSON } from "../../src/lib/utils/json-parser.js";

// Test JSON with nested objects
const testJSON = [
  {
    id: 1,
    name: "John Doe",
    address: {
      city: "New York",
      country: "USA",
    },
    profile: {
      age: 30,
      preferences: {
        theme: "dark",
        language: "en",
      },
    },
  },
  {
    id: 2,
    name: "Jane Smith",
    address: {
      city: "London",
      country: "UK",
    },
    profile: {
      age: 25,
      preferences: {
        theme: "light",
        language: "fr",
      },
    },
  },
];

console.log("Testing nested JSON parsing...");
const result = parseJSON(JSON.stringify(testJSON), { maxDepth: 15 });

console.log("\nParsed data:");
console.log(JSON.stringify(result.data, null, 2));

console.log("\nChecking specific values:");
result.data.forEach((row, index) => {
  console.log(`Row ${index}:`);
  console.log(`  - address.city: ${row["address.city"]}`);
  console.log(
    `  - profile.preferences.theme: ${row["profile.preferences.theme"]}`
  );
});

console.log("\nAll keys:");
const allKeys = new Set();
result.data.forEach((row) => {
  Object.keys(row).forEach((key) => allKeys.add(key));
});
console.log(Array.from(allKeys).sort());
