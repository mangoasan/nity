FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3101/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN npm run build --workspace=apps/web

FROM node:22-alpine AS runner
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3101/api
ARG INTERNAL_API_URL
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=build /app/apps/web/src/messages ./apps/web/src/messages
COPY --from=build /app/apps/web/src/i18n ./apps/web/src/i18n
COPY --from=build /app/apps/web/src/proxy.ts ./apps/web/src/proxy.ts

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/web", "--", "-H", "0.0.0.0", "-p", "3000"]
