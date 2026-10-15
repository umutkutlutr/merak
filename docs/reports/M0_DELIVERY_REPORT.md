# M0 Teslim Raporu — Merak

Tarih: 2026-10-15 · Dal: `claude/wonderful-johnson-25mox5` · Ortam: Claude Code bulut konteyneri (Ubuntu 24.04, Node 22.22.0, PostgreSQL 16, Docker daemon yok, Xcode/Android SDK yok)

Kısaltmalar: **UYGULANDI** = kod mevcut ve çalışıyor; **DOĞRULANDI** = otomatik test veya kaydedilmiş demo ile kanıtlandı; **DOĞRULANMADI** = test edilemedi.

## 1. Teslim özeti — gerçekten çalışan akışlar

- **Kayıt/giriş** gerçek Supabase Auth (GoTrue v2.197.0, kaynaktan derlenmiş) ile; API JWT’yi imza/exp/iss/aud ile doğrular; ilk `GET /me` profili oluşturur.
- **Keşfet → kart detayı → kaynak → “Tamamladım” → XP (bir kez) → kaydet**; günlük görev (3 farklı içerik, Europe/Istanbul) ve Kültür Radarı (4 kitap/film önerisi, gerekçe, kaydetme). XP ve kaydedilenler yeniden girişte korunur.
- **Editoryal kapı**: admin panelinde soru/kart inceleme; `draft → review → approved → published`; ret gerekçeli; düzenleme yeni revizyon üretip onayı düşürür; planlı oturum sabitlenmiş revizyonu kullanır, onay geri çekilirse zamanlayıcı oturumu iptal eder.
- **Canlı test oturumu**: admin planlar; iki bağımsız kullanıcı aynı sunucu takvimiyle lobi → 5 soru → cevap alındısı → süre kapanınca doğru cevap/açıklama → sonraki soru → sonuç ve sıralama; kalıcı puan; sonuçtan ilgili karta geçiş ve ayrı analitik olayı.
- **Yeniden bağlantı/ikinci cihaz/geç katılım/restart/iptal** kuralları sunucuda uygulanır ve testlerle kanıtlanmıştır.

Çalıştırılmış kanıtlar: 23 birim + 48 entegrasyon testi (gerçek PostgreSQL), API/WS iki kullanıcılı demo, Expo **web** üzerinde iki bağımsız tarayıcı bağlamıyla tam akış + admin ekran görüntüleri (`docs/reports/evidence/`).

## 2. Kapsam tablosu

| Öğe (brief §5) | Durum | Not |
|---|---|---|
| 5.1 Supabase Auth ile kayıt/giriş/oturum koruma/çıkış | Uygulandı | Mobil + admin `@supabase/auth-js`; yerel e-posta doğrulaması kapalı |
| 5.1 Kullanıcı adı, profil, ilgi alanı | Uygulandı | `PATCH /me`; ilgi alanı serbest etiket (kullanılmıyor, A-6) |
| 5.1 Beş bölüm navigasyonu; Kültür’de yalnızca Radar | Uygulandı | Boş modül kartı yok |
| 5.1 Ana Sayfa: sıradaki test oturumu, keşif kartları, ilerleme | Uygulandı | Sahte sayaç/kazanan/ödül yok |
| 5.2 ≥3 kategori, ≥12 mikro içerik | Uygulandı | 5 konu, 13 kart (metin), kaynak URL’li |
| 5.2 Liste → detay → kaynak → tamamladım → kaydet | Uygulandı + Doğrulandı | K11, web demo |
| 5.2 XP bir kez; günlük görev Europe/Istanbul | Uygulandı + Doğrulandı | K11 (paralel istek, gün sınırı) |
| 5.2 Kültür Radarı 4 öneri + gerekçe + kaydetme | Uygulandı + Doğrulandı | K11 |
| 5.3 Admin: onaylı sorulardan 5 soruluk ödülsüz oturum, yakın saat, iptal | Uygulandı + Doğrulandı | K03, K10 |
| 5.3 İki bağımsız kullanıcı aynı soruları aynı sunucu takvimiyle görür | Uygulandı + Doğrulandı | K04 (API), web demo (2 tarayıcı bağlamı) |
| 5.3 Bekleme → soru → alındı → reveal → sonraki → sonuç | Uygulandı + Doğrulandı | K04, K08 (WS olayları) |
| 5.3 Hız puanı sunucuda; yanlış/cevapsız 0; eleme yok | Uygulandı + Doğrulandı | K05, K07 |
| 5.3 Sonuç: gerçek cevap, doğru sayısı, soru puanları, toplam, 2 kullanıcı sıralaması | Uygulandı + Doğrulandı | K04 |
| 5.3 Sonuçtan ilgili karta geçiş + olay | Uygulandı + Doğrulandı | K12, web demo |
| 5.3 Haftalık/lig/sezon/ödül | Yapılmadı (kapsam dışı) | Veri modeli uygun (`session_results`) |
| 5.4 Admin rolü sunucuda | Uygulandı + Doğrulandı | K02 |
| 5.4 Soru/kart düzenleme, kaynak, inceleme, onay/yayın | Uygulandı + Doğrulandı | K03; admin UI |
| 5.4 ≥10 soru havuzu; seed “örnek test içeriği” | Uygulandı + Doğrulandı | 12 soru, `draft`, K01 |
| 5.4 Kaynak URL/başlık, dil, kategori, üretim yöntemi, inceleme durumu, sürüm | Uygulandı | `source_verified` yalnızca editör işaretlerse |
| 5.4 Düzenleme eski onayı düşürür; planlı oturum sabit revizyon; geri çekilince başlatılmaz | Uygulandı + Doğrulandı | K03 |
| 5.4 Önemli admin işlemleri denetim kaydı | Uygulandı + Doğrulandı | aktör/zaman/gerekçe; K03, K10 |
| §10 Analitik olaylar + aktif kullanıcı örnek sorgusu | Uygulandı + Doğrulandı | 11 olay; `activeUsersByDay`; K12/K11 |
| §10 Yapılandırılmış log, request id, sır maskeleme; health/ready | Uygulandı | nestjs-pino; `/ready` lider bilgisi |
| §11 CI yapılandırması | Yazıldı, **çalıştırılmadı** | `.github/workflows/ci.yml` |
| Native çalıştırma | **DOĞRULANMADI** | Ortam kısıtı |

