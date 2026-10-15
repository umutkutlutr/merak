import { Injectable } from '@nestjs/common';

/**
 * Single time authority for the API process. All live-quiz timestamps (opensAt, closesAt,
 * receivedAt) come from here, never from the database clock or the client.
 */
@Injectable()
export class ClockService {
  private frozenAt: number | null = null;
  now(): number {
    return this.frozenAt ?? Date.now();
  }
  nowDate(): Date {
    return new Date(this.now());
  }
  /** Test-only: freeze the process clock at an exact instant (null = wall clock). */
  __freezeForTests(atMs: number | null): void {
    // Not reachable over HTTP/WS; refuse outright in production builds as defence in depth.
    if (process.env.NODE_ENV === 'production') throw new Error('Clock freezing is disabled in production');
    this.frozenAt = atMs;
  }
}
