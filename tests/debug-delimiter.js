// Simple Node.js test for delimiter detection
const testData = `Username;Login email;Identifier;First name;Last name
booker12;rachel@example.com;9012;Rachel;Booker
grey07;;2070;Laura;Grey
johnson81;;4081;Craig;Johnson
jenkins46;mary@example.com;9346;Mary;Jenkins
smith79;jamie@example.com;5079;Jamie;Smith`;

// Manual implementation of detectDelimiter for testing
function detectDelimiter(text) {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return ",";

  const firstLine = lines[0];
  const delimiters = [",", ";", "\t", "|"];

  let maxCount = 0;
  let bestDelimiter = ",";

  console.log("First line:", firstLine);

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp("\\" + delimiter, "g")) || [])
      .length;
    console.log(`Delimiter "${delimiter}": count = ${count}`);
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  console.log("Best delimiter based on count:", bestDelimiter);

  // Additional validation: check if delimiter creates consistent column counts
  if (lines.length > 1) {
    const headerCount = firstLine.split(bestDelimiter).length;
    let consistentRows = 0;

    console.log("Header count:", headerCount);
    console.log("Checking consistency for first 5 rows:");

    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const rowCount = lines[i].split(bestDelimiter).length;
      console.log(`Row ${i}: "${lines[i]}" -> ${rowCount} columns`);
      if (rowCount === headerCount) {
        consistentRows++;
      }
    }

    console.log(
      `Consistent rows: ${consistentRows} out of ${Math.min(
        4,
        lines.length - 1
      )}`
    );

    // If less than 70% of rows have consistent column count, try other delimiters
    const checkCount = Math.min(4, lines.length - 1);
    if (consistentRows < checkCount * 0.7) {
      console.log("Not enough consistent rows, trying other delimiters...");
      for (const delimiter of delimiters) {
        if (delimiter === bestDelimiter) continue;

        const headerCount = firstLine.split(delimiter).length;
        let consistent = 0;

        for (let i = 1; i < Math.min(5, lines.length); i++) {
          const rowCount = lines[i].split(delimiter).length;
          if (rowCount === headerCount) {
            consistent++;
          }
        }

        console.log(`Delimiter "${delimiter}": ${consistent} consistent rows`);
        if (consistent > consistentRows) {
          bestDelimiter = delimiter;
          consistentRows = consistent;
        }
      }
    }
  }

  console.log("Final delimiter:", bestDelimiter);
  return bestDelimiter;
}

// Test the function
const result = detectDelimiter(testData);
console.log("Detected delimiter:", result);
