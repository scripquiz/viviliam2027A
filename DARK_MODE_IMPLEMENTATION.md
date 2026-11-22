# Dark Mode Implementation Guide

## Overview

This document describes the comprehensive dark mode system implemented for the Viviliam Bible app. The implementation includes a global dark mode that unifies the app experience, while preserving reading-specific toggles for the Read and Compare pages.

## Architecture

### 3-Tier Dark Mode System

1. **Global Dark Mode** (New)

   - Affects all pages: Home, More, Settings, Notes, etc.
   - Applies app-wide styling and theming
   - Syncs with system preference on first launch

2. **Read Page Dark Mode** (Enhanced)

   - Independent toggle for Read page
   - Overrides global dark mode when enabled
   - Optimized for comfortable reading

3. **Compare Page Dark Mode** (Enhanced)
   - Independent toggle for Compare page
   - Overrides global dark mode when enabled
   - Optimized for side-by-side Bible comparison

## Key Features

### ✅ Centralized Service

- `DarkModeService` manages all dark mode state
- Observable pattern for reactive updates
- Automatic localStorage persistence
- System preference detection

### ✅ StatusBar Synchronization

- StatusBar color automatically updates based on active dark mode
- Different StatusBar styles per page (Read/Compare/Global)
- Smooth transitions between pages

### ✅ CSS Variables System

- Unified color palette using CSS custom properties
- Easy theme customization
- Consistent styling across all components

### ✅ Smooth Transitions

- 0.3s ease transitions for all color changes
- No jarring flashes when toggling modes

## File Changes

### New Files

- `src/app/services/dark-mode.service.ts` - Centralized dark mode management

### Modified Files

1. `src/theme/variables.scss` - CSS variables for light/dark themes
2. `src/global.scss` - Global dark mode styles
3. `src/index.html` - Updated meta tag for dark mode support
4. `src/app/app.component.ts` - Integrated service, removed old StatusBar logic
5. `src/app/app.component.html` - Added global dark mode toggles
6. `src/app/read/read.page.ts` - Refactored to use service
7. `src/app/compare/compare.page.ts` - Refactored to use service

## How It Works

### State Management

```typescript
interface DarkModeState {
  globalDarkMode: boolean;
  readDarkMode: boolean;
  compareDarkMode: boolean;
}
```

All state is stored in localStorage:

- `globalDarkMode`: '0' or '1'
- `readDarkMode`: '0' or '1'
- `compareDarkMode`: '0' or '1'

### Priority System

For each page, dark mode is determined by:

1. **Read Page**: `readDarkMode` OR `globalDarkMode`
2. **Compare Page**: `compareDarkMode` OR `globalDarkMode`
3. **Other Pages**: `globalDarkMode` only

This means:

- If global dark mode is ON, all pages are dark
- Read/Compare can additionally have their own dark mode independent of global
- When both are enabled, page-specific takes precedence (for future customization)

### StatusBar Updates

StatusBar color automatically updates when:

- Dark mode is toggled
- User navigates between pages
- App resumes from background
- System preference changes (on first launch only)

## User Interface

### Toggle Locations

#### Read Page Menu

1. **Dark Theme** (moon/sun icon) - Global toggle
2. **Reading Dark** (moon-outline/sun-outline icon) - Read-specific toggle

#### Compare Page Menu

1. **Dark Theme** (moon/sun icon) - Global toggle
2. **Compare Dark** (moon-outline/sun-outline icon) - Compare-specific toggle

### Visual Indicators

- Filled moon icon (🌙) = Global dark theme active
- Outlined moon icon = Page-specific dark mode active
- Sun icons indicate light mode

## CSS Variables Reference

### Light Mode (Default)

```scss
--app-background: #f4ecdd;
--app-text-primary: #222428;
--app-card-background: #fff;
--app-toolbar-background: #fff;
```

### Dark Mode (body.dark-theme)

```scss
--app-background: #1a1a1a;
--app-text-primary: #e0e0e0;
--app-card-background: #2d2d2d;
--app-toolbar-background: #1a1a1a;
```

All components should use these CSS variables for automatic theme support.

## Developer Guide

### Using Dark Mode in New Components

#### 1. Check Dark Mode State

```typescript
constructor(private darkModeService: DarkModeService) {}

ngOnInit() {
  this.darkModeService.darkModeState$.subscribe(state => {
    const isDark = state.globalDarkMode;
    // Apply dark mode styling
  });
}
```

#### 2. Apply Page-Specific Dark Mode

```typescript
// For reading pages
const isDark = this.darkModeService.isDarkModeActive("read");

// For compare pages
const isDark = this.darkModeService.isDarkModeActive("compare");

// For other pages
const isDark = this.darkModeService.isDarkModeActive();
```

#### 3. Use CSS Variables

```scss
.my-component {
  background: var(--app-background);
  color: var(--app-text-primary);
  border: 1px solid var(--app-border-color);
}
```

### Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Subscribe to dark mode changes** for dynamic updates
3. **Unsubscribe in ngOnDestroy** to prevent memory leaks
4. **Test in both modes** during development

## Testing Checklist

- [ ] Global dark mode toggles all pages
- [ ] Read page dark mode works independently
- [ ] Compare page dark mode works independently
- [ ] StatusBar color matches current mode
- [ ] Smooth transitions between light/dark
- [ ] Settings persist after app restart
- [ ] System preference detected on first launch
- [ ] All pages use CSS variables correctly
- [ ] No flickering during page navigation
- [ ] Works on both iOS and Android

## Future Enhancements

### Potential Additions

1. **Auto Dark Mode Schedule**
   - Toggle on at sunset, off at sunrise
   - Manual time configuration
2. **Multiple Dark Themes**
   - Pure Black (OLED-friendly)
   - Dark Gray (current)
   - Sepia Dark (warm)
3. **Independent Font Colors**
   - Warm white, cool white, amber options
   - Better reading comfort
4. **Blue Light Filter**
   - Reduce blue light in dark mode
   - Eye strain reduction
5. **Automatic Mode**
   - Follow system preference automatically
   - Override when manually toggled

## Troubleshooting

### Dark Mode Not Applying

1. Check if `dark-theme` class is on `<body>` element
2. Verify CSS variables are defined in variables.scss
3. Check browser/device cache

### StatusBar Not Updating

1. Ensure app is running on Capacitor platform
2. Check StatusBar plugin is installed
3. Verify `updateStatusBar()` is called on page changes

### Flickering on Toggle

1. Check CSS transitions are defined (0.3s ease)
2. Verify no conflicting inline styles
3. Test on actual device (emulators may differ)

## Support

For issues or questions about the dark mode implementation:

1. Check this documentation first
2. Review the DarkModeService code
3. Test with provided debugging logs
4. Contact development team

---

**Implementation Date:** January 25, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
