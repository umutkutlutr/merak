# API ve Olay Sözleşmeleri — M0

Tipli kaynak: `packages/contracts/src/*.ts` (zod). Bu belge gerçek uçları ve payload örneklerini özetler. Tüm zaman damgaları ISO-8601 UTC. Tüm uçlar `Authorization: Bearer <Supabase JWT>` ister (istisna: `/health`, `/ready`, `/time`).

## Hata biçimi

```json
{ "error": { "code": "QUESTION_CLOSED", "message": "Sorunun süresi doldu; bu cevap kabul edilmedi.", "details": null, "requestId": "…" } }
```

Kodlar ve HTTP durumları (`errorMessagesTr` Türkçe metinleri taşır):

| Kod | HTTP | Ne zaman |
|---|---|---|
| AUTH_REQUIRED / AUTH_INVALID_TOKEN / AUTH_TOKEN_EXPIRED | 401 | Token yok / geçersiz / süresi dolmuş |
| FORBIDDEN | 403 | Rol yetersiz |
| NOT_FOUND | 404 | Kayıt yok |
| VALIDATION_FAILED | 400 | zod doğrulaması; `details` alan listesi |
| RATE_LIMITED | 429 | Hız sınırı |
| PAYLOAD_TOO_LARGE | 413 | > 32 KB |
| USERNAME_TAKEN | 409 | Profil güncelleme |
| CONTENT_NOT_PUBLISHED | 404 | Yayında olmayan içerik |
| SESSION_NOT_JOINABLE / SESSION_CANCELLED / SESSION_COMPLETED | 409 | Katılım |
| PARTICIPATION_EXISTS | 409 | İkinci cihaz |
| PARTICIPATION_TOKEN_INVALID | 403 | Token eşleşmedi |
| NOT_PARTICIPANT | 403 | Katılmamış kullanıcı |
| QUESTION_NOT_OPEN / QUESTION_CLOSED | 409 | Pencere dışı |
| NOT_ELIGIBLE_FOR_QUESTION | 409 | Geç katılım |
| ANSWER_ALREADY_ACCEPTED | 409 | İkinci cevap |
| IDEMPOTENCY_KEY_CONFLICT | 409 | Aynı anahtar, farklı payload |
| OPTION_INVALID | 400 | Seçenek soruya ait değil |
| QUESTION_NOT_APPROVED / QUESTION_COUNT_INVALID / SCHEDULE_IN_PAST | 409/400/400 | Planlama |
| INVALID_TRANSITION / REVISION_STALE | 409 | Yaşam döngüsü |
| INTERNAL | 500 | Beklenmeyen |

## REST

### Kimlik ve profil
- `GET /me` → `{ profile, created }` — ilk çağrı profili oluşturur (`signup_completed` olayı bir kez).
- `PATCH /me` `{ username?, displayName?, interests? }` → `{ profile }`.

### Ana sayfa ve içerik
- `GET /home` → `{ quiz: CurrentQuizResponse, cards: ContentCardSummary[4], progress: LearningProgress }`.
- `GET /content?kind=card|radar_pick&topic=slug&limit=30` → `{ items, topics }`.
- `GET /content/:idOrSlug` → `ContentDetail` (yalnızca yayınlanmış revizyon; kaynak, dil, üretim yöntemi, sürüm).
- `POST /content/:id/save` → `{ saved: true }` · `DELETE /content/:id/save` → `{ saved: false }`.
- `POST /content/:id/complete` → `CompleteResponse`:
  ```json
  { "completed": true, "xpAwarded": 10, "alreadyCompleted": false, "learningXpTotal": 30,
    "dailyTask": { "progress": 3, "target": 3, "completed": true, "completedNow": true } }
  ```
- `GET /learning/progress` → `LearningProgress` · `GET /learning/saved` → `{ items }`.

### Yarışma
- `GET /quiz/current` → `{ session: QuizSessionSummary|null, serverTime, myParticipation }` (soru içeriği taşımaz).
- `GET /quiz/history` → katıldığım tamamlanmış/iptal oturumlar.
- `GET /quiz/sessions/:id` → özet + `myParticipation`.
- `POST /quiz/sessions/:id/join` `{ participationToken? }` → `JoinSessionResponse`:
  ```json
  { "participantId": "…", "participationToken": "<cihazda sakla>", "eligibleFromPosition": 1, "resumed": false, "snapshot": { … } }
  ```
- `GET /quiz/sessions/:id/state` → `SessionSnapshot` (yetkili durum; yeniden eşitleme).
- `POST /quiz/sessions/:id/answers` (30/10 sn) `AnswerSubmitInput`:
  ```json
  { "sessionQuestionId": "…", "optionId": "…", "idempotencyKey": "<uuid v4>", "participationToken": "…", "clientSentAt": "…", "clientRttMs": 40 }
  ```
  → `AnswerReceipt` (doğruluk/puan içermez):
  ```json
  { "status": "accepted", "receiptId": "…", "sessionQuestionId": "…", "position": 1, "optionId": "…", "receivedAt": "…", "replayed": false }
  ```
