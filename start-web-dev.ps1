$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = Join-Path $projectRoot "web"
$apiDir = Join-Path $projectRoot "web-api"
$appDir = Join-Path $projectRoot "app"
$uvicornExe = Join-Path $projectRoot "venv\Scripts\uvicorn.exe"
$apiStdout = Join-Path $apiDir "codex-api-stdout.log"
$apiStderr = Join-Path $apiDir "codex-api-stderr.log"
$webStdout = Join-Path $webDir ".next\manual-web-stdout.log"
$webStderr = Join-Path $webDir ".next\manual-web-stderr.log"

Write-Host "Starting Sellora web API on http://127.0.0.1:8000 ..."
Start-Process -FilePath $uvicornExe `
  -ArgumentList "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload", "--reload-dir", $apiDir, "--reload-dir", $appDir `
  -WorkingDirectory $apiDir `
  -RedirectStandardOutput $apiStdout `
  -RedirectStandardError $apiStderr

Write-Host "Starting Sellora web frontend on http://localhost:3005 ..."
Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", "npm.cmd run dev -- --hostname 127.0.0.1 --port 3005 > .next\\manual-web-stdout.log 2> .next\\manual-web-stderr.log" `
  -WorkingDirectory $webDir

Write-Host ""
Write-Host "Open http://localhost:3005"
Write-Host "API should be available at http://127.0.0.1:8000"
