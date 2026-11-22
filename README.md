# Viviliam - Bible App by ScripQuiz

<div align="center">

An Ionic + Angular 22 app built with Capacitor for Android deployment.
Featuring daily Bible verses, audio meditations, and spiritual content.

---

## 🏗️ Tech Stack

- **Framework:** Angular 22 (Ionic Framework)
- **Native Runtime:** Capacitor (Android target)
- **UI Library:** @ionic/angular v8.8.19
- **Data Persistence:** Capacitor SQL & Filesystem API

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/           # Services, guards, interceptors
│   ├── features/       # Feature modules
│   ├── home/          # Landing page module
│   └── shared/        # Shared components, pipes, directives
android/                # Native Android project (Gradle)
├── www/                # Built web assets
└── scripts/            # Build & automation scripts
```

---

## 🚀 Quick Commands

### Development
```bash
npm run start          # Launch development server (ionic serve)
npm run build          # Production web build
npm run watch          # Watch mode for hot reloading
```

### Android Build & Deploy
```bash
# Debug APK (for testing on your device)
npm run build && npx cap sync android && cd android && ANDROID_HOME=C:/Users/viviliam/AppData/Local/Android/Sdk ./gradlew assembleDebug --quiet

# Release APK (signed, for distribution) - requires keystore setup
npm run build && npx cap sync android && cd android && ./gradlew assembleRelease --quiet
```

### Full Production Pipeline
```bash
npm run android:release:apk
# Runs: DB pre-build → Web build → Capacitor sync → Gradle release build
```

---

## 📱 APK Build Instructions

See **`android/APK_BUILD_QUICK_GUIDE.md`** for step-by-step instructions to:

1. Build debug/release APKs
2. Transfer APK to Android device
3. Install on physical device or emulator
4. Create production-signed release builds

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Production web build (outputs to www/) |
| `npm run start` | Development server (ionic serve) |
| `npm run watch` | Watch mode with hot reload |
| `npm run lint` | ESLint code checking |
| `npm test` | Unit tests (Karma/Jasmine) |
| `npm run android:release:apk` | Full release pipeline |
| `npm run android:release:aab` | Google Play bundle (.aab) |

---

## 🔧 Configuration

### Environment Variables (`.env`)
```bash
VITALITY_TOKEN=your-api-token-here
# Add other environment variables as needed
```

### Android SDK Setup

If you're experiencing "SDK location not found" errors, create `android/local.properties`:
```properties
sdk.dir=C:/Users/viviliam/AppData/Local/Android/Sdk
```

Or set the environment variable:
```bash
set ANDROID_HOME=C:\Users\viviliam\AppData\Local\Android\Sdk
```

---

## 📤 Output Locations

| Build Type | Location |
|------------|----------|
| Debug APK (arm64) | `android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk` |
| Release APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Universal APK | Same as above (all architectures combined) |
| Google Play Bundle | `android/app/build/outputs/bundle/release/app-release.aab` |
| Web assets | `www/` |

---

## 🧪 Testing

- Unit tests: `npm test`
- Lint check: `npm run lint`
- Build validation: `ionic build`

---

## 📋 Requirements

- Node.js 18+ / npm 9+
- Android Studio (provides SDK)
- Gradle 8.14+
- Windows/macOS/Linux development environment

---

## 📝 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for spiritual growth and daily devotion**