## 3. Kabul kanıt tablosu (K01–K12)

Komut: `pnpm --filter @merak/api test` (ortam: bu konteyner; PostgreSQL 16 `merak_test`; GoTrue :9999 çalışır durumda). Sonuç: **Test Files 12 passed; Tests 71 passed** (birim 23, entegrasyon 48). Kanıt dosyaları `apps/api/src/**/*.spec.ts` ve `apps/api/test/*.test.ts`.

| ID | Kanıt (test / demo adımı) | Gerçek sonuç | Durum |
|---|---|---|---|
| K01 | `test/01-migrations-seed-auth.test.ts` — temiz DB’de migration, idempotent tekrar; seed iki kez: 2. koşuda 0 yeni kayıt | 17 içerik + 12 soru bir kez; tablolar `app_api` sahipli, RLS açık | DOĞRULANDI |
| K02 | aynı dosya — gerçek GoTrue ile `ayse@merak.local` parola girişi ve token doğrulama; member→admin rotası 403; editor→sessions 403; `anon/authenticated/service_role`→`app` permission denied; `app_api`→`auth` denied; e-posta sütunu yok | hepsi beklendiği gibi | DOĞRULANDI |
| K03 | `test/02-editorial-gate.test.ts` — draft planlanamaz (`QUESTION_NOT_APPROVED`); approved ama yayınlanmamış planlanamaz; düzenleme → v2, status draft, pinned v1 metni değişmedi; lobi öncesi iptal `question_approval_withdrawn` / `question_revision_changed`; arşivleme → iptal | 5/5 | DOĞRULANDI |
| K04 | `test/03-live-session.test.ts` — 2 kullanıcı + 1 geç katılan, 5 soru, tamamlanma, sonuçlar `session_results` = makbuz toplamları; yeni token ile sonuç aynı; `pnpm demo:two-users` (API/WS, gerçek zamanlayıcı) DEMO OK; web demosu 2 bağımsız tarayıcı bağlamı (ayse 0 p / mehmet 97 p — web demosu rastgele seçenek tıklar) | geçti | DOĞRULANDI (API/WS + **web önizleme**; native DOĞRULANMADI) |
| K05 | aynı dosya + `scoring.spec.ts` — açılış anında 100, kapanıştan 1 ms önce 60, yarıda 80, yanlış 0, kapanış anında `QUESTION_CLOSED`, açılmamış soruya `QUESTION_NOT_OPEN` | geçti | DOĞRULANDI |
| K06 | `test/04-answers-idempotency.test.ts` — 8 paralel farklı anahtar → 1 kabul + 7 `ANSWER_ALREADY_ACCEPTED`, DB’de 1 satır; aynı anahtar aynı payload → aynı makbuz; aynı anahtar farklı payload → `IDEMPOTENCY_KEY_CONFLICT`; kayıp alındı: anahtarla sorgu, soru kapandıktan sonra da aynı makbuz; geçersiz istek hakkı tüketmez | geçti | DOĞRULANDI |
| K07 | aynı dosya + `jwt-verifier.spec.ts` — `clientTimestamp/clientScore/userId/points` gövdede yok sayılır, puan sunucu zamanından (6000 ms → 80); süresi dolmuş/yabancı imza 401; başka kullanıcı `NOT_PARTICIPANT`; 32 KB üstü 413; 30/10 sn üstü 429 | geçti | DOĞRULANDI |
| K08 | `test/05-reconnect-late-join.test.ts` — WS kimliksiz ret; yanlış token ret; `question.opened` artan `stateVersion`; resync aynı sürüm; yeniden katılım cevapları ve aynı seçenek sırasını getirir; ikinci cihaz `PARTICIPATION_EXISTS`; geç katılan Q2’de `NOT_ELIGIBLE_FOR_QUESTION`, Q3’te kabul, ilk iki soru 0 | geçti | DOĞRULANDI |
| K09 | `03-live-session` — açık soru payload’ında `correctOptionId/explanation` yok; `pending` sorunun metni snapshot’ta yok; ID’si bilinse bile cevaplanamaz; K02 ile `question_answer_keys` DB rollerine kapalı | geçti | DOĞRULANDI |
| K10 | `test/06-cancel-restart.test.ts` — restart kurtarma: canlı oturum `server_restart` iptal, makbuz korunur, sonuç yok, katılım ret; admin iptal denetimli ve terminal; `missed_start`; ikinci süreç advisory lock alamaz; paralel tick’lerden yalnızca biri uygular | geçti | DOĞRULANDI |
| K11 | `test/07-learning.test.ts` — 5 paralel tamamlama → 1 XP; tekrar 0; günlük görev 3 farklı (aynı kart 3 kez = 1); 23:30/00:30 İstanbul gün sınırı; XP defterinde yalnızca `content_completed`; quiz tablolarından XP’ye FK yok | geçti | DOĞRULANDI |
| K12 | `03-live-session` + `07-learning` — sonuçta `relatedContent`; `quiz_to_content_opened` istemci olayı `producer=client`; sunucu olguları istemciden kabul edilmez; aktif kullanıcı kümeleri ayrı; web demosu “Kartı aç” adımı | geçti | DOĞRULANDI |

