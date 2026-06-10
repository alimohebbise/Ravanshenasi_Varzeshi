# Bootstraps and runs the full dev environment:
#   - PostgreSQL + Django backend  -> Docker (rebuilt fresh on every run)
#   - React frontend               -> runs locally via Vite
#
# Usage: .\run.ps1
# If you get "cannot be loaded because running scripts is disabled", run:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

$ErrorActionPreference = "Stop"
$ROOT_DIR = $PSScriptRoot
Set-Location $ROOT_DIR

Write-Host "=== Ravanshenasi Varzeshi — dev environment bootstrap ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Docker must be installed and running ---
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker is not installed." -ForegroundColor Red
    Write-Host "Install Docker Desktop from https://www.docker.com/products/docker-desktop and re-run this script."
    exit 1
}

try {
    docker info 2>&1 | Out-Null
} catch {
    Write-Host "ERROR: Docker is installed but the daemon isn't running." -ForegroundColor Red
    Write-Host "Start Docker Desktop and re-run this script."
    exit 1
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker daemon isn't running." -ForegroundColor Red
    Write-Host "Start Docker Desktop and re-run this script."
    exit 1
}

try {
    docker compose version 2>&1 | Out-Null
} catch {
    Write-Host "ERROR: 'docker compose' is not available." -ForegroundColor Red
    Write-Host "Update Docker Desktop to a version that bundles Compose v2 and re-run this script."
    exit 1
}

Write-Host "[ok] Docker is installed and running." -ForegroundColor Green

# --- 2. npm must be installed (frontend runs locally) ---
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "ERROR: npm is not installed." -ForegroundColor Red
    Write-Host "Install Node.js from https://nodejs.org/ and re-run this script."
    exit 1
}

$npmVersion = npm --version
Write-Host "[ok] npm is installed ($npmVersion)." -ForegroundColor Green

# --- 3. Ensure a root .env exists for docker compose ---
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creating .env from backend\.env.example ..."
    Copy-Item "backend\.env.example" ".env"
}

# --- 4. Remove any previous containers, then rebuild and start db + backend fresh ---
Write-Host ""
Write-Host "Removing previous containers..."
docker compose down --remove-orphans

Write-Host "Building and starting 'db' and 'backend' containers..."
docker compose up -d --build db backend

Write-Host "Waiting for the backend to respond on http://localhost:8000 ..."
$backendReady = $false
for ($i = 1; $i -le 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/admin/login/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -lt 500) {
            $backendReady = $true
            break
        }
    } catch {
        # not ready yet
    }
    Start-Sleep -Seconds 2
}

if ($backendReady) {
    Write-Host "[ok] Backend is up at http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "[warn] Backend did not respond within the timeout." -ForegroundColor Yellow
    Write-Host "       Check its logs with: docker compose logs -f backend"
}

# --- 5. Local Python virtualenv for backend tooling ---
Write-Host ""
Write-Host "Setting up local Python virtual environment for backend tooling..."
Set-Location "$ROOT_DIR\backend"

$pythonCmd = $null
foreach ($cmd in @("python", "py", "python3")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $pythonCmd = $cmd
        break
    }
}

if ($null -eq $pythonCmd) {
    Write-Host "[warn] Python not found — skipping virtualenv setup." -ForegroundColor Yellow
    Write-Host "       Install Python from https://www.python.org/downloads/"
} else {
    if (-not (Test-Path ".venv")) {
        & $pythonCmd -m venv .venv
    }
    & ".venv\Scripts\pip.exe" install --quiet --upgrade pip
    & ".venv\Scripts\pip.exe" install --quiet -r requirements.txt
    Write-Host "[ok] Virtualenv ready at backend\.venv" -ForegroundColor Green
    Write-Host "     Example: backend\.venv\Scripts\python.exe manage.py createsuperuser"
}

# --- 6. Frontend dependencies ---
Write-Host ""
Write-Host "Installing frontend dependencies..."
Set-Location "$ROOT_DIR\frontend"
npm install

# --- 7. Run the frontend dev server locally (foreground) ---
Write-Host ""
Write-Host "=================================================================="
Write-Host " Backend:  http://localhost:8000   (Docker, auto-reloads on save)"
Write-Host " Frontend: http://localhost:5173   (local Vite dev server)"
Write-Host "=================================================================="
Write-Host ""
npm run dev
