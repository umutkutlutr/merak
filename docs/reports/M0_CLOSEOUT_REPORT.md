# M0 Kapanış Raporu — Merak

Tarih: 2026-10-15 · Repo: `umutkutlutr/merak` · Dal: `claude/wonderful-johnson-25mox5` · Ortam: Claude Code bulut konteyneri (Linux x86_64, Node 22.22.0, pnpm 10.28.0, PostgreSQL 16.15, GoTrue 2.197.0; Docker, Xcode ve Android SDK yok)

Talimat: `docs/product/history/M0_KAPANIS_PROMPTU.md`. Durum dili: **DOĞRULANDI** (çalıştırıldı, kanıt var) · **KISMİ** (bir kısmı kanıtlı) · **DOĞRULANMADI** (çalıştırılmadı) · **ENGELLİ** (ortam engeli nedeniyle çalıştırılamadı). “Merak” çalışma adıdır; marka kararı değildir. M0’ın nihai kabulü ürün sahibinindir.

## 1. Kısa durum

- M0 kapsamı çalışıyor ve teslim commit’inde **96/96 test** (28 birim + 68 gerçek PostgreSQL entegrasyonu) yerelde, temiz kurulumda ve GitHub Actions’ta geçti.
- Kapanış incelemesi, önceki teslimde test edilmemiş veya yanlış davranan **15 gerçek hata** buldu ve düzeltti. Bunların 4’ü ilk kapanış turunda (`0f0f5df`), 11’i bağımsız risk incelemesinden sonra (`2618234`) düzeltildi. Liste §6.2’de.
- Önceki teslim özetindeki bazı iddialar düzeltildi (§11). En önemlileri: 21 değil 20 ekran görüntüsü vardı ve profil görüntüsü aslında içerik kartının kopyasıydı; 23505 yeniden deneme yolu test edilmemişti; K-9 “kesin” değil.
- Native iOS/Android **DOĞRULANMADI**. Mobil uygulama yalnızca Expo web önizlemesinde (react-native-web) iki ayrı tarayıcı bağlamıyla çalıştırıldı.
- Yedi açık ürün kararı var (önceki raporda altıydı; kapanışta A-7 eklendi). Hiçbiri M0’ı engellemiyor (§10).

## 2. Commitler, yedek ve push

| Commit | Tarih (UTC) | İçerik | Rol |
|---|---|---|---|
| `4cadd83` | 10-15 00:28 | Monorepo, sözleşmeler, yerel stack, API ve canlı motor | Önceki teslim (1/3) |
| `7a06cc7` | 10-15 00:38 | K01–K12 testleri | Önceki teslim (2/3) |
| `72afaa3` | 10-15 01:02 | Mobil, admin, web demosu, belgeler, CI | Önceki teslim (3/3); kapanış başında yedeklendi |
| `0f0f5df` | 10-15 15:43 | Kapanış düzeltmeleri 1. tur (kapanış sınırı, cevap–geçiş serileştirme, kilit doğrulama, temiz kurulum seed’i) | Kod |
| `e7681a8` | 10-15 22:07 | Kilit sahibi testini test veritabanıyla sınırlama | Test |
| `34f2249` | 10-15 22:23 | Web demosunda kart seçimi ve artık oturum temizliği | Demo betiği |
| `000a8d9` | 10-15 22:30 | Claude Design brief’i | Doküman |
| **`2618234`** | 10-15 22:47 | Kapanış incelemesi düzeltmeleri 2. tur, migration `0002` | **Test edilen kod commit’i** |
| `8eef005` | 10-15 22:57 | Web demosunun profil ekranını gerçekten yakalaması | Demo betiği (ürün kodu değişmedi) |
| (bu rapor) | — | Kapanış belgeleri, kanıt görüntüleri | **Teslim commit’i** (SHA: `MANIFEST.md` ve son yanıt) |

- **Remote:** `origin https://github.com/umutkutlutr/merak` (URL’de kimlik bilgisi yok).
- **Push:** `e7681a8` ve `2618234` push edildi; uzak dal yerel HEAD ile eşleşti (`git rev-parse` iki tarafta `2618234…`). Teslim commit’inin push sonucu `MANIFEST.md`’de ve son yanıtta. `main`’e merge yapılmadı; force-push veya history rewrite yok.
- **Yedekler:** kapanış başında `72afaa3` için bundle alındı, sonra her kod turunda yenilendi (`0f0f5df`, `e7681a8`, `2618234`). Nihai `MERAK_M0_BACKUP.bundle` teslim commit’ini içerir, `git bundle verify` ile doğrulandı. Bundle’daki geçmişte gerçek secret bulunmadı (§4.5).

## 3. Özgün kapsam ile eşleme

`docs/product/MASTER_BRIEF.md` artık kurucunun 14 Ekim 2026 tarihli özgün metnidir (sha256 `6ab181bd…`). Önceki “eksiklik notu” `docs/product/history/MASTER_BRIEF_MISSING_NOTE_2026-10-15.md` olarak saklandı; ilk M0 promptu ve kapanış promptu da `history/` altında.

