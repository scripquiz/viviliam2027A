# 📱 Viviliam APK Build - Quick Start Guide

## ⚡ Fastest Way to Build an APK (for Testing)

### Windows Command Line Steps

1. **Build the web app and sync with Android:**
```bash
cd F:\Projects\viviliam2027A
npm run build
npx cap sync android
```

2. **Configure Android SDK path (if not already set):**
```bash
# Create local.properties if it doesn't exist
echo sdk.dir=C:/Users/viviliam/AppData/Local/Android/Sdk > android/local.properties
```

3. **Build the debug APK:**
```bash
cd android
set ANDROID_HOME=C:\Users\viviliam\AppData\Local\Android\Sdk && ./gradlew assembleDebug --quiet
```

4. **APK is ready at:**
```
android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk
```

---

## 🚀 Production Build (for Distribution)

### Single Command (if you have a signed keystore):
```bash
cd F:\Projects\viviliam2027A\android
set ANDROID_HOME=C:\Users\viviliam\AppData\Local\Android\Sdk && ./gradlew assembleRelease --quiet
```

**Output APK:** `app-release.apk`

### For Google Play Store (create .aab bundle):
```bash
./gradlew bundleRelease --quiet
# Output: app-release.aab in android/app/build/outputs/bundle/release/
```

---

## 📂 Where to Find Your APKs

| Build Type | Location | File Name | Use Case |
|------------|----------|-----------|----------|
| Debug | `android/app/build/outputs/apk/debug/` | `app-arm64-v8a-debug.apk` | Testing on devices |
| Release (Signed) | `android/app/build/outputs/apk/release/` | `app-release.apk` | Distribution to users |
| Universal | Same as above | `app-universal.apk` | All architectures in one file |
| Google Play Bundle | `android/app/build/outputs/bundle/release/` | `app-release.aab` | Upload to Play Store |

---

## 📤 Transferring APK to Your Phone

### Method 1: USB Transfer (No ADB)
1. Connect Android phone via USB
2. Copy APK from PC to phone's Downloads folder
3. Open file manager → Downloads → tap APK → Install

### Method 2: Google Drive / Cloud Storage
1. Upload `app-arm64-v8a-debug.apk` to Google Drive
2. Open the file on your Android phone
3. Tap "Install" from notification or Drive app

### Method 3: ADB (Advanced Testing)
```bash
adb push viviliam-debug.apk /sdcard/Download/
adb install -r /sdcard/Download/viviliam-debug.apk
```

---

## ⚙️ If Build Fails

### "SDK location not found"
**Fix:** Create or edit `android/local.properties`:
```bash
echo sdk.dir=C:/Users/viviliam/AppData/Local/Android/Sdk > android/local.properties
```

### Build Errors in Gradle
- Run full build with more output: `./gradlew assembleDebug`
- Check `build/reports/problems/problems-report.html` for issues

---

## ✅ Quick Verification Commands

```bash
# Verify APK is valid (Windows)
powershell.exe -Command "& {if (Test-Path 'F:\Projects\viviliam2027A\android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk') { Write-Host 'APK exists' } else { Write-Host 'APK not found' }}"

# Check APK size
dir "F:\Projects\viviliam2027A\android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk" | Select-Object Name,Length

# List all available APK architectures
Get-ChildItem "F:\Projects\viviliam2027A\android\app\build\outputs\apk\debug\" -Filter '*.apk' | ForEach-Object { $_.Name }
```

---

## 📞 Need More Help?

See the full guide: `www/APK_BUILD_GUIDE.md`

For build logs with detailed error output:
```bash
./gradlew assembleDebug --stacktrace --info
```

---

**Note:** The debug APK is **not code-signed** - use only for testing on your own devices. For distribution to others or publishing, you must create a signed release build.
