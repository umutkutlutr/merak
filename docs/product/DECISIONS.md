# Karar Kaydı — M0

Son güncelleme: 2026-10-15 (M0 kapanışı). Üç sınıf: **KESİN** (kurucu/brief kararı), **M0_DENEY_AYARI** (deneme ayarı; nihai ürün kararı değildir), **AÇIK** (karar bekliyor). Teknik uygulama tercihleri ayrı bölümdedir.

## 1. KESİN — ürün özü (brief’ten)

| # | Karar | Gerekçe / kaynak |
|---|---|---|
| K-1 | Yarışmaya giriş ücretsizdir; katılım, ek puan, hız avantajı veya kazanma şansı satın alınamaz. | Brief §2.1. API’de ödeme yolu yoktur; `quiz_sessions.prize_mode = 'none'` CHECK kısıtı M0’da zorunludur. |
| K-2 | Haftalık sıralama ve ödüller hedef kapsamdadır; M0’da uygulanmaz. Paris seyahati gibi örnekler taahhüt değildir. | Brief §2.2. Veri modeli (`session_results`) haftalık toplamı sonradan üretmeye elverişlidir. |
| K-3 | Yarışma puanı ile öğrenme XP’si ayrıdır; keşif/davet/premium/düello yarışma puanını artırmaz. | Brief §2.3. Ayrı tablolar ve yazma yolları: `learning_xp_events` ↔ `answer_receipts`/`session_results`. Test: K11. |
| K-4 | Canlı yarışma edinim/geri dönüş mekanizmasıdır; M0’da ödeme sistemi kurulmaz. | Brief §2.4. |
| K-5 | AI destekli içerik üretimi vizyondur; ödüllü sorularda insan onayı zorunludur; kaynak/editoryal denetim AI ile ikame edilemez. | Brief §2.5. Yaşam döngüsü `draft → review → approved → published`; seed sorular otomatik onaylanmaz. |
| K-6 | Premium, güçlü tipografili, yetişkinlere de hitap eden deneyim; küçümseyen dil yok. | Brief §2.6. Token sistemi `apps/mobile/src/theme/tokens.ts`. |
| K-7 | Maddi ödüllü yayın; hukuki/mağaza uygunluğu ve ödül operasyonu doğrulanmadan açılmaz. **M0 yalnızca ödülsüz yerel testtir.** Bu bir hukuki değerlendirme değildir. | Brief §2.7. Mobilde ve admin’de “ödülsüz test” etiketi görünür. |
| K-8 | Ana bilgi mimarisi: Ana Sayfa, Keşfet, Yarış, Kültür, Profil (M0 tasarım varsayımı; kullanılabilirlik bulgusuyla değişebilir). | Brief §2.8. |
| K-9 | *(Kapanışta düzeltildi; artık kesin karar değil.)* Ürün adı açık bir karardır: özgün brief §28 “Uygulamanın adı” ve “Son marka konumlandırması”nı kesinleşmemiş kararlar arasında sayar. **“Merak” yalnızca çalışma adıdır**: kurucunun “app ismini sen koy” talimatıyla geliştirme için seçildi, repo adı `merak`. Marka/tescil/alan adı taraması ve kurucunun marka onayı yok → A-1. | Kurucu talimatı (2026-10-14); brief §28. |
| K-10 | M1+ aşamaları ve yedi yan modül bu görevde başlatılmaz; veri ilişkileri konu/kategori/içerik kimlikleriyle genişlemeye uygun kurulur. | Brief §3. |

## 2. M0_DENEY_AYARI — deneme kuralları (nihai ürün kararı değildir)

Oturum oluşturulurken bu kurallar `quiz_sessions.rules` (JSON) ve `rules_version` alanına **dondurulur**; sonradan bu dosya değişse bile yayınlanmış/başlamış oturum etkilenmez. M0 kural sürümü: `m0-v1` (test amaçlı süre kısaltmaları `m0-v1+test-override` olarak etiketlenir ve denetim kaydında görünür).

