import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClockService } from './clock.js';

export interface RequestWithReceivedAt extends Request {
  receivedAtMs: number;
}

/**
 * Stamps the trusted server receipt time as early as possible (before auth, validation, DB).
 * Answer scoring uses this value, never the client's clock.
 */
@Injectable()
export class ReceivedAtMiddleware implements NestMiddleware {
  constructor(private readonly clock: ClockService) {}
  use(req: Request, _res: Response, next: NextFunction): void {
    (req as RequestWithReceivedAt).receivedAtMs = this.clock.now();
    next();
  }
}
