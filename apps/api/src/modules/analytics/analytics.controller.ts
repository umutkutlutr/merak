import { Body, Controller, Post } from '@nestjs/common';
import { ClientAnalyticsBatchSchema, type ClientAnalyticsEventInput } from '@merak/contracts';
import { ZodValidationPipe } from '../../common/zod.pipe.js';
import { CurrentUser } from '../identity/auth.guard.js';
import type { AuthUser } from '../identity/jwt-verifier.js';
import { AnalyticsService } from './analytics.service.js';

@Controller('events')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post()
  async ingest(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ClientAnalyticsBatchSchema))
    body: { events: ClientAnalyticsEventInput[] },
  ) {
    return this.analytics.ingestClientEvents(user.userId, body.events);
  }
}
