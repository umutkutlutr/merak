import { Controller, Get } from '@nestjs/common';
import { CurrentUser, ReceivedAt } from '../identity/auth.guard.js';
import type { AuthUser } from '../identity/jwt-verifier.js';
import { ContentService } from '../editorial-content/content.service.js';
import { LearningService } from '../learning-progress/learning.service.js';
import { SessionsService } from '../live-quiz/sessions.service.js';

/** Home screen aggregate: next test session, a few discovery cards, learning progress. No fake counters. */
@Controller('home')
export class HomeController {
  constructor(
    private readonly content: ContentService,
    private readonly learning: LearningService,
    private readonly sessions: SessionsService,
  ) {}

  @Get()
  async home(@CurrentUser() user: AuthUser, @ReceivedAt() now: number) {
    const [quiz, cards, progress] = await Promise.all([
      this.sessions.currentForUser(user.userId),
      this.content.listPublished(user.userId, { kind: 'card', limit: 4 }),
      this.learning.progress(user.userId, now),
    ]);
    return { quiz, cards, progress };
  }
}
