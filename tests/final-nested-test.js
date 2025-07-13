// Final test of nested JSON parsing with user's exact data
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

// Simulate the parseJSON function
const flattenObject = (obj, prefix = "", maxDepth = 10, currentDepth = 0) => {
  const flattened = {};
  if (currentDepth >= maxDepth) {
    return { [prefix || "data"]: JSON.stringify(obj) };
  }
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      flattened[newKey] = null;
    } else if (Array.isArray(value)) {
      flattened[newKey] = value.length === 0 ? "[]" : JSON.stringify(value);
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

console.log("🧪 Testing user provided nested JSON...");
try {
  const parsed = JSON.parse(testData);
  const hasNestedData = parsed.some((item) =>
    Object.values(item).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === "object" && value !== null)
    )
  );

  const flattenedData = parsed.map((item) => flattenObject(item, "", 15));
  const headerSet = new Set();
  flattenedData.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet).sort();

  console.log("✅ Success!");
  console.log("📊 Results:", {
    rowCount: flattenedData.length,
    hasNestedData,
    headers,
    sampleRow: flattenedData[0],
  });

  console.log("\n📋 Expected table structure:");
  headers.forEach((header) => {
    console.log(`  ${header}: ${flattenedData[0][header]}`);
  });
} catch (error) {
  console.error("❌ Error:", error.message);
}
