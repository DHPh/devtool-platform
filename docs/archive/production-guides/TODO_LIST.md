> **Historical document:** This file is retained for context only and may not match the current codebase. Use docs/INDEX.md for maintained guidance.

# 📝 TODO List - Những Việc Cần Làm Trước Khi Production

## 🔥 CRITICAL - Bắt Buộc Phải Làm

### 1. 🌐 Domain & Environment Variables

- [ ] Tạo file `.env.local` từ `.env.example`
- [ ] Thay thế `NEXT_PUBLIC_SITE_URL` với domain thật
- [ ] Cập nhật `NEXT_PUBLIC_SITE_NAME` với tên thật
- [ ] Thay thế `CONTACT_EMAIL` với email thật
- [ ] Cập nhật `TWITTER_HANDLE` với Twitter handle thật

**Files cần sửa:**

- `src/config/site.ts`: Replace DEFAULT_CONFIG values
- `.env.local`: Set all production values

### 2. 🔍 SEO Verification Codes

- [ ] Lấy Google Search Console verification code
- [ ] Lấy Bing Webmaster Tools verification code
- [ ] Cập nhật `GOOGLE_VERIFICATION_CODE` trong `.env.local`
- [ ] Cập nhật `BING_VERIFICATION_CODE` trong `.env.local`

**Files affected:**

- `src/config/site.ts`: verification object
- `src/app/layout.tsx`: verification metadata

### 3. 🖼️ Required Images - PHẢI TẠO

- [ ] `public/favicon.ico` (32x32) - Browser tab icon
- [ ] `public/favicon-16x16.png` (16x16) - Small favicon
- [ ] `public/favicon-32x32.png` (32x32) - Standard favicon
- [ ] `public/apple-touch-icon.png` (180x180) - iOS icon
- [ ] `public/og-image.png` (1200x630) - Global OG image
- [ ] `public/og-homepage.png` (1200x630) - Homepage OG image
- [ ] `public/icon-192.png` (192x192) - PWA icon small
- [ ] `public/icon-512.png` (512x512) - PWA icon large

**Files referencing these:**

- `src/app/layout.tsx`: Global OG image
- `src/app/page.tsx`: Homepage OG image
- `public/manifest.json`: PWA icons

### 4. 📱 Social Media Updates

- [ ] Thay thế tất cả `@devtoolplatform` với Twitter handle thật
- [ ] Cập nhật contact email trong mọi file

**Files cần cập nhật:**

- `src/app/page.tsx`: Twitter metadata
- `src/app/tools/[slug]/page.tsx`: Twitter metadata
- `src/config/site.ts`: Default config

### 5. 🗺️ Sitemap & Robots

- [ ] Cập nhật robots.txt với domain thật
- [ ] Verify sitemap hoạt động sau khi deploy

**Files:**

- `public/robots.txt`: Update sitemap URL
- `src/app/sitemap.ts`: Uses config (should auto-update)

## 🚀 MEDIUM PRIORITY - Nên Làm

### 6. 🎨 Dynamic OG Images

- [ ] Implement @vercel/og for dynamic OG image generation
- [ ] Add tool category and icon to OG images
- [ ] Add usage statistics to OG images
- [ ] Implement caching mechanism

**Files to enhance:**

- `src/app/api/og/route.ts`: Current placeholder implementation

### 7. 📊 Optional Analytics

- [ ] Setup Google Analytics (optional)
- [ ] Setup Sentry for error monitoring (optional)
- [ ] Setup Hotjar for user analytics (optional)

**Environment variables:**

- `GOOGLE_ANALYTICS_ID`
- `SENTRY_DSN`
- `HOTJAR_ID`
- `ENABLE_ANALYTICS=true`

### 8. 📸 Screenshots for PWA

- [ ] Create desktop screenshot (1280x720)
- [ ] Create mobile screenshot (750x1334)
- [ ] Add tool-specific screenshots

**Files:**

- `public/screenshot-1.png`
- `public/screenshot-2.png`
- `public/screenshots/[tool-slug].png`

## 📋 CHECKLIST - Trước Khi Deploy

### Pre-deployment Checks

- [ ] Run `node scripts/production-checker.js` - no issues found
- [ ] All TODO comments addressed
- [ ] `.env.local` created with real values
- [ ] All required images uploaded
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Test locally: `npm run dev`

### Post-deployment Tasks

- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Test OG tags with Facebook Debugger
- [ ] Test Twitter Cards with Twitter Card Validator
- [ ] Verify verification codes work
- [ ] Check PageSpeed Insights score
- [ ] Monitor search console for indexing

## 🛠️ Quick Commands

```bash
# Check what needs to be done
node scripts/production-checker.js

# Update domain after setting .env.local
node scripts/update-domain.js

# Build for production
npm run build

# Test locally
npm run dev
```

## 📊 Current Status

### ✅ Completed

- SSR implementation
- SEO metadata and structured data
- Accessibility improvements
- Performance optimizations
- Centralized configuration
- TODO comments added to code

### ⚠️ Needs Attention (TODO items)

- Environment variables with real values
- Google & Bing verification codes
- 8 required image files
- Domain URL updates
- Social media handle updates

### 🎯 Ready for Production When

1. All CRITICAL items completed
2. All required images created and uploaded
3. Environment variables set with real values
4. Build passes without errors
5. Verification codes working

---

**Status: 90% Ready - Just need real values and images!** 🚀
