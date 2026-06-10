#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Ensuring default admin account exists..."
python manage.py create_default_admin

echo "Ensuring default coach account exists..."
python manage.py create_default_coach

echo "Starting Django development server on 0.0.0.0:8000..."
exec python manage.py runserver 0.0.0.0:8000
