# Nity - запуск через Docker Compose

## Быстрый старт

```bash
docker compose up --build
```

После старта:

- сайт: `http://localhost:3100`
- API: `http://localhost:3101/api`
- PostgreSQL: `localhost:55432`

Контейнеры, сеть и volume не используют фиксированные `container_name`, поэтому не конфликтуют с другими compose-проектами. Порты тоже вынесены в переменные и по умолчанию не занимают типичные `3000`, `3001` и `5432`.

## Настройка портов и переменных

```powershell
Copy-Item .env.example .env
```

Если нужно, измени в `.env`:

- `WEB_PORT`
- `API_PORT`
- `POSTGRES_PORT`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Что делает compose

- поднимает `postgres`, `api` и `web`
- ждёт готовности базы
- применяет Prisma migrations
- при `RUN_DB_SEED=true` заполняет базу тестовыми данными

## Тестовые аккаунты

- администратор: `admin@nity.kz / admin123456`
- пользователь: `user@nity.kz / user123456`
