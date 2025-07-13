import { detectDelimiter, parseCSV } from "../src/lib/utils/csv-parser";

// Test with semicolon data
const testData = `Username;Login email;Identifier;First name;Last name
booker12;rachel@example.com;9012;Rachel;Booker
grey07;;2070;Laura;Grey
johnson81;;4081;Craig;Johnson
jenkins46;mary@example.com;9346;Mary;Jenkins
smith79;jamie@example.com;5079;Jamie;Smith`;

console.log("Testing delimiter detection:");
console.log("Detected delimiter:", detectDelimiter(testData));

console.log("\nTesting full CSV parsing:");
const result = parseCSV(testData, { hasHeader: true, skipEmptyLines: true });
console.log("Result:", result);
console.log("Headers:", result.headers);
console.log("First row:", result.data[0]);
