#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "import psycopg2; psycopg2.connect(
  dbname='${DB_NAME}',
  user='${DB_USER}',
  password='${DB_PASSWORD}',
  host='${DB_HOST}',
  port='${DB_PORT}'
)" 2>/dev/null; do
  sleep 1
done
echo "Database ready."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Create superuser if not exists
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin / admin123')
"

exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 2 --limit-request-field_size 16384 --limit-request-fields 200
