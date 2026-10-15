import { Controller, Get } from '@nestjs/common';
import { CurrentUser, ReceivedAt } from '../identity/auth.guard.js';
import type { AuthUser } from '../identity/jwt-verifier.js';
import { LearningService } from './learning.service.js';

@Controller('learning')
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get('progress')
  progress(@CurrentUser() user: AuthUser, @ReceivedAt() now: number) {
    return this.learning.progress(user.userId, now);
  }

  @Get('saved')
  async saved(@CurrentUser() user: AuthUser) {
    return { items: await this.learning.savedList(user.userId) };
  }
}