| Gereksinim (brief) | M0 karşılığı | Gelecek aşama | Çelişki / not |
|---|---|---|---|
| İki motor: canlı rekabet + kültür/keşif (§2) | Günün 5’i test oturumu; Keşfet kartları, Kültür Radarı, XP, günlük görev | M1–M3 derinleştirir | Yok |
| Haftada 6 gün, Pzt–Cmt, herkes için sabit saat (§6.1) | Yönetici yakın bir saat planlar; haftalık takvim otomasyonu yok | M1 | M0 sınırı; ilke ihlali değil |
| 21.00 adayı, 20.55’te bekleme salonu (§6.2) | Lobi başlangıçtan 60 sn önce açılır (deney ayarı) | Pilot ölçümü | Fark kayıtlı (DECISIONS §2) |
| Ücretsiz katılım, avantaj satılamaz (§6.1, §28/8, /11) | Ödeme yolu yok; `prize_mode='none'` CHECK; davet/premium yok | Korunur | Yok |
| 5 soru (§6.1) | `rules.questionCount = 5`, API zorlar | — | Yok |
| Hız puanı 60 + 40×(1−t/T), yanlış 0, eleme yok (§6.3) | Aynen; sunucu hesaplar | M1 hız adaleti | Brief tablosundaki “12 sn → 60” M0’da 11,999 sn; tam 12 sn’de pencere kapalı |
| Sunucu doğrular, cihaz zamanına güvenilmez (§6.3) | `receivedAt` sunucuda, istemci zamanı yok sayılır (K07) | Gecikme adaleti M1 | “Adil” iddiası yok |
| Sonuç ekranı: toplam, doğru sayısı, cevap süreleri, haftalık değişim, arkadaş sıralaması, açıklama, ilgili içerik (§6.2) | Toplam, doğru sayısı, soru puanları, açıklama, sıralama, ilgili kart | M1–M2 | Cevap süresi kaydediliyor (`elapsed_ms`) ama ekranda yok; haftalık ve arkadaş yok |
| Yapay zekâyla hileyi zorlaştırma (§6.4) | Kişiye özel seçenek sırası, sunucu kontrollü açılış/kapanış, anahtar yalnızca sunucuda | Görsel/ses soru tipleri M2+ | Yok |
| Geç katılım ve kenar durumlar (§6.6) | Geç katılım, yeniden bağlanma, ikinci cihaz, restart/iptal, eşit puan | İtiraz, telafi, şüpheli örüntü, hatalı soru düzeltmesi M1+ | Kısmi kapsam (beklenen) |
| Haftalık lig, sezon, ödül, final (§7) | Yok; `session_results` haftalık toplama uygun | M1 haftalık toplam; ligler bir aşamaya bağlanmadı | Yok |
| Mikro kartlar, günlük görev, koleksiyon (§8.1–8.3) | 13 metin kart, kaynaklı; tek görev “3 farklı içerik”; koleksiyon yok | M2, Faz 2 | Yok |
| İki ayrı puan sistemi (§8.4, §28/16) | Ayrı tablolar ve yazma yolları (K11) | — | Yok |
| Yedi yan modül (§9) | Yalnızca Kültür Radarı (4 öneri); boş modül kartı yok | Sırayla | Yok |
| AI içerik fabrikası, ödüllü soruda insan onayı (§11, §28/14) | AI üretimi yok; `draft → review → approved → published`; seed soruları taslak; **onay kaynağı ayrı kaydedilir** (`editor_review` / `automated_test`) | M2 AI hattı | **Kapanışta düzeltildi:** test onayları önceden insan onayından ayırt edilemiyordu |
| Kişiselleştirme (§12) | İlgi alanı saklanır, kullanılmaz | M2 | A-6 |
| Tasarım: premium, güçlü tipografi (§14, §28/17) | Token sistemi; `docs/design/CLAUDE_DESIGN_PROMPT.md` hazır | Tasarım turu | Yok |
| İş modeli ve finans (§15–19) | Kod kapsamı değil | Faz 0, pilot | — |
| Teknik mimari (§22) | NestJS + Socket.IO, tek süreç, yönetim paneli | Ölçek M1 | Yok |
| Hukuki kapı (§23, §28/19) | M0 ödülsüz ve etiketli; ödül açılamaz | Faz 0 | Yok |
| Veri güvenliği ve KVKK (§24) | E-posta `app` şemasında yok; RLS; varsayılan kullanıcı adı e-postadan türetilmiyor | Hesap silme M3 | **Kapanışta düzeltildi:** kullanıcı adı e-postanın yerel kısmından üretilip sıralamada görünüyordu |
| Faz 0 araştırma (§25) | Repoda çıktısı yok | Paralel yürümeli | — |
| Faz 1 MVP (§25) | M0–M3’e dağıtıldı | — | — |
| Ad ve marka (§28 açık kararlar) | “Merak” çalışma adı | A-1 | **Kapanışta düzeltildi:** DECISIONS K-9 adı “kesin” kaydetmişti |

İlke ihlali olarak bulunup M0 sınırında düzeltilenler: test onaylarının insan onayından ayırt edilememesi, cevap anahtarını görebilen personelin oyuncu olarak katılabilmesi, adın kesin karar gibi kaydedilmesi. Uzun vadeli özelliklerin M0’da olmaması hata sayılmadı.

## 4. Sürümler ve kurulumun tekrar edilebilirliği

### 4.1 Sürümler

