#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import os, sys
url = os.environ.get('DATABASE_URL', '')
if url:
    import urllib.parse as p
    u = p.urlparse(url)
    import psycopg2
    psycopg2.connect(dbname=u.path.lstrip('/'), user=u.username,
                     password=u.password, host=u.hostname, port=u.port or 5432)
else:
    import psycopg2
    psycopg2.connect(
        dbname=os.environ.get('DB_NAME','salesdb'),
        user=os.environ.get('DB_USER','salesuser'),
        password=os.environ.get('DB_PASSWORD','salespass'),
        host=os.environ.get('DB_HOST','db'),
        port=int(os.environ.get('DB_PORT','5432')))
" 2>/dev/null; do
  sleep 1
done
echo "Database ready."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Create superuser if not exists
python manage.py shell -c "
from django.contrib.auth import get_user_model
import os
User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f'Superuser created: {username}')
"

PORT=${PORT:-8000}
exec gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --limit-request-field_size 16384 --limit-request-fields 200
