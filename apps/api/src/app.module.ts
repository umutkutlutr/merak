import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpThrottlerGuard } from './common/throttler.guard.js';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { CommonModule } from './common/common.module.js';
import { AllExceptionsFilter } from './common/http-exception.filter.js';
import { ReceivedAtMiddleware } from './common/received-at.middleware.js';
import { ConfigModule } from './config/config.module.js';
import { getEnv } from './config/env.js';
import { DbModule } from './db/db.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuditModule } from './modules/admin-audit/audit.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { ContentModule } from './modules/editorial-content/content.module.js';
import { HealthController } from './modules/health/health.controller.js';
import { HomeModule } from './modules/home/home.module.js';
import { AuthGuard } from './modules/identity/auth.guard.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { RolesGuard } from './modules/identity/roles.guard.js';
import { LearningModule } from './modules/learning-progress/learning.module.js';
import { LiveQuizModule } from './modules/live-quiz/live-quiz.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { QuestionsModule } from './modules/question-bank/questions.module.js';
import { ResultsModule } from './modules/scoring-results/results.module.js';

const env = getEnv();

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
        // Secrets never reach the logs.
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'req.body.participationToken',
            'req.body.password',
            'req.body.token',
          ],
          censor: '[redacted]',
        },
        autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/ready' || req.url === '/time' },
        customProps: (req) => ({ requestId: (req as { id?: string }).id }),
        transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } } : undefined,
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 600 }]),
    ConfigModule,
    CommonModule,
    DbModule,
    AuditModule,
    AnalyticsModule,
    IdentityModule,
    ProfilesModule,
    ContentModule,
    LearningModule,
    QuestionsModule,
    ResultsModule,
    LiveQuizModule,
    AdminModule,
    HomeModule,
  ],
  controllers: [HealthController],
  providers: [
    ReceivedAtMiddleware,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: HttpThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ReceivedAtMiddleware).forRoutes('*path');
  }
}