- `GET /quiz/sessions/:id/answers/:idempotencyKey` → aynı makbuz (kayıp alındı kurtarma).
- `GET /quiz/sessions/:id/result` → `{ result: SessionResultView }` (yalnızca `completed`).

### Analitik (istemci iddiaları)
- `POST /events` `{ events: ClientAnalyticsEventInput[1..50] }` → `{ accepted, duplicates }`. İzinli adlar: `content_opened`, `quiz_to_content_opened`, `connection_interrupted`, `state_resynced`. Sunucu olguları (`answer_accepted` vb.) istemciden kabul edilmez (400).

### Yönetim (`editor` | `admin`)
- `GET /admin/topics`
- `GET /admin/questions`, `GET /admin/questions/:id`, `POST /admin/questions`, `PATCH /admin/questions/:id` (yeni revizyon, onay sıfırlanır), `POST /admin/questions/:id/{submit_review|approve|reject|publish|archive|reopen}` `{ reason?, expectedRevisionId? }`
- `GET /admin/content`, `POST /admin/content`, `PATCH /admin/content/:id`, `POST /admin/content/:id/{action}`
- `GET /admin/audit?limit=`
- **admin**: `GET /admin/sessions`, `GET /admin/sessions/:id`, `POST /admin/sessions` (`AdminCreateSessionInput`: başlık, `scheduledStartAt`, tam 5 `questionIds`, `rulesOverride?` test amaçlı), `POST /admin/sessions/:id/cancel { reason }`, `GET /admin/analytics/active-users?days=7`

### Sağlık
- `GET /health`, `GET /ready` (`{ database, schedulerLeader }`), `GET /time` (`{ serverTime, serverTimeMs }`).

## Socket.IO (`/socket.io`, handshake `auth: { token }`)

| Yön | Olay | Payload |
|---|---|---|
| C→S | `session.subscribe` | `{ sessionId, participationToken }` → ack `{ ok, snapshot }` veya `{ ok:false, code, message }` |
| C→S | `state.resync` | `{ sessionId }` → ack snapshot (`state_resynced` olayı kaydedilir) |
| C→S | `session.unsubscribe` | `{ sessionId }` |
| S→C | `session.lobby` | `{ sessionId, stateVersion, serverTime, scheduledStartAt, participantCount }` |
| S→C | `question.opened` | `{ …zarf, question: OpenQuestionView }` — kişiye özel seçenek sırası, anahtar yok |
| S→C | `question.revealed` | `{ …zarf, reveal: RevealView }` — `correctOptionId`, `explanation`, `myAnswer{isCorrect, points}` |
| S→C | `session.completed` | zarf → istemci `GET …/result` çağırır |
| S→C | `session.cancelled` | `{ …zarf, reason, message }` |

İstemci kuralı: `stateVersion <= uygulanan` olan olaylar atılır; bağlantı kopup gelince `session.subscribe` tekrar edilir; beklenen geçiş 1,5 sn gecikirse `state.resync`.

## Analitik olay şeması

Her satır: `id` (üretici event_id, tekrar düşer), `schemaVersion=1`, `eventName`, `eventTime`, `receivedAt`, `producer` (`server|client`), `userId?`, `quizSessionId?`, `contentItemId?`, `props` (kişisel veri/e-posta/token/anahtar içeremez; sunucu süzer).

| Olay | Üretici | Tetik |
|---|---|---|
| signup_completed | server | İlk profil oluşturma |
| content_opened | client | Detay açıldı |
| content_completed | server | İlk tamamlama (XP ile aynı transaction) |
| content_saved | server | İlk kaydetme |
| daily_task_completed | server | Günde bir kez |
| quiz_joined | server | İlk katılım |
| answer_accepted | server | Makbuzla aynı transaction (`props.position`, `elapsedMs`; doğruluk yok) |
| quiz_completed | server | Oturum tamamlanınca katılımcı başına |
| quiz_to_content_opened | client | Sonuçtan karta geçiş |
| connection_interrupted | server (WS düşmesi) / client | — |
| state_resynced | server | resync ack |

### Aktif kullanıcı örnek sorgusu (Europe/Istanbul günü, tekil kullanıcı)

```sql
with d as (
  select (event_time at time zone 'Europe/Istanbul')::date as day, user_id, event_name
  from app.analytics_events where producer = 'server' and user_id is not null
)
select day,
  count(distinct user_id) filter (where event_name in ('answer_accepted','quiz_completed'))  as quiz_active,
  count(distinct user_id) filter (where event_name in ('content_completed','content_saved')) as culture_active,
  count(distinct user_id) filter (where event_name in ('answer_accepted','quiz_completed'))
    filter (where user_id in (select user_id from d d2 where d2.day = d.day and d2.event_name in ('content_completed','content_saved'))) as both_sets
from d group by day order by day;
```

Tanımlar: *quiz-active* = o gün en az bir kabul edilmiş cevabı veya tamamlanmış oturumu olan; *culture-active* = o gün en az bir tamamlama veya kaydetme yapan. `content_opened` ve sekme görüntüleme kültür kullanımı sayılmaz. Kümeler kesişebilir; toplamları DAU değildir. Aynı mantık `AnalyticsService.activeUsersByDay` ve `GET /admin/analytics/active-users` ile de sunulur.
