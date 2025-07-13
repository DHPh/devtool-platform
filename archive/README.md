# Archive - Unused/Legacy Files

This folder contains archived versions of files that were consolidated, replaced, or are no longer used during the project cleanup.

## Archived Files

### Tool Registry Files

#### `tool-registry-new.ts`

- **Purpose**: Enhanced development version with additional helper functions
- **Archived on**: 2025-07-11
- **Reason**: Consolidated into main `tool-registry.ts` to eliminate duplication
- **Key features**: Additional helper functions and analytics (now merged into main registry)

#### `tool-registry-backup.ts`

- **Purpose**: Legacy backup with old interface structure
- **Archived on**: 2025-07-11
- **Reason**: Contains outdated interface with `functionalType` and `contentType`
- **Key features**: Legacy category structure and simpler tool entries

### Page Components

#### `page-new.tsx`

- **Purpose**: Experimental homepage version with enhanced features
- **Archived on**: 2025-07-11
- **Reason**: Features merged into main `page.tsx`, redundant file
- **Key features**: Enhanced SEO metadata, feature sections

#### `page-ssr.tsx`

- **Purpose**: Server-side rendering experiment for homepage
- **Archived on**: 2025-07-11
- **Reason**: Duplicate functionality, main `page.tsx` already uses SSR
- **Key features**: Same as page-new.tsx but with SSR focus

## Migration Summary

All functionality from these files has been preserved in the active codebase:

### Tool Registry Migration:

- ✅ Enhanced metadata structure → `src/lib/tool-registry.ts`
- ✅ Helper functions → `src/lib/tool-registry.ts`
- ✅ Analytics and statistics → `src/lib/tool-registry.ts`
- ✅ Legacy compatibility → `src/lib/tool-registry.ts`
- ✅ All imports updated to single registry

### Page Component Migration:

- ✅ Enhanced features → `src/app/page.tsx`
- ✅ SEO improvements → `src/app/page.tsx`
- ✅ SSR functionality → Already in Next.js App Router
- ✅ No breaking changes

## Current Active Files

Use these files as the single source of truth:

- **Tool Registry**: `src/lib/tool-registry.ts`
- **Homepage**: `src/app/page.tsx`
- **Tool Classification**: `src/lib/tool-classification.ts`
- **Tool Builder**: `src/lib/tool-builder.ts`

## Archive Benefits

- 🧹 **Cleaner codebase**: No duplicate or unused files
- 📖 **Single source of truth**: Clear which files to use
- 🚀 **Better maintainability**: Less confusion for developers
- 📝 **Preserved history**: Legacy files available for reference
- ✅ **Zero breaking changes**: All functionality preserved
