# Nity — контекст для Claude Code

## Архитектура

npm workspaces монорепозиторий с двумя приложениями:

- `apps/api` — NestJS 11, REST API, порт 3001 (в Docker: 3101)
- `apps/web` — Next.js 16, React 19, порт 3100

Общая база: PostgreSQL 16 через Prisma ORM.

## Команды

```bash
# Docker (рекомендуется для полного запуска)
npm run docker:up       # docker compose up --build
npm run docker:down     # docker compose down

# Локальная разработка
npm run db:up           # только postgres в Docker
npm run dev             # API + web в watch-режиме (concurrently)

# База данных (из корня)
npm run db:migrate      # prisma migrate dev
npm run db:seed         # ts-node prisma/seed.ts

# Из apps/api напрямую
npm run dev             # nest start --watch
npm run build           # nest build
npm run test            # jest
npm run test:e2e        # jest --config ./test/jest-e2e.json
```

## Структура API (apps/api/src)

Каждый модуль — стандартный NestJS: `module`, `controller`, `service`, DTO-файлы.

- `auth/` — JWT-стратегия, Google OAuth (passport-google-oauth20), guards
- `users/` — CRUD пользователей, смена пароля
- `masters/` — тренеры студии (YogaMaster)
- `class-types/` — типы занятий (YogaClassType), мультиязычные названия (ru/en/kk)
- `schedule/` — слоты расписания (ScheduleSlot: мастер + тип + день недели + время)
- `bookings/` — записи пользователей на конкретную дату
- `personal-training/` — заявки на персональные тренировки
- `admin/` — эндпоинты только для роли ADMIN
- `prisma/` — PrismaService (singleton)
- `common/` — общие декораторы, фильтры, интерцепторы

## Prisma

Схема: `apps/api/prisma/schema.prisma`  
Миграции: `apps/api/prisma/migrations/`  
Сид: `apps/api/prisma/seed.ts`

Основные модели: `User`, `YogaMaster`, `YogaClassType`, `ScheduleSlot`, `Booking`, `PersonalTrainingRequest`.

При изменении схемы — запустить `npm run db:migrate` из корня (или `prisma migrate dev` из `apps/api`).

## Структура Web (apps/web/src)

- `app/[locale]/` — страницы с i18n-роутингом (next-intl)
- `components/` — React-компоненты
- `hooks/` — кастомные хуки
- `lib/` — API-клиент (fetch-обёртки), утилиты
- `messages/ru.json`, `en.json`, `kk.json` — переводы
- `proxy.ts` — серверный прокси для API-запросов (обходит CORS в SSR)

Роутинг: `/[locale]/...` где locale ∈ `ru | en | kk`.  
Стили: Tailwind CSS 4 (конфиг в `postcss.config.mjs`).

## Аутентификация

- JWT Bearer токен, хранится в cookie через js-cookie
- Google OAuth: `/api/auth/google` → callback → редирект на фронтенд с токеном
- Роли: `USER`, `ADMIN` (поле `role` в модели User)
- Guard: `JwtAuthGuard`, `RolesGuard` + декоратор `@Roles(Role.ADMIN)`

## Переменные окружения

API читает `.env` через `@nestjs/config`. Ключевые:
- `DATABASE_URL` — строка подключения PostgreSQL
- `JWT_SECRET` — обязателен в проде
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL` — для CORS и OAuth редиректов

Web использует:
- `NEXT_PUBLIC_API_URL` — публичный URL API (build-time аргумент в Docker)
- `INTERNAL_API_URL` — внутренний URL для SSR запросов внутри Docker-сети

## Важные соглашения

- Мультиязычные поля в БД хранятся как `titleRu`, `titleEn`, `titleKk` (не JSON)
- ID везде CUID (`@default(cuid())`)
- Даты в UTC, формат ISO 8601
- Swagger доступен по `/api/docs` в development-режиме
- `RUN_DB_SEED=true` в docker-compose запускает сид автоматически при старте контейнера
