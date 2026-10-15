import { io, type Socket } from 'socket.io-client';
import { WS_EVENTS, type SessionSnapshot, type WsAck } from '@merak/contracts';
import { currentAccessToken } from './auth';
import { config } from './config';
import { track } from './analytics';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

/**
 * Thin Socket.IO wrapper. Transport only: the server snapshot is the truth, every event carries a
 * stateVersion and anything older than what we already applied is dropped.
 */
export class QuizSocket {
  private socket: Socket | null = null;
  private lastVersion = -1;
  constructor(
    private readonly sessionId: string,
    private readonly participationToken: string,
    private readonly handlers: {
      onConnection: (s: ConnectionState) => void;
      onSnapshot: (s: SessionSnapshot) => void;
      onEvent: (name: string, payload: { stateVersion: number; [k: string]: unknown }) => void;
    },
  ) {}

  async connect(): Promise<void> {
    const token = await currentAccessToken();
    if (!token) throw new Error('AUTH_REQUIRED');
    this.handlers.onConnection('connecting');
    const socket = io(config.apiUrl, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 500, reconnectionDelayMax: 5000 });
    this.socket = socket;
    socket.on('connect', () => {
      this.handlers.onConnection('connected');
      socket.emit(WS_EVENTS.subscribe, { sessionId: this.sessionId, participationToken: this.participationToken }, (ack: WsAck) => {
        if (ack.ok) this.applySnapshot(ack.snapshot);
        else this.handlers.onEvent('subscribe.error', { stateVersion: Number.MAX_SAFE_INTEGER, code: ack.code, message: ack.message });
      });
    });
    socket.io.on('reconnect_attempt', async () => {
      this.handlers.onConnection('reconnecting');
      const fresh = await currentAccessToken();
      if (fresh) socket.auth = { token: fresh };
    });
    socket.on('disconnect', () => {
      this.handlers.onConnection('reconnecting');
      track('connection_interrupted', { quizSessionId: this.sessionId, props: { source: 'client_disconnect' } });
    });
    socket.on('connect_error', () => this.handlers.onConnection('offline'));
    for (const name of [WS_EVENTS.lobby, WS_EVENTS.questionOpened, WS_EVENTS.questionRevealed, WS_EVENTS.sessionCompleted, WS_EVENTS.sessionCancelled]) {
      socket.on(name, (payload: { stateVersion: number }) => {
        if (typeof payload?.stateVersion !== 'number' || payload.stateVersion <= this.lastVersion) return; // stale/duplicate
        this.lastVersion = payload.stateVersion;
        this.handlers.onEvent(name, payload);
      });
    }
  }

  /** Ask for the authoritative snapshot (used after reconnects and when a timer expires without an event). */
  resync(): void {
    const socket = this.socket;
    if (!socket?.connected) return;
    socket.emit(WS_EVENTS.resync, { sessionId: this.sessionId }, (ack: WsAck) => {
      if (ack.ok) {
        this.applySnapshot(ack.snapshot);
        track('state_resynced', { quizSessionId: this.sessionId, props: { stateVersion: ack.snapshot.stateVersion } });
      }
    });
  }

  private applySnapshot(s: SessionSnapshot): void {
    if (s.stateVersion < this.lastVersion) return;
    this.lastVersion = s.stateVersion;
    this.handlers.onSnapshot(s);
  }

  close(): void {
    this.socket?.removeAllListeners();
    this.socket?.close();
    this.socket = null;
  }
}