Not: K04 için gerçek akış **iki bağımsız oturumlu otomatik tarayıcı istemcisi** (Playwright, headless Chromium, Expo web) ile çalıştırıldı; simülatör/fiziksel cihaz kullanılmadı.

## 4. Mimari ve kararlar

Seçimler ve gerekçeler `docs/product/DECISIONS.md` §4; mimari `docs/architecture/ARCHITECTURE.md`. Prompttan anlamlı sapmalar:

1. **Supabase yerel stack Docker’sız**: Docker daemon olmadığı için `supabase start` yerine PostgreSQL 16 ikilileri + kaynaktan derlenmiş GoTrue. Gerçek Supabase Auth sunucusudur; `supabase start` ile aynı env değişkenleri çalışır.
2. **TypeScript 5.9.3**, npm `latest` 7.0.2 olmasına rağmen (NestJS dekoratör metadata/Expo uyumu).
3. **Oturum planlama `published` ister** (yalnızca `approved` yetmez); havuza bırakma adımı açık.
4. **Geç katılım yorumu**: açık soru dâhil o ana kadar açılmış sorular 0 (A-4).
5. **Seed kartları yayınlı** gelir (etiketli, denetimli, editör onayı sayılmaz); sorular `draft`.
6. `REST` cevap gönderimi (WS ack yerine): idempotency, hız sınırı ve 413/429 standart davranış.

## 5. Veri ve güvenlik kanıtları

- Migration’lar: `apps/api/drizzle/0000_m0_initial.sql`, `0001_privileges_and_checks.sql` (REVOKE/RLS/CHECK). Uygulayan rol `app_api`; `pnpm db:migrate` tekrarında no-op (K01).
- Yetkiler: K02 probe’ları (`set role anon|authenticated|service_role` → permission denied; `app_api` → `auth.users` denied).
- Idempotency: `answer_receipts` iki unique kısıt + `FOR UPDATE` + 23505 yeniden deneme (K06).
- Gizli cevap: `question_answer_keys` yalnızca `QuestionsService.answerKey/revealView`; istemci sözleşmesinde alan yok; K09 JSON taraması.
- Loglar: `authorization`, `participationToken`, `password` maskeli (API log örneğinde `"authorization":"[redacted]"`).

