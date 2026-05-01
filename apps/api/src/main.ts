import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import express from 'express';
import { getUploadsDir } from './common/utils/uploads';

function getAllowedOrigins() {
  const configuredOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const defaultOrigin = process.env.FRONTEND_URL || 'http://localhost:3100';
  const origins = new Set(configuredOrigins.length ? configuredOrigins : [defaultOrigin]);

  for (const origin of [...origins]) {
    try {
      const url = new URL(origin);

      if (url.hostname === 'localhost') {
        origins.add(origin.replace('localhost', '127.0.0.1'));
      }

      if (url.hostname === '127.0.0.1') {
        origins.add(origin.replace('127.0.0.1', 'localhost'));
      }
    } catch {
      continue;
    }
  }

  return [...origins];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();

  // Security headers (CSP off — frontend handles it; COEP off to avoid breaking OAuth images)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Limit request body size
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');
  app.use('/uploads', express.static(getUploadsDir()));

  const port = process.env.PORT || 3101;
  await app.listen(port);
  console.log(`Nity API running on http://localhost:${port}/api`);
}

bootstrap();