| Bileşen | Bildirilen | Çözümlenen / çalışan | Kanıt | Durum |
|---|---|---|---|---|
| Node | 22.22.0 | v22.22.0 | `.node-version`, `node -v`, CI `node-version-file` | DOĞRULANDI |
| pnpm | 10.28 | 10.28.0 | `packageManager`, `pnpm -v`, CI | DOĞRULANDI |
| Expo SDK | 57 | 57.0.29 | `node_modules/expo/package.json` | DOĞRULANDI |
| React Native | 0.86 | 0.86.3; Expo’nun beklediği 0.86.3 | `bundledNativeModules.json` karşılaştırması (`checks/08`) | DOĞRULANDI |
| React | 19 | 19.2.3; Expo’nun beklediği 19.2.3 | Aynı | DOĞRULANDI |
| expo-doctor | — | 18/21; 3 kontrol `exp.host` ve RN Directory’ye erişemediği için düştü | `checks/08` | ENGELLİ (ağ); sürüm eşleşmesi çevrimdışı olarak doğrulandı (21 bağımlılık, 0 uyumsuzluk) |
| NestJS | 12 | 12.1.3 | `pnpm-lock.yaml` | DOĞRULANDI |
| Vite | 8 | 8.3.4 (admin build) | `checks/04` | DOĞRULANDI |
| TypeScript | 5.9.3 | 5.9.3 | lockfile | DOĞRULANDI |
| PostgreSQL | 16 | 16.15 (yerel ve CI `postgres:16`) | `postgres --version`, CI log | DOĞRULANDI |
| GoTrue | v2.197.0 | 2.197.0; kaynak commit `4eee58f296d9698a1c2c0ae14d7a0b379c7622d3` | `gotrue version`, `build-gotrue.sh` commit doğrulaması | DOĞRULANDI (aynı makine) |

### 4.2 GoTrue’nun kaynaktan derlenmesi

- **Kaynak:** resmi `https://github.com/supabase/auth`, tag `v2.197.0`. `scripts/local-stack/build-gotrue.sh` tag’in commit’ini `4eee58f…` ile karşılaştırır, farklıysa derlemeyi reddeder. Ret yolu test edildi: yanlış commit verilince çıkış kodu 1.
- **Toolchain:** kaynak `go 1.27.0` ister. Makinedeki go1.24.7, `GOTOOLCHAIN=auto` ile 1.27.0’ı indirdi. README’deki “Go ≥ 1.24” notu buna göre düzeltildi.
- **Yeniden derleme:** boş bir çıktı klasörüne yeniden derleme bayt düzeyinde aynı ikiliyi üretti (sha256 önek `bbf7d2839d78a886`). Bu derleme aynı makinenin Go önbelleğini kullandı.
- **Başlatma sırası:** `pnpm stack:init` sırasıyla şunları yapar: initdb, roller (`supabase_auth_admin`, `app_api`, `anon`, `authenticated`, `service_role`), veritabanı, şemalar (`auth` → auth rolü, `app` → `app_api`), yetkiler (`app` şeması Data API rollerine kapalı), `gotrue migrate`. Sonra `pnpm stack:start` (PostgreSQL :54329, GoTrue :9999), `pnpm db:migrate` (`0000` → `0001` → `0002`, `app_api` rolüyle; tekrar çalıştırmak etkisiz) ve `pnpm db:seed`.
- **Ortam değişkenleri:** `apps/api/.env.example`, `apps/mobile/.env.example`, `apps/admin/.env.example`. Yerel varsayılanlar `scripts/local-stack/env.sh` içinde, “LOCAL DEV ONLY” etiketli. Repodaki yerel JWT secret, CI secret’ı ve Supabase CLI varsayılan secret’ı artık `NODE_ENV=production`’da reddediliyor.

### 4.3 İmza ve doğrulama yolu, ortam bazında auth

API, JWT’yi `jose` ile imza, `exp`, `iss`, `aud` ve `alg` kontrol ederek doğrular. Sadece decode etmez. HS256 yerel GoTrue ve Supabase CLI için, JWKS (ES256/RS256) barındırılan Supabase için kullanılır.

| Ortam | Token kaynağı | Doğrulama | Bypass var mı? |
|---|---|---|---|
| Entegrasyon testleri | Test, HS256 token’ı test secret’ıyla imzalar (`mintToken`) | Üretimdeki `JwtVerifier`; guard’lar açık | Yok. Saat dondurma yalnızca test API’si ve `production`’da hata fırlatır. K02’deki gerçek GoTrue giriş testi GoTrue yoksa atlanır (CI’da atlanıyor). |
| Demolar (`demo:two-users`, `demo:web`) ve auth smoke | Gerçek GoTrue (parola girişi) | Aynı doğrulayıcı | Yok |
| CI | GoTrue yok; testlerdeki imzalı token’lar | Aynı | Yok; gerçek giriş testi atlanır |
| Barındırılan Supabase (JWKS) | — | Birim testinde yerel bir JWKS sunucusuyla ES256 kabul ediliyor, yabancı anahtar reddediliyor | Gerçek barındırılan projeyle DOĞRULANMADI |

Gerçek akış (`scripts/smoke/auth-flow.mjs`, `checks/05`, 12/12): kayıt, giriş, yenileme (token döner), çıkış. Yenilenmiş token kabul edildi; imzası bozuk, yabancı secret’lı, `alg=none` ve eksik token reddedildi; çıkıştan sonra refresh reddedildi. **Bilinen M0 özelliği:** çıkıştan sonra access token süresi dolana kadar (3600 sn) geçerli kalır (durumsuz JWT).

### 4.4 Temiz kurulum

`2618234` bundle’ından boş bir klasöre klon alındı. Ayrı bir PostgreSQL kümesi (:54339) ve ayrı bir GoTrue (:9998) kullanıldı; çalışan veritabanına dokunulmadı.