| Konu | M0 deneme kararı | Uygulama |
|---|---|---|
| Saat dilimi | Europe/Istanbul; veritabanında UTC | Günlük görev günü `completed_at AT TIME ZONE 'Europe/Istanbul'`; test: gün sınırı 21:00 UTC. |
| Genel yayın adayı | Pazartesi–Cumartesi 21.00; M0’da admin yakın saat seçer | Admin formu `datetime-local`; haftalık takvim otomasyonu M1. |
| Soru sayısı | 5 | `rules.questionCount = 5`; API tam 5 soru ister (`QUESTION_COUNT_INVALID`). |
| Soru süresi | 12 sn (okunabilirlik/erişilebilirlik deneyi bekliyor) | `rules.questionDurationMs = 12000`. |
| Reveal süresi | 6 sn | `rules.revealDurationMs = 6000`. |
| Lobi | Başlangıçtan 60 sn önce açılır (brief §6.2 örneği: 20.55’te, yani 5 dk önce; M0 test kolaylığı için kısa) | `rules.lobbyLeadMs = 60000`. |
| Puan | Doğru: `round(60 + 40 × (1 − elapsedMs/durationMs))`, 60–100; yanlış/cevapsız/geçersiz 0 | `packages/contracts/src/scoring.ts`; sunucu tek otorite; birim test. |
| Cevap aralığı | `opensAt <= receivedAt < closesAt`; sınırda ve sonrasında ret (brief §6.3 tablosundaki “12 sn → 60 puan” satırı M0’da 11,999 sn’ye karşılık gelir; tam 12 sn kapalıdır). Kapanıştan önce alınıp reveal’den sonra işlenen istek kabul edilir. **Bilinçli sınır:** oturum tamamlandıktan sonra (son kapanış + 6 sn) işlenen istek `SESSION_COMPLETED` alır; sonuçlar tamamlanmada kesinleşir. | `answerWindow()`; `receivedAt` gövde alındıktan sonra middleware’de sunucu saatiyle alınır. Test K05, `08-closeout-risks` R5, R1/R10. |
| Değişiklik | İlk geçerli kabulden sonra cevap değiştirilemez | `ANSWER_ALREADY_ACCEPTED`; DB tekil kısıtı. Test K06. |
| Geç katılım | Katıldığı anda açık olan soru dâhil, o ana kadar açılmış sorular 0; sonraki sorudan yarışır | `eligible_from_position = currentPosition + 1`; `NOT_ELIGIBLE_FOR_QUESTION`. **Yorum notu:** brief’teki “henüz açılmamış sorulardan itibaren” ifadesi, açık soruya sonradan dahil olmayı kapsamayacak şekilde yorumlandı. Alternatif (kalan süreyle açık soruya girmek) tek satırlık değişikliktir → A-4. |
| Yeniden bağlantı | Aynı kullanıcı önceki katılımıyla döner; açık soruda yalnızca kalan ortak süre | `opensAt` ortak; katılım cihazda saklanan token ile devam eder. Test K08. |
| İkinci cihaz | İlk katılım korunur; M0’da devralma yok | Token’sız ikinci `join` → `PARTICIPATION_EXISTS`. Test K08. |
| Eşit puan | Aynı sıra (1,1,3); görsel ikinci anahtar (önce bitiren) avantaj değildir | `rankParticipants()`; `tieRule` sonuçta açıkça yazılır. |
| API yeniden başlarsa | Lobi/canlı oturum `server_restart` ile iptal; cevaplar korunur; sıralamaya girmez. Başlangıcı 60 sn’den fazla kaçırılan planlı oturum `missed_start` ile iptal | `EngineService.recoverAfterRestart`. Test K10. |
| Haftalık hesap | M1’e kadar açık | — |
| Öğrenme XP | Tamamlama başına 10 XP, bir kez | `XP_PER_COMPLETION`. |
| Günlük görev | “Bugün 3 farklı içerik tamamla”; ödül/puan vermez | `daily_task_completions`. Test K11. |
| Hız puanı ve gecikme | Sunucu alım zamanı esas; istemci `clientSentAt/clientRttMs` yalnızca tanılama için saklanır, puana etkisi yoktur | Test K07. Gecikme telafisi M1 adalet/saldırı senaryolarıyla değerlendirilecek. |
| Soru havuzu kuralı | Oturum yalnızca `published` durumundaki ve onaylı revizyonu güncel olan soruları sabitler; `approved` (onaylı ama havuza verilmemiş) soru planlanamaz | `resolveSchedulable()`. Test K03. |
| Personel katılımı | Editör ve yönetici hesapları oturuma oyuncu olarak katılamaz (`STAFF_CANNOT_PLAY`): cevap anahtarlarını ve oturum içeriğini görebilirler. Ürün kararı değil, geri alınabilir bütünlük varsayımı. | `SessionsService.join`. Test `09-closeout-audit` R2. |
| Varsayılan kullanıcı adı | Rastgele `oyuncu_xxxxxx`; e-postadan türetilmez (sıralamada başkalarına görünür, KVKK). Kullanıcı `PATCH /me` ile değiştirir. | `ProfilesService.ensureProfile`. Test K02. |
| Onay kaynağı | Her soru onayı `editor_review` (bir editör tek tek onayladı) veya `automated_test` (toplu buton, demo betiği, test) olarak kaydedilir; ikincisi insan incelemesi sayılmaz ve admin’de kırmızı “TEST ONAYI” olarak görünür. | `questions.approval_kind` + CHECK. Test `09-closeout-audit` R6. |
| Seed içerik | Kartlar/Radar önerileri yerel seed ile `published` ancak `production_method = seed_sample`, `source_verified = false`, denetim kaydı `content.seed_publish` (aktör: sistem). Bu bir editör onayı değildir. Sorular `draft` kalır. | `src/seed/seed.ts`; mobilde “Örnek test içeriği” rozeti. |

