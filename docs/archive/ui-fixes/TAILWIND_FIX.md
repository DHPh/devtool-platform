> **Historical document:** This file is retained for context only and may not match the current codebase. Use docs/INDEX.md for maintained guidance.

# Tailwind CSS Class Issue Fix

## Vấn đề

Các Tailwind CSS classes như `pb-6`, `mb-6`, `my-6` không hoạt động trong các file tools.

## Nguyên nhân

Tailwind config thiếu content path cho thư mục `src/lib/` nên không scan được các file tools, dẫn đến các classes không được include trong CSS build.

## Giải pháp

Đã cập nhật `tailwind.config.ts`:

```typescript
// Trước
content: [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
],

// Sau
content: [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/lib/**/*.{js,ts,jsx,tsx,mdx}", // 👈 Thêm dòng này
],
```

## Cách test

1. Restart development server: `npm run dev`
2. Các classes sau giờ đây sẽ hoạt động:
   - `pb-6` (padding-bottom)
   - `mb-6` (margin-bottom)
   - `my-6` (margin top & bottom)
   - `pt-4` (padding-top)
   - `mt-2` (margin-top)
   - Tất cả Tailwind classes khác

## Các classes được test trong regex-tester:

- `pb-6 mb-2` trong heading "Flag Combinations & Conflicts"

## Lưu ý

Sau khi thay đổi Tailwind config, luôn restart development server để áp dụng thay đổi.