Sırasıyla 16 adımın hepsi geçti: install, env dosyaları, stack:init (GoTrue sabit commit’ten derlendi), migrate ×2, seed ×2, API `/ready`, auth akışı (12/12), iki kullanıcılı demo, 96/96 test, stack:stop. Log: `checks/10-clean-install-smoke.log`.

**Sınır:** kurulum aynı Linux makinede yapıldı. Mac veya native kurulum kanıtı değildir.

Kapanış boyunca bulunan kurulum hataları:

1. Temiz klonda `db:seed`, `@merak/contracts` derlenmeden çalışıp başarısız oluyordu; düzeltildi (`0f0f5df`).
2. Smoke betiğinin kendi port ve temizlik hataları düzeltildi; bunlar ürün hatası değildi.

### 4.5 Secret taraması

Dalın tüm geçmişinde token, anahtar, özel anahtar, JWT, bulut DB URL’si ve benzeri 13 kalıp için eşleşme 0 (`checks/09`). Repoda geçmişte yer alan env benzeri dosyalar yalnızca üç `.env.example`. Atanmış değerler yalnızca belgelenmiş yerel ve CI varsayılanları: yerel Postgres parolaları, yerel JWT secret’ı, CI secret’ı. Bunlar uzak hiçbir servise erişim vermez ve üretimde reddedilir. **Sonuç: bundle paylaşılabilir.**

## 5. K01–K12 kanıt tablosu

Komut: `pnpm --filter @merak/api test` · Commit: `2618234` · Tarih: 2026-10-15 · Ortam: bulut konteyneri, PostgreSQL 16.15 `merak_test`, GoTrue :9999 açık · Sonuç: **16 dosya, 96/96 geçti** (`checks/03`).

Aynı komut iki yerde daha geçti:

- Temiz kurulumda 96/96 (`checks/10`).
- GitHub Actions run 3’te: `https://github.com/umutkutlutr/merak/actions/runs/38819493260`, commit `2618234`, success. CI’da GoTrue yok, bu yüzden K02’nin gerçek giriş testi orada atlandı.

| ID | Kanıt (dosya › test) | Sonuç | Durum |
|---|---|---|---|
| K01 | `01-migrations-seed-auth` › K01: migration’lar uygulama rolüyle çalışır ve RLS açıktır; tekrar migration etkisizdir; seed bir kez yükler (2. koşuda 0 yeni kayıt); seed yerel olmayan Auth’a herkese açık parolayla personel hesabı açmayı reddeder; seed soruları taslaktır | geçti | DOĞRULANDI |
| K02 | `01` › K02 (6 test: profil bir kez oluşur; eksik, bozuk, süresi dolmuş, yabancı token reddedilir; roller; başka kullanıcının verisi; Data API rolleri; gerçek GoTrue girişi) + `09` › R3: her admin rotası üyeye, oturum ve analitik rotaları editöre 403; süresi dolan WS token’ı + `checks/05` gerçek auth akışı 12/12 + `jwt-verifier.spec` (HS256 ve JWKS) | geçti | DOĞRULANDI (barındırılan Supabase DOĞRULANMADI) |
| K03 | `02-editorial-gate` (5 test) + `09` › R6: onay kaynağı kaydı; lobi→canlı yeniden kontrolü; bitmiş oturumun bağlantıları sabit | geçti | DOĞRULANDI |
| K04 | `03-live-session` (8 test) + `checks/06` API/WS demosu (DEMO OK) + `checks/07` Expo web, iki tarayıcı bağlamı (WEB DEMO OK) | geçti | DOĞRULANDI (API/WS + web); native DOĞRULANMADI |
| K05 | `03` › K05 sınır testi + `scoring.spec` + `08` › R5: kapanıştan 1 ms önce alınıp reveal’den sonra işlenen cevap kabul edilir (60 puan); kapanış anında ret; yavaş gövde ret | geçti | DOĞRULANDI |
| K06 | `04-answers-idempotency` › K06 (4 test) + `08` › R1/R10: geçişle seri çalışma; tamamlanmadan sonra aynı anahtarla aynı makbuz | geçti | DOĞRULANDI; DB tekil kısıtı ve 23505 yeniden deneme yolu API’den tetiklenemiyor ve testi yok |
| K07 | `04` › K07 (3 test) + `09` › R5: başka sorunun seçeneği `OPTION_INVALID`, cevap hakkı tüketilmez | geçti | DOĞRULANDI |
| K08 | `05-reconnect-late-join` (6 test) | geçti | DOĞRULANDI (API/WS). Mobil yeniden bağlanma ve token yenileme kodu yalnızca typecheck ile; cihazda DOĞRULANMADI |
| K09 | `03` › Q1 açılışında anahtar yok + `09` › R2: WS `question.opened` yükünde ve katılmamış kullanıcının `/state` yanıtında anahtar yok; personel oyuncu olamaz; editör oturum içeriğini göremez | geçti | DOĞRULANDI |
| K10 | `06-cancel-restart` (5 test) + `08` › R4 (3 test: sağlıklı lideri bozmama, kilit kaybında durma, ölen liderden devralmada iptal) + `09` › R4 (üretimdeki açılış kurtarma yolu) + `09` › R7 (canlı oturumda yönetici iptali) | geçti | DOĞRULANDI |
| K11 | `07-learning` (8 test; eşzamanlı tamamlamada günlük görev kaydı dahil) | geçti | DOĞRULANDI; “XP yarışma puanını değiştirmez” yalnızca yapısal kanıtla (ayrı tablolar, FK yok) |
| K12 | `03` › K12 + `07` › aktif kullanıcı ayrımı + web demosu “Kartı aç” (`11-quiz-to-content.png`) | geçti | DOĞRULANDI |

