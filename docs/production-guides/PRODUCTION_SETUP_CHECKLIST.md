# 🔧 PRODUCTION SETUP CHECKLIST - Cần Cập Nhật API Keys & Settings

## 🚨 CÁC THÔNG TIN CẦN THAY THÊM

### 1. **Domain URL - CẦN UPDATE**

📁 **Files cần sửa:**

- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/tools/[slug]/page.tsx`
- `src/lib/og-generator.ts`

```typescript
// ❌ Hiện tại (placeholder):
metadataBase: new URL("https://devtool-platform.vercel.app"),

// ✅ Cần thay bằng domain thật:
metadataBase: new URL("https://your-actual-domain.com"),
```

### 2. **Google Search Console Verification - CẦN UPDATE**

📁 **File:** `src/app/layout.tsx`

```typescript
// ❌ Hiện tại (placeholder):
verification: {
  google: "your-google-verification-code",
  other: {
    "msvalidate.01": "your-bing-verification-code",
  },
},

// ✅ Cần thay bằng mã thật từ Search Console:
verification: {
  google: "abc123def456...", // Lấy từ Google Search Console
  other: {
    "msvalidate.01": "xyz789...", // Lấy từ Bing Webmaster Tools
  },
},
```

### 3. **Twitter/X Handle - CẦN UPDATE**

📁 **Files:** `src/app/layout.tsx`, `src/app/page.tsx`

```typescript
// ❌ Hiện tại (placeholder):
twitter: {
  site: "@devtoolplatform",
  creator: "@devtoolplatform",
},

// ✅ Cần thay bằng Twitter handle thật:
twitter: {
  site: "@your-twitter-handle",
  creator: "@your-twitter-handle",
},
```

### 4. **OpenGraph Images - CẦN TẠO**

📁 **Files cần image thật:**

- `public/og-image.png` (1200x630px)
- `public/og-homepage.png`
- `public/og-tools-collection.png`

**Specs:**

- Size: 1200x630px
- Format: PNG hoặc JPG
- Text: Readable, high contrast
- Branding: Logo + tool names

### 5. **Favicons - CẦN TẠO**

📁 **Files:** `public/`

```
favicon.ico (32x32)
favicon.svg (vector)
apple-touch-icon.png (180x180)
android-chrome-192x192.png
android-chrome-512x512.png
```

### 6. **Manifest.json - CẦN UPDATE**

📁 **File:** `public/manifest.json`

```json
{
  "name": "Your App Name",
  "short_name": "YourApp",
  "start_url": "https://your-domain.com",
  "icons": [
    // Real icon paths
  ]
}
```

## 🛠 SETUP INSTRUCTIONS

### Step 1: Domain Setup

```bash
# 1. Deploy to production (Vercel/Netlify/etc)
# 2. Get actual domain URL
# 3. Update all files with real domain
```

### Step 2: Google Search Console

1. Go to https://search.google.com/search-console
2. Add your domain property
3. Verify ownership
4. Copy verification meta tag
5. Add to `layout.tsx`

### Step 3: Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters
2. Add your site
3. Verify ownership
4. Copy verification code
5. Add to `layout.tsx`

### Step 4: Create OpenGraph Images

**Tool recommendations:**

- Canva Pro
- Figma
- Adobe Photoshop
- Online OG generators

**Template structure:**

```
[App Logo] DevTool Platform
100+ Free Developer Tools
[Tool Icon] Tool Name
"Description text"
```

### Step 5: Generate Favicons

**Tools:**

- https://realfavicongenerator.net/
- https://favicon.io/
- Figma export

### Step 6: Twitter/Social Setup

1. Create Twitter account for project
2. Update handles in metadata
3. Test social sharing cards

## 📝 ENVIRONMENT VARIABLES

**Không cần API keys cho:**

- ✅ Static site generation
- ✅ Client-side tools
- ✅ Basic SEO metadata

**Có thể thêm sau (optional):**

- Google Analytics ID
- Hotjar tracking
- Error monitoring (Sentry)

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deploy

- [ ] Update all domain URLs
- [ ] Create OpenGraph images
- [ ] Generate favicons
- [ ] Update manifest.json
- [ ] Test build locally

### Post-Deploy

- [ ] Verify Google Search Console
- [ ] Verify Bing Webmaster Tools
- [ ] Submit sitemap to both
- [ ] Test OpenGraph previews
- [ ] Monitor initial indexing

### Week 1-2 After Deploy

- [ ] Check Search Console for errors
- [ ] Monitor Core Web Vitals
- [ ] Track initial keyword rankings
- [ ] Verify structured data parsing

## 🎯 PRIORITY ORDER

### HIGH PRIORITY (Làm ngay):

1. **Domain URL** - Update ở tất cả files
2. **OpenGraph images** - Basic homepage image
3. **Favicons** - Tối thiểu favicon.ico
4. **Search Console verification**

### MEDIUM PRIORITY (Tuần đầu):

1. Twitter handle setup
2. Bing verification
3. Tool-specific OG images
4. Manifest.json update

### LOW PRIORITY (Có thể làm sau):

1. Advanced analytics
2. Error monitoring
3. Performance tracking
4. A/B testing setup

## 💡 PRO TIPS

### Quick Wins:

- Use placeholder domain initially để test
- Generate OG images in bulk với template
- Use favicon generator tools
- Start with Google Search Console first

### Common Mistakes:

- Forgetting to update sitemap URLs
- Mixed HTTP/HTTPS trong metadata
- Wrong OG image dimensions
- Missing trailing slashes in URLs

---

**🎯 TÓM TẮT: Chỉ cần update domain URLs, verification codes, và tạo images. Không cần API keys phức tạp!**
