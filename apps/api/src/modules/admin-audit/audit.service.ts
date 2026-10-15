import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { AdminAuditEntry } from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import { adminAuditLog, profiles } from '../../db/schema/index.js';

export interface AuditInput {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Record inside the same transaction as the change it describes. */
  async record(input: AuditInput, tx: DbOrTx = this.db): Promise<void> {
    await tx.insert(adminAuditLog).values({
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      reason: input.reason ?? null,
      metadata: input.metadata ?? null,
    });
  }

  async list(limit = 100): Promise<AdminAuditEntry[]> {
    const rows = await this.db
      .select({
        id: adminAuditLog.id,
        actorUserId: adminAuditLog.actorUserId,
        actorUsername: profiles.username,
        action: adminAuditLog.action,
        targetType: adminAuditLog.targetType,
        targetId: adminAuditLog.targetId,
        reason: adminAuditLog.reason,
        metadata: adminAuditLog.metadata,
        createdAt: adminAuditLog.createdAt,
      })
      .from(adminAuditLog)
      .leftJoin(profiles, eq(profiles.id, adminAuditLog.actorUserId))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      ...r,
      actorUsername: r.actorUsername ?? null,
      metadata: (r.metadata as Record<string, unknown> | null) ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
