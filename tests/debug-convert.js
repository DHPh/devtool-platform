// Test the convertValue function specifically
const convertDateValue = (value, fieldName) => {
  if (typeof value !== "string") {
    return value;
  }

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

  // Only convert if both conditions are met
  if (isLikelyDateField && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split("T")[0];
    }
  }

  return value;
};

const convertValue = (value, fieldName) => {
  console.log(`Converting value:`, value, `fieldName:`, fieldName);

  if (value === null || value === undefined) {
    console.log(`  -> null (was null/undefined)`);
    return null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    console.log(`  -> string value: "${trimmedValue}"`);

    // Handle empty strings
    if (trimmedValue === "") {
      console.log(`  -> null (empty string)`);
      return null;
    }

    // Handle boolean values
    if (trimmedValue === "true" || trimmedValue === "false") {
      const result = trimmedValue === "true";
      console.log(`  -> ${result} (boolean)`);
      return result;
    }

    // Handle null strings
    if (trimmedValue.toLowerCase() === "null") {
      console.log(`  -> null (null string)`);
      return null;
    }

    // Handle numeric values
    if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
      const numValue = Number(trimmedValue);
      if (!isNaN(numValue)) {
        console.log(`  -> ${numValue} (number)`);
        return numValue;
      }
    }

    // Try date conversion
    const dateResult = convertDateValue(trimmedValue, fieldName);
    console.log(`  -> "${dateResult}" (after date conversion)`);
    return dateResult;
  }

  console.log(`  -> ${value} (unchanged)`);
  return value;
};

// Test with flattened data
const flattenedData = {
  name: "John",
  "contact.email": "john@example.com",
  "contact.phone": "+1-555-0123",
  "address.city": "New York",
  "address.zip": "10001",
};

console.log("=== Testing convertValue function ===");
const converted = {};
for (const [key, value] of Object.entries(flattenedData)) {
  converted[key] = convertValue(value, key);
}

console.log("\nOriginal:", flattenedData);
console.log("Converted:", converted);

// Check for null values
const nullValues = Object.entries(converted).filter(
  ([key, value]) => value === null
);
if (nullValues.length > 0) {
  console.log("\n❌ Found null values:", nullValues);
} else {
  console.log("\n✅ No null values found");
}