## 6. Yedi risk ve bulunan hatalar

### 6.1 Risk bazında sonuç

| Risk | Kanıt | Kapanışta bulunan | Durum |
|---|---|---|---|
| 1. Eşzamanlı cevap, kayıp alındı | K06; `08` R1/R10 | Cevap transaction’ı geçişlerle seri değildi, tamamlanmış oturuma makbuz yazılabiliyordu (düzeltildi). Mobil, `ANSWER_ALREADY_ACCEPTED`’ta dokunulan seçeneği işaretliyordu (düzeltildi). 23505 yeniden deneme iddiası düzeltildi. | DOĞRULANDI (API); mobil kenar yolları KISMİ |
| 2. Cevap sızıntısı | K09; `09` R2 | Personel oyuncu olarak katılabiliyordu; editör, denetim kaydından gelecek oturumun sorularını görebiliyordu (ikisi de düzeltildi). Daha önce reveal edilmiş sorunun yeni oturumda kullanılması ürün kararı olarak açıldı (A-7). | DOĞRULANDI |
| 3. Kimlik ve yetki | K02, K07; `09` R3; `checks/05` | WS soketi token süresi dolsa da çalışıyordu; mobil yeniden bağlanırken eski token’ı kullanıyordu; yerel secret üretimde kabul ediliyordu; seed uzak Auth’a bilinen parolayla personel açabiliyordu; kullanıcı adı e-postadan türetiliyordu (hepsi düzeltildi). | DOĞRULANDI; barındırılan JWKS DOĞRULANMADI |
| 4. Zamanlayıcı kilidi | K10; `08` R4; `09` R4; `scheduler-leader.spec` | Kilit, ayrı ve kalıcı bir bağlantıda tutuluyor. Bağlantı kaybı doğrulanmıyordu (`0f0f5df`); ölen liderden devralan süreç yarıda kalan oturumu sürdürüp sıralıyordu; sessizce ölen bağlantı zamanlayıcıyı donduruyordu (`2618234`). Sağlıklı lider varken açılan ikinci süreç hiçbir oturumu iptal etmiyor ve ilerletmiyor. Tek instance sınırı korundu. | DOĞRULANDI (aynı makine) |
| 5. Zaman ve sıralama | K05, K07; `08` R5; `09` R5 | Kapanıştan önce alınıp reveal’den sonra işlenen cevap reddediliyordu (düzeltildi). `receivedAt` gövde alındıktan sonra damgalanıyor. **Bilinçli sınır:** tamamlanmadan (son kapanış + 6 sn) sonra işlenen istek `SESSION_COMPLETED` alır. Sistem saatinin oturum sırasında atlaması M1 risk kaydında. | DOĞRULANDI (sınır kayıtlı) |
| 6. Editoryal onay | K03; `09` R6 | Test ve toplu onaylar insan onayıyla aynı kaydediliyordu; konu ve ilgili kart revizyonla sabitlenmiyordu; başlangıç yeniden kontrolü yayınlanmamış soruyu kabul ediyordu (hepsi düzeltildi). Açık kalanlar: editör bir seed kartını düzenlerse “örnek test içeriği” etiketi düşüyor; sabitlenmiş revizyon satırlarının değişmezliği uygulama düzeyinde, DB tetikleyicisi yok. | DOĞRULANDI; iki madde açık |
| 7. İptal ve XP | K10, K11; `09` R7 | Eşzamanlı tamamlamalarda günlük görev kaydı kayboluyordu (düzeltildi). Canlı oturumda yönetici iptali testsizdi (eklendi). Otomatik iptal katılımcıya ham UUID gösteriyordu (düzeltildi). | DOĞRULANDI |

İnceleme yöntemi: yedi risk için ayrı ayrı okuma ve saldırı senaryosu çıkarıldı. Bulgular kodla tek tek doğrulandı. Gerçek kural ihlali olanlar düzeltildi ve her biri için başarısız olan test önce yazıldı. Örneğin günlük görev yarışı ve ilgili kart sabitlemesi testleri düzeltme olmadan kırmızıydı. M0 kuralını ihlal etmeyen kanıt istekleri ve mobil UX notları düzeltilmedi; açık maddeler olarak kayıtlı (§12).

### 6.2 Bulunan ve düzeltilen gerçek hatalar

