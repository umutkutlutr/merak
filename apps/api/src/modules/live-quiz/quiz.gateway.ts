import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import { eq } from 'drizzle-orm';
import {
  errorMessagesTr,
  WS_EVENTS,
  WsResyncInputSchema,
  WsSubscribeInputSchema,
  type MyAnswerView,
  type WsAck,
} from '@merak/contracts';
import { AppError } from '../../common/errors.js';
import { ClockService } from '../../common/clock.js';
import { getEnv } from '../../config/env.js';
import { JwtVerifier, type AuthUser } from '../identity/jwt-verifier.js';
import { QuestionsService } from '../question-bank/questions.service.js';
import { sessionQuestions } from '../../db/schema/index.js';
import type { Transition } from './engine.service.js';
import { SessionsService } from './sessions.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { DB } from '../../db/db.module.js';
import type { Db } from '../../db/client.js';
import { Inject } from '@nestjs/common';

interface Member {
  userId: string;
  participantId: string;
}

const roomName = (sessionId: string) => `session:${sessionId}`;

/**
 * Socket.IO is a transport, not a guarantee. The DB is the source of truth; every event carries
 * stateVersion + serverTime and the client can always ask for a full snapshot (`state.resync`).
 * Payloads are personalised per socket (option order, own answer), so broadcasts iterate members.
 */
