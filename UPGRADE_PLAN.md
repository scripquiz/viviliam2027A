# App Upgrade Plan

## 1. Establish a baseline

- Commit or back up current changes before upgrading.
- Keep the repaired Angular 20 test baseline green before upgrading.
- Review the 47 dependency vulnerabilities reported by npm: 1 low, 33 moderate,
  11 high, and 2 critical. Assess fixes and potential breaking changes before
  applying them.
- Re-run the build and tests and record the results before each upgrade.

### Verified baseline (2026-11-16)

- Production build: passed.
- ChromeHeadless tests: **46 passed, 0 failed**. The previously reported
  29 failures were reproduced before repairs.
- Changed test files and the test helper pass ESLint using the existing legacy
  configuration (`ESLINT_USE_FLAT_CONFIG=false`). The root component still has
  13 `prefer-inject` errors and one lifecycle-interface warning; the same counts
  were verified against its pre-change version.
- Angular and dependency versions were not changed.

The repairs import standalone components instead of declaring them and provide
the HTTP, routing, and application dependencies required by page tests.
[PageTestingModule](src/testing/page-testing.module.ts) scopes database,
network, orientation, and dark-mode substitutes to component tests; service
unit tests continue to exercise their own implementations. Account tests flush
their HTTP response, startup tests stub navigation, and native initialization
is isolated from component-creation checks.

Testing also exposed an unused Capacitor Clipboard constructor injection in
the root component. It was removed; existing direct `Clipboard.write` calls
are unchanged.

Run these commands from the repository root in PowerShell:

```powershell
node --max_old_space_size=8192 .\node_modules\@angular\cli\bin\ng build --configuration production --progress=false
node --max_old_space_size=8192 .\node_modules\@angular\cli\bin\ng test --watch=false --browsers=ChromeHeadless --progress=false
```

Calling Node directly avoids the argument-forwarding problem observed with
the local npm PowerShell wrapper, which dropped the single-run options.

Remaining warnings include unsupported older Browserslist targets and
test-browser font/URL, modal-trigger, and Swiper layout warnings. Passing unit
tests do not replace Android device testing.

### Dependency audit

`npm audit` on 2026-11-15 reported 47 affected package entries: 2 critical,
11 high, 33 moderate, and 1 low. These counts include both direct and transitive
dependencies and do not imply that every advisory is exploitable in this app.
The results can change; run `npm audit` for current advisory details and fixes.

**Critical**

