# Comments Project

This README provides a step-by-step guide for setting up and running the Comments project using Docker. The project consists of a Django backend and a React frontend. Ensure you have Docker and Docker Compose installed on your machine before proceeding.

## Project Structure
```bash
comments-project/
├── backend/
│   ├── .env
│   |── (Django app files)
│   ├── .env.db
|   |── Dockerfile
├── comment-frontend/
│   ├── .env
│   |── (React app files)
|   |── Dockerfile
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Docker: Install Docker
- Docker Compose: Install Docker Compose

## Configuration Files

**Backend** .env

Create a file named .env inside the backend/ directory with the following conte

```bash
DJANGO_SECRET_KEY=secret_key
DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1 localhost 0.0.0.0 
SET_COOKIE_SECURE=0
SESSION_COOKIE_DOMAIN=
SITE_URL=http://localhost
CORS_ALLOW_ALL_ORIGINS=1
CORS_ALLOWED_ORIGINS=http://localhost:3000 http://localhost 
CSRF_TRUSTED_ORIGINS=
CSRF_COOKIE_DOMAIN=
DATABASE_ENGINE=django.db.backends.postgresql_psycopg2
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=db_name
DATABASE_USERNAME=username
DATABASE_PASSWORD=password
```
**Database** .env.db

Create a file named .env.db

```bash
POSTGRES_USER=comment
POSTGRES_PASSWORD=7777
POSTGRES_DB=db_comment
```

**Comment-Frontend** .env

Create a file named .env inside the comment-frontend/ directory with the following conte

```bash
REACT_APP_API_BASE_URL=http://localhost/api
REACT_APP_BASE_URL=http://localhost
REACT_APP_BASE_WS=ws://localhost/ws/comments/
```

## Docker Compose Setup

Ensure your docker-compose.yml file is properly configured to include services for the backend, database, and frontend. An example configuration:

``` yml
services:
  db:
    image: postgres:17rc1-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - ./backend/.env.db
    ports:
      - 5432:5432

  redis:
    image: redis:latest
    ports:
      - 6379:6379

  api:
    build:
      context: ./backend  # Путь к Dockerfile для backend
      dockerfile: Dockerfile
    command: bash -c "python manage.py makemigrations && \
                      python manage.py migrate && \
                      python manage.py collectstatic --noinput && \
                      python run_uvicorn.py"
    env_file:
      - ./backend/.env  # Переменные окружения для backend
    volumes:
      - ./backend:/app  # Монтируем исходники backend
      - ./backend/staticfiles/:/app/staticfiles
      - ./backend/media/:/app/media
      - ./backend/static/images:/app/static/images
    ports:
      - 8000:8000
    
    depends_on:
      - db
      - redis

  nginx: 
        restart: unless-stopped
        build:
            context: .
            dockerfile: ./comment-frontend/Dockerfile-dev
        ports:
            - 80:80
        volumes:
            - ./backend/staticfiles/:/app/staticfiles
            - ./backend/media/:/app/media
            - ./backend/static/images:/app/static/images
        depends_on: 
            - api

volumes:
  postgres_data:
```

## Steps to Run the Project

1.  **Clone the Repository**

```bash
git clone https://github.com/igor20192/Comment_App.git
cd Comment_App
```

2. **Build and Start the Containers**

```bash
docker-compose -f docker-compose-dev.yml  up --build
```

3.  **Access the Application**

- Backend API: http://localhost/api
- Frontend: http://localhost

4. Stopping the Containers

To stop the containers, press Ctrl+C or run:

```bash
docker-compose -f docker-compose-dev.yml down
```

## Additional Notes

- Database Migrations: If migrations fail, manually run:

```bash
docker-compose exec api python manage.py migrate
```

- Static Files: To collect static files in production:

```bash 
docker-compose exec api python manage.py collectstatic --noinput
```

- Debugging: Use Docker logs to debug issues:

```bash
docker-compose logs <service_name>
```

## Common Issues

### CSRF Errors

Ensure the following:

1. Proper CSRF settings in .env.
2. Correct trusted origins in CSRF_TRUSTED_ORIGINS.
3. Cookies are enabled in your browser.

## Port Conflicts

Ensure the ports 5432, 8000, and 3000 are not in use. Change them in docker-compose.yml if necessary.

## Project Description

The Comments project is designed to provide a robust commenting system for web applications. It features:

- **Backend**: Built with Django for handling API requests and managing data storage with PostgreSQL.

- **Frontend**: Developed with React to provide an intuitive user interface.

- **Real-time Updates**: WebSocket integration for live comment updates.

- **Containerized Deployment**: Docker ensures smooth and consistent deployment across environments.

