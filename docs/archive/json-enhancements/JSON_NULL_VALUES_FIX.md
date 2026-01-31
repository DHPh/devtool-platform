> **Historical document:** This file is retained for context only and may not match the current codebase. Use docs/INDEX.md for maintained guidance.

# JSON Parsing Null Values Issue - FIXED

## Problem

Both JSON Table Viewer and Data Explorer were showing null values for all columns when parsing nested JSON like:

```json
[
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
]
```

## Root Causes Found & Fixed

### 1. ✅ Aggressive Date Conversion

**Issue**: The `convertDateValue` function was using `!isNaN(Date.parse(value))` which could convert many strings (like "New York") to dates unexpectedly.

**Fix**: Made date conversion more strict - only converts strings that:

- Match date field patterns (date, time, created, etc.) AND
- Match strict ISO date format (`^\d{4}-\d{2}-\d{2}`)

### 2. ✅ Real-time Parsing on Every Keystroke

**Issue**: Both tools were calling `handleTextInput` on every `onChange` event in the textarea, trying to parse incomplete JSON as users typed.

**Fix**: Changed from `onChange` to `onBlur` so parsing only happens when user finishes typing and clicks away from the textarea.

## Changes Made

### JSON Parser (`src/lib/utils/json-parser.ts`)

```typescript
// BEFORE: Too aggressive date conversion
if (
  isLikelyDateField ||
  /^\d{4}-\d{2}-\d{2}/.test(value) ||
  !isNaN(Date.parse(value))  // ❌ This was the problem
) {

// AFTER: Strict date conversion
if (isLikelyDateField && /^\d{4}-\d{2}-\d{2}/.test(value)) {
  // ✅ Only convert if both conditions are met
}
```

### JSON Table Viewer (`src/lib/tools/json-table-viewer.tsx`)

```typescript
// BEFORE: Parse on every keystroke
onChange={(e) => {
  if (e.target.value.trim()) {
    handleTextInput(e.target.value); // ❌ Called constantly
  }
}}

// AFTER: Parse only when user finishes typing
onBlur={(e) => {
  if (e.target.value.trim()) {
    handleTextInput(e.target.value); // ✅ Called only when done
  }
}}
```

### Data Explorer (`src/lib/tools/data-explorer.tsx`)

- ✅ Same `onChange` → `onBlur` fix applied

## Test Results

Now both tools correctly parse and display:

**Input:**

```json
[
  {
    "name": "John",
    "contact": { "email": "john@example.com" },
    "address": { "city": "New York" }
  }
]
```

**Output Columns:**

- `address.city` → "New York" ✅
- `contact.email` → "john@example.com" ✅
- `name` → "John" ✅

**No more null values!** 🎉

## Usage Instructions

1. **JSON Table Viewer**:

   - Paste your nested JSON and click outside the textarea
   - Data will be flattened with dot notation
   - "Nested data flattened" badge will appear

2. **Data Explorer**:
   - Same behavior as JSON Table Viewer
   - Also supports CSV/TSV mixed with JSON

Both tools now handle nested JSON consistently and correctly!
