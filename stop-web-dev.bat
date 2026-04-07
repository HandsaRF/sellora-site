@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\stop-web-dev.ps1"
