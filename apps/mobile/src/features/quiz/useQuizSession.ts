import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnswerReceipt, JoinSessionResponse, OpenQuestionView, QuizSessionSummary, RevealView, SessionResultView, SessionSnapshot } from '@merak/contracts';
import { WS_EVENTS } from '@merak/contracts';
import { api, ApiError, describeError } from '@/lib/api';
import { serverNow, syncClock } from '@/lib/clock';
import { QuizSocket, type ConnectionState } from '@/lib/socket';
import { participationStore } from '@/lib/storage';
import { newUuid } from '@/lib/uuid';

export type Phase = 'loading' | 'error' | 'preview' | 'joining' | 'scheduled' | 'lobby' | 'question' | 'expired' | 'reveal' | 'completed' | 'cancelled';

export interface AnswerState {
  status: 'idle' | 'submitting' | 'accepted' | 'rejected' | 'unknown';
  optionId: string | null;
  message: string | null;
  receipt: AnswerReceipt | null;
  idempotencyKey: string;
}

export interface QuizState {
  phase: Phase;
  session: QuizSessionSummary | null;
  participantId: string | null;
  eligibleFromPosition: number;
  connection: ConnectionState;
  question: OpenQuestionView | null;
  reveal: RevealView | null;
  answer: AnswerState | null;
  result: SessionResultView | null;
  error: string | null;
  cancelMessage: string | null;
  lastSyncedAt: number;
}

const freshAnswer = (): AnswerState => ({ status: 'idle', optionId: null, message: null, receipt: null, idempotencyKey: newUuid() });

/** Watchdog: when an expected server transition does not arrive within this window, ask for a snapshot. */
const WATCHDOG_MS = 1500;

