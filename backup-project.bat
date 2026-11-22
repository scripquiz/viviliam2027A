@echo off
setlocal enabledelayedexpansion

:: Determine directory where this batch file resides
set "BACKUP_DIR=%~dp0"
set "BACKUP_DIR=%BACKUP_DIR:~0,-1%"

cd /d "%BACKUP_DIR%"

:: Run the PowerShell backup script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-project.ps1"
