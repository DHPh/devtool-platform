#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Production Setup Script
 * Updates placeholder domains with actual domain
 */

const fs = require("fs");
const path = require("path");

// Configuration
const PLACEHOLDER_DOMAIN = "devtool-platform.vercel.app";
const FILES_TO_UPDATE = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/sitemap.ts",
  "src/app/tools/[slug]/page.tsx",
  "src/lib/og-generator.ts",
  "public/manifest.json",
];

function updateDomain(actualDomain) {
  if (!actualDomain) {
    console.error("❌ Please provide actual domain");
    console.log("Usage: node scripts/update-domain.js your-domain.com");
    process.exit(1);
  }

  // Remove protocol if provided
  actualDomain = actualDomain.replace(/^https?:\/\//, "");

  console.log(
    `🔄 Updating domain from ${PLACEHOLDER_DOMAIN} to ${actualDomain}`
  );

  let updatedFiles = 0;

  FILES_TO_UPDATE.forEach((filePath) => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    try {
      let content = fs.readFileSync(fullPath, "utf8");
      const originalContent = content;

      // Update domain
      content = content.replace(
        new RegExp(PLACEHOLDER_DOMAIN, "g"),
        actualDomain
      );

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`✅ Updated: ${filePath}`);
        updatedFiles++;
      } else {
        console.log(`⏭️  No changes needed: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  });

  console.log(`\n🎉 Updated ${updatedFiles} files successfully!`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Create OpenGraph images (1200x630px)`);
  console.log(`2. Generate favicons`);
  console.log(`3. Setup Google Search Console verification`);
  console.log(`4. Deploy and submit sitemap`);
}

// Run if called directly
if (require.main === module) {
  const actualDomain = process.argv[2];
  updateDomain(actualDomain);
}

module.exports = { updateDomain };