export function useQuizSession(sessionId: string) {
  const [state, setState] = useState<QuizState>({ phase: 'loading', session: null, participantId: null, eligibleFromPosition: 1, connection: 'offline', question: null, reveal: null, answer: null, result: null, error: null, cancelMessage: null, lastSyncedAt: 0 });
  const socketRef = useRef<QuizSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const answersRef = useRef<Map<string, AnswerState>>(new Map());
  const [, forceTick] = useState(0);

  const answerFor = (sqId: string): AnswerState => {
    let a = answersRef.current.get(sqId);
    if (!a) {
      a = freshAnswer();
      answersRef.current.set(sqId, a);
    }
    return a;
  };
  const setAnswer = (sqId: string, patch: Partial<AnswerState>) => {
    const next = { ...answerFor(sqId), ...patch };
    answersRef.current.set(sqId, next);
    setState((s) => (s.question?.sessionQuestionId === sqId ? { ...s, answer: next } : s));
  };

  const applySnapshot = useCallback((snap: SessionSnapshot) => {
    // Previously accepted answers (from the authoritative snapshot) win over local guesses.
    for (const a of snap.myParticipation?.answers ?? []) {
      const cur = answersRef.current.get(a.sessionQuestionId);
      answersRef.current.set(a.sessionQuestionId, {
        status: 'accepted',
        optionId: a.optionId,
        message: null,
        receipt: { status: 'accepted', receiptId: a.receiptId, sessionQuestionId: a.sessionQuestionId, position: a.position, optionId: a.optionId, receivedAt: a.receivedAt, replayed: true },
        idempotencyKey: cur?.idempotencyKey ?? newUuid(),
      });
    }
    setState((s) => {
      const session = snap.session;
      let phase: Phase = s.phase;
      let question: OpenQuestionView | null = null;
      let reveal: RevealView | null = null;
      let result: SessionResultView | null = snap.result;
      if (session.status === 'scheduled') phase = 'scheduled';
      else if (session.status === 'lobby') phase = 'lobby';
      else if (session.status === 'cancelled') phase = 'cancelled';
      else if (session.status === 'completed') phase = 'completed';
      else if (session.status === 'live') {
        const cq = snap.currentQuestion;
        if (cq?.open && Date.parse(cq.open.closesAt) > serverNow()) {
          phase = 'question';
          question = cq.open;
        } else if (cq?.reveal) {
          phase = 'reveal';
          reveal = cq.reveal;
        } else phase = 'expired';
      }
      const answer = question ? answerFor(question.sessionQuestionId) : reveal ? answersRef.current.get(reveal.sessionQuestionId) ?? null : null;
      return {
        ...s,
        phase,
        session,
        participantId: snap.myParticipation?.participantId ?? s.participantId,
        eligibleFromPosition: snap.myParticipation?.eligibleFromPosition ?? s.eligibleFromPosition,
        question,
        reveal,
        answer,
        result: result ?? s.result,
        cancelMessage: session.status === 'cancelled' ? s.cancelMessage : null,
        lastSyncedAt: Date.now(),
      };
    });
  }, []);

  const loadResult = useCallback(async () => {
    try {
      const r = await api<{ result: SessionResultView }>('GET', `/quiz/sessions/${sessionId}/result`);
      setState((s) => ({ ...s, result: r.result, phase: 'completed' }));
    } catch (e) {
      setState((s) => ({ ...s, error: describeError(e) }));
    }
  }, [sessionId]);

  const openSocket = useCallback(
    async (token: string) => {
      socketRef.current?.close();
      const sock = new QuizSocket(sessionId, token, {
        onConnection: (c) => setState((s) => ({ ...s, connection: c })),
        onSnapshot: applySnapshot,
        onEvent: (name, payload) => {
          if (name === WS_EVENTS.lobby) {
            setState((s) => (s.session ? { ...s, phase: 'lobby', session: { ...s.session, status: 'lobby', stateVersion: payload.stateVersion, participantCount: payload.participantCount as number } } : s));
          } else if (name === WS_EVENTS.questionOpened) {
            const q = payload.question as OpenQuestionView;
            setState((s) => ({ ...s, phase: 'question', question: q, reveal: null, answer: answerFor(q.sessionQuestionId), session: s.session ? { ...s.session, status: 'live', stateVersion: payload.stateVersion, currentQuestionPosition: q.position } : s.session, lastSyncedAt: Date.now() }));
          } else if (name === WS_EVENTS.questionRevealed) {
            const r = payload.reveal as RevealView;
            if (r.myAnswer) {
              answersRef.current.set(r.sessionQuestionId, { ...answerFor(r.sessionQuestionId), status: 'accepted', optionId: r.myAnswer.optionId });
            }
            setState((s) => ({ ...s, phase: 'reveal', reveal: r, question: null, answer: answersRef.current.get(r.sessionQuestionId) ?? null, session: s.session ? { ...s.session, stateVersion: payload.stateVersion } : s.session, lastSyncedAt: Date.now() }));
          } else if (name === WS_EVENTS.sessionCompleted) {
            setState((s) => ({ ...s, phase: 'completed', question: null, session: s.session ? { ...s.session, status: 'completed', stateVersion: payload.stateVersion } : s.session }));
            void loadResult();
          } else if (name === WS_EVENTS.sessionCancelled) {
            setState((s) => ({ ...s, phase: 'cancelled', question: null, cancelMessage: String(payload.message ?? ''), session: s.session ? { ...s.session, status: 'cancelled', stateVersion: payload.stateVersion, cancelledReason: payload.reason as QuizSessionSummary['cancelledReason'] } : s.session }));
          } else if (name === 'subscribe.error') {
            setState((s) => ({ ...s, error: String(payload.message ?? 'Abonelik başarısız') }));
          }
        },
      });
      socketRef.current = sock;
      await sock.connect();
    },
    [sessionId, applySnapshot, loadResult],
  );

  const join = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'joining', error: null }));
    try {
      await syncClock();
      const stored = tokenRef.current ?? (await participationStore.get(sessionId));
      const res = await api<JoinSessionResponse>('POST', `/quiz/sessions/${sessionId}/join`, stored ? { participationToken: stored } : {});
      tokenRef.current = res.participationToken;
      await participationStore.set(sessionId, res.participationToken);
      setState((s) => ({ ...s, participantId: res.participantId, eligibleFromPosition: res.eligibleFromPosition }));
      applySnapshot(res.snapshot);
      await openSocket(res.participationToken);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : null;
      if (code === 'SESSION_COMPLETED') {
        await loadResult();
        return;
      }
      setState((s) => ({ ...s, phase: code === 'SESSION_CANCELLED' ? 'cancelled' : 'preview', error: describeError(e), cancelMessage: code === 'SESSION_CANCELLED' ? describeError(e) : s.cancelMessage }));
    }
  }, [sessionId, applySnapshot, openSocket, loadResult]);

  // Initial load: summary, then auto-resume when this device already holds a participation token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api<{ session: QuizSessionSummary; myParticipation: { participantId: string } | null }>('GET', `/quiz/sessions/${sessionId}`);
        if (cancelled) return;
        const stored = await participationStore.get(sessionId);
        tokenRef.current = stored;
        setState((s) => ({ ...s, session: r.session, phase: r.session.status === 'cancelled' ? 'cancelled' : r.session.status === 'completed' ? 'completed' : 'preview' }));
        if (r.session.status === 'completed') {
          await loadResult();
          return;
        }
        if (r.session.status === 'cancelled') return;
        if (stored && r.myParticipation) await join();
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, phase: 'error', error: describeError(e) }));
      }
    })();
    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Display timer + watchdogs (device timers never decide state; they only trigger a resync).
  useEffect(() => {
    const t = setInterval(() => {
      forceTick((n) => n + 1);
      const now = serverNow();
      setState((s) => {
        if (s.phase === 'question' && s.question && Date.parse(s.question.closesAt) <= now) return { ...s, phase: 'expired', lastSyncedAt: Date.now() };
        return s;
      });
      const s = stateRef.current;
      const since = Date.now() - s.lastSyncedAt;
      const overdue =
        (s.phase === 'expired' && since > WATCHDOG_MS) ||
        (s.phase === 'reveal' && s.reveal?.nextOpensAt && Date.parse(s.reveal.nextOpensAt) + WATCHDOG_MS < now && since > WATCHDOG_MS) ||
        (s.phase === 'reveal' && !s.reveal?.nextOpensAt && since > 5 * WATCHDOG_MS) ||
        (s.phase === 'lobby' && s.session && Date.parse(s.session.scheduledStartAt) + WATCHDOG_MS < now && since > WATCHDOG_MS) ||
        (s.phase === 'scheduled' && s.session && Date.parse(s.session.lobbyOpensAt) + WATCHDOG_MS < now && since > WATCHDOG_MS);
      if (overdue && socketRef.current) {
        stateRef.current = { ...s, lastSyncedAt: Date.now() };
        setState((x) => ({ ...x, lastSyncedAt: Date.now() }));
        socketRef.current.resync();
      }
    }, 100);
    return () => clearInterval(t);
  }, []);
  const stateRef = useRef(state);
  stateRef.current = state;

  const submit = useCallback(
    async (optionId: string) => {
      const s = stateRef.current;
      const q = s.question;
      const token = tokenRef.current;
      if (!q || !token || s.phase !== 'question') return;
      const a = answerFor(q.sessionQuestionId);
      if (a.status === 'accepted' || a.status === 'submitting') return;
      setAnswer(q.sessionQuestionId, { status: 'submitting', optionId, message: null });
      const body = { sessionQuestionId: q.sessionQuestionId, optionId, idempotencyKey: a.idempotencyKey, participationToken: token, clientSentAt: new Date().toISOString() };
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const receipt = await api<AnswerReceipt>('POST', `/quiz/sessions/${sessionId}/answers`, body);
          setAnswer(q.sessionQuestionId, { status: 'accepted', optionId: receipt.optionId, receipt, message: receipt.replayed ? 'Cevabın zaten kayıtlıydı.' : null });
          // Accepted after the reveal reached us (sent before close, processed after): refresh the reveal.
          if (stateRef.current.phase !== 'question') socketRef.current?.resync();
          return;
        } catch (e) {
          if (e instanceof ApiError && e.code !== 'NETWORK') {
            if (e.code === 'ANSWER_ALREADY_ACCEPTED') {
              socketRef.current?.resync();
              setAnswer(q.sessionQuestionId, { status: 'accepted', message: e.message });
            } else setAnswer(q.sessionQuestionId, { status: 'rejected', message: e.message });
            return;
          }
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      }
      // Delivery unknown: never pretend success. The same key is reused on the next tap or resync.
      setAnswer(q.sessionQuestionId, { status: 'unknown', message: 'Cevabın iletilemedi; bağlantı gelince aynı cevapla tekrar denenir.' });
    },
    [sessionId],
  );

  const retryUnknown = useCallback(() => {
    const s = stateRef.current;
    if (s.answer?.status === 'unknown' && s.answer.optionId) {
      answersRef.current.set(s.question?.sessionQuestionId ?? '', { ...s.answer, status: 'idle' });
      void submit(s.answer.optionId);
    }
  }, [submit]);

  const resync = useCallback(() => socketRef.current?.resync(), []);
  const remainingMs = useMemo(() => (state.question ? Math.max(0, Date.parse(state.question.closesAt) - serverNow()) : 0), [state.question, state.lastSyncedAt]);

  return { state, join, submit, retryUnknown, resync, loadResult, remainingMs, now: serverNow() };
}
