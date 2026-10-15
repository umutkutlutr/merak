import { Injectable } from '@nestjs/common';

/**
 * Single time authority for the API process. All live-quiz timestamps (opensAt, closesAt,
 * receivedAt) come from here, never from the database clock or the client.
 */
@Injectable()
export class ClockService {
  private offsetMs = 0;
  now(): number {
    return Date.now() + this.offsetMs;
  }
  nowDate(): Date {
    return new Date(this.now());
  }
  /** Test-only: shift the process clock (used by boundary tests). */
  __setOffsetForTests(offsetMs: number): void {
    this.offsetMs = offsetMs;
  }
}
