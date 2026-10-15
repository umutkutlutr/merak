import { errorMessagesTr, type ErrorCode } from '@merak/contracts';
import { currentAccessToken } from './auth';
import { config } from './config';

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode | 'NETWORK',
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && /network|fetch/i.test(err.message)) return 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.';
  return errorMessagesTr.INTERNAL;
}

export async function api<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const token = await currentAccessToken();
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('NETWORK', 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.', 0);
  }
  const text = await res.text();
  const json = text ? (JSON.parse(text) as T & { error?: { code: ErrorCode; message: string; details?: unknown } }) : (null as T);
  if (!res.ok) {
    const e = (json as { error?: { code: ErrorCode; message: string; details?: unknown } } | null)?.error;
    throw new ApiError(e?.code ?? 'INTERNAL', e?.message ?? errorMessagesTr.INTERNAL, res.status, e?.details);
  }
  return json;
}
