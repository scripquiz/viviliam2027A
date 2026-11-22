# Viviliam APK Build Script for Windows PowerShell
# Builds debug APK ready for testing on Android devices

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Viviliam APK Build Script (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$ENV:ANDROID_HOME = "C:\Users\viviliam\AppData\Local\Android\Sdk"
Write-Host "Configuring Android SDK: $ENV:ANDROID_HOME" -ForegroundColor Green
Write-Host ""

# Step 1: Build web assets
Write-Host "[1/4] Building web application..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "www")) {
    Write-Host "ERROR: Web build failed!" -ForegroundColor Red
    pause
    exit
}

Write-Host "Web build complete. Output in www/" -ForegroundColor Green
Write-Host ""

# Step 2: Sync Capacitor with Android
Write-Host "[2/4] Syncing Capacitor with Android platform..." -ForegroundColor Yellow
npx cap sync android

if (-not (Test-Path "android\app")) {
    Write-Host "ERROR: Capacitor sync failed!" -ForegroundColor Red
    pause
    exit
}

Write-Host "Capacitor sync complete." -ForegroundColor Green
Write-Host ""

# Step 3: Configure local.properties
Write-Host "[3/4] Configuring local.properties..." -ForegroundColor Yellow
@"
sdk.dir=$env:ANDROID_HOME
"@ | Set-Content -Path "android\local.properties" -NoNewline

Write-Host "Verifying SDK location..." -ForegroundColor Green
if (Test-Path "$ENV:ANDROID_HOME\platform-tools") {
    Write-Host "SUCCESS: Android SDK found at $ENV:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "WARNING: Platform-tools not found in $ENV:ANDROID_HOME" -ForegroundColor Yellow
    pause
}
Write-Host ""

# Step 4: Run Gradle build for debug APK
Write-Host "[4/4] Building Debug APK with Gradle..." -ForegroundColor Yellow
Set-Location android

Write-Host "Starting Gradle assembleDebug task..." -ForegroundColor Cyan
& gradlew.bat assembleDebug --stacktrace

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  APK BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Gradle build failed. Check the logs above." -ForegroundColor Red
    Write-Host ""
}

Set-Location ..

# Check for APK files
Write-Host "Checking build output..." -ForegroundColor Yellow
$apkFiles = Get-ChildItem "android\app\build\outputs\apk\debug" -Filter "*.apk" -ErrorAction SilentlyContinue

if ($apkFiles) {
    Write-Host "Available architecture-specific APKs:" -ForegroundColor Cyan
    $apkFiles | ForEach-Object {
        Write-Host "  $_.FullName (`$([Math::round($_.Length/1024/1024,2)] MB)" -ForegroundColor Green
    }
}

# Copy main APK to www directory
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Copying main APK (arm64-v8a) to www/..." -ForegroundColor Cyan
    $arm64Apk = Get-ChildItem "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk" -ErrorAction SilentlyContinue
    if ($arm64Apk) {
        Copy-Item $arm64Apk.FullName "www\viviliam-debug.apk" -Force
        Write-Host "Main debug APK copied to: www\viviliam-debug.apk" -ForegroundColor Green
    } else {
        # Try to find any available APK
        $firstApk = $apkFiles[0]
        if ($firstApk) {
            Copy-Item $firstApk.FullName "www\viviliam-debug.apk" -Force
            Write-Host "Copied APK: $($_.Name)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To install on your Android device:" -ForegroundColor Yellow
Write-Host "  1. Copy viviliam-debug.apk to your phone" -ForegroundColor White
Write-Host "  2. Enable USB debugging in Settings -> Developer Options" -ForegroundColor White
Write-Host "  3. Install the APK from Downloads folder" -ForegroundColor White
Write-Host ""
Write-Host "For full instructions, see:" -ForegroundColor Yellow
Write-Host "  - www\APK_BUILD_GUIDE.md" -ForegroundColor Cyan
Write-Host "  - android\APK_BUILD_QUICK_GUIDE.md" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
