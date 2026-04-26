# Nity — платформа йога-студии

Монорепозиторий с NestJS API и Next.js фронтендом для управления расписанием, записями и тренерами йога-студии.

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, next-intl |
| Backend | NestJS 11, Passport (JWT + Google OAuth) |
| База данных | PostgreSQL 16, Prisma ORM |
| Инфраструктура | Docker Compose, npm workspaces |

## Быстрый старт (Docker)

```bash
docker compose up --build
```

- Сайт: `http://localhost:3100`
- API: `http://localhost:3101/api`
- PostgreSQL: `localhost:55432`

Тестовые аккаунты после сида:
- `admin@nity.kz / admin123456`
- `user@nity.kz / user123456`

## Локальная разработка

```bash
# Установить зависимости
npm install

# Поднять только базу данных
npm run db:up

# Запустить API и web в watch-режиме
npm run dev
```

Скопируй `.env.example` → `.env` и настрой переменные перед запуском.

## Переменные окружения

| Переменная | По умолчанию | Описание |
|-----------|-------------|---------|
| `WEB_PORT` | `3100` | Порт фронтенда |
| `API_PORT` | `3101` | Порт API |
| `POSTGRES_PORT` | `55432` | Порт PostgreSQL |
| `JWT_SECRET` | — | Секрет для JWT (обязателен в проде) |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `RUN_DB_SEED` | `true` | Заполнить базу тестовыми данными при старте |

## Структура проекта

```
nity/
├── apps/
│   ├── api/          # NestJS — REST API
│   │   ├── src/
│   │   │   ├── auth/           # JWT + Google OAuth
│   │   │   ├── users/          # Пользователи
│   │   │   ├── masters/        # Тренеры (YogaMaster)
│   │   │   ├── class-types/    # Типы занятий
│   │   │   ├── schedule/       # Слоты расписания
│   │   │   ├── bookings/       # Записи на занятия
│   │   │   ├── personal-training/ # Запросы на персональные тренировки
│   │   │   └── admin/          # Административные эндпоинты
│   │   └── prisma/
│   │       ├── schema.prisma   # Схема БД
│   │       └── seed.ts         # Тестовые данные
│   └── web/          # Next.js — фронтенд
│       └── src/
│           ├── app/[locale]/   # Страницы (i18n routing)
│           ├── components/     # UI-компоненты
│           ├── hooks/          # React хуки
│           ├── lib/            # API-клиент и утилиты
│           └── messages/       # Переводы (ru, en, kk)
└── docker-compose.yml
```

## База данных

Основные модели: `User`, `YogaMaster`, `YogaClassType`, `ScheduleSlot`, `Booking`, `PersonalTrainingRequest`.

```bash
# Применить миграции
npm run db:migrate

# Заполнить тестовыми данными
npm run db:seed
```

## Локализация

Поддерживаемые языки: русский (`ru`), английский (`en`), казахский (`kk`).  
Переводы находятся в [apps/web/src/messages/](apps/web/src/messages/).
