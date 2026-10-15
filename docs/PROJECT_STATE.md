# Proje Durumu

Son güncelleme: 2026-10-15 (M0 kapanışı) · Dal: `claude/wonderful-johnson-25mox5` · Sonraki Claude oturumu önce bunu okusun.

## Son tamamlanan adım

M0 kapanışı (`docs/reports/M0_CLOSEOUT_REPORT.md`): yedek bundle, özgün brief eşlemesi, sürüm ve kurulum doğrulaması, yedi riskin incelenmesi ve 15 hatanın düzeltilmesi, CI ve inceleme paketi. Test edilen kod commit’i `2618234`; migration `0002` (`question_revisions.topic_id/related_content_item_id`, `questions.approval_kind`). Claude Design brief’i: `docs/design/CLAUDE_DESIGN_PROMPT.md`. M1 başlamadı; nihai kabul ürün sahibinde.

## Doğrulama durumu (özet)

| Alan | Durum |
|---|---|
| Birim (28) + gerçek PostgreSQL entegrasyon (68) testleri | DOĞRULANDI — `pnpm --filter @merak/api test`, 96/96 |
| Uzak CI (`.github/workflows/ci.yml`) | DOĞRULANDI — run 1–3 success (son: `2618234`) |
| Temiz klondan kurulum (aynı Linux makinesi) | DOĞRULANDI — 16/16 adım, 96/96 test |
| Gerçek GoTrue ile kayıt / giriş / yenileme / çıkış | DOĞRULANDI — `scripts/smoke/auth-flow.mjs` 12/12 |
| API/WS iki kullanıcılı demo | DOĞRULANDI — `pnpm demo:two-users` |
| Web (react-native-web), iki bağımsız tarayıcı bağlamı + admin | DOĞRULANDI — `pnpm --filter @merak/api demo:web`, `docs/reports/evidence/` |
| Native iOS/Android, macOS kurulumu, Supabase CLI yolu, barındırılan JWKS | **DOĞRULANMADI** |

## Açık engeller / bilinen sorunlar

- Native çalıştırma doğrulanmadı (kurucunun Mac’i için komutlar: kapanış raporu §8).
- Mobil kenar yolları (yeni token ile yeniden bağlanma, geç kabulde resync) için otomatik test yok.
- Son sorunun cevabı tamamlanmadan sonra işlenirse `SESSION_COMPLETED` alır (bilinçli sınır).
- Seed kartı editörce düzenlenirse “örnek test içeriği” etiketi düşer.
- Açık ürün kararları A-1 … A-7 (`docs/product/DECISIONS.md` §3).

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
