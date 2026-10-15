import { Inject, Injectable } from '@nestjs/common';
import { and, countDistinct, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import {
  ANALYTICS_SCHEMA_VERSION,
  type AnalyticsEventName,
  type ClientAnalyticsEventInput,
} from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import { analyticsEvents } from '../../db/schema/index.js';
import { newId } from '../../common/ids.js';
import { ClockService } from '../../common/clock.js';

export interface ServerEventInput {
  eventName: AnalyticsEventName;
  userId?: string | null;
  quizSessionId?: string | null;
  contentItemId?: string | null;
  props?: Record<string, string | number | boolean> | null;
  eventTime?: Date;
  eventId?: string;
}

const FORBIDDEN_PROP_KEY = /(token|secret|password|email|authorization|answer|correct|key)/i;
const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/** Drops personal/secret-looking props. Returns null when nothing survives. */
export function sanitizeProps(
  props: Record<string, string | number | boolean> | null | undefined,
): Record<string, string | number | boolean> | null {
  if (!props) return null;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (FORBIDDEN_PROP_KEY.test(k)) continue;
    if (typeof v === 'string' && (EMAIL_LIKE.test(v) || v.length > 200)) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: ClockService,
  ) {}

  /** Trusted server-produced event. Call inside the owning transaction when the fact is transactional. */
  async recordServerEvent(input: ServerEventInput, tx: DbOrTx = this.db): Promise<void> {
    await tx
      .insert(analyticsEvents)
      .values({
        id: input.eventId ?? newId(),
        schemaVersion: ANALYTICS_SCHEMA_VERSION,
        eventName: input.eventName,
        eventTime: input.eventTime ?? this.clock.nowDate(),
        producer: 'server',
        userId: input.userId ?? null,
        quizSessionId: input.quizSessionId ?? null,
        contentItemId: input.contentItemId ?? null,
        props: sanitizeProps(input.props),
      })
      .onConflictDoNothing();
  }

  /** Client-claimed events. Stored with producer='client' so analysts never confuse them with facts. */
  async ingestClientEvents(
    userId: string,
    events: ClientAnalyticsEventInput[],
  ): Promise<{ accepted: number; duplicates: number }> {
    const rows = events.map((e) => ({
      id: e.eventId,
      schemaVersion: e.schemaVersion,
      eventName: e.eventName,
      eventTime: new Date(e.eventTime),
      producer: 'client' as const,
      userId,
      quizSessionId: e.quizSessionId ?? null,
      contentItemId: e.contentItemId ?? null,
      props: sanitizeProps(e.props ?? null),
    }));
    const inserted = await this.db
      .insert(analyticsEvents)
      .values(rows)
      .onConflictDoNothing()
      .returning({ id: analyticsEvents.id });
    return { accepted: inserted.length, duplicates: rows.length - inserted.length };
  }

  /**
   * Example "active users" split used by the delivery report. Distinct users per Europe/Istanbul day:
   *  - quiz-active: answer_accepted OR quiz_completed (server facts)
   *  - culture-active: content_completed OR content_saved (server facts) — content_opened alone does not count
   * Sets may overlap; their sum is NOT a DAU.
   */
  async activeUsersByDay(fromInclusive: Date, toExclusive: Date): Promise<
    Array<{ day: string; quizActive: number; cultureActive: number; both: number }>
  > {
    const quizNames: AnalyticsEventName[] = ['answer_accepted', 'quiz_completed'];
    const cultureNames: AnalyticsEventName[] = ['content_completed', 'content_saved'];
    const day = sql<string>`to_char((${analyticsEvents.eventTime} at time zone 'Europe/Istanbul')::date, 'YYYY-MM-DD')`;
    const base = (names: AnalyticsEventName[]) =>
      this.db
        .select({ day: day.as('day'), userId: analyticsEvents.userId })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.producer, 'server'),
            inArray(analyticsEvents.eventName, names),
            gte(analyticsEvents.eventTime, fromInclusive),
            lt(analyticsEvents.eventTime, toExclusive),
          ),
        )
        .groupBy(day, analyticsEvents.userId);
    const quiz = await base(quizNames);
    const culture = await base(cultureNames);
    const days = new Map<string, { q: Set<string>; c: Set<string> }>();
    const get = (d: string) => {
      let v = days.get(d);
      if (!v) {
        v = { q: new Set(), c: new Set() };
        days.set(d, v);
      }
      return v;
    };
    for (const r of quiz) if (r.userId) get(r.day).q.add(r.userId);
    for (const r of culture) if (r.userId) get(r.day).c.add(r.userId);
    return [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, v]) => ({
        day: d,
        quizActive: v.q.size,
        cultureActive: v.c.size,
        both: [...v.q].filter((u) => v.c.has(u)).length,
      }));
  }

  async countByName(name: AnalyticsEventName, userId?: string): Promise<number> {
    const [row] = await this.db
      .select({ n: countDistinct(analyticsEvents.id) })
      .from(analyticsEvents)
      .where(
        userId
          ? and(eq(analyticsEvents.eventName, name), eq(analyticsEvents.userId, userId))
          : eq(analyticsEvents.eventName, name),
      );
    return Number(row?.n ?? 0);
  }
}
