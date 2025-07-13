#!/usr/bin/env node

/**
 * Test Files Path Checker
 * Verifies that all test files have correct paths after reorganization
 */

import fs from "fs";
import path from "path";

const testsDir = "./tests";
const issues = [];

// Check each test file for potential path issues
function checkTestFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const fileName = path.basename(filePath);
    const fileIssues = [];

    // Check for old relative paths
    if (content.includes("./src/")) {
      fileIssues.push('Uses old relative path "./src/" - should be "../src/"');
    }

    // Check for absolute paths that might break
    if (content.includes("src/lib/") && !content.includes("../src/lib/")) {
      fileIssues.push('Contains "src/lib/" without proper relative path');
    }

    // Check for missing imports in JS/MJS files
    if (
      (fileName.endsWith(".js") || fileName.endsWith(".mjs")) &&
      content.includes("import ")
    ) {
      const importLines = content.match(/import .* from ['"][^'"]+['"]/g);
      if (importLines) {
        importLines.forEach((line) => {
          if (line.includes("./src/") || line.includes("src/")) {
            if (!line.includes("../src/")) {
              fileIssues.push(`Potential import issue: ${line}`);
            }
          }
        });
      }
    }

    // Check for require statements
    if (content.includes("require(") && content.includes("src/")) {
      const requireLines = content.match(/require\(['"][^'"]+['"]\)/g);
      if (requireLines) {
        requireLines.forEach((line) => {
          if (
            line.includes("./src/") ||
            (line.includes("src/") && !line.includes("../src/"))
          ) {
            fileIssues.push(`Potential require issue: ${line}`);
          }
        });
      }
    }

    if (fileIssues.length > 0) {
      issues.push({
        file: fileName,
        path: filePath,
        issues: fileIssues,
      });
    }
  } catch (error) {
    issues.push({
      file: path.basename(filePath),
      path: filePath,
      issues: [`Error reading file: ${error.message}`],
    });
  }
}

// Get all test files
const testFiles = fs
  .readdirSync(testsDir)
  .filter(
    (file) =>
      file.endsWith(".js") || file.endsWith(".mjs") || file.endsWith(".ts")
  )
  .map((file) => path.join(testsDir, file));

console.log("🔍 Checking test files for path issues...\n");

testFiles.forEach(checkTestFile);

// Report results
if (issues.length === 0) {
  console.log("✅ All test files have correct paths!");
} else {
  console.log(`⚠️  Found ${issues.length} files with potential issues:\n`);

  issues.forEach((issue) => {
    console.log(`📁 ${issue.file}`);
    issue.issues.forEach((problem) => {
      console.log(`   ❌ ${problem}`);
    });
    console.log();
  });
}

// Additional checks
console.log("\n🔍 Additional checks:");

// Check if utility files exist
const utilityPaths = [
  "../src/lib/utils/json-parser.ts",
  "../src/lib/utils/csv-parser.ts",
];

utilityPaths.forEach((utilPath) => {
  const fullPath = path.resolve(testsDir, utilPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${utilPath} exists`);
  } else {
    console.log(`❌ ${utilPath} NOT FOUND`);
  }
});

console.log("\n📊 Summary:");
console.log(`Total test files checked: ${testFiles.length}`);
console.log(`Files with issues: ${issues.length}`);
console.log(`Status: ${issues.length === 0 ? "✅ READY" : "⚠️ NEEDS FIXES"}`);
