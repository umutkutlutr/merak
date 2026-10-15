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
  private authRetries = 0;
  private authRetryTimer: ReturnType<typeof setTimeout> | null = null;
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
    // auth as a callback: every handshake (first connect and each reconnect) asks for the current access
    // token, which auth-js refreshes, instead of replaying the token the screen was opened with.
    const socket = io(config.apiUrl, {
      auth: (cb) => void currentAccessToken().then((t) => cb({ token: t ?? '' })),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    this.socket = socket;
    socket.on('connect', () => {
      this.authRetries = 0;
      this.handlers.onConnection('connected');
      socket.emit(WS_EVENTS.subscribe, { sessionId: this.sessionId, participationToken: this.participationToken }, (ack: WsAck) => {
        if (ack.ok) this.applySnapshot(ack.snapshot);
        else if (isAuthCode(ack.code)) this.reconnectWithFreshToken();
        else this.handlers.onEvent('subscribe.error', { stateVersion: Number.MAX_SAFE_INTEGER, code: ack.code, message: ack.message });
      });
    });
    socket.io.on('reconnect_attempt', () => this.handlers.onConnection('reconnecting'));
    socket.on('disconnect', () => {
      this.handlers.onConnection('reconnecting');
      track('connection_interrupted', { quizSessionId: this.sessionId, props: { source: 'client_disconnect' } });
    });
    socket.on('connect_error', () => {
      this.handlers.onConnection('offline');
      // A handshake refused by the server's auth middleware is not retried by socket.io itself
      // (socket.active is false): retry with backoff; the auth callback fetches a refreshed token.
      if (!socket.active) this.scheduleAuthRetry();
    });
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
      } else if (isAuthCode(ack.code)) this.reconnectWithFreshToken();
    });
  }

  /** The socket's handshake identity expired: open a new handshake (subscribe + snapshot follow on 'connect'). */
  private reconnectWithFreshToken(): void {
    const socket = this.socket;
    if (!socket) return;
    this.handlers.onConnection('reconnecting');
    socket.disconnect();
    socket.connect();
  }

  private scheduleAuthRetry(): void {
    if (this.authRetryTimer || !this.socket) return;
    const delay = Math.min(1_000 * 2 ** this.authRetries, 15_000);
    this.authRetries += 1;
    this.authRetryTimer = setTimeout(() => {
      this.authRetryTimer = null;
      this.socket?.connect();
    }, delay);
  }

  private applySnapshot(s: SessionSnapshot): void {
    if (s.stateVersion < this.lastVersion) return;
    this.lastVersion = s.stateVersion;
    this.handlers.onSnapshot(s);
  }

  close(): void {
    if (this.authRetryTimer) clearTimeout(this.authRetryTimer);
    this.authRetryTimer = null;
    this.socket?.removeAllListeners();
    this.socket?.close();
    this.socket = null;
  }
}

function isAuthCode(code: string): boolean {
  return code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_INVALID_TOKEN' || code === 'AUTH_REQUIRED';
}