- `swiper` (direct): [prototype pollution](https://github.com/advisories/GHSA-hmx5-qpq5-p643).
- `tar` (transitive): multiple issues, including [file read/write via archive extraction](https://github.com/advisories/GHSA-83g3-92jg-28cx).

**High**

- `@angular/cli` (direct)
- `@angular/common` (direct)
- `@angular/compiler` (direct)
- `@angular/core` (direct)
- `@angular/router` (direct)
- `@capacitor/assets` (direct)
- `@capacitor/cli` (transitive vulnerable instance)
- `@modelcontextprotocol/sdk` (transitive)
- `pacote` (transitive)
- `sharp` (transitive)
- `zod` (transitive)

**Moderate**

- `@angular-devkit/build-angular` (direct)
- `@angular-devkit/build-webpack` (transitive)
- `@angular/animations` (direct)
- `@angular/compiler-cli` (direct)
- `@angular/forms` (direct)
- `@angular/platform-browser` (direct)
- `@angular/platform-browser-dynamic` (direct)
- `@hono/node-server` (transitive)
- `@npmcli/package-json` (transitive)
- `@npmcli/run-script` (transitive)
- `@sigstore/sign` (transitive)
- `@sigstore/tuf` (transitive)
- `@trapezedev/project` (transitive)
- `@tufjs/models` (transitive)
- `@typescript-eslint/eslint-plugin` (direct)
- `@typescript-eslint/parser` (direct)
- `@typescript-eslint/type-utils` (transitive)
- `@typescript-eslint/typescript-estree` (transitive)
- `@typescript-eslint/utils` (direct)
- `cacache` (transitive)
- `glob` (transitive)
- `ignore-walk` (transitive)
- `make-fetch-happen` (transitive)
- `minimatch` (transitive)
- `npm-packlist` (transitive)
- `npm-registry-fetch` (transitive)
- `rimraf` (transitive)
- `sigstore` (transitive)
- `sockjs` (transitive)
- `tuf-js` (transitive)
- `uuid` (transitive)
- `webpack-dev-server` (transitive)
- `xcode` (transitive)

**Low**

- `@babel/core` (transitive)

## 2. Upgrade Angular incrementally

- [x] Upgrade Angular 20 to 21, including compatible Angular tooling.
- [x] Build and run the test suite before proceeding.
- [x] Upgrade Angular 21 to 22, including TypeScript 6 and migration away from
  the deprecated `baseUrl` configuration.
- [x] Build and test again.

### Angular 20 to 21 (2026-11-16)

- Angular framework and compiler: `21.2.26`.
- Angular CLI and build tooling: `21.2.30`.
- Angular ESLint tooling: `21.4.0`.
- TypeScript: `5.9.3`, within Angular 21's supported range.
- Applied the Angular CLI/core migrations, including bootstrap option updates
  and conversion of legacy template control flow to block syntax.
- Production build passed; ChromeHeadless tests passed (**46 passed, 0 failed**).
- Full `ng lint` still reports 367 problems (359 errors, 8 warnings); broader
  lint cleanup is outside this upgrade step.

### Angular 21 to 22 (2026-11-16)

- Angular framework and compiler: `22.2.6`.
- Angular CLI and build tooling: `22.2.7`.
- Angular ESLint tooling: `22.7.0`.
- TypeScript: `6.0.3`.
- Applied the Angular CLI/core migrations: `ChangeDetectionStrategy.Eager` was
  added to all components to retain the pre-v22 default change detection,
  `withXhr()` was added to `provideHttpClient` call sites, and
  `istanbul-lib-instrument` was added for Karma coverage. The optional Vitest
  and application-builder migrations were skipped; the project already uses the
  `@angular/build:application` and `@angular/build:karma` builders.
- Removed the deprecated `baseUrl` from `tsconfig.json` and replaced it with an
  equivalent `paths` mapping (`"src/*"`), which TypeScript resolves relative to
  the tsconfig location. The stale `ignoreDeprecations: "5.0"` setting was also
  removed because TypeScript 6 rejects it.
- Removed the `extendedDiagnostics` suppressions that the v22 migration added
  to `tsconfig.app.json` and `tsconfig.spec.json`; they fail the build
  (`NG4003`) while `strictTemplates` is disabled and have no effect without it.
- Converted ESLint to flat config: Angular ESLint 22 dropped support for the
  legacy `.eslintrc.json` format, so the configuration was rewritten as
  `eslint.config.js` with the same rule set (Angular recommended plus the
  existing selector and class-suffix rules), and the `angular-eslint` and
  `typescript-eslint` meta packages were installed. `ng lint` no longer needs
  `ESLINT_USE_FLAT_CONFIG=false`.
- Production build passed; ChromeHeadless tests passed (**46 passed, 0 failed**).
- Full `ng lint` now reports 404 problems (395 errors, 9 warnings). The
  increase over the Angular 21 count comes from the v22-recommended
  `prefer-on-push-component-change-detection` rule flagging the migration-added
  `ChangeDetectionStrategy.Eager` opt-outs; moving the app to `OnPush` and the
  broader lint cleanup remain outside this upgrade step.

## 3. Upgrade Android separately

- Verify Capacitor and plugin compatibility with the Android Gradle Plugin
  version required for API 37.
- Install the Android 37 SDK and update the build tools as needed.
- Review Android 17 behavior changes, then test before changing the target API.
- Build and test the Android app.

## 4. Validate before release

- Test login, database import, reading, audio, downloads, and navigation on
  Android devices or emulators.
- Build and verify a release package before publishing.
