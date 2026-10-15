# Merak — M0

Türkiye’de başlayacak, eğlenerek bilgi ve kültür kazandıran mobil platformun ilk uçtan uca kesiti: **Günün 5’i** canlı test yarışması (ödülsüz, yerel) + keşif kartları, Kültür Radarı, öğrenme XP’si ve günlük görev.

> “Merak” çalışma adıdır (kurucu adlandırmayı devretti); marka/tescil denetimi yapılmadı. M0 yalnızca ödülsüz yerel testtir.

Belgeler: `docs/product/DECISIONS.md` · `docs/product/ROADMAP.md` · `docs/architecture/ARCHITECTURE.md` · `docs/contracts/API_AND_EVENTS.md` · `docs/reports/M0_DELIVERY_REPORT.md` · `docs/PROJECT_STATE.md`

## Yapı

```
apps/api        NestJS 12 — REST + Socket.IO, canlı oturum otoritesi, admin API
apps/mobile     Expo 57 + expo-router — iOS/Android/Web
apps/admin      Vite 8 + React 19 — dar editoryal/oturum yönetimi
packages/contracts  zod sözleşmeleri (istemciye açık; cevap anahtarı yok)
packages/config     paylaşılan tsconfig/eslint
scripts/local-stack Docker’sız yerel PostgreSQL 16 + Supabase Auth (GoTrue)
docs/               ürün, mimari, sözleşme, rapor
```

## Ön koşullar

- Node **22.22.0** (`.node-version`), pnpm 10 (`corepack enable` yeterli)
- PostgreSQL 16 ikilileri (`initdb`, `pg_ctl`, `psql`) — macOS: `brew install postgresql@16`; Ubuntu: `apt install postgresql-16`
- Supabase Auth için **iki seçenek**:
  1. **Docker’sız (bu teslimde kullanılan):** Go ≥ 1.24 kurulu olsun; `pnpm stack:init` GoTrue’yu kaynaktan derler (`.local/bin/gotrue`, ilk seferde birkaç dakika).
  2. **Supabase CLI + Docker:** `supabase start` ile çalışan Auth’u kullan; `.env` dosyalarında `SUPABASE_AUTH_URL=http://127.0.0.1:54321/auth/v1`, `AUTH_JWT_ISSUER` aynı değer, `SUPABASE_JWT_SECRET` = `supabase status` çıktısındaki JWT secret, `DATABASE_*` = Supabase’in Postgres’i (54322). `app` şemasını ve `app_api` rolünü `scripts/local-stack/init.sh` içindeki SQL ile oluştur.

## Temiz kurulum (kopyala-yapıştır)

```bash
pnpm install
pnpm stack:init                      # initdb, roller, auth/app şemaları, GoTrue migrate (idempotent)
pnpm stack:start                     # postgres :54329 + gotrue :9999
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
pnpm db:migrate                      # app şeması migration'ları (app_api rolüyle)
pnpm db:seed                         # örnek test içeriği + yerel test hesapları (idempotent)
```

Yerel test hesapları (şifre `Merak-Local-123`): `admin@merak.local` (admin), `editor@merak.local` (editör), `ayse@merak.local`, `mehmet@merak.local` (üye). Seed hesapları üretime taşınamaz; seed `NODE_ENV=production`’da çalışmayı reddeder.

## Çalıştırma

```bash
pnpm dev:api          # http://localhost:3000  (/health, /ready)
pnpm dev:admin        # http://localhost:5173
pnpm dev:mobile       # Expo (i: iOS simülatör, a: Android, w: web)
pnpm dev:mobile:web   # doğrudan web önizleme http://localhost:8081
```

### Mobil API adresi: localhost / LAN / simülatör

| Ortam | `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_AUTH_URL` |
|---|---|
| Web önizleme, iOS simülatörü | `http://localhost:3000` / `http://localhost:9999` |
| Android emülatörü | `localhost` otomatik olarak `10.0.2.2`’ye çevrilir (`src/lib/config.ts`) |
| Fiziksel cihaz (aynı Wi-Fi) | `http://<LAN-IP>:3000` / `http://<LAN-IP>:9999`; GoTrue’yu `GOTRUE_API_HOST=0.0.0.0 pnpm stack:start` ile başlat. `iss` iddiası `API_EXTERNAL_URL` ile belirlendiğinden API’nin `AUTH_JWT_ISSUER` değeri değişmez. |

### Native (iOS/Android)

Development build yolu hazır (`expo-dev-client`): `cd apps/mobile && npx expo run:ios` veya `npx expo run:android`. **Bu teslimde native çalıştırma doğrulanmadı** (ortamda Xcode/Android SDK yok); web önizleme native doğrulaması sayılmaz.

## Demo (kurucu için, 3 dakika)

1. Admin: `http://localhost:5173` → `editor@merak.local` ile giriş → **Sorular** → 5 soruyu seç → “Seçilileri test-onayla + yayınla” (bu bir TEST onayıdır; denetim kaydına böyle düşer).
2. Admin: `admin@merak.local` → **Oturumlar** → başlangıç 2–3 dk sonrası, 5 yayınlanmış soru → **Planla**.
3. İki tarayıcı/cihazda (`ayse`, `mehmet`) **Yarış** → **Katıl** → lobi → 5 soru → sonuç → “Kartı aç”.
4. Keşfet → kart → **Tamamladım** (XP bir kez) → Profil’de XP ve kaydettiklerin.

Otomatik demolar:

```bash
pnpm demo:two-users                                   # API/WS: editör onayı → planlama → 2 kullanıcı → sonuç (API çalışır olmalı)
pnpm --filter @merak/api exec tsx scripts/demo-web-screens.ts   # Expo web + admin, 2 tarayıcı bağlamı, ekran görüntüleri docs/reports/evidence/
```

## Test

```bash
pnpm test:api                      # birim (vitest) + gerçek PostgreSQL entegrasyon (merak_test veritabanı, otomatik oluşturulur)
pnpm --filter @merak/api test:unit
pnpm --filter @merak/api test:integration
pnpm lint && pnpm typecheck
```

Entegrasyon testleri `DATABASE_ADMIN_URL` (superuser) ile `merak_test` veritabanını her dosyada sıfırlar ve migration’ları `app_api` rolüyle uygular. GoTrue erişilebilirse gerçek giriş de test edilir; değilse o test uyarı basarak atlanır.

## Yerel stack komutları

`pnpm stack:start | stack:stop | stack:status | stack:reset` (reset: auth + app verisini siler). Veri dizini `.local/pg/data`, loglar `.local/*.log`. Root kullanıcıda PostgreSQL otomatik olarak `postgres` sistem kullanıcısıyla çalıştırılır.

## Güvenlik notları

- Tüm sırlar `apps/api/.env` içinde kalır; `EXPO_PUBLIC_*` ve `VITE_*` yalnızca genel URL/anon key taşır.
- Uygulama tabloları `app` şemasında, `app_api` rolünün sahipliğinde; `anon/authenticated/service_role` yetkisiz, RLS açık. Mobil hiçbir tabloya doğrudan yazamaz.
- Cevap anahtarları yalnızca sunucuda (`app.question_answer_keys`); istemci sözleşmelerinde yoktur.