## 6. Çalıştırma özeti

```bash
pnpm install && pnpm stack:init && pnpm stack:start
cp apps/api/.env.example apps/api/.env && cp apps/mobile/.env.example apps/mobile/.env && cp apps/admin/.env.example apps/admin/.env
pnpm db:migrate && pnpm db:seed
pnpm dev:api & pnpm dev:admin & pnpm dev:mobile:web
pnpm test:api
pnpm demo:two-users
```

## 7. Görsel kanıt

`docs/reports/evidence/` — Expo **web** (react-native-web, 390×844, headless Chromium via Playwright) ve admin (1280×900) ekran görüntüleri; `web-demo-summary.json` zaman damgaları. Hiçbiri native cihaz/simülatör görüntüsü değildir.

| Dosya | İçerik |
|---|---|
| 01-home-ayse | Ana Sayfa: planlı test oturumu, günlük görev, keşif kartları |
| 02-discover, 03-content-detail, 04-content-completed-saved | Keşfet → detay (kaynak, örnek içerik rozeti) → tamamlandı/kaydedildi |
| 05-culture-radar | Kültür Radarı |
| 06-waiting-room-* | Bekleme salonu (iki kullanıcı) |
| 07-live-question-*, 08-answer-accepted-* | Canlı soru (kişiye özel seçenek sırası), kabul edildi |
| 09-reveal-* | Doğru cevap, açıklama, kendi sonucu |
| 10-result-*, 11-quiz-to-content, 12-profile-ayse | Sonuç/sıralama → ilgili kart → profil |
| 13–15-admin-* | Sorular, oturumlar (revizyon geçerliliği), denetim kaydı |

## 8. Sınırlar ve teknik borç

**Ağ adaleti:** puan sunucu alım zamanına dayanır; gecikme farkı puana yansır. İstemci RTT yalnızca tanı için saklanır. “Adil” iddiası yoktur; M1’de saldırı/adalet senaryoları.

**Native doğrulama:** iOS/Android derlenmedi/çalıştırılmadı. Web önizleme davranışı native için kanıt değildir; `expo-secure-store`, AsyncStorage ve WS davranışı cihazda doğrulanmalı.

**Hile/ölçek:** tek süreç, bellek içi hız sınırı ve WS üyeliği; kişiye özel reveal yayını üye başına emit; sıralama her tamamlanmada hesaplanır. Hileyi “çözdük” iddiası yok; cihaz bütünlüğü, çoklu hesap, bot kontrolü yok.

**Üretim hazırlığı:** CI yazıldı ama koşmadı; dağıtım tarif edildi, uygulanmadı; sır yönetimi `.env`; izleme yalnızca yapılandırılmış log + `/ready`; e-posta/SMS yok; mağaza/hukuk kapsam dışı.

**Diğer:** içerik görselleri yok; `source_verified` seed’de false; web’de pasif sekme ekranları DOM’da kalır (kullanıcı etkisi yok); Master Brief özgün metni yok.

## 9. Kurucu kararı gerektirenler

`docs/product/DECISIONS.md` §3: A-1 ad/marka, A-2 haftalık hesap, A-3 12 sn/erişilebilirlik, A-4 geç katılım yorumu, A-5 ödüllü yayın değerlendirmesi, A-6 ilgi alanlarının rolü.

## 10. M1 önerisi (en fazla beş; otomatik uygulanmadı)

1. **Yük ve yayın ölçümü (100 → 1.000):** tek süreçte WS yayın gecikmesi, cevap p95, DB kilit bekleme; Redis adapter kararı için veri.
2. **Haftalık toplam modeli:** `session_results` üzerinden hesaplanan, sürümlü, yeniden üretilebilir haftalık tablo; kural kararı (A-2) ile.
3. **Adalet/gecikme deneyi:** RTT tanı verisiyle gecikme dağılımı; telafi seçeneklerinin saldırı senaryolarıyla değerlendirilmesi.
4. **Native development build ve cihaz doğrulaması:** iOS/Android’de K04/K08 akışları; büyük yazı ve ekran okuyucu ile zamanlı soru denemesi (A-3).
5. **Sürümlü puan düzeltmesi:** hatalı soru için iptal/yeniden hesaplama tasarımı (sessiz kayıt değişikliği olmadan) ve kesinti/iptal/düzeltme test seti.
