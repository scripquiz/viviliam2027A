# Dark Mode Implementation - Quick Start Guide

## What's New? 🌙

Your Viviliam Bible app now has a **comprehensive 3-tier dark mode system**:

1. **🌍 Global Dark Mode** - Makes the entire app dark (new!)
2. **📖 Reading Dark Mode** - Independent dark mode for Bible reading (enhanced)
3. **🔄 Compare Dark Mode** - Independent dark mode for comparison view (enhanced)

## How to Use

### For Users

#### Accessing Dark Mode Toggles

**On Read Page:**

1. Tap the menu icon (⋮) in the top-right
2. You'll see two dark mode options:
   - **Dark Theme** 🌙 - Toggles entire app
   - **Reading Dark** 🌙 - Toggles just the reading view

**On Compare Page:**

1. Tap the menu icon (⋮) in the top-right
2. You'll see two dark mode options:
   - **Dark Theme** 🌙 - Toggles entire app
   - **Compare Dark** 🌙 - Toggles just the comparison view

#### Behavior

- **Global Dark Mode ON** → Everything is dark
- **Global Dark Mode OFF + Reading Dark ON** → Only reading page is dark
- **Both ON** → Reading page uses reading-specific dark colors (if different)

### For Developers

#### Quick Implementation Checklist

✅ **Created Files:**

- `src/app/services/dark-mode.service.ts` - Centralized service

✅ **Updated Files:**

- `src/theme/variables.scss` - CSS variables for themes
- `src/global.scss` - Global dark mode styles
- `src/index.html` - Meta tag support
- `src/app/app.component.ts` - Service integration
- `src/app/app.component.html` - UI toggles
- `src/app/read/read.page.ts` - Service integration
- `src/app/compare/compare.page.ts` - Service integration

#### Key Features Implemented

1. **Centralized State Management**

   - Observable-based reactive updates
   - LocalStorage persistence
   - System preference detection

2. **StatusBar Synchronization**

   - Auto-updates based on current page and mode
   - Smooth transitions between pages

3. **CSS Variables System**

   - Unified theming with CSS custom properties
   - Easy to customize and maintain

4. **Smooth Transitions**
   - 0.3s ease animations
   - No flickering or jarring changes

## Testing

### Quick Test Steps

1. **Test Global Dark Mode:**

   ```
   ✓ Enable global dark mode from Read page menu
   ✓ Navigate to Home, More, Settings - all should be dark
   ✓ Disable global dark mode - all should be light
   ```

2. **Test Reading Dark Mode:**

   ```
   ✓ Disable global dark mode
   ✓ Enable Reading Dark mode
   ✓ Only Read page should be dark
   ✓ Navigate to Home - should be light
   ```

3. **Test Compare Dark Mode:**

   ```
   ✓ Disable global dark mode
   ✓ Enable Compare Dark mode
   ✓ Only Compare page should be dark
   ✓ Navigate to Home - should be light
   ```

4. **Test StatusBar:**

   ```
   ✓ Enable dark mode - StatusBar should be dark (#1a1a1a)
   ✓ Disable dark mode - StatusBar should be light (#FFFFFF)
   ✓ Navigate between pages - StatusBar should update
   ```

5. **Test Persistence:**
   ```
   ✓ Toggle dark modes
   ✓ Close app completely
   ✓ Reopen app
   ✓ Settings should be preserved
   ```

## Build & Run

```powershell
# No additional dependencies needed
# Simply build and run as usual

# For development
npm start

# For production build
npm run build

# For Android
ionic capacitor run android

# For iOS
ionic capacitor run ios
```

## Common Issues & Solutions

### Issue: Dark mode not applying

**Solution:**

- Hard refresh the app
- Check browser/app cache
- Verify CSS variables are loaded

### Issue: StatusBar not updating

**Solution:**

- Ensure running on actual device/emulator
- Check Capacitor StatusBar plugin is installed
- Verify platform is 'capacitor' (not web)

### Issue: Settings not persisting

**Solution:**

- Check localStorage is available
- Clear app data and retry
- Verify DarkModeService is properly injected

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         DarkModeService                 │
│  (Central State Management)             │
│                                         │
│  • darkModeState$ (Observable)          │
│  • toggleGlobalDarkMode()               │
│  • toggleReadDarkMode()                 │
│  • toggleCompareDarkMode()              │
│  • updateStatusBar()                    │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐     ┌────▼─────┐
    │   Read   │     │ Compare  │
    │   Page   │     │   Page   │
    │          │     │          │
    │ • Subscribe    │ • Subscribe    │
    │ • Apply styles │ • Apply styles │
    └──────────┘     └──────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  AppComponent   │
         │                 │
         │ • UI Toggles    │
         │ • StatusBar sync│
         └─────────────────┘
```

## Next Steps

1. ✅ Implementation complete
2. ⏳ Test on physical devices (iOS & Android)
3. ⏳ Gather user feedback
4. ⏳ Consider future enhancements:
   - Auto dark mode schedule
   - Multiple dark themes
   - Blue light filter

## Resources

- Full Documentation: `DARK_MODE_IMPLEMENTATION.md`
- Service Code: `src/app/services/dark-mode.service.ts`
- CSS Variables: `src/theme/variables.scss`

---

**Ready to test!** 🚀

Try toggling dark modes and see the magic happen! ✨