1. Kapanıştan önce alınmış ama reveal’den sonra işlenen cevap `QUESTION_CLOSED` ile reddediliyordu (`0f0f5df`).
2. Cevap ile oturum geçişi seri değildi; tamamlanmış oturuma makbuz yazılabiliyordu (`0f0f5df`).
3. Kilit bağlantısı düşünce süreç liderliği doğrulamadan ilerlemeye devam edebiliyordu (`0f0f5df`).
4. Temiz klonda `db:seed` başarısız oluyordu (`0f0f5df`).
5. Ölen liderden kilidi alan süreç yarıda kalan oturumu sürdürüp sıralıyordu (`2618234`).
6. Sessizce ölen kilit bağlantısı `verify()`’ı sonsuza kadar bekletip zamanlayıcıyı donduruyordu (`2618234`).
7. Test ve toplu onaylar insan editör onayından ayırt edilemiyordu (`2618234`, migration `0002`).
8. Konu ve ilgili kart onaylı revizyonla sabitlenmiyordu; onaysız bir düzenleme bitmiş oturumun sonucunu değiştiriyordu (`2618234`).
9. Editör ve admin hesapları oyuncu olarak katılabiliyordu; editörler oturum sorularını denetim kaydından görebiliyordu (`2618234`).
10. WS soketi el sıkışmadan sonra token süresi dolsa da kullanılabiliyordu; mobil yeniden bağlanmada eski token’ı gönderiyordu (`2618234`).
11. Varsayılan kullanıcı adı e-postanın yerel kısmıydı ve diğer oyunculara görünüyordu (`2618234`).
12. İki farklı içerik aynı anda tamamlanınca günlük görev kaydı kayboluyordu (`2618234`).
13. Repodaki yerel JWT secret’ı üretimde de kabul ediliyordu; seed, yerel olmayan Auth sunucusuna bilinen parolayla personel hesabı açabiliyordu (`2618234`).
14. Otomatik iptal katılımcıya ham soru UUID’si gösteriyordu; başlangıç yeniden kontrolü planlama kuralından gevşekti (`2618234`).
15. Mobil: `ANSWER_ALREADY_ACCEPTED`’ta dokunulan seçenek kabul edilmiş gibi işaretleniyordu; geç işlenen kabulde reveal “Cevapsız” gösterebiliyordu (`2618234`; yalnızca typecheck, otomatik mobil testi yok → KISMİ).

Kanıt düzeltmeleri:

- Web demosu tamamlanmış kartı seçebiliyor ve artık oturuma takılabiliyordu (`34f2249`).
- Profil ekran görüntüsü sessizce içerik kartını tekrar çekiyordu (`8eef005`).
- Kilit sahibi testi küme genelini sayıyordu (`e7681a8`).

## 7. Demo kanıtı — ortamlar ayrı

| Tür | Ne | Kanıt | Durum |
|---|---|---|---|
| Otomatik API/WS istemcisi | Editör test onayı → planlama → iki kullanıcı ayrı oturumla katılır → aynı sunucu takvimiyle 5 soru → kalıcı sonuç ve sıra → ilgili kart (`quiz_to_content_opened`) | `checks/06` (DEMO OK, 2 katılımcı, 10 cevap) | DOĞRULANDI |
| Web (Expo web = `apps/mobile` kodunun react-native-web derlemesi) | İki bağımsız Chromium bağlamında arayüzden giriş, Keşfet → kart → Tamamladım/Kaydet, Radar, bekleme salonu, canlı soru, alındı, reveal, sonuç, “Kartı aç”, profil; admin soru, oturum ve denetim ekranları | `checks/07`, `docs/reports/evidence/` (20 PNG + `web-demo-summary.json`) | DOĞRULANDI (web) |
| Native iOS/Android | — | — | DOĞRULANMADI |

Görsellerin çoğu `2618234` kodu ve `8eef005` demo betiğiyle yeniden üretildi. `05-culture-radar`, `06-waiting-room-*` ve `11-quiz-to-content` aynı akıştan bayt düzeyinde aynı çıktığı için değişmedi. Mobil görüntüler 390×844 Expo web, admin görüntüleri 1280×900. Görseller tek başına işlem doğruluğu kanıtı değildir; doğruluk testlerle (§5) gösterildi.

## 8. Native durum ve kurucunun Mac’inde sonraki adım

**Durum:** iOS/Android derlenmedi ve çalıştırılmadı (Xcode ve Android SDK yok) → DOĞRULANMADI. `expo-dev-client` hazır. `expo-secure-store`, AsyncStorage, arka plana alma ve WS davranışı cihazda doğrulanmalı. macOS kurulum yolu da DOĞRULANMADI.

```bash
# Ön koşul: Xcode (Expo SDK 57’nin istediği sürüm) + iOS simülatörü; Android için Android Studio + SDK
brew install postgresql@16 go node@22 && corepack enable
export PATH="$(brew --prefix postgresql@16)/bin:$PATH"     # postgresql@16 keg-only; pg_ctl PATH’te olmalı
git clone https://github.com/umutkutlutr/merak && cd merak && git checkout claude/wonderful-johnson-25mox5
#   (GitHub’sız: git clone MERAK_M0_BACKUP.bundle merak && cd merak && git checkout claude/wonderful-johnson-25mox5)
pnpm install
pnpm stack:init && pnpm stack:start
cp apps/api/.env.example apps/api/.env && cp apps/mobile/.env.example apps/mobile/.env && cp apps/admin/.env.example apps/admin/.env
pnpm db:migrate && pnpm db:seed
pnpm dev:api        # ayrı terminal; http://localhost:3000/ready → schedulerLeader:true
pnpm dev:admin      # ayrı terminal; http://localhost:5173
cd apps/mobile && npx expo run:ios        # veya: npx expo run:android
```

