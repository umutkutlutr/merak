import type { ErrorCode } from '@merak/contracts';
import { accessToken } from './auth';

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public readonly code: ErrorCode | 'NETWORK', message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
  }
}

export async function api<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const token = await accessToken();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('NETWORK', `API'ye ulaşılamadı (${base}).`, 0);
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(json?.error?.code ?? 'INTERNAL', json?.error?.message ?? `HTTP ${res.status}`, res.status, json?.error?.details);
  return json as T;
}

export function errText(e: unknown): string {
  if (e instanceof ApiError) return `${e.message}${e.details ? ' — ' + JSON.stringify(e.details) : ''}`;
  return (e as Error)?.message ?? 'Hata';
}

/** Approval provenance shown next to every approved question; a test approval is never human review. */
export function approvalKindLabel(kind: 'editor_review' | 'automated_test' | null): string {
  if (kind === 'automated_test') return 'TEST ONAYI (insan incelemesi değil)';
  if (kind === 'editor_review') return 'editör onayı';
  return '—';
}
