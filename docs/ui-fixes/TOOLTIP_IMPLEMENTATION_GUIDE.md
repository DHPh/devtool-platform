# Tooltip Implementation Guide

## Overview

This guide explains how to implement tooltips across all tools in the DevTool Platform for better user experience and accessibility.

## Components

### 1. Tooltip Component (`/components/ui/tooltip.tsx`)

Basic Radix UI tooltip implementation with consistent styling.

### 2. Tooltip Helpers (`/components/ui/tooltip-helpers.tsx`)

Helper components and predefined tooltip content for common use cases.

## Implementation Examples

### Basic Tooltip Usage

```tsx
import {
  TooltipWrapper,
  ToolTooltipProvider,
} from "@/components/ui/tooltip-helpers";

export function MyTool() {
  return (
    <ToolTooltipProvider>
      <TooltipWrapper content="This button clears all inputs">
        <Button variant="outline">Clear All</Button>
      </TooltipWrapper>
    </ToolTooltipProvider>
  );
}
```

### Manual Tooltip Usage

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MyTool() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Clear All</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This button clears all inputs</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### Using Predefined Tooltips

```tsx
import {
  TooltipWrapper,
  commonTooltips,
} from "@/components/ui/tooltip-helpers";

<TooltipWrapper content={commonTooltips.clearAll}>
  <Button variant="outline">Clear All</Button>
</TooltipWrapper>;
```

## Best Practices

### 1. Wrap Tools with TooltipProvider

Always wrap your entire tool component with `ToolTooltipProvider` or `TooltipProvider`:

```tsx
export function MyTool() {
  return <ToolTooltipProvider>{/* Your tool content */}</ToolTooltipProvider>;
}
```

### 2. Use Consistent Tooltip Content

- Use predefined tooltips from `commonTooltips` when possible
- Keep tooltip text concise and descriptive
- Explain the action, not just repeat the button text

### 3. Apply Cursor Styles

Add `cursor-help` class to indicate interactive elements:

```tsx
<TooltipWrapper content="Explanation here">
  <div className="cursor-help">Hover for info</div>
</TooltipWrapper>
```

### 4. Tooltip for Form Elements

Apply tooltips to form labels and inputs:

```tsx
<TooltipWrapper content="Enter your regex pattern here">
  <Label htmlFor="pattern" className="cursor-help">
    Pattern
  </Label>
</TooltipWrapper>
```

## Tools to Update

### High Priority (Complex Tools)

- [x] Regex Tester - ✅ Completed
- [ ] JSON Formatter
- [ ] Data Explorer
- [ ] Markdown Preview
- [ ] Code Formatter (HTML, CSS, JS)

### Medium Priority (Data Tools)

- [ ] CSV Viewer
- [ ] XML Formatter
- [ ] YAML Validator
- [ ] SQL Formatter
- [ ] JSON Table Viewer

### Low Priority (Simple Tools)

- [ ] Base64 Encoder/Decoder
- [ ] URL Encoder/Decoder
- [ ] Hash Generator
- [ ] Text Case Converter
- [ ] Color Converter

## Implementation Checklist

For each tool, ensure:

- [ ] Wrap with `ToolTooltipProvider`
- [ ] Add tooltips to all buttons
- [ ] Add tooltips to form labels
- [ ] Add tooltips to complex UI elements
- [ ] Add tooltips to quick reference items
- [ ] Use `cursor-help` class for interactive elements
- [ ] Test tooltips in both light and dark mode
- [ ] Ensure tooltips don't interfere with functionality

## Example: Complete Tool Implementation

```tsx
import {
  TooltipWrapper,
  ToolTooltipProvider,
  commonTooltips,
} from "@/components/ui/tooltip-helpers";

export function ExampleTool() {
  return (
    <ToolTooltipProvider>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex gap-2">
          <TooltipWrapper content={commonTooltips.clearAll}>
            <Button variant="outline">Clear All</Button>
          </TooltipWrapper>
          <TooltipWrapper content={commonTooltips.loadSample}>
            <Button variant="outline">Load Sample</Button>
          </TooltipWrapper>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <TooltipWrapper content="Enter your input text here">
                <Label htmlFor="input" className="cursor-help">
                  Input Text
                </Label>
              </TooltipWrapper>
              <Textarea
                id="input"
                placeholder="Enter text..."
                className="textarea-enhanced"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <TooltipWrapper content="This is a helpful tip">
                <div className="cursor-help">
                  <code>example</code> - Description
                </div>
              </TooltipWrapper>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolTooltipProvider>
  );
}
```

## Benefits

1. **Better UX**: Users understand what each element does
2. **Accessibility**: Screen readers can access tooltip content
3. **Consistency**: Standardized tooltip behavior across all tools
4. **Learning**: Users can learn tool features without external docs
5. **Professionalism**: Polished, professional feel

## Notes

- Tooltips should enhance, not replace, good UI design
- Keep tooltip text under 100 characters when possible
- Test tooltips on touch devices for mobile compatibility
- Consider keyboard navigation for accessibility
- Use tooltips sparingly - only where they add value
