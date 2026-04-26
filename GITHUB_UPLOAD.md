# Подготовка к загрузке на GitHub

## Что уже настроено

- `.gitignore` не дает добавить `.env`, `node_modules`, `.next`, `dist`, логи и локальные файлы.
- `.env.example` оставлен как безопасный шаблон без реальных секретов.
- `.dockerignore` не отправляет локальные `.env` в Docker build context.
- Seed-пользователи теперь могут настраиваться через переменные окружения.

## Перед первым коммитом

Проверь, что в статусе нет `.env`, `node_modules`, `.next` или `dist`:

```powershell
git status --short
```

Если git еще не создан:

```powershell
git init
git add .
git status --short
git commit -m "Initial commit"
```

Потом создай пустой репозиторий на GitHub и привяжи remote:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## Что не загружать

Эти файлы должны остаться только локально:

- `.env`
- `apps/api/.env`
- `apps/web/.env.local`
- `node_modules/`
- `apps/web/.next/`
- `apps/api/dist/`
- `.codex-run/`

## Переменные для хостинга

На Railway/Render/VPS нужно создать production-переменные:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public&sslmode=require
JWT_SECRET=long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.kz
API_PUBLIC_URL=https://api.your-domain.kz
NEXT_PUBLIC_API_URL=https://api.your-domain.kz/api
GOOGLE_CALLBACK_URL=https://api.your-domain.kz/api/auth/google/callback
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RUN_DB_SEED=false
```

Если включаешь seed на staging, задай отдельные тестовые данные:

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change_me_admin_password
SEED_USER_EMAIL=user@example.com
SEED_USER_PASSWORD=change_me_user_password
```

## Важно

Если реальный Google OAuth secret когда-либо лежал в `.env.example`, лучше перевыпустить его в Google Cloud Console перед продакшеном.
