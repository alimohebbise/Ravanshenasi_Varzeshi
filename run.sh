#!/usr/bin/env bash
#
# Bootstraps and runs the full dev environment:
#   - PostgreSQL + Django backend  -> Docker (rebuilt fresh on every run)
#   - React frontend               -> runs locally via Vite
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== Ravanshenasi Varzeshi — dev environment bootstrap ==="
echo ""

# --- 1. Docker must be installed and running ---
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed."
  echo "Install Docker Desktop from https://www.docker.com/products/docker-desktop and re-run this script."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is installed but the daemon isn't running."
  echo "Start Docker Desktop (or the Docker daemon) and re-run this script."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: 'docker compose' is not available."
  echo "Update Docker Desktop to a version that bundles Compose v2 and re-run this script."
  exit 1
fi

echo "[ok] Docker is installed and running."

# --- 2. npm must be installed (frontend runs locally) ---
if ! command -v npm >/dev/null 2>&1; then
  echo ""
  echo "ERROR: npm is not installed."
  echo "Install Node.js (https://nodejs.org/) and re-run this script."
  exit 1
fi

echo "[ok] npm is installed ($(npm --version))."

# --- 3. Ensure a root .env exists for docker compose ---
if [ ! -f ".env" ]; then
  echo ""
  echo "Creating .env from backend/.env.example ..."
  cp backend/.env.example .env
fi

# --- 4. Remove any previous containers, then rebuild and start db + backend fresh ---
echo ""
echo "Removing previous containers..."
docker compose down --remove-orphans

echo "Building and starting 'db' and 'backend' containers..."
docker compose up -d --build db backend

echo "Waiting for the backend to respond on http://localhost:8000 ..."
backend_ready=false
for _ in $(seq 1 60); do
  if curl -s -o /dev/null http://localhost:8000/admin/login/; then
    backend_ready=true
    break
  fi
  sleep 2
done

if [ "$backend_ready" = true ]; then
  echo "[ok] Backend is up at http://localhost:8000"
else
  echo "[warn] Backend did not respond within the timeout."
  echo "       Check its logs with: docker compose logs -f backend"
fi

# --- 5. Local Python virtualenv for backend tooling (manage.py, IDE support) ---
# The server itself runs inside Docker; this venv is for running management
# commands (createsuperuser, makemigrations, shell, tests) from the host and
# for editor/IDE autocompletion.
echo ""
echo "Setting up local Python virtual environment for backend tooling..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt
echo "[ok] Virtualenv ready at backend/.venv"
echo "     Example: backend/.venv/bin/python manage.py createsuperuser"
echo "     (export DB_PORT from .env so it points at the host-mapped Postgres port)"

# --- 6. Frontend dependencies ---
echo ""
echo "Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

# --- 7. Run the frontend dev server locally (foreground) ---
echo ""
echo "=================================================================="
echo " Backend:  http://localhost:8000   (Docker, auto-reloads on save)"
echo " Frontend: http://localhost:5173   (local Vite dev server)"
echo "=================================================================="
echo ""
npm run dev
