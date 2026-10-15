# Proje Durumu

Son güncelleme: 2026-10-15 · Dal: `claude/wonderful-johnson-25mox5` · Sonraki Claude oturumu önce bunu okusun.

## Son tamamlanan adım

M0 teslimi: monorepo, Docker’sız yerel stack (PostgreSQL 16 + GoTrue), NestJS API (içerik/öğrenme/soru bankası/canlı yarışma/analitik/denetim), Expo 57 mobil uygulaması, Vite admin paneli, K01–K12 testleri, iki kullanıcılı API/WS ve web (Playwright) demoları, teslim belgeleri. Ayrıntı: `docs/reports/M0_DELIVERY_REPORT.md`.

## Doğrulama durumu (özet)

| Alan | Durum |
|---|---|
| Birim testleri (23) + gerçek PostgreSQL entegrasyon testleri (48) | GEÇTİ — `pnpm --filter @merak/api test` |
| API/WS iki kullanıcılı demo | GEÇTİ — `pnpm demo:two-users` |
| Web (react-native-web) iki bağımsız tarayıcı bağlamı + admin, ekran görüntülü | GEÇTİ — `docs/reports/evidence/` |
| Native iOS/Android | **DOĞRULANMADI** (bu ortamda Xcode/Android SDK yok) |
| Uzak CI (`.github/workflows/ci.yml`) | Yazıldı, **çalıştırılmadı** |
| Gerçek Supabase Auth (GoTrue) ile giriş | GEÇTİ (K02 testi + demolar) |

## Açık engeller / bilinen sorunlar

- Native çalıştırma doğrulanmadı; `expo-dev-client` yolu hazır ama derlenmedi (bkz. README “Native”).
- `.github/workflows/ci.yml` henüz bir GitHub Actions koşusu görmedi.
- Kaynak Master Brief yüklenmedi (`docs/product/MASTER_BRIEF.md`).
- Web’de pasif sekme ekranları DOM’da kalır (react-navigation davranışı); otomasyon locator’ları aktif ekrana göre kapsamlandı. Kullanıcı etkisi yok.
- Reveal yayını üye başına kişiye özel emit; ölçek M1 konusu.

## Yerelde devam etmek için

```bash
pnpm install && pnpm stack:init && pnpm stack:start
pnpm db:migrate && pnpm db:seed
pnpm dev:api            # :3000
pnpm dev:admin          # :5173 (admin@merak.local / Merak-Local-123)
pnpm dev:mobile:web     # :8081 (ayse@merak.local / mehmet@merak.local)
pnpm test:api
```

## Sonraki önerilen iş (M1, kurucu onayı sonrası)

Bkz. teslim raporu §10: (1) 100→1.000 eşzamanlı yük testi ve WS yayın ölçümü, (2) haftalık toplam modeli ve hesap kuralı kararı, (3) gecikme/adalet deneyi (RTT tanı verisiyle), (4) native development build + cihaz doğrulaması, (5) soru düzeltmesi için sürümlü yeniden hesaplama tasarımı.
