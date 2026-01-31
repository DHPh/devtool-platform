> **Historical document:** This file is retained for context only and may not match the current codebase. Use docs/INDEX.md for maintained guidance.

# Testing Instructions

## For debugging the JSON parsing issue:

1. Open the browser dev tools (F12)
2. Go to the JSON Table Viewer tool
3. Paste this test data:

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

4. Click outside the textarea to trigger parsing
5. Check the console for debug output

## Expected Console Output:

```
handleTextInput called with: [JSON data]
parseJSON result: {data: [...], headers: [...], ...}
Creating columns for keys: ["address.city", "address.zip", "contact.email", "contact.phone", "name"]
Sample data: {name: "John", contact.email: "john@example.com", ...}
Column address.city: values = ["New York"] type = string
... (more columns)
```

## Expected Table Output:

| address.city | address.zip | contact.email    | contact.phone | name |
| ------------ | ----------- | ---------------- | ------------- | ---- |
| New York     | 10001       | john@example.com | +1-555-0123   | John |

If you see `null` values in the console output or table, that indicates where the issue is occurring.
