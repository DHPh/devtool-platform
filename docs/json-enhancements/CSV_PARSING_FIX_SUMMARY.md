# Data Table Tools - Enhanced CSV Parsing Fix Summary

## Issues Identified and Fixed

Both the **CSV Viewer** and **Data Explorer** tools have been significantly improved to handle various CSV formats, especially those using semicolon (`;`) delimiters and files with empty fields.

## Problem Details

- **Original Issue**: CSV files with semicolon delimiters were parsed incorrectly
- **Additional Issues Discovered**: Empty fields, inconsistent column counts, and poor delimiter detection
- **Affected Tools**:
  - CSV Viewer (`/tools/csv-viewer`)
  - Data Explorer (`/tools/data-explorer`)
- **Symptoms**:
  - Multiple columns appeared as a single column
  - Empty fields caused parsing errors
  - Data was not properly separated
  - Pagination and table features were affected
  - Statistics in Data Explorer were incorrect

## Enhanced Solution Implemented

### 1. Advanced Auto-Delimiter Detection

Applied to both CSV Viewer and Data Explorer with consistency validation:

```typescript
const detectDelimiter = (text: string): string => {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return ",";

  const firstLine = lines[0];
  const delimiters = [",", ";", "\t", "|"];

  let maxCount = 0;
  let bestDelimiter = ",";

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp("\\" + delimiter, "g")) || [])
      .length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  // Additional validation: check if delimiter creates consistent column counts
  if (lines.length > 1) {
    const headerCount = firstLine.split(bestDelimiter).length;
    let consistentRows = 0;

    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const rowCount = lines[i].split(bestDelimiter).length;
      if (rowCount === headerCount) {
        consistentRows++;
      }
    }

    // If less than 70% of rows have consistent column count, try other delimiters
    const checkCount = Math.min(4, lines.length - 1);
    if (consistentRows < checkCount * 0.7) {
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

        if (consistent > consistentRows) {
          bestDelimiter = delimiter;
          consistentRows = consistent;
        }
      }
    }
  }

  return bestDelimiter;
};
```

### 2. Enhanced CSV Line Parsing with Quote Handling

Improved parsing logic for both tools to handle empty fields and quoted values:

```typescript
const parseCSVLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  // Clean up quoted values
  return result.map((value) => {
    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  });
};
```

### 3. Improved Data Processing for Empty Fields

Enhanced the main parsing logic in Data Explorer to handle missing/empty values:

```typescript
const lines = text
  .trim()
  .split("\n")
  .filter((line) => line.trim());
if (lines.length === 0) return [];

const headers = parseCSVLine(lines[0], delimiter);
const rows = lines.slice(1).map((line) => {
  const values = parseCSVLine(line, delimiter);
  const row: DataRow = {};

  headers.forEach((header, index) => {
    const value = values[index] || "";
    const cleanHeader = header.replace(/"/g, "").trim();

    // Handle empty values
    if (value === "" || value === null || value === undefined) {
      row[cleanHeader] = null;
    } else if (value === "true" || value === "false") {
      row[cleanHeader] = value === "true";
    } else {
      const numValue = Number(value);
      row[cleanHeader] = isNaN(numValue) ? value : numValue;
    }
  });

  // Ensure all headers are present in the row (fill missing with null)
  headers.forEach((header) => {
    const cleanHeader = header.replace(/"/g, "").trim();
    if (!(cleanHeader in row)) {
      row[cleanHeader] = null;
    }
  });

  return row;
});
```

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }

}

result.push(current.trim());
return result;
};

````

### 3. Tool-Specific Enhancements

#### CSV Viewer

- Enhanced export function to use detected delimiter
- Delimiter badge showing detected format
- Improved placeholder text with examples

#### Data Explorer

- Enhanced multi-format parsing (CSV, TSV, JSON)
- Format detection badge in statistics
- Advanced delimiter detection for auto mode
- Improved placeholder with multiple format examples

### 4. User Experience Improvements

- **Delimiter Badges**: Show detected delimiter type in the UI
- **Enhanced Placeholders**: Show examples for multiple formats
- **Better Error Handling**: More robust parsing with proper error messages
- **Format Consistency**: Export maintains original delimiter format

## Supported Delimiters

Both tools now support:

- **Comma (`,`)** - Standard CSV format
- **Semicolon (`;`)** - European CSV format
- **Tab (`\t`)** - TSV format
- **Pipe (`|`)** - Alternative delimiter format

## Test Cases

### Before Fix

```csv
Username;Login email;Identifier;First name;Last name
booker12;rachel@example.com;9012;Rachel;Booker
````

Result: 1 column with all data combined

### After Fix

```csv
Username;Login email;Identifier;First name;Last name
booker12;rachel@example.com;9012;Rachel;Booker
```

Result: 5 proper columns with correct data separation

## Tool-Specific Results

### CSV Viewer

- ✅ Proper column detection (5 columns instead of 1)
- ✅ Working pagination controls
- ✅ Correct data display and formatting
- ✅ Export preserves original delimiter

### Data Explorer

- ✅ Accurate column statistics
- ✅ Proper data type detection
- ✅ Correct min/max/avg calculations
- ✅ Enhanced format detection and display

### JSON Table Viewer

- ✅ No changes needed (JSON-specific tool)
- ✅ Continues to work correctly for JSON data

## UI Enhancements

1. **Delimiter Detection Badges**:
   - CSV Viewer: "Delimiter: Semicolon (;)"
   - Data Explorer: "Format: CSV (;)"
2. **Enhanced Placeholder Text**: Provides examples for multiple delimiter types
3. **Proper Export**: Maintains the original delimiter format when exporting

## Benefits

- **Universal CSV Support**: Works with CSV files from any source/locale
- **Automatic Detection**: No user configuration required
- **Data Integrity**: Preserves original formatting and structure
- **Professional Features**: Maintains all existing functionality (sorting, filtering, pagination, statistics)
- **Consistent Experience**: All data table tools now handle CSV formats uniformly

## Technical Implementation

- **TanStack Table**: Continues to provide robust table functionality
- **Type Safety**: Full TypeScript support maintained
- **Performance**: Efficient parsing algorithm with minimal overhead
- **Error Handling**: Graceful fallbacks and user-friendly error messages

The data table tools now provide enterprise-grade data processing capabilities that handle the diverse range of data formats encountered in real-world scenarios.
