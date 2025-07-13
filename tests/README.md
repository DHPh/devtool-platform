# 🧪 Tests Directory

This directory contains all test files and debugging scripts used during development.

## Contents

### JSON Parser Tests

- `test-nested-json-parser.js` - Main nested JSON parsing test
- `test-nested-json.js` - Additional JSON parsing tests
- `debug-json-*.js` - JSON debugging and issue resolution scripts

### CSV Parser Tests

- `debug-csv.js` - CSV parsing debugging
- `debug-delimiter.js` - Delimiter detection tests
- `debug-convert.js` - Data conversion tests
- `user-data-test.csv` - Sample user data for testing
- `test-semicolon.csv` - Semicolon delimiter test file
- `test-semicolon-debug.csv` - Debug version of semicolon test

### General Tests

- `test-tool-params.js` - Tool parameter testing
- `quick-test.js` - Quick functionality tests
- `final-nested-test.js` - Final nested data structure tests
- `test-complete-flow.mjs` - Complete flow testing (ES module)
- `test-nested-json.json` - Sample nested JSON data for testing

### UI & Classification Tests

- `fouc-test.html` - Dark theme FOUC (Flash of Unstyled Content) testing
- `test-fouc-prevention.js` - FOUC prevention logic testing
- `demo-tool-classification.js` - Demo for new tool classification system

### UI/Theme Tests

- `fouc-test.html` - FOUC (Flash of Unstyled Content) prevention test for dark theme

## Usage

These files are for development and debugging purposes only. They are not part of the production application.

### Running Tests

**Note**: Some test files have dependencies on TypeScript utility files and may require transpilation or specific Node.js setup to run properly.

```bash
# Independent test files (no dependencies)
node tests/test-nested-json-parser.js
node tests/debug-flatten.js
node tests/final-nested-test.js

# Files with TypeScript dependencies (may need build setup)
# node tests/test-nested-json.js
# node tests/debug-csv.js
# node tests/test-tool-params.js
# node tests/test-complete-flow.mjs
```

### Testing UI Components

For testing FOUC (Flash of Unstyled Content) prevention:

1. Open `tests/fouc-test.html` in a web browser
2. Switch between light/dark themes using the buttons
3. Refresh the page multiple times to test for visual flashing
4. Verify smooth theme transitions without content flashing

### Path Notes

After reorganization, test files that import from the main codebase use relative paths:

- `../src/lib/utils/json-parser.ts` - JSON parsing utilities
- `../src/lib/utils/csv-parser.ts` - CSV parsing utilities

## Note

These files can be safely removed in production builds as they are only used for development and testing purposes.
