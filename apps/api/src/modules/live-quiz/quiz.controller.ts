import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnswerSubmitInputSchema, JoinSessionInputSchema, type AnswerSubmitInput } from '@merak/contracts';
import { ZodValidationPipe } from '../../common/zod.pipe.js';
import { CurrentUser, ReceivedAt } from '../identity/auth.guard.js';
import type { AuthUser } from '../identity/jwt-verifier.js';
import { AnswersService } from './answers.service.js';
import { SessionsService } from './sessions.service.js';
import { ResultsService } from '../scoring-results/results.service.js';
import { ClockService } from '../../common/clock.js';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly answers: AnswersService,
    private readonly results: ResultsService,
    private readonly clock: ClockService,
  ) {}

  /** Next or active prize-less test session (never carries questions). */
  @Get('current')
  current(@CurrentUser() user: AuthUser) {
    return this.sessions.currentForUser(user.userId);
  }

  @Get('history')
  async history(@CurrentUser() user: AuthUser) {
    return { items: await this.sessions.myHistory(user.userId) };
  }

  @Get('sessions/:id')
  async summary(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const row = await this.sessions.getRow(id);
    const [pc, p] = await Promise.all([this.sessions.participantCount(id), this.sessions.findParticipant(id, user.userId)]);
    return {
      session: this.sessions.toSummary(row, pc),
      serverTime: this.clock.nowDate().toISOString(),
      myParticipation: p ? { participantId: p.id, eligibleFromPosition: p.eligibleFromPosition } : null,
    };
  }

  /** Creates (or resumes with the device token) the caller's participation. */
  @Post('sessions/:id/join')
  join(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(JoinSessionInputSchema)) body: { participationToken?: string },
  ) {
    return this.sessions.join(user.userId, id, body.participationToken);
  }

  /** Authoritative snapshot for resync. Never includes unopened questions or unrevealed keys. */
  @Get('sessions/:id/state')
  state(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessions.snapshot(id, { userId: user.userId, participantId: null });
  }

  @Throttle({ default: { limit: 30, ttl: 10_000 } })
  @Post('sessions/:id/answers')
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AnswerSubmitInputSchema)) body: AnswerSubmitInput,
    @ReceivedAt() receivedAtMs: number,
  ) {
    return this.answers.submit(user.userId, id, body, receivedAtMs);
  }

  /** Lost-ack recovery without resubmitting. */
  @Get('sessions/:id/answers/:idempotencyKey')
  receipt(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('idempotencyKey') key: string) {
    return this.answers.findByKey(user.userId, id, key);
  }

  @Get('sessions/:id/result')
  async result(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { result: await this.results.viewFor(id, user.userId) };
  }
}
