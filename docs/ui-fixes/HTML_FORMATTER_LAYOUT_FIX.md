# HTML Formatter Layout Fix

## Issue Description

**Problem**: Trong HTML Formatter tool, khi có output và 2 nút Copy/Download xuất hiện, chúng làm lệch layout của textarea output section xuống dưới.

**Root Cause**: Layout shift xảy ra khi buttons được render conditionally trong `flex items-center justify-between` container, khiến height của container thay đổi và đẩy textarea xuống.

## Solution Applied

### Before (Problematic Layout)

```tsx
<div className="flex items-center justify-between">
  <Label>Formatted Output</Label>
  {output && (
    <div className="flex gap-2">
      <Button>Copy</Button>
      <Button>Download</Button>
    </div>
  )}
</div>
```

**Issue**: Khi `output` không có, chỉ có Label. Khi `output` có giá trị, buttons xuất hiện và có thể thay đổi height của container.

### After (Fixed Layout)

```tsx
<div className="flex items-center justify-between min-h-[2rem]">
  <Label>Formatted Output</Label>
  <div className="flex gap-2">
    {output && (
      <>
        <Button>Copy</Button>
        <Button>Download</Button>
      </>
    )}
  </div>
</div>
```

**Improvements**:

1. ✅ **Fixed height container**: `min-h-[2rem]` ensures consistent header height
2. ✅ **Always present button container**: `<div className="flex gap-2">` always exists
3. ✅ **Conditional buttons only**: Only buttons are conditional, not the container
4. ✅ **No layout shift**: Textarea position remains stable

## Technical Changes

### File Modified

- **Path**: `src/lib/tools/html-formatter.tsx`
- **Lines**: ~300-320 (Output section header)

### Code Changes

```diff
- <div className="flex items-center justify-between">
+ <div className="flex items-center justify-between min-h-[2rem]">
    <Label>Formatted Output</Label>
-   {output && (
      <div className="flex gap-2">
+       {output && (
+         <>
          <Button>Copy</Button>
          <Button>Download</Button>
+         </>
+       )}
      </div>
-   )}
  </div>
```

## Verification

### ✅ Before Fix Issues

- Layout shift when output appears
- Textarea "jumps" down when buttons render
- Inconsistent header height
- Poor user experience

### ✅ After Fix Benefits

- Stable layout regardless of output state
- Consistent header height (2rem minimum)
- Smooth user experience
- Professional appearance

## Other Tools Analysis

### ✅ Tools Checked

1. **JSON Formatter** - Uses different layout pattern, no issues
2. **CSS Formatter** - Uses separate Card for output, no layout shift
3. **HTML Formatter** - ✅ Fixed with this change

### 📋 Recommended Pattern

For future tools with conditional action buttons:

```tsx
// ✅ Good: Fixed height container with conditional content
<div className="flex items-center justify-between min-h-[2rem]">
  <Label>Output Label</Label>
  <div className="flex gap-2">
    {hasOutput && (
      <>
        <Button>Action 1</Button>
        <Button>Action 2</Button>
      </>
    )}
  </div>
</div>

// ❌ Avoid: Conditional containers
<div className="flex items-center justify-between">
  <Label>Output Label</Label>
  {hasOutput && (
    <div className="flex gap-2">
      <Button>Action 1</Button>
      <Button>Action 2</Button>
    </div>
  )}
</div>
```

## Related Improvements

### Future Enhancements

1. **Consistent button placement** across all formatter tools
2. **Unified layout patterns** for better UX
3. **Responsive button behavior** on mobile devices
4. **Keyboard shortcuts** for copy/download actions

### CSS Utilities

Consider adding utility classes for consistent layouts:

```css
.tool-header {
  @apply flex items-center justify-between min-h-[2rem];
}

.tool-actions {
  @apply flex gap-2;
}
```

---

**Status**: ✅ **Fixed** - HTML Formatter no longer has layout shift issues
**Impact**: Better user experience, more professional appearance
**Pattern**: Can be applied to other tools with similar conditional UI elements
