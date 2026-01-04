# DevTool Platform - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

A comprehensive DevTool Platform built with Next.js 15, featuring 22 production-ready developer tools in a microfrontend architecture. Each tool is an independent module with shared UI patterns and state management.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript 5
- **UI Library**: Tailwind CSS + Shadcn UI (Radix primitives)
- **State Management**: Zustand with persistence middleware
- **Icons**: Lucide React
- **Notifications**: Sonner toast library
- **Build**: Turbopack for fast development

## Critical Architecture Patterns

### Tool Registry System

Tools are managed via a centralized registry pattern:

- `src/lib/tool-registry.ts` - Metadata registry with categories and types
- `src/lib/tool-classification.ts` - Type system for tools (GENERATOR, VALIDATOR, etc.)
- `src/app/tools/[slug]/page.tsx` - Dynamic routing with component mapping

### Tool Development Pattern

Each tool follows this structure:

```typescript
// 1. Create tool component in src/lib/tools/my-tool.tsx
export function MyTool() {
  const [input, setInput] = useState("");
  // Tool logic here...
  return (
    <div>
      <ToolHeader title="My Tool" description="..." />
      {/* Tool UI */}
    </div>
  );
}

// 2. Add to TOOL_COMPONENTS mapping in src/app/tools/[slug]/page.tsx
const TOOL_COMPONENTS = {
  "my-tool": MyTool,
  // ...existing tools
};

// 3. Register metadata in src/lib/tool-registry.ts
{
  id: "my-tool",
  name: "My Tool",
  description: "...",
  category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
  type: TOOL_TYPES.CONVERTER,
  tags: ["tag1", "tag2"],
  path: "/tools/my-tool",
}
```

### Component Patterns

- **ToolFrame**: Universal wrapper providing breadcrumbs, bookmarks, share functionality
- **Layout Components**: Use `ToolHeader`, `QuickActions`, `ResultCard`, `CopyableResult` from `@/components/layout`
- **State**: Zustand stores in `src/store/` with localStorage persistence

### Key Development Commands

```bash
npm run dev          # Start with Turbopack (fast HMR)
npm run build        # Production build
npm run lint         # ESLint check
node scripts/production-checker.js  # Check for placeholder values
```

## File Organization Rules

- **Tools**: `src/lib/tools/[tool-name].tsx` or `src/lib/tools/[tool-name]/index.tsx` for complex tools
- **Components**: Reusable UI in `src/components/`, tool-specific in tool directory
- **Utils**: Shared utilities in `src/lib/utils.ts`
- **Documentation**: Organized by feature in `docs/` with implementation summaries

## Production Considerations

- All tools use client-side processing (no server dependencies)
- Static generation with `generateStaticParams()` for tool pages
- SEO optimization with dynamic metadata generation
- Mobile-first responsive design
- Error boundaries and loading states required
