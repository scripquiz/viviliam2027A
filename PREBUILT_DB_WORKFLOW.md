# Prebuilt DB Workflow (JSON Source of Truth)

This project now supports a prebuilt SQLite database for faster first-time install while keeping JSON files as the editing source.

## Source of Truth

- Keep editing content in `src/assets/data/*.ts` JSON files.
- Do not edit `src/assets/databases/viviliamSQLite.db` manually.

## Build Prebuilt DB

Run:

```bash
npm run build:prebuilt-db
```

This generates:

- `src/assets/databases/viviliamSQLite.db`

## App Build

For a normal web/app build:

```bash
npm run build
```

To regenerate prebuilt DB and then build in one command:

```bash
npm run build:with-db
```

## Runtime Behavior

- On first DB initialization, the app tries to copy prebuilt DB from app assets.
- If copy fails for any reason, app falls back to the runtime import path.

## Recommended Release Checklist

1. Update JSON data files.
2. Run `npm run build:prebuilt-db`.
3. Run tests/build.
4. Build Android/iOS artifacts.
5. Verify first install speed on at least one mid-range Android device.