- **API adresi:** iOS simülatörü için `http://localhost:3000` ve `http://localhost:9999`. Android emülatöründe `localhost` otomatik olarak `10.0.2.2`’ye çevrilir. Fiziksel cihazda `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000` ve `EXPO_PUBLIC_AUTH_URL=http://<LAN-IP>:9999` kullanılır; GoTrue `GOTRUE_API_HOST=0.0.0.0 pnpm stack:start` ile başlatılır.
- **Beklenen akış:** `ayse@merak.local` ile giriş (`Merak-Local-123`) → Ana Sayfa → Keşfet → kart → Tamamladım (+10 XP, bir kez) → Yarış. Admin tarafında `editor@merak.local` ile 5 soru seçilip “Seçilileri test-onayla + yayınla” yapılır; ekranda kırmızı “TEST ONAYI” görünür. Ardından `admin@merak.local` ile 2–3 dk sonrası için oturum planlanır. Mobilde Katıl → lobi → 5 soru × (12 sn + 6 sn reveal) → sonuç ve sıralama → Kartı aç. İkinci cihaz veya simülatörde `mehmet@merak.local` ile aynı oturuma katılınır.
- **Kontrol edilecekler:** uygulama arka plana alınıp geri getirilince durum yeniden senkronlanıyor mu; uçak modunda “bağlantı” şeridi ve aynı cevapla tekrar gönderme; büyük yazı boyutunda 12 sn soru ekranı (A-3).

## 9. CI

`.github/workflows/ci.yml` şu adımları çalıştırır:

- frozen-lockfile ile install;
- contracts build;
- API lint;
- API, admin ve mobil typecheck;
- API testleri (PostgreSQL 16 servis konteyneriyle);
- API ve admin build.

| Run | Commit | Sonuç | URL |
|---|---|---|---|
| 1 | `72afaa3` | success (71 test) | https://github.com/umutkutlutr/merak/actions/runs/38761738323 |
| 2 | `e7681a8` | success | https://github.com/umutkutlutr/merak/actions/runs/38814960615 |
| 3 | `2618234` | success | https://github.com/umutkutlutr/merak/actions/runs/38819493260 |

Teslim commit’inin CI sonucu `MANIFEST.md`’de ve son yanıtta. CI’da olmayanlar:

- GoTrue (gerçek giriş testi atlanır);
- demolar;
- mobil veya admin uçtan uca testleri;
- native build;
- `expo-doctor`.

GitHub bir uyarı veriyor: kullanılan action’lar Node 20 tabanlı ve Node 24’e zorlanıyor. Bilgi amaçlı; hata değil.

## 10. Açık ürün kararları (7)

Önceki raporda 6 madde vardı; kapanışta A-7 eklendi. Öneriler kurucuya sunulan görüşlerdir, onay değildir.

| # | Karar | Seçenekler | Teknik / ürün etkisi | Öneri | Gerektiği aşama | M0 engeli |
|---|---|---|---|---|---|---|
| A-1 | Ürün adı ve marka (“Merak” çalışma adı) | Merak’ı tescil ve alan adı taramasından sonra tut / alternatif ad listesi / brief’teki yer tutucu adla ilerle | Mağaza kaydı, alan adı, logo; kodda ad yalnızca metinlerde, ikona gömülü değil | Pilot öncesi TPMK marka, alan adı ve mağaza taraması; sonuca göre karar | Kamuya açık pilottan önce (M3) | Hayır |
| A-2 | Haftalık hesap | 6 günün toplamı / en iyi 5 gün / ortalama | Bir günü kaçıranın cezası, geri dönüş motivasyonu; `session_results` iki modele de uygun | M1’de iki modeli de sürümlü hesaplayan tablo; benim önerim en iyi 5 gün (kaçırılan bir gün cezalandırılmaz) | M1, haftalık sıralama yazılmadan önce | Hayır |
| A-3 | 12 sn soru süresi ve erişilebilirlik | Sabit 12 sn / soru uzunluğuna göre süre / önce okuma süresi, sonra cevap penceresi | Puan formülü, adalet, büyük yazı ve ekran okuyucu kullanıcıları | M1’de okuma süresi ölçümü; “önce oku, sonra cevapla” deneyi | M1 ölçümleri, pilot öncesi | Hayır |
| A-4 | Geç katılım | Açık soru dahil kaçırılır (mevcut) / açık soruya kalan süreyle girilir | Tek satır kod (`eligibleFromPosition`); ortak süre nedeniyle avantaj yok | Mevcut kuralı koru (basit, istismar yolu yok) | M1 | Hayır |
| A-5 | Ödüllü yayın için hukuki yol | İzin al / ödülsüz sürdür / ödülü ayrı ve uygun bir organizasyonla yürüt / ödül modelini yeniden tasarla | Ödül, sezon ve final tasarımının tamamı | Faz 0 hukuki görüşü M1 ile paralel başlasın | Herhangi bir ödüllü yayından önce | Hayır |
| A-6 | İlgi alanlarının rolü | Yalnızca profil / Radar ve akış kişiselleştirmesi / kayıtta seçim | KVKK (profil verisi), kayıt akışı tasarımı | M2’de Radar sıralamasında kullan; seçim isteğe bağlı olsun | M2 | Hayır |
| A-7 | Reveal edilmiş sorunun yeniden kullanımı | Ödüllü yayında hiç tekrar yok / X hafta sonra tekrar / yalnızca ödülsüz modda tekrar | Önceki oturuma katılanlar cevabı bilir; içerik hacmi (brief: haftada 30 canlı soru, ~90 aday) | Ödüllü yayında tekrar kullanılmasın; M1’de planlamaya “daha önce reveal edildi” kontrolü ve admin uyarısı | M1 / pilot öncesi | Hayır |

