# Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL via Docker Compose)

## 1. Start PostgreSQL with Docker Compose

```bash
# from the project root
cp .env.example .env   # adjust DB_PORT if 5432 is already taken locally
docker compose up -d db
```

This starts a `postgres:16-alpine` container and creates the `ravanshenasi_varzeshi`
database automatically (configurable via `.env` / `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`).

## 2. Backend

```bash
cd backend

# Install dependencies (uses psycopg v3, which has prebuilt wheels for modern Python)
pip install -r requirements.txt

# Generate and apply migrations
python manage.py makemigrations accounts appointments articles coaches
python manage.py migrate

# Create your owner/admin account
python manage.py createsuperuser
# After creation, set role to 'owner':
# python manage.py shell -c "from accounts.models import User; u=User.objects.get(username='YOUR_USERNAME'); u.role='owner'; u.save()"

# Run the server
python manage.py runserver
```

### Running tests

The test suite runs against a real PostgreSQL test database (Django creates/destroys
`test_<DB_NAME>` automatically), so the Docker `db` container must be running:

```bash
cd backend
python manage.py test accounts articles coaches appointments
```

28 tests cover: registration/login/JWT auth/role info (`accounts`), article view
tracking and listing (`articles`), the coach-application submit/approve/reject
workflow including file uploads and permission checks (`coaches`), and the
appointments REST API (`appointments`).

## 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open http://localhost:5173

## Environment variables

Set in `.env` at the project root (read by Docker Compose) and exported to the
Django process (or placed in `backend/.env` and loaded however you prefer):

```
DB_NAME=ravanshenasi_varzeshi
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5436
```

> Note: `DB_PORT=5436` is used by default in `.env` because `5432` may already be
> bound by another local Postgres instance. Adjust to `5432` if it's free on your machine.

## API endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register/ | Sign up |
| POST | /api/auth/login/ | Login (returns JWT) |
| POST | /api/auth/refresh/ | Refresh JWT |
| GET | /api/auth/me/ | Current user info |
| GET | /api/articles/?lang=fa | Article list with view counts |
| POST | /api/articles/<slug>/view/ | Track article view |
| POST | /api/coaches/apply/ | Submit coach application |
| GET | /api/coaches/my-application/ | My application status |
| GET | /api/coaches/applications/ | All applications (owner only) |
| POST | /api/coaches/applications/<id>/review/ | Approve/reject (owner only) |
