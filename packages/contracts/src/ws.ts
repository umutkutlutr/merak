import { z } from 'zod';
import { ErrorCodeSchema, IsoDateTimeSchema, UuidSchema } from './common.js';
import {
  CancelReasonSchema,
  OpenQuestionViewSchema,
  RevealViewSchema,
  SessionSnapshotSchema,
} from './quiz.js';

/**
 * Socket.IO contract. Every server event carries `stateVersion` and `serverTime`.
 * Clients must drop events whose stateVersion is <= the last applied one for that session.
 */
export const WsEnvelopeSchema = z.object({
  sessionId: UuidSchema,
  stateVersion: z.number().int().nonnegative(),
  serverTime: IsoDateTimeSchema,
});

export const WsSessionStateEventSchema = WsEnvelopeSchema.extend({
  snapshot: SessionSnapshotSchema,
});
export const WsQuestionOpenedEventSchema = WsEnvelopeSchema.extend({
  question: OpenQuestionViewSchema,
});
export const WsQuestionRevealedEventSchema = WsEnvelopeSchema.extend({
  reveal: RevealViewSchema,
});
export const WsSessionCompletedEventSchema = WsEnvelopeSchema;
export const WsSessionCancelledEventSchema = WsEnvelopeSchema.extend({
  reason: CancelReasonSchema,
  message: z.string(),
});
export const WsLobbyEventSchema = WsEnvelopeSchema.extend({
  scheduledStartAt: IsoDateTimeSchema,
  participantCount: z.number().int().nonnegative(),
});

export const WsSubscribeInputSchema = z
  .object({ sessionId: UuidSchema, participationToken: z.string().min(16).max(256) })
  .strict();
export const WsResyncInputSchema = z.object({ sessionId: UuidSchema }).strict();

export const WsAckSchema = z.union([
  z.object({ ok: z.literal(true), snapshot: SessionSnapshotSchema }),
  z.object({ ok: z.literal(false), code: ErrorCodeSchema, message: z.string() }),
]);
export type WsAck = z.infer<typeof WsAckSchema>;

export const WS_EVENTS = {
  // server -> client
  sessionState: 'session.state',
  lobby: 'session.lobby',
  questionOpened: 'question.opened',
  questionRevealed: 'question.revealed',
  sessionCompleted: 'session.completed',
  sessionCancelled: 'session.cancelled',
  // client -> server (ack-based)
  subscribe: 'session.subscribe',
  unsubscribe: 'session.unsubscribe',
  resync: 'state.resync',
} as const;

export type ServerToClientEvents = {
  [WS_EVENTS.sessionState]: (e: z.infer<typeof WsSessionStateEventSchema>) => void;
  [WS_EVENTS.lobby]: (e: z.infer<typeof WsLobbyEventSchema>) => void;
  [WS_EVENTS.questionOpened]: (e: z.infer<typeof WsQuestionOpenedEventSchema>) => void;
  [WS_EVENTS.questionRevealed]: (e: z.infer<typeof WsQuestionRevealedEventSchema>) => void;
  [WS_EVENTS.sessionCompleted]: (e: z.infer<typeof WsSessionCompletedEventSchema>) => void;
  [WS_EVENTS.sessionCancelled]: (e: z.infer<typeof WsSessionCancelledEventSchema>) => void;
};

export type ClientToServerEvents = {
  [WS_EVENTS.subscribe]: (
    input: z.infer<typeof WsSubscribeInputSchema>,
    ack: (res: WsAck) => void,
  ) => void;
  [WS_EVENTS.unsubscribe]: (input: { sessionId: string }, ack?: (res: { ok: true }) => void) => void;
  [WS_EVENTS.resync]: (input: z.infer<typeof WsResyncInputSchema>, ack: (res: WsAck) => void) => void;
};
