# Viviliam APK Build Guide

This guide covers building both debug and release APKs for the Viviliam app.

---

## Project Setup Verification

Before building, ensure your project is properly configured:

```bash
# Check package.json webDir setting matches capacitor.config.json
# Both should use: "webDir": "www"

# Verify Capacitor Android plugin is installed
npm list @capacitor/android

# Check Android SDK location (Windows)
echo %ANDROID_HOME%
# Or check default path:
echo C:\Users\<username>\AppData\Local\Android\Sdk
```

---

## Quick Start - Debug APK

### Steps to Build Debug APK:

1. **Build Angular app:**
   ```bash
   npm run build
   ```

2. **Sync Capacitor Android:**
   ```bash
   npx cap sync android
   ```

3. **Navigate to Android directory:**
   ```bash
   cd android
   ```

4. **Clean Gradle cache (if previous builds failed):**
   ```bash
   ./gradlew clean
   ```

5. **Build debug APK:**
   ```bash
   ./gradlew assembleDebug
   ```

6. **Find APK:**
   - Main debug APK: `app/build/outputs/apk/debug/app-debug.apk`
   - Copy to `www/` folder for easy access: `viviliam-debug.apk`

### One-Command Debug Build (Recommended):

```bash
npm run build && npx cap sync android && cd android && ./gradlew clean && ./gradlew assembleDebug
```

---

## Release APK Build

Release APK is signed and ready for distribution.

### Steps:

1. **Ensure keystore exists:**
   ```bash
   ls ../viviliam-key.keystore
   # Or check build.gradle for keystorePath
   ```

2. **Build with production flags:**
   ```bash
   npm run android:release:apk
   ```

   This command does:
   - Builds with database prebuilt (`build:prebuilt-db`)
   - Builds Angular app with `--prod` flag
   - Syncs Capacitor Android
   - Runs Gradle clean and release build

3. **Find release APK:**
   - Location: `android/app/build/outputs/apk/release/app-release.apk`
   - Or check the build output directory

---

## Architecture-Specific APKs

Gradle builds create APKs for multiple architectures automatically:

- **arm64-v8a** (64-bit ARM - modern phones, ~39MB)
- **armeabi-v7a** (32-bit ARM - older phones, ~37MB)
- **x86** (Intel 32-bit - Android emulators, ~38MB)
- **x86_64** (Intel/AMD 64-bit - desktop emulators, ~39MB)

These are stored in:
```
android/app/build/outputs/apk/debug/
├── app-armeabi-v7a-debug.apk
├── app-arm64-v8a-debug.apk
├── app-x86-debug.apk
└── app-x86_64-debug.apk
```

For release builds, check `android/app/build/outputs/apk/release/`

---

## Common Build Errors & Fixes

### Error: "java.io.IOException: The filename, directory name, or volume label syntax is incorrect"

**Cause:** Windows path encoding issue with backslashes in Gradle files

**Fix:**
```bash
# Recreate local.properties with forward slashes
echo sdk.dir=C:/Users/viviliam/AppData/Local/Android/Sdk > android/local.properties
```

### Error: "android platform has not been added yet"

**Cause:** Capacitor Android plugin not synced

**Fix:**
```bash
npx cap sync android
```

### Error: Gradle build cache lock

**Fix:**
```bash
# Clear Gradle daemon and cache
cd android
rm -rf .gradle/daemon
rm -rf .gradle/caches
./gradlew clean
./gradlew assembleDebug
```

### Error: "SDK location not found"

**Cause:** Android SDK not at expected location

**Fix:**
1. Check your Android SDK path:
   ```bash
   echo %ANDROID_HOME%
   # or check default:
   C:\Users\<username>\AppData\Local\Android\Sdk
   ```

2. Update `android/local.properties`:
   ```bash
   echo sdk.dir=C:/Your/Actual/Android/Sdk/path > android/local.properties
   ```

---

## Build Commands Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Build Angular app to www/ |
| `npx cap sync android` | Sync Android platform with www/ contents |
| `cd android && ./gradlew clean` | Clean Gradle build |
| `cd android && ./gradlew assembleDebug` | Build debug APK |
| `npm run android:release:apk` | Build signed release APK |

---

## Testing Your APK

1. Transfer APK to Android device via USB/ADB/cloud storage
2. Enable "Install from unknown sources" on device
3. Open APK file and tap "Install"
4. Launch app and verify all features work correctly

---

## Release Build Checklist

Before creating a signed release build:

- [ ] Keystore file exists (`viviliam-key.keystore`)
- [ ] Keystore password and alias recorded securely
- [ ] App version in `package.json` is appropriate for release
- [ ] All features tested on multiple devices
- [ ] No debug logs or console statements in production code

---

## Notes

- **Debug builds** include debugging symbols and can be installed over previous versions
- **Release builds** are stripped of debug info and signed with your keystore
- Always test debug builds thoroughly before promoting to release
- Keep keystore files secure - you cannot update an app without the same signature
