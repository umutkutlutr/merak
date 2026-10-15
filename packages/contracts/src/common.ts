import { z } from 'zod';

/** Stable, user-presentable error codes. Every API/WS error carries one of these. */
export const ErrorCodeSchema = z.enum([
  'AUTH_REQUIRED',
  'AUTH_INVALID_TOKEN',
  'AUTH_TOKEN_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'USERNAME_TAKEN',
  'CONTENT_NOT_PUBLISHED',
  'SESSION_NOT_JOINABLE',
  'SESSION_CANCELLED',
  'SESSION_COMPLETED',
  'PARTICIPATION_EXISTS',
  'STAFF_CANNOT_PLAY',
  'PARTICIPATION_TOKEN_INVALID',
  'NOT_PARTICIPANT',
  'QUESTION_NOT_OPEN',
  'QUESTION_CLOSED',
  'NOT_ELIGIBLE_FOR_QUESTION',
  'ANSWER_ALREADY_ACCEPTED',
  'IDEMPOTENCY_KEY_CONFLICT',
  'OPTION_INVALID',
  'QUESTION_NOT_APPROVED',
  'QUESTION_COUNT_INVALID',
  'INVALID_TRANSITION',
  'REVISION_STALE',
  'SCHEDULE_IN_PAST',
  'SCHEDULER_NOT_LEADER',
  'INTERNAL',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Turkish, user-presentable messages. Clients should map codes through this table. */
export const errorMessagesTr: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'Devam etmek için giriş yapmalısın.',
  AUTH_INVALID_TOKEN: 'Oturum doğrulanamadı. Lütfen yeniden giriş yap.',
  AUTH_TOKEN_EXPIRED: 'Oturumun süresi doldu. Lütfen yeniden giriş yap.',
  FORBIDDEN: 'Bu işlem için yetkin yok.',
  NOT_FOUND: 'Aradığın kayıt bulunamadı.',
  VALIDATION_FAILED: 'Gönderilen veri geçersiz.',
  RATE_LIMITED: 'Çok hızlı istek gönderdin. Biraz bekleyip tekrar dene.',
  PAYLOAD_TOO_LARGE: 'İstek çok büyük.',
  USERNAME_TAKEN: 'Bu kullanıcı adı alınmış.',
  CONTENT_NOT_PUBLISHED: 'Bu içerik henüz yayında değil.',
  SESSION_NOT_JOINABLE: 'Bu oturuma şu anda katılınamıyor.',
  SESSION_CANCELLED: 'Bu oturum iptal edildi.',
  SESSION_COMPLETED: 'Bu oturum tamamlandı.',
  PARTICIPATION_EXISTS: 'Bu oturuma başka bir cihazdan katıldın. M0 sürümünde ikinci cihaz devralamaz.',
  STAFF_CANNOT_PLAY: 'Editör ve yönetici hesapları cevap anahtarlarını görebildiği için yarışmaya oyuncu olarak katılamaz.',
  PARTICIPATION_TOKEN_INVALID: 'Katılım bilgin doğrulanamadı. Oturuma yeniden katıl.',
  NOT_PARTICIPANT: 'Bu oturuma katılmış görünmüyorsun.',
  QUESTION_NOT_OPEN: 'Soru henüz açılmadı.',
  QUESTION_CLOSED: 'Sorunun süresi doldu; bu cevap kabul edilmedi.',
  NOT_ELIGIBLE_FOR_QUESTION: 'Bu soru açıldıktan sonra katıldığın için cevaplayamazsın. Bir sonraki sorudan devam et.',
  ANSWER_ALREADY_ACCEPTED: 'Bu soru için cevabın zaten kabul edildi; cevap değiştirilemez.',
  IDEMPOTENCY_KEY_CONFLICT: 'Aynı istek anahtarıyla farklı bir cevap gönderildi; istek reddedildi.',
  OPTION_INVALID: 'Seçenek bu soruya ait değil.',
  QUESTION_NOT_APPROVED: 'Onaylanmamış soru planlanamaz.',
  QUESTION_COUNT_INVALID: 'Oturumda tam olarak beş soru olmalı.',
  INVALID_TRANSITION: 'Bu durum geçişi şu anda yapılamaz.',
  REVISION_STALE: 'Kayıt sen açtıktan sonra değişti. Yeniden yükle.',
  SCHEDULE_IN_PAST: 'Başlangıç zamanı gelecekte olmalı.',
  SCHEDULER_NOT_LEADER: 'Canlı oturum zamanlayıcısı bu süreçte etkin değil.',
  INTERNAL: 'Beklenmeyen bir hata oldu. Lütfen tekrar dene.',
};

export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export const UuidSchema = z.uuid();

export const UserRoleSchema = z.enum(['member', 'editor', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LanguageSchema = z.enum(['tr', 'en']);
export const ProductionMethodSchema = z.enum([
  'human',
  'ai_assisted',
  'ai_generated',
  'seed_sample',
]);
export type ProductionMethod = z.infer<typeof ProductionMethodSchema>;

export const ReviewStatusSchema = z.enum([
  'draft',
  'review',
  'approved',
  'published',
  'rejected',
  'archived',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
