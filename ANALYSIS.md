# Project Analysis — viviliam (Ionic 8 / Angular 22 Mobile App)

Generated: 2026-11-17

---

## Executive Summary

The viviliam project is a Bible/life-events tracking mobile app built with Ionic 8 + Angular 22 + Capacitor 8. It uses @capacitor-community/sqlite for local storage and sql.js (WASM) for browser queries. The codebase has ~180+ files across pages, components, and services.

**Key health issues:**
- `app.component.ts` is a 2175-line "god component" violating single responsibility
- SQL injection vulnerabilities from string concatenation in queries
- ~40+ `any` typed properties — no type safety enforcement
- Dual provider registration (fixed — migrated to `src/app/app.config.ts`)
- Bundle size budgets are dangerously loose (1.1MB warning, 2MB error)

---

## Critical Issues (P0 — Fix Immediately)

### 1. God Component — `src/app/app.component.ts` (2175 lines)

This file handles dozens of unrelated responsibilities:
- Database connection & initialization
- Audio playback state + timers (chapter-by-chapter Bible audio, timespans)
- Dark mode toggling
- Bible book/category selection logic
- Font selection & settings persistence
- Verse highlighting/bookmarking
- Content sharing & clipboard operations
- Account deletion via API
- Network connectivity monitoring
- Reading position save/load
- Back button handling

**Recommended fix — split into dedicated services:**
```
src/app/services/
  audio-player.service.ts      # Audio playback, timers, wake lock, focus
  bible-data.service.ts         # Book/category selection, Bible list state
  reading.service.ts            # Save/load last position, verse highlights
  settings.service.ts           # Font, dark mode, display preferences
  account.service.ts            # Account deletion, auth operations
```

### 2. SQL Injection Vulnerabilities (40+ instances)

String concatenation used directly in SQL queries throughout `app.component.ts`:

```typescript
// DANGEROUS — string concatenation
qry = "update fonts set isset = '0' where language='" + this.authservice.defaultBibleLanguage + "'";
qry = "update config set value = '" + obj.currentTarget.value + "' where caption ='FONTSIZE'";
```

**Fix:** Use parameterized queries:
```typescript
// SAFE — parameterized queries (SQLite/Web API)
await this.db.run('UPDATE fonts SET isset = ? WHERE language = ?', ['0', lang]);
```

### 3. Type Safety — ~40+ `any` typed properties

```typescript
public fromid: any = '2';
public toid: any = '3';
public database: DatabaseConnection;
public networkConnectSubscription: any;
// ... 20+ more
```

**Fix:** Define proper interfaces:
```typescript
interface BibleBook { id: number; title: string; language: string; }
interface ReadingPosition { bookId: number; chapter: number; verse: number; }
interface FontSettings { fontSize: number; fontFamily: string; language: string; }
```

---

## High Priority Issues (P1)

### 4. Dual Provider Duplication — ~~`src/app/app.module.ts` + `src/main.ts`~~ ✅ FIXED

**Status: Resolved** — See `src/app/app.config.ts` (created). All providers consolidated into a single `ApplicationConfig`. Removed the NgModule fallback bootstrap from `main.ts`. `app.module.ts` is now a minimal shell.

### 5. setTimeout Anti-Pattern (15+ instances)

Used instead of RxJS timers or Angular's async pipe:

```typescript
setTimeout(() => { this.categoryRefreshed = true; }, 300);
setTimeout(() => this.loadLastReadingPosition(), 2000);  // retry logic
```

**Fix:** Replace with RxJS `timer`, `delay()`, or Angular Signals for reactive state:
```typescript
timer(300).pipe(tap(() => this.categoryRefreshed = true)).subscribe();
retryWhen(errors => errors.pipe(delay(2000), take(3)));
```

### 6. Bootstrap Pattern Complexity in `src/main.ts`

The try/catch dual bootstrap (standalone first, fallback to NgModule) is a migration trap:

