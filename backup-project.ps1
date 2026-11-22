# backup-project.ps1 - Local PC project backup using .gitignore for exclusions

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dir = $scriptDir
$folderName = Split-Path $dir -Leaf
$timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$zipFileName = "${folderName}-${timestamp}.zip"
$zipPath = Join-Path $dir $zipFileName
$gitignorePath = Join-Path $dir '.gitignore'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Project Backup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Folder:     $dir"
Write-Host " Archive:    $zipFileName"
Write-Host " Ignoring:   .gitignore patterns"
Write-Host "========================================"
Write-Host ""

# Load .gitignore patterns
$patterns = @()
if (Test-Path $gitignorePath) {
    Get-Content $gitignorePath | Where-Object { $_ -notmatch '^\s*$' -and $_ -notmatch '^\s*#' } | ForEach-Object {
        $p = $_.Trim()
        if ($p) { $patterns += $p }
    }
    Write-Host "Loaded $($patterns.Count) .gitignore patterns"
} else {
    Write-Host ".gitignore not found - no exclusions"
}

# Convert gitignore pattern to regex
function Convert-GitIgnorePattern {
    param($pattern)
    $regex = ''
    $i = 0
    while ($i -lt $pattern.Length) {
        $c = $pattern[$i]
        switch ($c) {
            '*' {
                if ($i + 1 -lt $pattern.Length -and $pattern[$($i+1)] -eq '*') {
                    # ** pattern
                    $regex += '(?:.+/)?'
                    $i += 2
                    continue
                } else {
                    $regex += '[^/]*'
                }
            }
            '?' { $regex += '.' }
            default { $regex += [regex]::Escape($c) }
        }
        $i++
    }
    return $regex
}

# Check if a path matches any .gitignore pattern
function Test-GitIgnored {
    param($relPath, $isDir)

    foreach ($pat in $patterns) {
        # Handle negation patterns like '!file.txt'
        $negated = $false
        if ($pat.StartsWith('!')) {
            $negated = $true
            $pat = $pat.Substring(1)
        }

        # Handle leading './'
        if ($pat.StartsWith('./')) { $pat = $pat.Substring(2) }

        # Check trailing slash (directory-only pattern)
        $dirOnly = $false
        if ($pat.EndsWith('/')) {
            $dirOnly = $true
            $pat = $pat.TrimEnd('/')
        }
        if ($dirOnly -and -not $isDir) { continue }

        # Convert pattern to regex
        $regex = Convert-GitIgnorePattern $pat

        # Match logic: if pattern contains '/', match against full relative path
        # Otherwise match against each path component (filename matching)
        $matched = $false
        if ($pat.Contains('/')) {
            # Path pattern
            try {
                if ($relPath -cmatch $regex) { $matched = $true }
            } catch {}
        } else {
            # Filename pattern - match only against individual path components (filenames)
            $parts = $relPath -split '/'
            foreach ($part in $parts) {
                try {
                    if ($part -cmatch "^${regex}$") { $matched = $true; break }
                } catch {}
            }
        }

        if ($negated) {
            return -not $matched
        } elseif ($matched) {
            return $true
        }
    }
    return $false
}

# Heavy directories to exclude before scanning (speed up file collection)
$excludedDirs = @('node_modules', '.git', '.angular', 'bower_components', '.pnp')

Write-Host ""
Write-Host "Collecting files..." -ForegroundColor Yellow

# First get all files, excluding heavy directories entirely
$files = @(Get-ChildItem -Path $dir -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
    $relPath = $_.FullName.Substring($dir.Length + 1) -replace '\\', '/'

    # Skip excluded directories early (before any other processing)
    foreach ($exDir in $excludedDirs) {
        if ($relPath -match "(^|/)${exDir}/") {
            return $false
        }
    }

    # Skip the backup script itself and any existing backups
    if ($relPath -eq 'backup-project.bat' -or $relPath -eq 'backup-project.ps1') { return $false }
    if ($relPath -match '\.zip$') { return $false }

    # Check if file matches any gitignore pattern
    if (Test-GitIgnored $relPath $false) { return $false }

    # Check if any parent directory is ignored
    $parentPaths = ($relPath -split '/')
    for ($j = 0; $j -lt ($parentPaths.Length - 1); $j++) {
        $parentPath = ($parentPaths[0..$j]) -join '/'
        if (Test-GitIgnored $parentPath $true) { return $false }
    }

    return $true
})
Write-Host "Files to backup: $($files.Count)" -ForegroundColor Green

if ($files.Count -eq 0) {
    Write-Host "No files to backup." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Remove existing zip if present
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Create the zip archive
Write-Host "Files found: $($files.Count)" -ForegroundColor Green
Write-Host "Compressing... (this may take a while)" -ForegroundColor Yellow

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
    $added = 0
    $total = $files.Count
    foreach ($file in $files) {
        $relPath = $file.FullName.Substring($dir.Length + 1) -replace '\\', '/'
        try {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relPath) | Out-Null
            $added++
        } catch {
            Write-Host "  Warning: skipping $relPath - $($_.Exception.Message)" -ForegroundColor Yellow
        }

        # Show progress every 500 files
        if ($added % 500 -eq 0) {
            Write-Host "  ...$added / $total files" -NoNewline
            Write-Host ""
        }
    }
} finally {
    $zip.Dispose()
}

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Backup complete!" -ForegroundColor Green
Write-Host " Archive:    $zipPath" -ForegroundColor Green
Write-Host " Files:      $added" -ForegroundColor Green
Write-Host " Size:       ${sizeMB} MB" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Read-Host "Press Enter to exit"
