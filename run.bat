@echo off
REM Bootstraps and runs the full dev environment.
REM This is a thin wrapper that launches run.ps1 via PowerShell.
REM If scripts are blocked, run this first in an admin PowerShell:
REM   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

echo Launching run.ps1 via PowerShell...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