```typescript
try {
  bootstrapApplication(AppComponent, {...}).catch((err) => {
    platformBrowserDynamic().bootstrapModule(AppModule, ...); // Fallback
  });
} catch (err) {
  platformBrowserDynamic().bootstrapModule(AppModule, ...);   // Another fallback
}
```

**Fix:** Pick one path. Go standalone fully — remove the NgModule fallback.

### 7. Bundle Size Budgets Are Too Large

```json
"maximumWarning": "1.1mb",   // warning at 1.1MB!
"maximumError": "2mb"         // error at 2MB!!
```

A mobile app shouldn't have a 2MB initial bundle budget. The `node --max_old_space_size=8192` scripts also hint at memory issues during build.

**Fix:** Tighten budgets to industry standards:
```json
"maximumWarning": "500kb",
"maximumError": "1mb"
```

Investigate what's bloating the bundle (likely sql.js WASM, ionicons SVGs, or prebuilt data files).

---

## Medium Priority Issues (P2)

### 8. Stale Cordova Reference in `ionic.config.json`

```json
"integrations": {
  "cordova": {},  // NO cordova dependencies exist in package.json
  "capacitor": {}
}
```

Remove the stale cordova entry — it confuses tooling and future contributors.

### 9. Dead Code Throughout `app.component.ts`

- `debugger;` statements on lines 577, 599 left in production code
- Commented-out implementation blocks still taking space
- Old imports that may no longer be needed

**Fix:** Remove all debugger statements and commented-out blocks before shipping.

### 10. Remaining ngModules Still Present

### 11. IonicConfig `innerHTMLTemplatesEnabled`

```typescript
IonicModule.forRoot({ innerHTMLTemplatesEnabled: true })
```

This is a legacy Ionic feature. Verify if it's still needed — newer versions use standard DOM templates. If not, remove it.

---

## Build & Deployment Issues

### 12. Prebuilt DB Build Script (`scripts/build-prebuilt-db.mjs`)

The script generates `.ts` data files (14.ts, 15.ts) that get bundled as assets. This is a reasonable approach for static content:
- Generated files in `src/assets/data/` are in version control — confirm intentional
- The exclusion pattern `ignore: ["data/[0-9]*.ts"]` prevents accidental double-bundling — good practice, but worth documenting

### 13. Gradle Build Paths Use Relative Paths (Windows-incompatible)

```json
"android:release:aab": "... cd android && gradlew clean && gradlew bundleRelease"
```

These won't work on Windows without `./` prefix or a `.bat`/`.ps1` wrapper. Consider cross-platform build tooling.

---

## Architecture Observations

### 14. Service Organization (Partial)

You have decent service separation already (`dark-mode.service.ts`, `database.service.ts`, `network.service.ts`, etc.), but most services' logic has been dumped into `app.component.ts`. Refactoring app.component will resolve this — the services should grow as app.component shrinks.

### 15. `app.config.ts` Created ✅

