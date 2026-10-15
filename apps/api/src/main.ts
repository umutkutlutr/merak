import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { getEnv } from './config/env.js';
import { PG_POOL } from './db/db.module.js';
import type { Pool } from 'pg';

export async function createApp(): Promise<NestExpressApplication> {
  const env = getEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(app.get(Logger));
  app.use(express.json({ limit: '32kb' }));
  app.enableCors({ origin: env.corsOrigins.length ? env.corsOrigins : true, credentials: true });
  app.enableShutdownHooks();
  return app;
}

async function bootstrap(): Promise<void> {
  const env = getEnv();
  const app = await createApp();
  await app.listen(env.PORT);
  const logger = app.get(Logger);
  logger.log(`Merak API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`, 'Bootstrap');
  const shutdown = async () => {
    await app.close();
    await (app.get<Pool>(PG_POOL)).end().catch(() => undefined);
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