## 3. AÇIK — kurucu kararı bekleyenler

| # | Konu | Neden önemli |
|---|---|---|
| A-1 | “Merak” adının marka/alan adı/mağaza uygunluğu | Çalışma adıdır; tescil taraması yapılmadı. |
| A-2 | Haftalık hesap (altı gün toplamı mı, en iyi beş gün mü) | M1 veri modeli bunu `session_results` üzerinden üretecek; seçim ürün kararıdır. |
| A-3 | 12 sn soru süresi ve erişilebilirlik (büyük yazı, ekran okuyucu) | M0 yalnızca UI’da font ölçekleme/erişilebilirlik etiketlerini taşır; zamanlı yarışmada eşit erişim iddiası yoktur. |
| A-4 | Geç katılım yorumu (bkz. yukarıdaki not) | Kural tek yerde (`eligibleFromPosition`) değişir. |
| A-5 | Maddi ödüllü yayın için hukuki/mağaza/ödül operasyonu değerlendirmesi | M0 kapsam dışı; otomatik takvim adımı değildir. |
| A-6 | İlgi alanı seçiminin ürün rolü (kişiselleştirme mi, yalnızca profil mi) | M0’da serbest etiket listesi olarak saklanır; kullanılmaz. |
| A-7 | Daha önce yayınlanmış (reveal edilmiş) bir sorunun yeni bir oturumda yeniden kullanılması | M0 izin verir (test kolaylığı). Önceki oturuma katılanlar cevabı bilir; ödüllü yayında soru tekrarı adaleti doğrudan etkiler. Kapanış incelemesinde açık karar olarak eklendi. |

## 4. Teknik uygulama tercihleri (gerekçeli)

| Tercih | Gerekçe |
|---|---|
| pnpm 10 workspace, `node-linker=hoisted` | Expo/Metro düz `node_modules` ile en sorunsuz çalışır; tek lockfile. |
| TypeScript **5.9.3** (7.x değil) | TS 7 (Go port) 2026-10’da `latest` ancak NestJS `emitDecoratorMetadata`, Expo ve araç ekosistemi için henüz kararlı/uyumlu sayılmadı; 5.9 son 5.x kararlı sürüm. |
| NestJS 12 + Socket.IO 4.8 | Brief tercihi; gateway + guard + modül sınırları. WS kimlik doğrulaması handshake middleware’inde. |
| Drizzle ORM 0.45 + drizzle-kit (SQL migration dosyaları) | SQL’e yakın; `FOR UPDATE`, transaction ve ham SQL kolay; migration’lar düz SQL olarak repoda ve elle eklenen yetki/CHECK ifadeleri aynı mekanizmada. |
| zod 4 (paylaşılan `packages/contracts`) | İstemci-sunucu sözleşmesi tek kaynaktan; cevap anahtarı sözleşmede yok. |
| jose 6 (JWT) | HS256 (yerel GoTrue / Supabase CLI) ve JWKS (hosted Supabase) aynı doğrulayıcıda; `iss/aud/exp/alg` zorunlu. |
| Vitest 5 + unplugin-swc | Nest dekoratör metadata’sı için SWC şart (esbuild üretmez). Entegrasyon testleri gerçek PostgreSQL’de, dosyalar seri. |
| PostgreSQL 16 + GoTrue (kaynaktan derlenmiş) yerel stack | Bu ortamda Docker daemon yoktu; `supabase start` kullanılamadı. GoTrue v2.197.0 gerçek Supabase Auth sunucusudur (emülatör değil). Docker’lı makinede `supabase start` ile aynı env değişkenleri kullanılabilir. |
| Uygulama verisi `app` şemasında, `app_api` rolü sahipliğinde; `anon/authenticated/service_role` yetkisiz; tüm tablolarda RLS açık | Supabase Data API bir gün açılsa bile mobilin tablolara doğrudan yazması mümkün değildir. API rolü `auth` şemasını okuyamaz. |
| Expo SDK 57 / RN 0.86.3 / React 19.2.3 | Expo’nun bundlediği sürümler (npm `react-native@latest` 0.87 değil). Development build yolu `expo-dev-client` ile hazır. |
| Admin: Vite 8 + React 19, kütüphanesiz dar arayüz | Brief tercihi; M0’da yalnızca inceleme/onay/planlama. |
| Seed/migrate çalıştırma: migrate `tsx`, seed `nest build` çıktısından | tsx (esbuild) dekoratör metadata üretmediği için Nest DI çalışmaz; seed derlenmiş JS ile koşar. |