All application-level providers consolidated in a single file — removed from both the NgModule `providers` array and the unused export that lived side-by-side in `app.module.ts`.
    DeviceService, ScreenOrientationService,
    provideZoneChangeDetection(),
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(IonicModule.forRoot({}))
  ]
};
```

### 16. Routing Strategy

`app-routing.module.ts` has a `SelectivePreloadingStrategy` class that lazy-loads routes, only preloading 'startup' and 'home'. With ~35+ routes defined, this is reasonable for performance — but verify preload flags match current routing structure after migrations.

### 17. Audio Playback System

Chapter-by-chapter Bible audio with:
- Timespan JSON fetching
- Wake lock management (`wake-lock.service.ts`)
- Audio focus handling (`audio-focus.service.ts`)
- Timer-based progress tracking

This is complex stateful logic that should be extracted into its own service.

### 18. State Management via Shared Service

`AuthserviceProvider` used as a global state container with public properties. Consider Angular Signals or a proper store pattern for reactive state management.

---

## Testing & Quality

### 19. Minimal Test Coverage

Karma/Jasmine is configured with spec files, but given the complexity of `app.component.ts`, you need:
- Unit tests for each new service after refactoring
- E2E tests for critical flows (Bible reading, audio playback)
- Integration tests for SQLite data operations

### 20. ESLint Configuration

Full Angular ESLint suite is present but the complexity of `app.component.ts` likely causes linting issues. After splitting components, configure stricter lint rules.

---

## TypeScript Strict Mode

`tsconfig.app.json` has `"types": []` (empty) and no explicit `strict: true`. With TypeScript 6.x available:

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

This will force type annotations on all `any` properties and catch many bugs at compile time.

---

## Prioritized Action Plan

| Priority | Task | Effort | Risk |
|----------|------|--------|------|
| P0 | Remove debugger statements, fix SQL injection | 2-4h | Low |
| P0 | Define interfaces for all `any` properties | 3-5h | Low |
| ~~P1~~ | ~~Create app.config.ts, remove NgModule provider duplication~~ | ~~1d~~ | ~~Medium~~ ✅ DONE |
| P1 | Split audio playback logic into service | 2-3d | High |
| P1 | Split Bible data management into service | 2-3d | High |
| P2 | Complete standalone component migration | 1w | Medium |
| P2 | Tighten bundle budgets, investigate size | 1-2d | Low |
| P2 | Add unit tests for new services | 3-5d | Low |

---

## Technical Stack Reference

| Area | Technology |
|------|-----------|
| Framework | Ionic 8.x + Angular 22.x |
| Native Bridge | Capacitor 8.x (Android) |
| Local DB | @capacitor-community/sqlite (7.0.3) |
| Browser Queries | sql.js (1.15.2) WASM |
| Build System | @angular/build:application + esbuild |
| Testing | Karma + Jasmine |
| Linting | Angular ESLint (v8) |
| TypeScript | 6.x |
| Styling | SCSS + Ionic themes |
| Animation | @angular/platform-browser/animations + Swiper |
| Routing | Custom SelectivePreloadingStrategy |

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/app.component.ts` | Main app component (2175 lines, god component) |
| `src/app/app.module.ts` | Root NgModule with providers (legacy) |
| `src/main.ts` | Bootstrap entry point (dual mode) |
| `src/app/app-routing.module.ts` | Route definitions + preload strategy |
| `angular.json` | Build config, budgets, asset pipeline |
| `package.json` | Dependencies, build scripts |
| `ionic.config.json` | Ionic project config (stale cordova entry) |
| `tsconfig.app.json` | TypeScript app config (no strict mode) |
| `src/app/services/database.service.ts` | Database connection wrapper |
| `src/app/services/dark-mode.service.ts` | Dark mode toggle logic |
| `src/app/services/wake-lock.service.ts` | Screen wake lock management |
| `src/app/services/audio-focus.service.ts` | Audio focus handling |

---

## APK Build — 2026-11-17

**Status:** ✅ Successfully built debug APKs.

**Environment required:**
- Java JDK 21 (`C:\Program Files\Java\jdk-21.0.13.0.3`)
- Android SDK with API 36+ (at `C:\Users\viviliam\AppData\Local\Android\Sdk`)
- Gradle wrapper + Build-Tools 35

**Steps to build:**
```bash
# 1. Sync Capacitor
npx cap sync android

# 2. Build debug APK (from android/ directory)
cd android
./gradlew assembleDebug
```

**Output APKs** (`android/app/build/outputs/apk/debug/`):

| APK | Size | Target |
|-----|------|--------|
| `app-armeabi-v7a-debug.apk` | 38 MB | Older 32-bit phones |
| `app-arm64-v8a-debug.apk` | 39 MB | Modern 64-bit phones (recommended) |
| `app-x86-debug.apk` | 39 MB | 32-bit emulators |
| `app-x86_64-debug.apk` | 40 MB | 64-bit emulators |

**Install on device:**
```bash
adb install android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk
```

**Notes:**
- Project targets API 36 (`android/variables.gradle`: `compileSdkVersion = 36`, `targetSdkVersion = 36`)
- `local.properties` must contain: `sdk.dir=C:\Users\viviliam\AppData\Local\Android\Sdk`
- No signing required for debug APKs (side-load directly)
