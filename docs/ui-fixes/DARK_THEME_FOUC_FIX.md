# Dark Theme FOUC Fix Documentation

## Problem

Flash of Unstyled Content (FOUC) occurs when the page loads with light theme briefly before switching to dark theme, causing a jarring visual experience for users who have selected dark mode.

## Solution Implementation

### 1. Blocking Script in Layout Head

A synchronous script in the `<head>` section that:

- Reads theme preference from localStorage before page render
- Applies theme classes immediately to `document.documentElement`
- Sets `data-theme-applied` attribute to prevent duplicate theme application
- Handles both direct theme selections and system preference

### 2. CSS Visibility Control

Added CSS rules to:

- Hide body content until theme is applied (`html:not([data-theme-applied]) body { visibility: hidden; }`)
- Show content once theme flag is set (`html[data-theme-applied] body { visibility: visible; }`)
- Add smooth transitions for theme switching

### 3. Theme Toggle Component Optimization

Updated ThemeToggle component to:

- Check if theme was already applied by blocking script
- Avoid conflicting theme applications
- Maintain proper theme state synchronization

## Technical Details

### Files Modified

1. `src/app/layout.tsx` - Added blocking script in head
2. `src/app/globals.css` - Added FOUC prevention CSS
3. `src/components/theme-toggle.tsx` - Optimized theme application logic

### Script Execution Flow

1. Script runs immediately when parsing HTML head
2. Reads theme from Zustand persist storage format
3. Applies appropriate theme class (`light`/`dark`) to `html` element
4. Sets `data-theme-applied="true"` flag
5. CSS makes body visible once flag is set

### Error Handling

- Fallback to system preference on localStorage read errors
- Graceful degradation if Zustand storage format changes
- Maintains functionality even without JavaScript

## Testing

To verify the fix:

1. Set theme to dark mode
2. Reload the page multiple times
3. Observe no flash of light content
4. Test with different theme options (light, dark, system)
5. Test with disabled JavaScript (should fallback to system)

## Performance Impact

- Minimal: ~200 bytes of inline JavaScript
- Executes synchronously but before DOM creation
- No additional network requests
- No hydration conflicts

## Browser Compatibility

- Works in all modern browsers
- Graceful fallback for older browsers
- Uses standard web APIs (localStorage, matchMedia)

## Future Considerations

- Monitor for any hydration mismatches
- Consider prefers-color-scheme changes during session
- Ensure compatibility with future Zustand versions