Brief §28’de kodla bağlantısı olmayan diğer açık kararlar:

- puan formülünün nihai hâli;
- canlı yarışmanın kesin saati;
- soru formatlarının dağılımı;
- lig yapısı;
- sezon uzunlukları;
- büyük final formatı;
- ödül bütçesi;
- sponsor fiyatlandırması;
- premium kapsamı ve fiyatı;
- ilk lansman bütçesi;
- yatırım ihtiyacı;
- kullanıcı edinme maliyeti;
- nihai teknoloji altyapısı;
- MVP’nin detaylı ekran kapsamı;
- yan modüllerin tarihleri.

Kapanışta alınan geri alınabilir teknik varsayımlar ürün kararı değildir: editör ve admin oyuncu olarak katılamaz; varsayılan kullanıcı adı rastgeledir; onay kaynağı ayrı kaydedilir (DECISIONS §2).

## 11. Düzeltilen iddialar

| Önceki iddia | Gerçek |
|---|---|
| “21 ekran görüntüsü” | 20 PNG + 1 JSON özet. Ayrıca `12-profile-ayse.png`, `11-quiz-to-content.png`’nin bayt düzeyinde aynısıydı (demo sessizce yanlış ekranı çekiyordu); `8eef005` ile gerçek profil ekranı alındı. |
| “CI yazıldı, çalıştırılmadı” | 3 uzak koşu, üçü de success (§9). |
| “Özgün Master Brief eksik” | Kapanış paketinde geldi ve yerleştirildi. |
| K06: “23505 yeniden deneme” kanıtı | O yol API üzerinden tetiklenemiyor ve testi yok; yalnızca savunma katmanı. |
| K10: “ikinci süreç kilit alamaz” yeterli kanıt | Devralma ve açılış kurtarma yolları testsizdi; birinde gerçek hata vardı (§6.2/5); testler eklendi. |
| DECISIONS K-9: ad “KESİN” | Brief §28 adı açık karar sayar; K-9 “çalışma adı” olarak düzeltildi. |
| “Kayıt/giriş gerçek Supabase Auth ile” | Demolarda ve smoke’ta doğru. Testlerin çoğu aynı doğrulayıcıdan geçen imzalı token kullanır; CI’da gerçek giriş testi atlanır (§4.3). |
| “23 birim + 48 entegrasyon” | `72afaa3` için doğruydu (CI run 1: 71). Teslim kodunda 28 + 68 = 96. |
| README “Go ≥ 1.24” | GoTrue v2.197.0 `go 1.27.0` ister; `GOTOOLCHAIN=auto` indirir. |
| “Test onayı denetim kaydına böyle düşer” | Önceden yalnızca serbest metin notuydu; artık `approval_kind` alanında yapılandırılmış. |
| “Push 403 nedeniyle tamamlanmadı” | 403’ün nedeni kesin değildi: kurulum veya erişim yetkisi şüphesi. Kurucu erişim verdikten sonra push başarılı oldu (§13). |

## 12. Kalan açıklar ve engeller

- **Native iOS/Android:** DOĞRULANMADI (§8).
- **Mac kurulumu ve Supabase CLI + Docker yolu:** DOĞRULANMADI. README’de tarif var, test edilmedi.
- **Barındırılan Supabase (JWKS):** yalnızca yerel JWKS sunucusuyla birim testi var; DOĞRULANMADI.
- **expo-doctor:** 3 kontrol ağ engeli nedeniyle ENGELLİ.
- **Mobil kenar yolları** (yeniden bağlanmada yeni token, geç kabulde resync, `ANSWER_ALREADY_ACCEPTED`): otomatik test yok; KISMİ.
- **DB katmanı:** 23505 yeniden deneme yolu ve sabitlenmiş revizyon satırlarının DB düzeyinde değişmezliği test edilmedi.
- **Seed kartları:** editör düzenlerse “örnek test içeriği” etiketi düşüyor (açık bulgu).
- **Son soru sınırı:** tamamlanmadan sonra işlenen son soru cevabı `SESSION_COMPLETED` alır (bilinçli sınır).
- **Logout:** access token süresi dolana kadar geçerli kalır.
- **Ölçek:** 100 ve 1.000 eşzamanlı kullanıcı, WS yayın gecikmesi, hız adaleti, haftalık toplam ve sürümlü puan düzeltmesi M1 kapsamında; bu kapanışta yapılmadı.
- **Sistem saati:** zaman damgaları monoton olmayan sistem saatine dayanıyor; M1 risk kaydında.

## 13. GitHub erişimi

İlk teslimde push 403 döndü. Hata mesajı Claude’un GitHub erişiminin eksik olduğunu söylüyordu. Kurulum ekranı görülmediği için kök neden “kurulum veya erişim yetkisi şüphesi” olarak kaydedildi.

Kurucu erişimi verdikten sonra:

- **Repo erişimi:** var (okuma ve push, oturumun GitHub bağlantısı üzerinden).
- **Dal:** `claude/wonderful-johnson-25mox5`’e push başarılı; dal kısıtı ile karşılaşılmadı.
- **Workflow dosyası:** `.github/workflows/ci.yml` içeren commit’ler push edildi ve CI tetiklendi; workflow yazma yetkisi çalışıyor.
- **Kısıtlar:** `main`’e merge ve PR açılmadı. Token istenmedi; kimlik bilgisi chat’e girmedi.

Push başarısı test, CI veya ürün kabulü yerine kullanılmadı.
