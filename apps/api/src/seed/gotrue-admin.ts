import { SignJWT } from 'jose';

/** Minimal Supabase Auth (GoTrue) admin client used by the seed. Local/dev only. */
export class GoTrueAdmin {
  constructor(
    private readonly baseUrl: string,
    private readonly serviceToken: string,
  ) {}

  static async create(baseUrl: string, env: { serviceRoleKey?: string; jwtSecret?: string; issuer: string; audience: string }) {
    if (env.serviceRoleKey) return new GoTrueAdmin(baseUrl, env.serviceRoleKey);
    if (!env.jwtSecret) throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_JWT_SECRET is required for seeding users');
    const token = await new SignJWT({ role: 'service_role' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(env.issuer)
      .setAudience(env.audience)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(new TextEncoder().encode(env.jwtSecret));
    return new GoTrueAdmin(baseUrl, token);
  }

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.serviceToken}`, apikey: this.serviceToken, ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`GoTrue ${init.method ?? 'GET'} ${path} -> ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  async findUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
    const page = await this.call<{ users: Array<{ id: string; email: string }> }>(`/admin/users?page=1&per_page=200&filter=${encodeURIComponent(email)}`);
    return page.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async createUser(email: string, password: string): Promise<{ id: string; email: string }> {
    return this.call('/admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) });
  }

  async ensureUser(email: string, password: string): Promise<{ id: string; created: boolean }> {
    const existing = await this.findUserByEmail(email);
    if (existing) return { id: existing.id, created: false };
    const u = await this.createUser(email, password);
    return { id: u.id, created: true };
  }
}
