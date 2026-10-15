import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { FeedQuerySchema, type FeedResponse } from '@merak/contracts';
import { ZodValidationPipe } from '../../common/zod.pipe.js';
import { CurrentUser, ReceivedAt } from '../identity/auth.guard.js';
import type { AuthUser } from '../identity/jwt-verifier.js';
import { LearningService } from '../learning-progress/learning.service.js';
import { ContentService } from './content.service.js';

@Controller('content')
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly learning: LearningService,
  ) {}

  @Get()
  async feed(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(FeedQuerySchema)) q: { kind?: 'card' | 'radar_pick'; topic?: string; limit: number },
  ): Promise<FeedResponse> {
    const [items, topics] = await Promise.all([
      this.content.listPublished(user.userId, q),
      this.content.listTopics(),
    ]);
    return { items, topics };
  }

  @Get(':idOrSlug')
  detail(@CurrentUser() user: AuthUser, @Param('idOrSlug') idOrSlug: string) {
    return this.content.getPublishedDetail(user.userId, idOrSlug);
  }

  @Post(':id/save')
  save(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.learning.save(user.userId, id);
  }

  @Delete(':id/save')
  unsave(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.learning.unsave(user.userId, id);
  }

  /** Explicit "tamamladım". Awards XP once per user+item; replays return xpAwarded = 0. */
  @Post(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string, @ReceivedAt() receivedAtMs: number) {
    return this.learning.complete(user.userId, id, receivedAtMs);
  }
}
