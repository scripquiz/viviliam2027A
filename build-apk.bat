@echo off
REM Viviliam APK Build Script for Windows
REM Builds debug APK ready for testing on Android devices

echo ========================================
echo   Viviliam APK Build Script
echo ========================================
echo.

setlocal

REM Set ANDROID_HOME environment variable
set "ANDROID_HOME=C:\Users\viviliam\AppData\Local\Android\Sdk"
echo Configuring Android SDK: %ANDROID_HOME%
echo.

REM Step 1: Build web assets
echo [1/4] Building web application...
call npm run build

if not exist www (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)

echo Web build complete. Output in www/
echo.

REM Step 2: Sync Capacitor with Android
echo [2/4] Syncing Capacitor with Android platform...
call npx cap sync android

if not exist android\app (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo Capacitor sync complete.
echo.

REM Step 3: Configure Android SDK
echo [3/4] Configuring local.properties...
(
    echo sdk.dir=%ANDROID_HOME%
) > android\local.properties

echo.
echo Verifying SDK location...
if exist "%ANDROID_HOME%\platform-tools" (
    echo SUCCESS: Android SDK found at %ANDROID_HOME%
) else (
    echo WARNING: Platform-tools not found in %ANDROID_HOME%
    pause
)
echo.

REM Step 4: Run Gradle build for debug APK
echo [4/4] Building Debug APK with Gradle...
cd android

echo Starting Gradle assembleDebug task...
if defined ANDROID_HOME (
    set "ENV_ARGS=--stacktrace"
) else (
    set "ENV_ARGS="
)

:: Try running Gradle build
gradlew.bat assembleDebug %ENV_ARGS%

REM Build output location
cd ..

echo.
echo ========================================
echo   APK BUILD COMPLETE!
echo ========================================
echo.
echo Your debug APK is ready at:
echo   android/app/build/outputs/apk/debug/
echo.
echo Available architecture-specific APKs:
dir /b "android\app\build\outputs\apk\debug" | findstr /i "*.apk" 2>nul || (
    echo No APKs found yet - build may be in progress or failed
)

echo.
echo Main debug APK (arm64-v8a for modern phones):
dir "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk" 2>nul || echo Building arm64...

REM Copy to www directory for easy access
if exist "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk" (
    echo.
    echo Copying main APK to www/...
    copy "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk" "www\viviliam-debug.apk" >nul 2>&1
    echo Main debug APK copied to: www\viviliam-debug.apk
)

echo.
echo To install on your Android device:
echo   1. Copy viviliam-debug.apk to your phone
echo   2. Enable USB debugging in Settings -> Developer Options
echo   3. Install the APK from Downloads folder
echo.
echo For full instructions, see:
echo   - www\APK_BUILD_GUIDE.md
echo   - android\APK_BUILD_QUICK_GUIDE.md
echo ========================================

endlocal
pause
