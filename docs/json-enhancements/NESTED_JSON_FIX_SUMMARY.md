# Testing Nested JSON Parsing

## Test Data

The following nested JSON should now work correctly in both JSON Table Viewer and Data Explorer:

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
]
```

## Expected Result

After flattening, the data should have the following columns:

- `address.city`
- `address.zip`
- `contact.email`
- `contact.phone`
- `name`

## Changes Made

### JSON Table Viewer

- ✅ Already using shared `parseJSON` utility
- ✅ Already shows "Nested data flattened" badge
- ✅ Properly handles nested JSON with dot notation

### Data Explorer

- ✅ Updated to use shared `parseJSON` utility instead of simple JSON.parse()
- ✅ Added `hasNestedData` state management
- ✅ Added "Nested data flattened" badge to UI
- ✅ Properly resets nested data state for CSV/TSV parsing
- ✅ Clears nested data state when clearing data

## Testing Instructions

1. Go to JSON Table Viewer tool
2. Paste the test JSON data above
3. Verify columns are flattened with dot notation
4. Verify "Nested data flattened" badge appears
5. Go to Data Explorer tool
6. Paste the same JSON data
7. Verify same flattening behavior and badge

Both tools should now handle deeply nested JSON objects consistently.
