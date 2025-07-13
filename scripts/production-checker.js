#!/usr/bin/env node

/**
 * Production Readiness Checker
 * Identifies all placeholder values that need to be replaced with real values
 */

import fs from "fs";
import path from "path";

// Color codes for console output
const colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

// Placeholders to check for
const placeholders = {
  domains: [
    "devtool-platform.vercel.app",
    "your-domain.com",
    "https://your-domain.com",
  ],
  verification: [
    "your-google-verification-code",
    "your-bing-verification-code",
    "your-google-verification-code-here",
    "your-bing-verification-code-here",
  ],
  social: [
    "@devtoolplatform",
    "@your-twitter-handle",
    "your-twitter-handle",
    "hello@devtoolplatform.com",
    "contact@your-domain.com",
    "support@your-domain.com",
  ],
  analytics: [
    "G-XXXXXXXXXX",
    "your-sentry-dsn",
    "your-hotjar-id",
    "your-facebook-app-id",
  ],
};

// Required image files
const requiredImages = [
  "public/favicon.ico",
  "public/favicon-16x16.png",
  "public/favicon-32x32.png",
  "public/apple-touch-icon.png",
  "public/og-homepage.png",
  "public/og-default.png",
  "public/icon-192.png",
  "public/icon-512.png",
];

// Files to check (exclude node_modules, .git, dist, etc.)
function shouldCheckFile(filePath) {
  const excludePatterns = [
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    ".env.local",
    ".env.production",
    "PRODUCTION_CHECKLIST.md",
    "scripts/production-checker.js",
  ];

  return !excludePatterns.some((pattern) => filePath.includes(pattern));
}

function checkFileForPlaceholders(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const issues = [];

    // Check each category of placeholders
    Object.entries(placeholders).forEach(([category, patterns]) => {
      patterns.forEach((pattern) => {
        if (content.includes(pattern)) {
          issues.push({
            category,
            pattern,
            type: "placeholder",
          });
        }
      });
    });

    return issues;
  } catch {
    return [];
  }
}

function checkMissingImages() {
  const missing = [];

  requiredImages.forEach((imagePath) => {
    if (!fs.existsSync(imagePath)) {
      missing.push(imagePath);
    }
  });

  return missing;
}

function scanDirectory(dir) {
  const issues = {};

  function scanRecursive(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach((file) => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && shouldCheckFile(filePath)) {
        scanRecursive(filePath);
      } else if (stat.isFile() && shouldCheckFile(filePath)) {
        const fileIssues = checkFileForPlaceholders(filePath);
        if (fileIssues.length > 0) {
          issues[filePath] = fileIssues;
        }
      }
    });
  }

  scanRecursive(dir);
  return issues;
}

function printResults(issues, missingImages) {
  console.log(
    `${colors.bold}${colors.blue}🔍 Production Readiness Check${colors.reset}\n`
  );

  // Print placeholder issues
  let totalIssues = 0;
  Object.entries(issues).forEach(([filePath, fileIssues]) => {
    console.log(`${colors.yellow}📁 ${filePath}${colors.reset}`);

    fileIssues.forEach((issue) => {
      totalIssues++;
      const categoryIcon =
        {
          domains: "🌐",
          verification: "🔍",
          social: "📱",
          analytics: "📊",
        }[issue.category] || "⚠️";

      console.log(`   ${categoryIcon} ${issue.pattern}`);
    });
    console.log();
  });

  // Print missing images
  if (missingImages.length > 0) {
    console.log(`${colors.red}🖼️  Missing Required Images:${colors.reset}`);
    missingImages.forEach((image) => {
      console.log(`   ❌ ${image}`);
      totalIssues++;
    });
    console.log();
  }

  // Summary
  if (totalIssues === 0) {
    console.log(
      `${colors.green}${colors.bold}✅ All placeholder values have been replaced!${colors.reset}`
    );
    console.log(
      `${colors.green}🚀 Ready for production deployment${colors.reset}`
    );
  } else {
    console.log(
      `${colors.red}${colors.bold}⚠️  Found ${totalIssues} items that need attention${colors.reset}`
    );
    console.log(
      `${colors.yellow}📋 See PRODUCTION_CHECKLIST.md for detailed instructions${colors.reset}`
    );
  }

  console.log(`\n${colors.blue}Next steps:${colors.reset}`);
  console.log(`1. Copy .env.example to .env.local`);
  console.log(`2. Update .env.local with real values`);
  console.log(`3. Upload required images to public/`);
  console.log(`4. Run: node scripts/update-domain.js`);
  console.log(`5. Deploy to production`);
}

// Main execution
function main() {
  console.log("Scanning for placeholder values...\n");

  const issues = scanDirectory(".");
  const missingImages = checkMissingImages();

  printResults(issues, missingImages);
}

// Check if .env.local exists
function checkEnvFile() {
  if (!fs.existsSync(".env.local")) {
    console.log(`${colors.yellow}⚠️  .env.local not found${colors.reset}`);
    console.log(`Run: cp .env.example .env.local\n`);
  }
}

checkEnvFile();
main();
