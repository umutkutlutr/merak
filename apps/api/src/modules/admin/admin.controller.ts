import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import {
  AdminCancelSessionInputSchema,
  AdminContentInputSchema,
  AdminCreateSessionInputSchema,
  AdminQuestionInputSchema,
  ReviewActionSchema,
  ReviewTransitionInputSchema,
  type AdminContentInput,
  type AdminCreateSessionInput,
  type AdminQuestionInput,
  type AdminSession,
  type ReviewAction,
  type ReviewTransitionInput,
} from '@merak/contracts';
import { Inject } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/zod.pipe.js';
import { ClockService } from '../../common/clock.js';
import { DB } from '../../db/db.module.js';
import type { Db } from '../../db/client.js';
import { answerReceipts, questionRevisions, questions, quizSessions, sessionQuestions } from '../../db/schema/index.js';
import { AuditService } from '../admin-audit/audit.service.js';
import { ContentService } from '../editorial-content/content.service.js';
import { CurrentUser } from '../identity/auth.guard.js';
import type { AuthUser } from '../identity/jwt-verifier.js';
import { Roles } from '../identity/roles.guard.js';
import { EngineService } from '../live-quiz/engine.service.js';
import { SessionsService } from '../live-quiz/sessions.service.js';
import { QuizGateway } from '../live-quiz/quiz.gateway.js';
import { QuestionsService } from '../question-bank/questions.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { desc } from 'drizzle-orm';

const actionPipe = new ZodValidationPipe(ReviewActionSchema);

/**
 * Narrow editorial + test-session administration. Every route is role-checked on the server
 * (RolesGuard reads app.profiles.role). Editors review content/questions; admins also run sessions.
 */
@Controller('admin')
@Roles('editor', 'admin')
export class AdminController {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly content: ContentService,
    private readonly questions: QuestionsService,
    private readonly engine: EngineService,
    private readonly sessions: SessionsService,
    private readonly gateway: QuizGateway,
    private readonly audit: AuditService,
    private readonly analytics: AnalyticsService,
    private readonly clock: ClockService,
  ) {}

  // ---------- topics ----------
  @Get('topics')
  async topics() {
    return { items: await this.content.listTopics() };
  }

  // ---------- content ----------
  @Get('content')
  async listContent() {
    return { items: await this.content.adminList() };
  }

  @Post('content')
  createContent(@CurrentUser() u: AuthUser, @Body(new ZodValidationPipe(AdminContentInputSchema)) body: AdminContentInput) {
    return this.content.adminCreate(u.userId, body);
  }

  @Patch('content/:id')
  updateContent(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(AdminContentInputSchema)) body: AdminContentInput) {
    return this.content.adminUpdate(u.userId, id, body);
  }

  @Post('content/:id/:action')
  transitionContent(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Param('action', actionPipe) action: ReviewAction,
    @Body(new ZodValidationPipe(ReviewTransitionInputSchema)) body: ReviewTransitionInput,
  ) {
    return this.content.adminTransition(u.userId, id, action, body);
  }

  // ---------- questions ----------
  @Get('questions')
  async listQuestions() {
    return { items: await this.questions.adminList() };
  }

  @Get('questions/:id')
  getQuestion(@Param('id') id: string) {
    return this.questions.adminGet(id);
  }

  @Post('questions')
  createQuestion(@CurrentUser() u: AuthUser, @Body(new ZodValidationPipe(AdminQuestionInputSchema)) body: AdminQuestionInput) {
    return this.questions.adminCreate(u.userId, body);
  }

  @Patch('questions/:id')
  updateQuestion(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(AdminQuestionInputSchema)) body: AdminQuestionInput) {
    return this.questions.adminUpdate(u.userId, id, body);
  }

  @Post('questions/:id/:action')
  transitionQuestion(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Param('action', actionPipe) action: ReviewAction,
    @Body(new ZodValidationPipe(ReviewTransitionInputSchema)) body: ReviewTransitionInput,
  ) {
    return this.questions.adminTransition(u.userId, id, action, body);
  }

  // ---------- sessions (admin only) ----------
  @Roles('admin')
  @Get('sessions')
  async listSessions() {
    const rows = await this.db.select().from(quizSessions).orderBy(desc(quizSessions.scheduledStartAt)).limit(50);
    const items: AdminSession[] = [];
    for (const r of rows) items.push(await this.adminSession(r));
    return { items };
  }

  @Roles('admin')
  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.adminSession(await this.sessions.getRow(id));
  }

  @Roles('admin')
  @Post('sessions')
  async createSession(@CurrentUser() u: AuthUser, @Body(new ZodValidationPipe(AdminCreateSessionInputSchema)) body: AdminCreateSessionInput) {
    const id = await this.engine.create(u.userId, body, this.clock.nowDate());
    return this.adminSession(await this.sessions.getRow(id));
  }

  @Roles('admin')
  @Post('sessions/:id/cancel')
  async cancelSession(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(AdminCancelSessionInputSchema)) body: { reason: string }) {
    const t = await this.engine.cancel(id, 'admin_cancelled', body.reason, u.userId, this.clock.nowDate());
    if (t) await this.gateway.broadcast(t);
    return this.adminSession(await this.sessions.getRow(id));
  }

  // ---------- audit & analytics ----------
  @Get('audit')
  async auditLog(@Query('limit') limit?: string) {
    return { items: await this.audit.list(Math.min(Number(limit) || 100, 500)) };
  }

  @Roles('admin')
  @Get('analytics/active-users')
  async activeUsers(@Query('days') days?: string) {
    const n = Math.min(Math.max(Number(days) || 7, 1), 90);
    const to = this.clock.nowDate();
    const from = new Date(to.getTime() - n * 86_400_000);
    return { from: from.toISOString(), to: to.toISOString(), rows: await this.analytics.activeUsersByDay(from, to) };
  }

  private async adminSession(r: typeof quizSessions.$inferSelect): Promise<AdminSession> {
    const pc = await this.sessions.participantCount(r.id);
    const sq = await this.db
      .select({ sq: sessionQuestions, prompt: questionRevisions.prompt, version: questionRevisions.version, q: questions })
      .from(sessionQuestions)
      .innerJoin(questionRevisions, eq(questionRevisions.id, sessionQuestions.questionRevisionId))
      .innerJoin(questions, eq(questions.id, sessionQuestions.questionId))
      .where(eq(sessionQuestions.sessionId, r.id));
    const [ac] = await this.db.select({ n: count() }).from(answerReceipts).where(and(eq(answerReceipts.sessionId, r.id)));
    const answerCount = ac?.n ?? 0;
    return {
      ...this.sessions.toSummary(r, pc),
      questions: sq
        .sort((a, b) => a.sq.position - b.sq.position)
        .map((x) => ({
          sessionQuestionId: x.sq.id,
          position: x.sq.position,
          questionId: x.sq.questionId,
          questionRevisionId: x.sq.questionRevisionId,
          revisionVersion: x.version,
          prompt: x.prompt,
          status: x.sq.status,
          opensAt: x.sq.opensAt?.toISOString() ?? null,
          closesAt: x.sq.closesAt?.toISOString() ?? null,
          revisionStillValid:
            ['approved', 'published'].includes(x.q.status) && x.q.approvedRevisionId === x.sq.questionRevisionId && x.q.currentRevisionId === x.sq.questionRevisionId,
        })),
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      answerCount: Number(answerCount ?? 0),
    };
  }
}