@Injectable()
@WebSocketGateway({
  cors: { origin: getEnv().corsOrigins.length ? getEnv().corsOrigins : true, credentials: true },
  path: '/socket.io',
})
export class QuizGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly rooms = new Map<string, Map<string, Member>>();

  constructor(
    private readonly verifier: JwtVerifier,
    private readonly sessions: SessionsService,
    private readonly questions: QuestionsService,
    private readonly clock: ClockService,
    private readonly analytics: AnalyticsService,
    private readonly logger: Logger,
    @Inject(DB) private readonly db: Db,
  ) {}

  afterInit(server: Server): void {
    // Handshake auth: unauthenticated sockets never reach a handler.
    server.use(async (socket, next) => {
      const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
      if (!token) return next(new Error('AUTH_REQUIRED'));
      try {
        (socket.data as { auth: AuthUser }).auth = await this.verifier.verify(token);
        next();
      } catch (err) {
        next(new Error(err instanceof AppError ? err.code : 'AUTH_INVALID_TOKEN'));
      }
    });
  }

  handleConnection(socket: Socket): void {
    this.logger.debug({ socketId: socket.id, userId: this.authOf(socket)?.userId }, 'ws connected', 'QuizGateway');
  }

  handleDisconnect(socket: Socket): void {
    for (const [sessionId, members] of this.rooms) {
      const m = members.get(socket.id);
      if (m) {
        members.delete(socket.id);
        void this.analytics.recordServerEvent({ eventName: 'connection_interrupted', userId: m.userId, quizSessionId: sessionId, props: { source: 'ws_disconnect' } });
      }
      if (members.size === 0) this.rooms.delete(sessionId);
    }
  }

  @SubscribeMessage(WS_EVENTS.subscribe)
  async subscribe(@ConnectedSocket() socket: Socket, @MessageBody() raw: unknown): Promise<WsAck> {
    try {
      const input = WsSubscribeInputSchema.parse(raw);
      const auth = this.requireAuth(socket);
      const participant = await this.sessions.requireParticipant(input.sessionId, auth.userId, input.participationToken);
      await socket.join(roomName(input.sessionId));
      let members = this.rooms.get(input.sessionId);
      if (!members) {
        members = new Map();
        this.rooms.set(input.sessionId, members);
      }
      members.set(socket.id, { userId: auth.userId, participantId: participant.id });
      const snapshot = await this.sessions.snapshot(input.sessionId, { userId: auth.userId, participantId: participant.id });
      return { ok: true, snapshot };
    } catch (err) {
      return this.toAck(err);
    }
  }

  @SubscribeMessage(WS_EVENTS.resync)
  async resync(@ConnectedSocket() socket: Socket, @MessageBody() raw: unknown): Promise<WsAck> {
    try {
      const input = WsResyncInputSchema.parse(raw);
      const auth = this.requireAuth(socket);
      const member = this.rooms.get(input.sessionId)?.get(socket.id);
      if (!member) throw new AppError('NOT_PARTICIPANT', 'Önce oturuma abone ol.');
      const snapshot = await this.sessions.snapshot(input.sessionId, { userId: auth.userId, participantId: member.participantId });
      await this.analytics.recordServerEvent({ eventName: 'state_resynced', userId: auth.userId, quizSessionId: input.sessionId, props: { stateVersion: snapshot.stateVersion } });
      return { ok: true, snapshot };
    } catch (err) {
      return this.toAck(err);
    }
  }

  @SubscribeMessage(WS_EVENTS.unsubscribe)
  async unsubscribe(@ConnectedSocket() socket: Socket, @MessageBody() raw: { sessionId?: string }): Promise<{ ok: true }> {
    const sessionId = typeof raw?.sessionId === 'string' ? raw.sessionId : null;
    if (sessionId) {
      await socket.leave(roomName(sessionId));
      this.rooms.get(sessionId)?.delete(socket.id);
    }
    return { ok: true };
  }

  /** Called by the scheduler after each committed transition. */
  async broadcast(t: Transition): Promise<void> {
    const members = this.rooms.get(t.sessionId);
    const serverTime = this.clock.nowDate().toISOString();
    const envelope = { sessionId: t.sessionId, stateVersion: t.stateVersion, serverTime };
    if (!this.server) return;
    if (!members || members.size === 0) return;
    const session = await this.sessions.getRow(t.sessionId);

    switch (t.kind) {
      case 'lobby': {
        const participantCount = await this.sessions.participantCount(t.sessionId);
        this.server.to(roomName(t.sessionId)).emit(WS_EVENTS.lobby, { ...envelope, scheduledStartAt: session.scheduledStartAt.toISOString(), participantCount });
        return;
      }
      case 'opened': {
        const sq = await this.sessionQuestion(t.sessionQuestionId);
        const view = await this.questions.publicView(sq.questionRevisionId);
        for (const [socketId, m] of members) {
          this.server.to(socketId).emit(WS_EVENTS.questionOpened, { ...envelope, question: this.sessions.toOpenView(sq, view, m.participantId) });
        }
        return;
      }
      case 'revealed': {
        const sq = await this.sessionQuestion(t.sessionQuestionId);
        const rv = await this.questions.revealView(sq.questionRevisionId);
        const receipts = await this.sessions.receiptsForQuestion(sq.id);
        for (const [socketId, m] of members) {
          const r = receipts.get(m.participantId);
          const myAnswer: MyAnswerView | null = r
            ? { receiptId: r.id, sessionQuestionId: r.sessionQuestionId, position: sq.position, optionId: r.optionId, receivedAt: r.receivedAt.toISOString(), elapsedMs: r.elapsedMs, isCorrect: r.isCorrect, points: r.points }
            : null;
          this.server.to(socketId).emit(WS_EVENTS.questionRevealed, { ...envelope, reveal: this.sessions.toRevealView(sq, rv, m.participantId, myAnswer, session) });
        }
        return;
      }
      case 'completed':
        this.server.to(roomName(t.sessionId)).emit(WS_EVENTS.sessionCompleted, envelope);
        return;
      case 'cancelled':
        this.server.to(roomName(t.sessionId)).emit(WS_EVENTS.sessionCancelled, { ...envelope, reason: t.reason, message: t.detail ?? errorMessagesTr.SESSION_CANCELLED });
        return;
    }
  }

  memberCount(sessionId: string): number {
    return this.rooms.get(sessionId)?.size ?? 0;
  }

  private async sessionQuestion(id: string) {
    const [sq] = await this.db.select().from(sessionQuestions).where(eq(sessionQuestions.id, id)).limit(1);
    if (!sq) throw new AppError('NOT_FOUND');
    return sq;
  }

  private authOf(socket: Socket): AuthUser | undefined {
    return (socket.data as { auth?: AuthUser }).auth;
  }

  private requireAuth(socket: Socket): AuthUser {
    const auth = this.authOf(socket);
    if (!auth) throw new AppError('AUTH_REQUIRED');
    // The handshake token was valid when the socket connected; an expired one may not keep using it
    // (same 5 s tolerance as the verifier). Wall clock on purpose: token expiry is not quiz time.
    if (auth.expiresAtMs !== null && Date.now() > auth.expiresAtMs + 5_000) throw new AppError('AUTH_TOKEN_EXPIRED');
    return auth;
  }

  private toAck(err: unknown): WsAck {
    if (err instanceof AppError) return { ok: false, code: err.code, message: (err.getResponse() as { message: string }).message };
    if ((err as { name?: string })?.name === 'ZodError') return { ok: false, code: 'VALIDATION_FAILED', message: errorMessagesTr.VALIDATION_FAILED };
    this.logger.error({ err }, 'ws handler failed', 'QuizGateway');
    return { ok: false, code: 'INTERNAL', message: errorMessagesTr.INTERNAL };
  }
}
