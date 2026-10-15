# Merak — Claude Design için kapsamlı tasarım brief’i (M0 gerçeğine dayalı)

Bu belge Claude Design’a verilecek tek ve tam talimattır. Claude Design’ın rolü: Merak için (1) token tabanlı bir tasarım sistemi, (2) uygulamanın **bütün** ekranları, (3) her ekranın **bütün** durumları (yükleniyor, boş, hata, çevrimdışı, yeniden bağlanıyor, süre doldu, iptal) ve (4) üç ana akışı kapsayan tıklanabilir bir prototip üretmek; sonra bunu mühendisliğe token ve bileşen adlarıyla devretmektir. Ürünün tek cümlelik özü: **Merak, Türkiye’de başlayan, yetişkinlere saygılı bir kültür ve mikro öğrenme uygulamasıdır; hedeflenen biçimiyle haftada altı akşam herkesin aynı saatte birlikte oynayacağı beş soruluk canlı yarışma “Günün 5’i” ile yarışma saati dışında değer üreten sakin bir kültür akışını (Keşfet, Kültür Radarı, günlük görev, öğrenme XP’si) tek üründe birleştirir.** Yayın takvimi (Pazartesi–Cumartesi 21:00) yalnızca adaydır; M0’da yönetici yakın bir saat planlar. Bu sürüm (M0) **ödülsüz yerel bir testtir**: ödeme yoktur, ödül yoktur, haftalık sıralama yoktur; bunlar ekranlarda “ödülsüz test” etiketleriyle açıkça söylenir. Uygulama **bugün çalışır durumdadır**: Expo Router tabanlı mobil uygulama (`apps/mobile`), Vite tabanlı yönetim paneli (`apps/admin`) ve gerçek akışın web önizlemesinden alınmış 20 ekran görüntüsü (15 adım; bazı adımlar iki kullanıcı için ayrı) (`docs/reports/evidence/01-home-ayse.png` … `15-admin-audit.png`, Expo web 390×844, admin 1280×900; native **doğrulanmadı**). Tasarım bu mühendislik gerçeğine bağlı kalır: her veri alanı bir sözleşme alanına (`packages/contracts/src/*.ts`), her ekran durumu uygulanmış bir faz/duruma (`useQuizSession.ts`, `useAsync.ts`, `socket.ts`) eşlenir; sözleşmede olmayan hiçbir alan ekranda görünmez, uygulanmamış hiçbir davranış “var” gibi çizilmez.

## Çalışma biçimi

**Sıra (adımları atlama; her adımın sonunda dur, teslim et, onay iste):**

| Adım | Ne yapılır | Teslim | Kontrol |
|---|---|---|---|
| 1 — Yön keşfi | §1.2’deki üç aday görsel yönü aynı dört ekranda çalış: Günün 5’i soru ekranı (`question`), Keşfet listesi, sonuç ekranı (`completed`), Profil. | 4 ekran × 3 yön = 12 çerçeve (390×844, light, 1.0×) + karşılaştırma tablosu + gerekçeli öneri. 1.6× ve reduced-motion varyantları bu adımda istenmez (P2). | Hiçbir yönde ödül/sahte sayaç yok; puan ve XP ayrı tonlarda. |
| 2 — Kurucu seçer | Yön seçimini ve §6.10’daki ilk tur açık soruları (font ailesi, caption büyük harf, dark öncelik) kurucuya sor. | Kısa karar notu: seçilen yön, cevaplar, kalan varsayımlar. | Cevaplanmayan soru için varsayım yazıldı ve işaretlendi. |
| 3 — Token’lar | §1.3–§1.8 ve Ek B’yi seçilen yönle tasarım dosyasına aktar. | Tokens sayfası + JSON + CSS değişkenleri (§5.9/1) + kontrast ölçüm tablosu (§1.3). | Token’a bağlanmamış tek değer yok; kontrast tablosu §1.3 ile birebir. |
| 4 — Bileşenler | §5.3’teki 28 bileşen; önce P0 varyantları. | Bileşen sayfaları (varyant × durum matrisi). | Her bileşenin üstünde kaynak notu (`primitives.tsx › Button` gibi). |
| 5 — Ana akışlar | §2’deki akışlar A–E ve P0 çerçeveleri. | ≈44 P0 çerçevesi (§5.9/0). | Ek D/24 ve Ek D/28. |
| 6 — Tüm durumlar | §3 ve §4’teki durum tabloları, P1 çerçeveleri. | 1.6× ve 360×800 varyantları, bağlantı şeritleri, katılım hataları, hata/boş durumlar. | Ek D/1–4 (“Durum kapsamı”) ve Ek D/5–10. |
| 7 — Prototip | §5.9/4’teki üç tıklanabilir akış. | Paylaşılabilir prototip bağlantısı. | Gerçek süreler (soru 12 sn, reveal 6 sn); 3-2-1 perdesi yok. |
| 8 — Handoff | Redline, token eşlemesi (§5.10), T1 düzeltme listesi (§0.1), A-3 erişilebilirlik raporu, açık soru cevapları. | Handoff sayfası. | Ek D’nin tamamı işaretlendi. |

**Her adımda teslim edilenlerin ortak biçimi:** çerçeve adlandırması `M0 / <Ekran> / <Durum> / <Genişlik> / <Tema> / <Ölçek>`; her çerçevenin köşesinde kaynak notu (`ts: app/quiz/[id].tsx › RevealPane`); her metin dizesi Ek C’deki tablodan birebir; her ölçü token adıyla. Kurucu yön seçimini geciktirirse önerilen yön (A) varsayılan kabul edilir ve bu teslimde açıkça yazılır. Bir deneme ayarını (12 sn, 6 sn, 60 sn, 10 XP, 3 içerik) hiçbir yerde “nihai kural” diye yazma; `session.rules`’tan okunan değer olarak göster.

**Soru sorma biçimi.** Soruları adım sonunda toplu ve kapalı uçlu sor: evet/hayır ya da seçenekli, her birinde senin önerdiğin varsayılan yazılı olsun. Cevap beklerken durma: makul varsayımı yap, ilgili çerçevenin köşesine `VARSAYIM: …` etiketi koy ve handoff sayfasındaki “Varsayımlar” listesine ekle. Kurucu kararı gerektiren konular §6.10’dadır (A-1 … A-6 ve tasarım soruları); bunlarda kesin karar yazma, varsayılanı ve alternatifi göster. Belge ile kod çelişirse kodu doğru kabul et ve çelişkiyi raporla.

**Asla yapılmayacaklar (ihlal eden teslim reddedilir):**
1. Sahte ödül, ödül havuzu, kupa/madalya/para/hediye imgesi, sahte kullanıcı sayacı, “binlerce kişi oynuyor” sosyal kanıtı, kazanan vitrini, sponsor logosu. Katılımcı sayısı yalnızca sunucudan gelen `participantCount`’tur.
2. “Ödülsüz test” etiketini kaldırmak veya küçültüp okunmaz yapmak (yedi zorunlu konum: §6.7/5).
3. Kapsam dışı ekranları (§6.9) ana akışta çalışan arayüz gibi çizmek: haftalık sıralama, lig, sezon, ödeme, premium, düello, arkadaş, kulüp, bildirim, görsel/ses soru tipleri, yedi yan modülün boş kartları, “Yakında” rozetleri. Keşif yapacaksan ayrı sayfada `M1/M2 önerisi — uygulanmadı` etiketiyle.
4. Lisansı belirsiz görsel: kitap kapağı, film afişi, tablo reprodüksiyonu, stok fotoğraf, yapay zekâ üretimi fotoğraf. İçerik metin odaklıdır; görsel yer tutucu da bırakma.
5. Yarışma puanı ile öğrenme XP’sini tek bileşende toplamak; reveal’dan önce doğruluk ya da puan ima etmek; “adil”, “eşit şans”, “hile korumalı”, “gecikme telafili” iddiası.
6. `errorMessagesTr` metinlerini yeniden yazmak (tam liste: Ek A); token dışı renk/ölçü; “Merak” adını uygulama ikonuna veya illüstrasyona gömmek; 3-2-1 geri sayım perdesi, konfeti, maskot; seçeneklere A/B/C/D harfi.

## İçindekiler

- **0. Okuma kılavuzu** — katmanlar (T0/T1/[M1+]), birimler, duyuru kuralı, tipografik işaretler, kanonik bölümler, terimler
- **1. Marka dili, görsel sistem ve token’lar** — 1.1 ilkeler · 1.2 üç yön · 1.3 renk (tek kanonik tablo) · 1.4 tipografi · 1.5 boşluk/grid · 1.6 ikon/illüstrasyon · 1.7 hareket · 1.8 ses/haptik · 1.9 logo/isim
- **2. Bilgi mimarisi, navigasyon ve akışlar** — 2.1 rota haritası · 2.2 beş sekme · 2.3 sekme çubuğu · 2.4 stack başlıkları · 2.5 kimlik kapısı · 2.6–2.10 akışlar A–E · 2.11 derin bağlantılar · 2.12 canlı oturumda geri · 2.13 boş/yeni kullanıcı · 2.14 web/tablet · 2.15 kapsam dışı · 2.16 kontrol listesi
- **3. Ekran ekran spesifikasyon** — 3.0 ortak kurallar · 3.1 Giriş · 3.2 Kayıt · 3.3 Ana Sayfa · 3.4 Keşfet · 3.5 İçerik detayı · 3.6 Kültür Radarı · 3.7 Profil · 3.8 Yarış
- **4. Canlı yarışma deneyimi (Günün 5’i)** — 4.0 değişmezler · 4.1 oturum kartı · 4.2 faz haritası · 4.3–4.11 fazlar · 4.12 bağlantı şeridi · 4.13 zamanlama diyagramı · 4.14 WS olayları · 4.15 erişilebilirlik · 4.16 hareket · 4.17 Türkçe kopya · 4.18 teslim listesi · 4.19 [M1+] fikirler
- **5. Bileşen kütüphanesi ve teslimatlar** — 5.1 token tablosu · 5.2 Türkçe tipografi ve ölçekleme · 5.3 28 bileşen · 5.4 ikon · 5.5 boş durum · 5.6 iOS/Android · 5.7 web/tablet · 5.8 dark · 5.9 teslimat formatı ve öncelikler · 5.10 mühendislik eşlemesi
- **6. Yönetim paneli, ton rehberi, kapsam dışı, açık sorular** — 6.1 admin genel · 6.2 giriş/yetki · 6.3 Sorular · 6.4 İçerik · 6.5 Oturumlar · 6.6 Denetim · 6.7 ton rehberi · 6.8 hata sunumu kuralları (+6.8b sunucu özel mesajları) · 6.9 kapsam dışı · 6.10 açık sorular · 6.11 kabul listesi
- **Ek A** — Hata kodları ve Türkçe mesajlar (tam liste) · **Ek B** — Mevcut token değerleri (tokens.ts) · **Ek C** — Mevcut mikro-metinler (ekran bazında) · **Ek D** — Kabul kontrol listesi

---

## 0. Okuma kılavuzu

### 0.1 Üç katman: T0 · T1 · [M1+]

Belgedeki her talimat üç katmandan birindedir; etiketsiz talimat **T0** sayılır.

- **T0 — as-built.** Bugün `apps/mobile` ve `apps/admin` içinde olan davranış, ölçü ve kopya. “Mevcut:” ile başlar ya da etiketsizdir. Ana çerçevelerde aynen gösterilir.
- **T1 — M0 düzeltmesi.** Ana çerçevelerde **gösterilir**; mühendislik tek satırlık ya da token düzeyinde değişiklikle uygular. Kapalı liste (başka hiçbir şey T1 değildir):
  1. Alındı rozeti nötr ton (`status/neutral`, bkz. §1.3).
  2. `v{stateVersion}` rozeti son kullanıcıdan gizli (`__DEV__`).
  3. Bağlantı şeridi socket açılmadan çizilmez (`loading/error/preview/joining` fazlarında yok).
  4. `expired` fazında soru panosu kalır (seçenekler kilitli, sayaç yerine “Süre doldu”).
  5. `tabular-nums` (`fontVariant: ['tabular-nums']`) sayaç, puan, sıra, XP rakamlarında.
  6. Türkçe büyük harf: caption dönüşümü locale-duyarlı (`toLocaleUpperCase('tr-TR')`, web’de `<html lang="tr">`).
  7. Token değerleri: `inkFaint` → #6F6B78; metin/buton `live` → #B5380A (`live/default`), #D9480F → `live/vivid`; `success` → #256B36; yeni `border/input` #8A8791.
  8. Chip yüksekliği 48, yatay padding 16.
  9. Seçenek aralığı 8 → 12.
  10. Bilgi taşıyan `inkFaint` metinleri `inkMuted`’a (liste §0.1 altında).
  11. Soru ekranında prompt bölgesi bütçeyi aşınca kendi içinde kaydırılır; seçenekler, durum satırı ve sayaç sabit.
  12. Quiz `error` fazında NOT_FOUND için `Tekrar dene` yerine ghost `Yarış sekmesine dön`.
  13. Tab bar etiketi `maxFontSizeMultiplier 1.3`; `TextInput` `maxFontSizeMultiplier 1.6`.
  14. `T` v=display|h1|h2|h3 varsayılan `accessibilityRole="header"` (StateView başlığı hariç).
  15. Seçili seçenek `accessibilityState {selected:true}` + hint; `disabled` yalnızca seçilmemiş kilitlilerde. Reveal seçenekleri `accessible`, glifler SR’den gizli.
  16. Stack/tab geçişleri reduced motion’da `animation: 'none'`.
  17. Admin `styles.css` değişkenleri §1.3 T1 değerleriyle (`--live` #B5380A, `--ok` #256B36).
  18. Günlük görev kopyası `· Günlük görev tamamlandı.` (ünlem yok).
  19. Odak halkası (`focus/ring`) web `:focus-visible`, native `onFocus`.
  20. Reveal `isMine` yalnızca `reveal.myAnswer.optionId`’den türer (yerel seçim ✗ boyanmaz).
  21. `completed` fazında sonuç yüklenemezse error StateView + `Tekrar dene`.
  22. Display/h1 Android’de `fontWeight "700"`, iOS’ta `"800"`.
  
  T1/10 kapsamındaki metinler: idle ipucu `Bir seçenek seç. İlk kabul edilen cevap geçerlidir.` → small inkMuted; preview `Katılım ücretsizdir. Bu sürümde ödül yoktur.` → caption inkMuted; sonuç hero `Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.` → caption inkMuted (liveSoft üstünde 5.52 ✓); iptal `Verdiğin cevaplar denetim için saklanır; bu oturum sıralamaya girmez.` → small inkMuted (surfaceMuted üstünde 5.60 ✓); kaynak doğrulama satırı → caption inkMuted; ContentCard `{n} dk okuma` → caption `text/tertiary` (#6F6B78, surface üstünde 5.18 ✓); giriş dipnotu ve Profil `İlgi alanları:` → small inkMuted.

- **[M1+] — öneri.** M0 kodunda karşılığı olmayan, kontrat ya da mühendislik işi gerektiren tasarım önerisi. **Ayrı sayfada**, her çerçevenin köşesinde `[M1+] — uygulanmadı` etiketiyle; ana akış çerçevelerine bağlanmaz. Etiketsiz öneri içeren teslim reddedilir. Belgede `[M1+ öneri]`, `[M1+ küçük düzeltme]` ve `[M1+]` aynı katmandır.

### 0.2 Birimler ve çerçeveler

Mobil bölümlerde (§1–§5) **tüm ölçüler pt (React Native dp)** cinsindendir; çerçeve 390×844 pt (iOS) ve 360×800 pt (Android) @1x, dışa aktarım 2×/3×. Admin bölümünde (§6) ölçüler CSS px’tir. Ekran görüntüleri Expo web’den alınmıştır; çentik, home indicator, klavye ve 64 pt tab çubuğu inset’leri ayrı katman olarak tasarlanır.

### 0.3 Duyuru kuralı (ekran okuyucu)

Tasarım dosyasında “live region” değil **“duyuru (polite/assertive)”** yazılır. Mevcut kod RN `accessibilityLiveRegion` kullanır; bu prop **yalnızca Android’de** çalışır, iOS VoiceOver yok sayar. Mühendislik notu: Android `accessibilityLiveRegion`, iOS `AccessibilityInfo.announceForAccessibility` (assertive için `announceForAccessibilityWithOptions(text, {queue:false})`). Duyurulacaklar: form hatası (assertive), ret metni (assertive), bilinmeyen teslim (polite), bağlantı şeridi açılış/kapanış (polite), alındı rozeti (polite), reveal özeti (tek duyuru), StateView başlığı (polite). Her duyuru iki platformda da test edilir (§6.11/10).

### 0.4 Tipografik işaretler

Bu belgedeki tüm örnek dizeler **U+2019 (’)** kesme ve **U+201C/U+201D (“ ”)** tırnak ile yazılmıştır; kopyala-yapıştır güvenlidir. Orta nokta ayırıcı U+00B7 (·), üç nokta U+2026 (…). Düz `'` ve `"` hiçbir çerçevede kullanılmaz (kontrol: Ek D/15).

### 0.5 Kanonik bölümler (aynı konu tek yerde tanımlanır)

| Konu | Tek kaynak | Diğer bölümler |
|---|---|---|
| Renk değerleri, semantik adlar, kontrast oranları, dark eşlemesi | §1.3 | “bkz. §1.3” |
| Tip ölçeği, Türkçe büyük harf kararı, 1.6× soru ekranı bütçesi | §1.4 | “bkz. §1.4” |
| Boşluk, chip, buton, seçenek, giriş alanı ölçüleri | §1.5 | — |
| Hareket ve reduced motion | §1.7 | — |
| Ses ve haptik | §1.8 | — |
| Seçenek durumları ve seçenek aralığı | §4.7 | — |
| Bağlantı şeridinin yerleşimi | §4.12 | — |
| Zamanlı akışta ekran okuyucu | §4.15 | — |
| Kaynak doğrulama satırının görseli | §3.5/7 | — |
| Web/tablet içerik genişliği | §5.7 | — |
| Teslim öncelikleri ve çerçeve listesi | §5.9 | — |
| Ödülsüz test etiketinin konumları | §6.7/5 | — |
| Tarih, saat ve sayı biçimi | §6.7/7 | — |
| Hata kodları ve mesajlar | Ek A (+ sunum kuralları §6.8) | — |
| Kabul kontrol listesi | Ek D | — |

### 0.6 Terimler

| Terim (ekranda) | Anlamı | Kullanma |
|---|---|---|
| **Günün 5’i** | Beş soruluk canlı yarışma oturumunun ürün adı | “Quiz”, “Trivia” |
| **Ana Sayfa · Keşfet · Yarış · Kültür · Profil** | Beş sekmenin adları (sıra sabit) | “Home”, “Akış” |
| **Kültür Radarı** | Kültür sekmesindeki tek M0 modülü: dört editör seçkisi (kitap/film) | “Öneriler” |
| **oturum** | Bir Günün 5’i yarışması (`quiz_session`) | “maç”, “oyun” |
| **bekleme salonu** | Lobi (oturum başlamadan önceki bekleme) | “lobi” (yalnızca teknik metinlerde) |
| **puan** | Yarışma puanı (soru başına 60–100 ya da 0) | “skor”, “XP” |
| **XP / öğrenme XP’si** | İçerik tamamlamadan gelen öğrenme puanı | “puan” |
| **reveal** | Soru kapandıktan sonra doğru cevabın ve açıklamanın gösterildiği an (ekranda `sonuç`) | — |
| **faz** | `/quiz/[id]` ekranının istemci durumu (11 adet) | — |
| **katılım** | Kullanıcının bir oturuma kaydı (cihazdaki katılım belirteciyle korunur) | — |


---

## 1. Marka dili, görsel sistem ve token’lar

### 1.1 Ürün özü ve tasarım ilkeleri (her biri test edilebilir)

Merak, Türkiye’de başlayan, yetişkinlere hitap eden bir kültür ve mikro öğrenme uygulamasıdır. İki deneyim tek üründe yaşar: hedeflenen biçimiyle haftada altı akşam aynı saatte oynanacak beş soruluk canlı yarışma **Günün 5’i** (yayın takvimi — Pazartesi–Cumartesi 21:00 — yalnızca adaydır; M0’da yönetici yakın bir saat planlar) ve yarışma saatinin dışında değer üreten sakin kültür akışı (Keşfet, Kültür Radarı, günlük görev, XP). M0 sürümünde yarışma **ödülsüz yerel testtir**; bu etiketi hiçbir ekranda kaldırma.

Aşağıdaki sekiz ilkeyi tasarım sisteminin kabul ölçütü olarak kullan. Her ilkenin “Test” satırı tasarım incelemesinde evet/hayır ile cevaplanır.

1. **Dürüstlük önce gelir.** Sahte sayaç, sahte kazanan, sponsor logosu, ödül görseli, “binlerce kişi oynuyor” sosyal kanıtı yok. Katılımcı sayısı yalnızca sunucudan gelen `participantCount`’tur.
   Test: Herhangi bir ekranda veriden gelmeyen bir sayı, isim veya ödül var mı? → Hayır olmalı.
2. **İki para birimi, iki renk.** Yarışma puanı (`puan`) ile öğrenme XP’si (`XP`) asla aynı bileşende toplanmaz; puan canlı (turuncu) bağlamda, XP sakin (teal) bağlamda gösterilir.
   Test: Bir kartta hem puan hem XP toplamı var mı? Tek bir seviye/ilerleme çubuğu ikisini karıştırıyor mu? → Hayır olmalı.
3. **Canlı enerjik, kültür sakin.** Yarış sekmesi ve `/quiz/[id]` ekranı `live` paletini; Ana Sayfa, Keşfet, Kültür, Profil ve içerik detayı `accent` paletini kullanır. Tek bir bileşen üzerinde iki palet birlikte kullanılmaz. **Tek istisna `QuizSessionCard`:** caption (`Günün 5’i · ödülsüz test`) her durumda live tonundadır; rozet ve CTA oturum `lobby`/`live` iken live, diğer durumlarda accent/muted’dır (as-built). Bu bileşen dışında karışım yoktur.
   Test: Keşfet listesinde turuncu bir öğe, soru ekranında teal bir CTA var mı? → Hayır olmalı.
4. **İçerik ve geri bildirim animasyondan önce gelir.** Soru ve seçenekler `question.opened` olayıyla aynı karede görünür; “Cevabın kabul edildi” sunucu alındısı geldiği anda görünür; hiçbir giriş animasyonu bunları geciktirmez (hareket tablosu §1.7).
   Test: Soru görünümüne veya alındı rozetine 0 ms’den uzun bir giriş gecikmesi/animasyon bağlı mı? → Hayır olmalı.
5. **Alındı ≠ doğru.** “Cevabın kabul edildi” nötr bir teslim durumudur (T1/1); yeşil ve “doğru” anlamındaki ✓ yalnızca reveal ve sonuç ekranlarında kullanılır.
   Test: Reveal öncesi **doğruluk anlamı taşıyan** hiçbir öğe success/danger tonunda değil mi? → Değil olmalı. Ret metni (danger) bir teslim hatasıdır, doğruluk bildirmez; alındı rozeti nötrdür.
6. **Yetişkin tonu, sade dil.** “Sen” hitabı, kısa cümleler; “Aferin!”, maskot, konfeti, seviye utandırma, “öğrendin/ustalaştın” iddiası yok. “Tamamladım” bir öğrenme kanıtı değil, kendi takip işaretidir (mevcut dipnot korunur).
   Test: Metinlerde ünlemli kutlama, çocuksu ifade veya öğrenme başarısı iddiası var mı? → Hayır olmalı. (Bugünkü tek ünlemli kutlama `· Günlük görev tamamlandı!` (T1/18) ile ünlemsiz yapılır; istisna yoktur.)
7. **Erişilebilirlik varsayılan.** Tüm dokunulabilir alanlar ≥ 48 pt; normal metin ≥ 4.5:1, büyük metin ≥ 3:1, etkileşimli sınır ve odak halkası ≥ 3:1 (§1.3); font 1.6× ölçeğinde dört seçenek ve timer sabit kalır, prompt gerekirse kendi içinde kaydırılır (§1.4/2); renk tek başına doğru/yanlış taşımaz (✓/✗ + metin); ekran okuyucu etiketleri mevcut `accessibilityLabel` kalıplarını korur; reduced motion’da hareket kalkar.
   Test: Her P1 ekranında 1.0× ve 1.6× varyantı ve reduced-motion notu var mı? → Evet olmalı.
8. **Token’suz değer yok.** Renk, tip, boşluk, radius, gölge ve süre yalnızca token adlarıyla belirtilir; ekrana özel rastgele hex, “her kartta ayrı renk” veya tek seferlik boşluk değeri kullanılmaz. Değer önerileri yalnızca §1.3’te yaşar.
   Test: Tasarım dosyasında token adına bağlanmamış bir renk/ölçü var mı? → Hayır olmalı.

### 1.2 Üç aday görsel yön (Çalışma biçimi · Adım 1)

Üç yönü aynı dört ekran üzerinde çalış: Günün 5’i soru ekranı (`/quiz/[id]` · faz `question`), Keşfet kart listesi, oturum sonuç ekranı (faz `completed`) ve Profil. Her yön için aşağıdaki başlıkları doldur; sonunda önerilen yönü gerekçesiyle ver. Bu adımın çıktısı bir **karar kapısıdır**: 12 çerçeve, 390×844, light, 1.0×. Seçilen yönün 1.6× ve reduced-motion varyantları sonraki adımlarda (P1/P2) üretilir. §5.9/0 öncelik tablosunda yön keşfinin P2 görünmesi, kabul için zorunlu son çerçeveler arasında olmadığı içindir; iş sırasında **ilk** adımdır ve token’a geçmeden kurucu seçimi beklenir.

| | A — “Kültür Dergisi” | B — “Modern Müze” | C — “Sahne + Kütüphane” |
|---|---|---|---|
| Karakter | Sıcak kâğıt, editoryal, güçlü başlık tipografisi | Nötr galeri, bol beyaz boşluk, geometrik sans, ince çizgiler | İki mod: yarışma için koyu “sahne”, kültür için açık “kütüphane” |
| Renk | Mevcut token’ların doğal devamı (§1.3): sıcak kâğıt zemin, beyaz yüzey, teal accent, turuncu live | Yalnızca bu yön keşfinde: zemin #F7F7F5 (daha soğuk), ink #121212; accent tek vurgu, live daha az doygun | Kültür: §1.3 light palet. Yarışma: §1.3 dark eşlemesi (canvas #151417 ailesi); live turuncu parlar, timer ve progress yüksek kontrast |
| Tipografi | Serif yalnızca sekme h1’leri, içerik başlığı ve display için (Source Serif 4, Fraunces, Newsreader); gövde ve **soru ekranının tamamı** sans (Inter/Manrope) | Tek sans aile (Inter/Geist/IBM Plex Sans), başlıklar w700, gövde 16/24 | Kültürde A’nın kombinasyonu; yarışmada aynı sans aile, daha ağır (w800) ve display 32 timer |
| Doku | Kâğıt tonu zemin; kartlar beyaz, `shadow.card` (0.06). Görsel yok; konu caption’ı ile ayrım | Dokusuz; kartlar yerine 1 pt ayraçlar; gölge yok veya minimum | Kültür A gibi; yarışmada çok hafif turuncu vinyet (statik, dekoratif) |
| Hareket karakteri | Sakin; yarışmada yalnızca timer ve progress canlı (§1.7) | Çok az | Kültürde A gibi; yarışmada yalnızca §1.7’nin izin verdiği hareketler |
| Güçlü yan | Bugünkü uygulamayla neredeyse birebir; K-6 “premium, güçlü tipografi” isteğini görselsiz karşılar; Türkçe serifler İ/ş/ğ için olgun | En düşük risk, hızlı uygulanır, kontrast yönetimi kolay | Canlı/sakin ayrımını en güçlü hissettirir; akşam yarışması göz yormaz |
| Zayıf yan | Serif lisans ve Türkçe glif kontrolü ister; iki aile yükü; serif 12–14 pt’de kullanılmaz | “Kültür” sıcaklığı kaybolur; hafızada kalmaz; yarışma yeterince enerjik olmayabilir | M0’da dark tema yok (`userInterfaceStyle: 'light'`); iki tema = iki kat token ve QA; koyu soru ekranı 1.6×’te yeniden doğrulanmalı |
| Soru ekranında | Beyaz seçenek kartları, live progress, sans h1 prompt (bugünkü ekran) | Kenarlıksız seçenek satırları, ince ayraçlar | Koyu zemin, koyu yüzey seçenekler, seçili = live dolgu |
| Keşfet kartında | Beyaz kart, teal konu caption’ı, serif başlık | Ayraçlı liste, kart yok | A ile aynı |
| Sonuç ekranında | liveSoft hero + accentSoft “Merakın devam etsin” (bugünkü ekran) | Tek sütun, display rakam, kart yok | Hero koyu, “Merakın devam etsin” açık (kültüre geçiş “ışığa çıkar”) |
| Profil’de | Üç sakin istatistik, serif başlık | Minimal liste | A ile aynı |

**Önerilen yön: A (“Kültür Dergisi”) temel; C’nin yarışma modu `[M1+ öneri]` olarak ayrı katman.** Gerekçe:
1. Mevcut token’lar ve 20 ekran görüntüsü zaten A’nın üzerinde duruyor; değişiklik token dosyasıyla sınırlı kalır (K-6 token sistemi kararıyla uyumlu).
2. K-6’nın “güçlü tipografi” isteğini görsel kullanmadan (lisans kısıtı) yalnızca tipografi ve kâğıt tonuyla karşılayan yön A’dır.
3. C’nin koyu “sahne” modu doğru fikirdir ama M0’da dark tema yoktur; §1.3 dark eşlemesiyle hazırla, uygulamayı M1+’a bırak.
4. B’yi yalnızca marka pası ertelenirse yedek olarak sakla; M0’a ek enerji getirmez.

### 1.3 Renk sistemi (kanonik: değerler, kontrast, dark)

**Bu alt bölüm renk değerlerinin ve kontrast oranlarının tek kaynağıdır.** Başka bir bölümde geçen hex veya oran buraya referanstır; çelişki görürsen bu tablo geçerlidir. Oranlar WCAG 2.x göreli parlaklık formülüyle hesaplanmıştır.

**A) Mevcut `tokens.ts` değerleri ve karar**

| Token (mevcut) | Hex (T0) | Mevcut rol | Karar |
|---|---|---|---|
| `bg` | #F6F3EE | Ekran zemini (sıcak kâğıt) | Koru |
| `surface` | #FFFFFF | Kart, giriş alanı, tab bar, seçenek | Koru |
| `surfaceMuted` | #EFEAE2 | Muted kart, chip, secondary buton | Koru |
| `ink` | #17161A | Birincil metin | Koru |
| `inkMuted` | #5E5A66 | İkincil metin | Koru |
| `inkFaint` | #9A96A3 | Caption/dipnot | **(T1/7) → #6F6B78** (`text/tertiary`); yalnızca bg ve surface üzerinde |
| `line` | #E2DDD4 | Kenarlık, ayraç, progress track | Koru; yalnızca dekoratif |
| `accent` | #1F5F5B | Kültür/öğrenme vurgusu, primary buton, aktif tab | Koru |
| `accentSoft` | #DCEBE8 | Accent kart zemini, “Kayıtlı” rozeti | Koru |
| `live` | #D9480F | Canlı yarışma vurgusu | **(T1/7)** metin ve beyaz metin taşıyan yüzeyler → #B5380A (`live/default`); #D9480F yalnızca `live/vivid` |
| `liveSoft` | #FDE4D8 | Oturum kartı (lobby/live), bekleme kartı, sonuç hero | Koru |
| `success` | #2B7A3D | Doğru cevap, “Tamamlandı” | **(T1/7) → #256B36** |
| `successSoft` | #DDF1E1 | Doğru seçenek zemini | Koru |
| `danger` | #B42318 | Yanlış, hata metni, çıkış | Koru |
| `dangerSoft` | #FBE3E0 | Yanlış seçenek zemini, danger buton | Koru |
| `warning` | #A15C00 | Bağlantı şeridi, seed rozeti, geç katılım, bilinmeyen teslim | Koru |
| `warningSoft` | #FDEFD8 | Şerit/rozet zemini | Koru |
| `overlay` | rgba(23,22,26,0.55) | Tanımlı, kullanılmıyor | Yalnızca `[M1+ öneri]` modal/sheet |
| — (yeni) | #8A8791 | — | **(T1/7) `border/input`**: etkileşimli bileşen sınırı |

**B) Semantik adlar (tasarım dosyasında bu adları kullan; mühendislik `tokens.ts`’e eşler, §5.10)**

| Semantik ad | Light değeri | Kullanım kuralı |
|---|---|---|
| `bg/canvas` | #F6F3EE | Ekran zemini |
| `bg/surface` · `bg/surfaceMuted` | #FFFFFF · #EFEAE2 | Kart, giriş, chip, secondary buton |
| `bg/accentSoft` · `bg/liveSoft` | #DCEBE8 · #FDE4D8 | Tonlu kartlar |
| `text/primary` | #17161A | Birincil metin |
| `text/secondary` | #5E5A66 | İkincil metin; **tonlu kartlarda (muted/accent/live/success/danger/warning soft) ikincil ve üçüncül metin daima bu** |
| `text/tertiary` | #6F6B78 (T1/7) | Yalnızca `bg/canvas` ve `bg/surface` üzerinde; caption, “N dk okuma”, tab pasif |
| `text/placeholder` | = `text/tertiary` | Giriş alanı yer tutucusu |
| `text/onAccent` · `text/onLive` | #FFFFFF | Primary ve live buton metni (live zemini yalnızca `live/default`) |
| `text/onSecondary` | = `text/primary` | Secondary buton metni |
| `text/onDanger` | = `status/danger` | Danger buton metni (dangerSoft zemin) |
| `text/ghost` | = `accent/default` | Ghost buton metni |
| `border/subtle` | #E2DDD4 | Dekoratif: ayraç, kart çevresi |
| `progress/track` | = `border/subtle` | Progress bar zemini (günlük görev, kalan süre) |
| `tab/inactive` | = `text/tertiary` (T1/7) | Tab bar pasif ikon ve etiket (surface 5.18) |
| `border/input` | #8A8791 (T1/7) | Etkileşimli sınır: giriş alanı 1 pt, seçenek butonu nötr durumu 2 pt, pasif chip 1 pt, admin input/düğme 1 px |
| `accent/default` · `accent/soft` | #1F5F5B · #DCEBE8 | Kültür/öğrenme |
| `live/default` | #B5380A (T1/7) | Canlı metin (caption, rozet metni, stack başlık tint’i), live buton zemini, seçili seçenek zemini ve kenarlığı |
| `live/vivid` | #D9480F | **Yalnızca** kalan süre progress dolgusu ve ≤3 sn timer rakamı (h2 20/26 w700 = büyük metin). Üzerinde metin taşıyan hiçbir yüzeyde kullanılmaz |
| `live/soft` | #FDE4D8 | Canlı kartlar |
| `status/success` · `status/successSoft` | #256B36 (T1/7) · #DDF1E1 | Yalnızca reveal, sonuç ve “Tamamlandı” rozeti |
| `status/danger` · `status/dangerSoft` | #B42318 · #FBE3E0 | Reveal yanlış, hata metni, ret satırı, “Çıkış yap” |
| `status/warning` · `status/warningSoft` | #A15C00 · #FDEFD8 | Bağlantı, seed içerik, geç katılım, bilinmeyen teslim |
| `status/warningStrong` | #8F5200 `[M1+ küçük düzeltme, isteğe bağlı]` | 12 pt warning rozetleri için daha güçlü metin |
| `status/neutral` · `status/neutralSoft` | #5E5A66 · #EFEAE2 | **“Cevabın kabul edildi” rozeti** (T1/1) |
| `focus/ring` | `accent/default` (kültür) · `live/default` (yarışma) | 2 pt halka, 2 pt offset; web `:focus-visible`, native klavye/switch odağı |
| `overlay` | rgba(23,22,26,0.55) | `[M1+ öneri]` modal |

**C) Kontrast ölçüm tablosu (light) — tek kaynak**

| Ön plan / zemin | Oran | Sonuç | Kullanım |
|---|---|---|---|
| ink / bg · ink / surface | 16.27 · 18.01 | ✓ | Gövde metni |
| ink / surfaceMuted · accentSoft · liveSoft · successSoft | 15.04 · 14.66 · 14.81 · 15.22 | ✓ | Tonlu kart metni |
| inkMuted / bg · surface | 6.06 · 6.71 | ✓ | İkincil metin |
| inkMuted / surfaceMuted · liveSoft · accentSoft · warningSoft | 5.60 · 5.52 · 5.46 · 5.91 | ✓ | Tonlu kartlarda ikincil metin |
| inkFaint #9A96A3 (T0) / bg · surface · surfaceMuted · liveSoft | 2.61 · 2.89 · 2.41 · 2.38 | ✗ | Bilgi taşıyan metinde kullanılamaz → T1/7 ve T1/10 |
| text/tertiary #6F6B78 / bg · surface | 4.68 · 5.18 | ✓ | Caption, dk okuma, tab pasif |
| text/tertiary #6F6B78 / surfaceMuted · liveSoft · accentSoft | 4.33 · 4.26 · 4.22 | ✗ | **Kullanılmaz**; orada inkMuted |
| accent / bg · surface · accentSoft · surfaceMuted | 6.67 · 7.38 · 6.01 · 6.16 | ✓ | Teal metin, ghost, caption |
| #FFF / accent | 7.38 | ✓ | Primary buton |
| live #D9480F / surface | 4.30 | ✗ (normal metin) | Yalnızca `live/vivid` |
| live #D9480F / bg | 3.88 | yalnızca büyük metin | ≥20 pt w700 timer |
| live #D9480F / liveSoft | 3.53 | ✗ | Kullanılmaz |
| #FFF / live #D9480F · ink / live #D9480F | 4.30 · 4.19 | ✗ | Seçili seçenek ve live buton bu zeminde olamaz |
| live/default #B5380A / surface · bg · liveSoft · surfaceMuted | 5.94 · 5.37 · 4.88 · 4.96 | ✓ | Canlı metin |
| #FFF / live/default #B5380A | 5.94 | ✓ | Live buton, seçili seçenek |
| success #2B7A3D (T0) / successSoft · surface | 4.49 · 5.31 | ✗ / ✓ | successSoft üstünde AA altı → T1/7 |
| status/success #256B36 / successSoft · surface · bg | 5.48 · 6.49 · 5.87 | ✓ | Doğru cevap, Tamamlandı |
| danger / dangerSoft · surface · bg | 5.37 · 6.57 · 5.94 | ✓ | Yanlış, hata |
| warning / warningSoft · bg | 4.58 · 4.69 | ✓ (12 pt w600 rozet dahil) | Şerit, seed rozeti, geç katılım |
| warningStrong #8F5200 / warningSoft | 5.49 | ✓ | İsteğe bağlı rozet metni |
| border/input #8A8791 / surface · bg | 3.53 · 3.19 | ✓ (≥3:1) | Etkileşimli sınır |
| line / surface · bg | 1.35 · 1.22 | dekoratif | Etkileşimli sınır olamaz |
| surface / bg · surfaceMuted / bg | 1.11 · 1.08 | dekoratif | Kart/chip ayrımı gölge, sınır ve içerikle sağlanır |

**D) Kontrast kuralları**
1. Normal metin (< 24 pt normal / < 18.66 pt bold): ≥ 4.5:1, 12 pt caption dahil.
2. Büyük metin (display, h1, ≥ 20 pt w700 h2 — timer dahil): ≥ 3:1.
3. Etkileşimli bileşen sınırı ve odak halkası: ≥ 3:1. `line` bunu sağlamaz; etkileşimli sınırlarda `border/input`.
4. Beyaz metin taşıyan live yüzey yalnızca `live/default` #B5380A.
5. `text/tertiary` yalnızca canvas ve surface üzerinde; tonlu kartlarda ikincil metin daima `text/secondary`.
6. `warning` metni 12 pt w600 rozet dahil AA geçer (4.58); 12 pt altında kullanılmaz. Uzun uyarı metinleri ≥ 14 pt. Rozet için istenirse `status/warningStrong` `[M1+ küçük düzeltme, isteğe bağlı]`.
7. Her teslim, kullandığı her çift için bu tablodan satır gösterir; yeni çift eklenirse ölçülüp bu tabloya eklenir.

**E) “Canlı” ve “kültür” modlarının renk ayrımı (kesin kurallar)**
1. `live/*` yalnızca şu yerlerde: `QuizSessionCard` (caption her durumda; rozet ve CTA yalnızca lobby/live iken — §1.1 ilke 3), `/quiz/[id]` tüm fazları, stack başlığı `Günün 5’i · Test` tint’i, sonuç hero kartı, Yarış sekmesindeki oturum kartı. Profil’deki yarışma geçmişi puanları **live değildir** (inkMuted; Profil tamamen sakin palet).
2. `accent/*` yalnızca şu yerlerde: tab bar aktif rengi, Ana Sayfa günlük görev kartı ve XP, Keşfet çipi aktif durumu, Kültür Radarı, içerik detayı (konu caption’ı, “Neden öneriyoruz”, “Kaynağı aç”), primary butonlar, Profil XP. Yarışma ekranında teal yalnızca iki yerde görünür: reveal’daki `Açıklama` kartı ve sonuçtaki `Merakın devam etsin` köprü kartı.
3. Tab bar aktif rengi her zaman `accent`; Yarış sekmesi seçiliyken de turuncuya dönmez.
4. `success`/`danger` doğruluk bildirimi olarak yalnızca reveal, sonuç ve “Tamamlandı” rozetinde kullanılır; `danger` ayrıca hata metinleri, ret satırı (teslim hatası) ve “Çıkış yap” içindir. Birincil CTA’larda asla kullanılmaz.
5. `warning` mod bağımsızdır: bağlantı şeridi, “Örnek test içeriği”, geç katılım notu, bilinmeyen teslim.

**F) Dark mod eşlemesi `[M1+ öneri]` — M0 yalnızca light (`app.json` → `userInterfaceStyle: 'light'`).** Tek set budur; başka bölümde farklı dark hex yoktur.

| Semantik | Light | Dark | Dark kontrast / not |
|---|---|---|---|
| `bg/canvas` | #F6F3EE | #151417 | — |
| `bg/surface` | #FFFFFF | #1F1E23 | canvas’a karşı 1.11 (dekoratif) |
| `bg/surfaceMuted` | #EFEAE2 | #2A282F | — |
| `text/primary` | #17161A | #F3F0EA | canvas 16.13 · surface 14.56 |
| `text/secondary` | #5E5A66 | #B8B3BE | canvas 8.94 · surface 8.07 · surfaceMuted 7.09 · liveSoft 7.05 · accentSoft 6.29 |
| `text/tertiary` · `text/placeholder` · `tab/inactive` | #6F6B78 | #8E8995 | canvas 5.39 · surface 4.86; surfaceMuted 4.27 ✗ → **yalnızca canvas/surface üzerinde** |
| `border/subtle` · `progress/track` | #E2DDD4 | #3A3840 | surface 1.43 (dekoratif) |
| `border/input` | #8A8791 | #8E8995 | surface 4.86 |
| `accent/default` | #1F5F5B | #7FC2BB | canvas 9.03 · surface 8.15 |
| `accent/soft` | #DCEBE8 | #1C3634 | accent üstünde 6.35 |
| `live/default` · `live/vivid` | #B5380A · #D9480F | #FF8A5B (ikisi tek değer) | canvas 7.90 · surface 7.13 |
| `live/soft` | #FDE4D8 | #3D2318 | live üstünde 6.22 |
| `text/onAccent` · `text/onLive` | #FFFFFF | #151417 | accent 9.03 · live 7.90 (seçili seçenek metni dahil) |
| `text/onSecondary` · `text/ghost` · `text/onDanger` | ink · accent · danger | text/primary · accent dark · danger dark | — |
| `status/success` / soft | #256B36 / #DDF1E1 | #7CCB8D / #1C3524 | 6.81 |
| `status/danger` / soft | #B42318 / #FBE3E0 | #F08A80 / #3E1F1C | 6.10 |
| `status/warning` / soft | #A15C00 / #FDEFD8 | #E6A84A / #3B2C12 | 6.47 |
| `focus/ring` | accent · live/default | accent dark · live dark | — |
| `overlay` | rgba(23,22,26,.55) | rgba(0,0,0,.6) | — |
| splash · status bar | #F6F3EE · `dark` | #151417 · `light` | — |

Dark kart ayrımı kuralı: gölge kaldırılır; etkileşimsiz `surface` kart = `bg/surface` + 1 pt `border/subtle` (dekoratif). Etkileşimli kart (`ContentCard`) ve seçenek butonu dark’ta `border/input` dark değerini kullanır. Dark’ta buton metni beyaz değil `#151417`’dir. Uygulama içi tema anahtarı yok; sistem ayarı izlenir.

### 1.4 Tipografi (kanonik: tip ölçeği, Türkçe büyük harf, 1.6× bütçesi)

**Tip ölçeği — mevcut `type` token’ları başlangıç noktasıdır; değerleri koru, yalnızca aile ve Türkçe kuralı ekle:**

| Token | Boyut/satır | Ağırlık | Tracking | Kullanım | Not |
|---|---|---|---|---|---|
| `display` | 32/38 | 800 (Android 700, T1/22) | −0.5 | Giriş “Merak”, sonuç puanı “97 puan” | 1.6×’te 51 pt; hero kartta sarar, kesilmez |
| `h1` | 26/32 | 800 (Android 700, T1/22) | −0.3 | Sekme başlıkları, soru prompt’u, içerik başlığı, bekleme kartı başlığı | Prompt 8–400 karakter |
| `h2` | 20/26 | 700 | 0 | Bölüm başlıkları, timer, oturum başlığı, istatistik değeri | Rakamlarda `fontVariant: ['tabular-nums']` (T1/5) (iOS doğrulandı; Android’de cihazda doğrula, yoksa sayaç `minWidth 64`) |
| `h3` | 17/22 | 700 | 0 | Kart başlıkları, StateView başlığı | — |
| `body` | 16/24 | 400 | 0 | İçerik metni, açıklama | Paragraf arası 16 |
| `bodyStrong` | 16/24 | 600 | 0 | Buton, seçenek metni, sıralamada “(sen)” satırı | Seçenek ≤ 120 karakter |
| `small` | 14/20 | 400 | 0 | Özet, meta, durum satırları, hata metni, kural satırları | — |
| `caption` | 12/16 | 600 | +0.4, BÜYÜK HARF | Konu etiketi, rozetler, “Günlük görev”, “SORU 1/5” | Türkçe büyük harf kuralı aşağıda |
| `mono` | 14/20 | — | 0 | Tanımlı, mobilde kullanılmıyor | Yalnızca admin işlem adları |

**Türkçe karakter kontrolü (her aday aile için zorunlu test sayfası):**
1. **Büyük harf kararı (kanonik; §1.4/1):** Caption BÜYÜK HARF korunur, dönüşüm locale-duyarlı yapılır (T1/6). Tasarımda tüm caption örneklerini doğru Türkçe biçimiyle yaz: `GÜNÜN 5’İ · ÖDÜLSÜZ TEST`, `ÖRNEK TEST İÇERİĞİ`, `SANAT VE MİMARİ`, `EŞİT PUANLAR AYNI SIRAYI PAYLAŞIR`, `MERAKIN DEVAM ETSİN`. Mevcut uygulama `textTransform: 'uppercase'` ile `GÜNÜN 5’I` ve `IÇERIĞI` üretir (ekran görüntülerinde görülür). Mühendislik notu üç platform için: **Expo web** — `app/+html.tsx` ile `<html lang="tr">` (CSS `text-transform` o zaman İ üretir; bugün dosya yok); **native** — `T` caption varyantında `textTransform` kaldırılır, `children` metinse `toLocaleUpperCase('tr-TR')` uygulanır (Hermes Intl ile çalışır); **admin** — `index.html` zaten `lang="tr"` taşır, değişiklik yok. Kişi adı içeren metin hiçbir zaman büyük harfe çevrilmez [M1+ küçük düzeltme] (§3.3). 12 pt’de İ’nin noktası için satır yüksekliği 16 korunur; rozet dikey padding 4 yeterlidir. Karşılaştırma sayfasında alternatif (küçük harf + w700 harf aralığı, büyük harf dönüşümü yok) de gösterilir; varsayılan yine BÜYÜK HARF + locale-duyarlı dönüşümdür, nihai onay §6.10/8’de “itiraz yoksa kapalı” sorusu olarak durur. §3.0/6, §4.17, §5.2/1 ve §6.7/8 bu maddeye atıf yapar.
2. `Ş ş Ğ ğ Ç ç Ö ö Ü ü` — ascender/descender çakışması h1 26/32’de kontrol edilir: “Keşfet”, “Yarış”, “Bugün ne öğreniyoruz?”, “Bağlantı yok”.
3. Şapkalı harfler `â î û` — “hikâyesi”, “kâğıt”; Radar başlıklarında geçer.
4. Kesme ve tırnak: tipografik `’` (U+2019) ve `“ ”`; düz `'` ve `"` kullanma. Kod zaten `’` kullanır (`Günün 5’i`, `Mimar Sinan’ın “ustalık eserim” dediği yapı`). Üç nokta tek karakter `…`.
5. Rakam: timer, puan, sıralama, XP ve geri sayım için `tabular-nums` (T1/5); “12 sn” → “9 sn” geçişinde genişlik zıplamaz.
6. Orta nokta `·` (U+00B7) tüm meta satırlarında aynı karakter.
7. Test cümleleri: “Pijamalı hasta yağız şoföre çabucak güvendi.” ve `İSTANBUL’DA IŞIK` (büyük harf).

**Font seçimi kriterleri:** (1) SIL OFL veya eşdeğer açık lisans, uygulamaya gömülebilir; (2) tam Türkçe glif seti ve doğru `tr` büyük harf davranışı; (3) `tnum` desteği; (4) 400/600/700/800 ağırlıkları tek değişken dosyada; (5) 12 pt’de okunur x-yüksekliği; (6) sistem fontuna düşüşte metrik uyumu.

**Aday aileler:**

| Rol | Aday | Lisans | Not |
|---|---|---|---|
| Sans (gövde + UI + soru ekranı) | Inter (değişken) | SIL OFL 1.1 | Türkçe tam, `tnum`, en düşük risk |
| Sans alternatif | Manrope; Geist Sans; IBM Plex Sans | SIL OFL 1.1 | Plex Türkçe’de çok olgun |
| Serif (yalnızca yön A: sekme h1, içerik başlığı, display) | Source Serif 4; Fraunces; Newsreader | SIL OFL 1.1 | **Soru prompt’u (`quiz-prompt`), seçenekler ve timer her yönde sans kalır**: zamanlı okumada serif, 1.6×’te satır başına karakteri düşürür ve A-3 deneyini etkiler |
| Sistem (M0 gerçeği) | iOS SF Pro / Android Roboto | Platform | M0 özel font yüklemiyor (`expo-font` eklentisi var, aile yok). Tasarımı aday aileyle yap, “sistem fontu varyantı”nı da teslim et |

Android’de `fontWeight: '800'` cihaza göre 700 ya da 900’e çözülür; T1/22 ile display/h1 Android’de açıkça 700, iOS’ta 800 olur. Mockup’ta iOS 800 ve Android 700 varyantı gösterilir; harf aralığı aynıdır. Özel font uygulaması `[M1+ öneri]`.

**Dinamik tip / font ölçekleme (mevcut: tüm `T` metinlerinde `maxFontSizeMultiplier={1.6}`):**
1. **Ölçekler:** 1.0× ve 1.6× zorunlu (P1); 1.3× yalnızca soru ekranı için. Tüm `T` metinleri ve — T1/13 ile — `TextInput` 1.6× tavanlıdır (bugün `TextInput` bu tavanı almaz; iOS’ta 3×’e kadar büyür). Bu tavan WCAG 1.4.4’ün %200 beklentisinin altındadır; **bilinçli bir M0 sınırlamasıdır** ve A-3 raporuna yazılır.
2. **Soru ekranı kaydırmasız prompt bütçesi (kanonik; §1.4/2).** Seçenekler tek satır, durum satırı dahil, bağlantı şeridi slotu hariç (şerit slotu varsa yüksekliği bütçeden düşülür, §4.12):

| Çerçeve | 1.0× | 1.3× | 1.6× |
|---|---|---|---|
| 390×844 | ≈ 260 karakter | ≈ 140 karakter | ≈ 80 karakter |
| 360×800 | ≈ 190 karakter | ≈ 110 karakter | ≈ 60 karakter |

   Kural: Bütçe aşılırsa **prompt bölgesi kendi içinde kaydırılır** (T1/11); seçenekler, durum satırı ve timer sabit kalır; timer ve seçenekler hiçbir koşulda küçülmez veya ekran dışına çıkmaz. Sözleşme 400 karakterlik prompt’a izin verdiği için 400 karakter 1.0×’te bile kaydırmasız sığmaz. As-built (T0): soru fazı tamamen kaydırmasızdır, taşma kırpılır. Teslim: 1.6×’te hem 80 karakterlik (sığar) hem 400 karakterlik (prompt kaydırılır) soru çerçevesi; seçenekler 2 satırlık en uzun metinle. Bu ölçüler sans aileyle yapılmıştır.
3. Buton ve chip metni 1.6×’te tek satıra sığmazsa yükseklik büyür (min 48 → içerik), metin kesilmez, pill radius korunur.
4. Caption 12 pt 1.6×’te ≈ 19 pt olur; rozet tek satır kalır, satır sığmazsa `Row` `flexWrap` ile alta iner.
5. Satır yüksekliği oranları sabittir (display 1.19, h1 1.23, body 1.5).
6. Tab bar etiketleri `maxFontSizeMultiplier 1.3` ile sınırlıdır (T1/13); ayrıntı §2.3.

### 1.5 Boşluk, grid, radius, gölge ve bileşen ölçüleri (kanonik)

**Mevcut değerler (koru):** `space` xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · xxxl 48 · `radius` sm 8 · md 12 · lg 16 · xl 24 · pill 999 · `touch.min` 48 · `shadow.card` #17161A @ 0.06, blur 12, offset 0/4, Android elevation 2.

1. 8 pt taban ızgara; 4 pt yalnızca ikon-metin ve rozet iç boşluğu için.
2. Ekran yan boşluğu `space.lg` (16); tab ekranlarında üst boşluk `space.md` (12), safe-area üstüne eklenir; çocuklar arası dikey boşluk `space.lg`; kaydırma alanı alt boşluğu `space.xxl` (32).
3. **Kart:** iç boşluk 16, iç öğe aralığı 8, radius 16, `shadow.card`. Tonlu kartlarda gölge kalır.
4. **Chip (kanonik):** `minHeight 48`, yatay padding 16, `radius.pill`, hitSlop **yok** (sarmalı satırda hitSlop komşu çiple çakışır) (T1/8; as-built 40/12). Pasif: zemin surfaceMuted + 1 pt `border/input`, metin ink small; aktif: zemin accent, metin #FFF. 1.6×’te metin tek satır kalır, chip büyür.
5. **Rozet:** 8×4 iç boşluk, `radius.sm`.
6. **Buton:** min 48, yatay 24, `radius.pill`.
7. **Seçenek butonu:** min 56, yatay 16, dikey ≥ 12 (iki satır 56’yı aşabilsin), `radius.lg`, kenarlık 2 pt `border/input` (nötr). Seçenek aralığı kanonik olarak §4.7’dedir: 12 (T1/9; as-built 8).
8. **Giriş alanı:** min 48 (1.6×’te ≈ 64), iç 12, kenarlık 1 pt `border/input`, `radius.md`; odakta kenarlık 2 pt accent.
9. **Web/tablet içerik genişliği:** kanonik değer §5.7’dedir — içerik sütunu en fazla 560 pt, ortalanmış; soru ekranında seçenek listesi de 560 (§2.14/2 aynı değere atıf yapar). M0 `supportsTablet: false`.
10. **Progress bar:** 8 pt, `radius.pill`, track `progress/track`.
11. **Tab bar:** 64 pt + alt safe-area, üst kenarlık 1 pt `border/subtle`, etiket 12/600 (1.3× tavan, §2.3), ikon 24 pt.
12. **Stack başlığı:** zemin bg, gölgesiz; `Geri` + başlık tint accent (içerik) / `live/default` (quiz).
13. Boşluk ve radius yalnızca token adıyla belirtilir; “14 pt” gibi ara değer yok.

### 1.6 İkonografi, illüstrasyon ve fotoğraf politikası

**İkon (mevcut: Ionicons, `@expo/vector-icons`):**
1. Tab bar çiftleri sabittir: `home-outline/home` Ana Sayfa · `compass-outline/compass` Keşfet · `flash-outline/flash` Yarış · `library-outline/library` Kültür · `person-outline/person` Profil. Değiştirme önerin varsa K-8 “M0 tasarım varsayımı” notuyla ayrı bölümde ver.
2. Boyut 24 pt (tab, başlık), 20 pt (satır içi), 16 pt (rozet içi). Dolu varyant yalnızca aktif durumda.
3. İkon tek başına anlam taşımaz; metin etiketi veya `accessibilityLabel` eşlik eder. Mevcut `Button` ikon almaz; ikonlu buton `[M1+ öneri]`.
4. Renk: tab aktif `accent`, pasif `text/tertiary` #6F6B78 (T1/7); içerik içi ikon `text/secondary`; durum ikonları ilgili `status/*`.
5. Uygulama ikonu ve splash: M0’da yalnızca düz #F6F3EE zemin, görsel yok.

**İllüstrasyon ve fotoğraf (kesin kural):**
1. Lisansı belirsiz görsel, kitap kapağı, film afişi, tablo reprodüksiyonu, stok fotoğraf **kullanılmaz**. `ContentCardSummary` ve `ContentDetail`’de görsel alanı yoktur; görsel yer tutucu bırakma.
2. Kart ayrımı tipografiktir: konu caption’ı (accent), başlık, 3 satır özet, “N dk okuma”. Radar kartında `Kitap · Oğuz Atay · 1972` satırı.
3. `[M1+ öneri]` Soyut/tipografik kimlik: konu başına token’lardan türetilmiş tek renkli monogram (24 pt daire içinde baş harf); renk yalnızca accent ailesinden, konu başına rastgele renk yok. `Topic` sözleşmesine alan gerektirir.
4. `[M1+ öneri]` Görsel eklenirse lisans alanı ve editör onayıyla admin İçerik formuna girer; lisans alanı boşsa görsel yayımlanmaz.

### 1.7 Hareket ilkeleri (kanonik)

M0’da **hiçbir animasyon yoktur**; `motion.fast` 120 ms ve `motion.base` 200 ms tanımlı ama kullanılmıyor. Aşağıdaki tablo neyin hareket alabileceğini sabitler; “anında” = 0 ms. Tablodaki hareketler `[M1+ öneri]`’dir; reduced-motion davranışı ve platform geçişlerinin kapatılması T1/16’dir.

| Öğe | Hareket | Süre | Reduced motion’da |
|---|---|---|---|
| Buton/seçenek basma | Opaklık 1 → 0.85 | Anında (0 ms) | Aynı |
| Seçili seçenek dolgusu | Renk değişimi | Anında | Anında |
| Alındı rozeti | Görünür olur | Anında (0 ms) | Anında |
| Timer rakamı | Sayı değişir; ≤ 3 sn’de `ink` → `live/vivid` | Anında; nabız/ölçek yok | Anında |
| Kalan süre progress’i | Genişlik, 100 ms tikle doğrusal boşalma | 100 ms adım | Saniyede bir adım (kesikli) |
| Reveal kenarlık ve zemin renkleri | Renk değişimi | Anında | Anında |
| Faz panosu değişimi (soru → reveal) | Cross-fade | ≤ 200 ms `[M1+ öneri]` | Yok |
| İçerik detayı durum satırı | Opaklık 0 → 1 | ≤ 200 ms `[M1+ öneri]` | Anında |
| Bağlantı şeridi | Soru/expired fazında yer önceden ayrılmıştır, yalnızca metin belirir; diğer fazlarda opaklık | ≤ 200 ms `[M1+ öneri]` | Anında |
| Günlük görev progress dolumu | Genişlik | ≤ 200 ms `[M1+ öneri]` | Anında |
| Kart listesi yüklemesi | Yok (spinner + `Yükleniyor…`, sonra içerik) | — | — |
| Sekme ve yığın geçişleri | Platform varsayılanı | — | `animation: 'none'` (T1/16) |
| Sonuç puanı | Animasyonsuz (sayaç sayma yok) | — | — |

**Kesin yasaklar:** (1) Soru açılışında 3-2-1 geri sayımı, giriş perdesi, kaydırma animasyonu yok; `question.opened` ile prompt ve dört seçenek aynı karede boyanır. (2) Alındı rozeti sunucu cevabıyla aynı karede görünür. (3) Reveal hiçbir içerik geçişini geciktirmez. (4) Skeleton M0’da yoktur (`[M1+ öneri]`: yalnızca ContentCard listesi, en fazla 3 kart, 200 ms’den kısa yüklemede hiç gösterilmez, parıltısız). (5) Parallax, yay (spring), konfeti, parçacık, otomatik kayan bant yok.

**Reduced motion tespiti:** native `AccessibilityInfo.isReduceMotionEnabled()` + `reduceMotionChanged` olayı; web `prefers-reduced-motion: reduce`. Sayaç ve kalan süre çubuğu **zorunlu zamanlamadır** (WCAG 2.2.2 istisnası); reduced motion’da kaldırılmaz, saniyede bir adımla güncellenir. Hiçbir bilgi yalnızca hareketle taşınmadığı için işlevsel kayıp yoktur. Tasarım dosyasında her hareketli öğeye “RM: …” notu ekle.

### 1.8 Ses ve haptik `[M1+ öneri]` (kanonik)

M0’da ses ve haptik yoktur. Öneri seti varsayılan **kapalıdır**, sistem sessiz modunu ve reduced motion/haptik ayarını dinler; ayar yeri (Profil) M0’da olmadığından o da `[M1+ öneri]`dir.

| An | Haptik | Ses | Kural |
|---|---|---|---|
| Soru açılışı | Yok | İsteğe bağlı tek kısa ton (≤ 150 ms) | Soru görünümünü geciktirmez |
| Seçenek basma | Yok | Yok | — |
| Cevap kabul edildi | `selection` | Yok | Doğruluk ima etmez (`notificationSuccess` kullanılmaz) |
| Son 3 saniye | Yok | Yok | Baskı üretmez; görsel renk değişimi yeterli |
| Reveal (doğru/yanlış) | Yok | Yok | Doğru/yanlış sesi ve deseni yok |
| Bağlantı koptu | Tek `warning` deseni | Yok | — |
| Kültür akışı (Tamamladım, Kaydet) | Yok | Yok | Sakin mod |

Ses dosyaları özgün üretim veya açık lisanslı olmalıdır; lisansı belirsiz ses kullanılmaz.

### 1.9 Logo ve isim

1. **“Merak” çalışma adıdır (K-9).** Marka, tescil, alan adı ve mağaza taraması yapılmadı (A-1). Logoyu, uygulama ikonunu veya illüstrasyonu bu ada kilitleme; ad değişirse yalnızca wordmark dosyası değişmelidir.
2. **Wordmark keşfi (kilitlenmez):** 3 aday — (a) yön A ile uyumlu serif, küçük harf “merak”, −0.5 tracking; (b) sans w800 “Merak”; (c) tipografik işaret “M” + nokta. Her aday için tek renk `text/primary`, tek renk `accent/default`, dark zemin ve 24 pt minimum boyut varyantı.
3. Wordmark yalnızca giriş/kayıt ekranında (`display` “Merak” yerine) kullanılır; splash’ta kullanımı `[M1+ öneri]`dir (M0 splash yalnızca düz #F6F3EE, §1.6). Tab ekranlarında marka değil içerik başlıkları görünür.
4. “Merak” sözcüğü üzerine kelime oyunu içeren slogan veya ikon üretme. Giriş alt satırı `Her akşam beş soru. Her gün biraz kültür.` ton referansıdır; takvim vaadi değildir.
5. Teslim: SVG + token referansları; renkler `text/primary`, `accent/default`, `text/onAccent` dışına çıkmaz.
6. Uygulama ikonu `[M1+ öneri]`: soyut, harf ve kelime içermeyen, iki renkli (accent + bg); wordmark kararına bağlıdır.


---

## 2. Bilgi mimarisi, navigasyon ve akışlar

### 2.1 Navigasyon modeli ve rota haritası

Uygulama tek bir native stack üzerinde çalışır; stack’in içinde beş sekmelik bir tab grubu ve iki tam ekran stack rotası vardır. Tasarımı bu iskelete göre yap; yeni rota ekleme, var olanları birleştirme.

```
Root Stack (headerShown=false, contentStyle bg #F6F3EE)
├── (auth)                        ← oturum yoksa
│   ├── /login                    “Merak” + e-posta/şifre
│   └── /register                 “Hesap oluştur”
├── (tabs)                        ← oturum varsa
│   ├── /          Ana Sayfa      (index)
│   ├── /discover  Keşfet
│   ├── /play      Yarış
│   ├── /culture   Kültür
│   └── /profile   Profil
├── /content/[id]?from=&sessionId=   içerik detayı (kart veya Radar önerisi)
└── /quiz/[id]                        canlı oturum; 11 istemci fazı tek rotada
```

Kurallar:

1. Sekmeler kendi içinde stack açmaz. Bir sekmeden açılan her detay, Root Stack’e push edilir ve sekme çubuğunun **üstünü** kapatır (detay ve canlı oturum ekranlarında sekme çubuğu görünmez). Bu davranış mevcut uygulamadadır; koru.
2. Sekme ekranları değiştirildiğinde unmount olmaz (expo-router Tabs). Tasarımda “sekmeye dönünce kaldığı scroll konumu korunur” varsay.
3. **Odak yenileme matrisi (mevcut kod):** Ana Sayfa ve Yarış **yalnızca ilk yükleme başarılıysa** odakta yeniler (`if (data) reload()`); ilk yükleme hatalıysa dönüşte yeniden denemez, hata StateView’u `Tekrar dene`ye kadar kalır. Profil her odakta üç isteği koşulsuz yeniler. Keşfet ve Kültür **çekmez** → detaydan dönünce `Tamamlandı`/`Kayıtlı` rozetleri bayat kalabilir. Tasarım spesifikasyonunda şu notu yaz: “Listeye dönüşte rozetler güncel olmalı” — `[M1+]` (`useFocusEffect` ekle); tasarım bayat rozet durumunu çizmez.
4. Tüm zamanlar sunucu saatine göredir; navigasyon hiçbir yerde cihaz saatine dayanmaz.

### 2.2 Beş sekme: amaç ve içerik

Beş bölüm K-8 kararıdır: “M0 tasarım varsayımı; kullanılabilirlik bulgusuyla değişebilir.” Varsayılan olarak beş sekmeyi koru; farklı bir yapı önereceksen ayrı bir “IA alternatifi `[M1+]`” başlığı altında, gerekçesiyle ver.

| Sıra | Sekme | Rota | Tek cümlelik amaç | Ekranda ne var (M0, as-built) | Ne YOK |
|---|---|---|---|---|---|
| 1 | **Ana Sayfa** | `/` | Bugünün giriş noktası: sıradaki test oturumu, günlük görev + XP, 4 keşif kartı | Selamlama `Merhaba, {ad}` · h1 `Bugün ne öğreniyoruz?` · QuizSessionCard · `Günlük görev` kartı (ProgressBar, `{progress}/{target} içerik · Europe/Istanbul gününe göre`) · h2 `Keşif kartları` (4 kart) | Sahte sayaç, kazanan, sponsor, ödül, banner, streak |
| 2 | **Keşfet** | `/discover` | Konuya göre kısa metin kartları; oku → tamamla → XP | h1 `Keşfet` · `Kısa kartlar, net kaynaklar. Okuyup “tamamladım” diyerek XP kazanırsın.` · chip satırı `Tümü` + 5 konu · kart listesi | Arama, sıralama, sayfalama, görsel |
| 3 | **Yarış** | `/play` | Yarışma merkezi: mevcut/sıradaki oturum + kurallar (tam spesifikasyon §3.8) | h1 `Yarış` · `Herkes aynı anda, aynı beş soru. Doğru ve hızlı cevap daha çok puan; yanlış cevap elemez.` · QuizSessionCard · `Kurallar (M0 deneme ayarı)` kartı | Takvim, haftalık sıralama, lig, sezon, ödül |
| 4 | **Kültür** | `/culture` | Kültür bölümü; M0’da yalnızca Kültür Radarı modülü var, dolayısıyla sekme = Radar | h1 `Kültür Radarı` · `Editör seçkisi: dört kitap ve film önerisi, kısa gerekçeyle. Beğendiğini kaydet.` · 4 öneri kartı | Diğer altı modül için **hiçbir** yer tutucu, kilitli kart, “Yakında” |
| 5 | **Profil** | `/profile` | Kimlik, öğrenme istatistikleri, düzenleme, yarışma geçmişi, kaydedilenler, çıkış | h1 `Profil` · profil kartı (ad, `@kullanıcıadı`, 3 stat: `Öğrenme XP` / `Tamamlanan` / `Kayıtlı`, ilgi alanları, `Profili düzenle`) · h2 `Yarışma geçmişi` · h2 `Kaydettiklerim` · `Çıkış yap` | Avatar görseli, ayarlar, bildirim, gizlilik, hesap silme, rozet, streak |

Sekme amaçlarını tasarım dosyasında birer “frame açıklaması” olarak aynen yaz; Claude Design’ın her sekmeye ekstra bölüm uydurmasına izin verme.

### 2.3 Sekme çubuğu tasarımı

Mevcut değerler başlangıç noktasıdır (`app/(tabs)/_layout.tsx`); bunları token olarak kullan ve yalnızca gerekçeli değiştir.

| Özellik | Değer (as-built) | Talimat |
|---|---|---|
| Sekme sırası ve etiketleri | Ana Sayfa · Keşfet · Yarış · Kültür · Profil | Değiştirme. Etiketler her zaman görünür (yalnızca ikon yok). |
| İkonlar (Ionicons, pasif→aktif) | home-outline→home · compass-outline→compass · flash-outline→flash · library-outline→library · person-outline→person | Aynı metaforları koru; özel ikon seti çizersen outline/filled çiftini koru ve 24 pt gridde tasarla. |
| Aktif renk | accent `#1F5F5B` | Yarış sekmesi aktifken bile **accent** kalır; live turuncusu sekme çubuğuna girmez (enerjik ton yalnızca içeriğe aittir). |
| Pasif renk | inkFaint `#9A96A3` (surface 2.89 ✗) | **T1: `tab/inactive` = `text/tertiary` #6F6B78 (surface 5.18 ✓)** — bkz. §1.3. |
| Zemin / üst çizgi | surface `#FFFFFF` / line `#E2DDD4` | Gölge yok. |
| Yükseklik | 64 pt (+ alt safe-area) | iOS home indicator ve Android gesture bar insetini **ekle**; ekran görüntüleri Expo web olduğundan inset kanıtı yoktur. |
| Etiket | 12 pt, w600 | **1.6× tab bar:** etiket `maxFontSizeMultiplier 1.3` (özel `tabBarLabel` ile, T1/13), tek satır, kesilmez; ikon 24 sabit; yükseklik 64 + inset sabit. Bu sınır A-3 raporuna “tab etiketi 1.3× ile sınırlı” olarak yazılır. Çerçeve: `M0 / TabBar / 390 / light / 1.6x` (§5.9/3). |
| Dokunma alanı | her sekme ≥ 48 × 48 pt, genişlik ekran/5 | Yatay dokunma boşluğu bırakma. |
| Rozet / sayaç / nokta | Yok | **Ekleme.** “Canlı” bir oturum olsa bile Yarış sekmesine kırmızı nokta koyma; canlı durum içerik kartında gösterilir. `[M1+]`: lobi açıkken Yarış sekmesine canlı-nokta — yalnızca gerçek oturum verisine bağlı olmak şartıyla. |
| Erişilebilirlik | — | Her sekme: `accessibilityRole="tab"`, etiket adı, `accessibilityState={{selected}}`; VoiceOver sırası soldan sağa; aktif sekmeye tekrar dokunmak listeyi en üste kaydırır `[M1+]`. |
| Reduced motion | — | Sekme geçişinde animasyon yok (anında değişim; T1/16). |

### 2.4 Stack ekranlar ve başlık davranışları

| Rota | Başlık (as-built) | Geri | Tint | Zemin | Talimat |
|---|---|---|---|---|---|
| `/content/[id]` | boş başlık `''` | `Geri` (ok + metin) | accent `#1F5F5B` | bg `#F6F3EE`, gölgesiz | Başlığı boş tut; içerik başlığı gövdede h1 olarak yaşar. Uzun okumada başlık çubuğunu sabit, sade bırak; scroll ile küçülen/büyüyen başlık **yapma**. |
| `/quiz/[id]` | `Günün 5’i · Test` | `Geri` | `live/default` (T1; as-built #D9480F) | bg, gölgesiz | Başlık metnindeki “Test” etiketi ödülsüz test sinyalidir; kaldırma. Soru fazında başlık çubuğu yüksekliğini sabit tut, içerik kaymasın. |

Ek kurallar:

1. Sekme ekranlarının kendi başlığı yoktur; h1 doğrudan status bar’ın altında, `paddingTop 12`, yatay `16` ile başlar. Status bar stili `dark`.
2. Android donanım geri tuşu = başlık `Geri` ile aynı davranış. Özel engelleme yok (bkz. §2.12).
3. Detaydan sonraki ikinci seviye yoktur: içerik detayından başka bir içeriğe gidilmez; sonuç ekranından `Kartı aç` içerik detayını canlı oturumun üstüne push eder (stack: tabs → quiz → content). Geri: content → quiz (sonuç) → tabs.
4. Başlık çubuğunda sağ aksiyon (paylaş, kaydet, menü) **yok**. Kaydet/Tamamladım gövdededir.

### 2.5 Kimlik doğrulama kapısı ve ilk profil (M0’da onboarding minimal)

Kapı mantığı (`app/_layout.tsx › Gate`):

1. `ready=false` → uygulamanın kendi yükleme ekranı yoktur; mevcut rota ne ise o render olur. `[M1+]`: bg `#F6F3EE` üzerinde ortalanmış küçük wordmark + `Yükleniyor…` (kısa bir açılış durumu); M0’da ayrı ekran yok, splash yalnızca düz renk.
2. `ready && !session` ve rota `(auth)` değil → `replace('/(auth)/login')`.
3. `ready && session` ve rota `(auth)` → `replace('/(tabs)')` (Ana Sayfa).
4. Oturum AsyncStorage’da (`merak.auth`) kalıcıdır; uygulama yeniden açıldığında kullanıcı doğrudan Ana Sayfa’ya düşer. Giriş ekranını tekrar göstermeyi tasarlama.

İlk profil: kayıt yalnızca e-posta + şifre ister; kullanıcı adı ve görünen ad **sunucuda** ilk `GET /me` çağrısında üretilir (`created=true` yalnızca bu ilk çağrıda döner). M0’da ilgi alanı seçimi, kullanıcı adı girişi, sözleşme onayı ve karşılama ekranı **yoktur**; ilgi alanları Profil’de serbest, virgülle ayrılmış bir metin alanıdır ve ürün tarafından kullanılmaz (A-6 açık).

`[M1+]` **3 ekranlık giriş** — `created=true` kancasına bağlı, atlanabilir, tek seferlik:
1. `Merhaba, {displayName}` — sunucunun ürettiği `@username` gösterilir, `Kullanıcı adını değiştir` (3–24, `[a-z0-9_]`, hata: `Küçük harf, rakam ve alt çizgi kullan.` / `Bu kullanıcı adı alınmış.`).
2. `Nelere meraklısın?` — 5 konu chip’i (Sanat ve Mimari, Tarih, Bilim ve Doğa, Edebiyat, Dünya ve Coğrafya); çoklu seçim; `Atla` her zaman görünür; ekranda `Bu seçim şimdilik yalnızca profilinde görünür.` notu. **Yalnızca A-6 “kişiselleştirme” cevabı gelirse tasarlanır; varsayılan tasarlanmaz (§6.10/6).**
3. `Günün 5’i nasıl işler?` — üç satır: `Beş soru, herkes aynı anda.` / `Soru başına 12 sn (M0 deneme ayarı); ilk kabul edilen cevap geçerli.` / `Bu sürüm ödülsüz bir testtir; katılım ücretsizdir.` CTA `Başla` → Ana Sayfa. (Onboarding anında oturum yoktur; süre veriden gelemez, bu yüzden deneme ayarı etiketi zorunludur.)
Bu üç ekranı tasarım dosyasında “M1+ öneri — M0’da uygulanmadı” etiketiyle ayrı sayfada tut.

### 2.6 Akış A — Kayıt / giriş → ilk profil

```
[Soğuk açılış] → Gate(ready) → oturum yok → /login
/login ──“Hesap oluştur”──▶ /register ──“Kaydol”──▶ signUp → (session) → /(tabs) Ana Sayfa
   │                             │ hata: inline danger metin
   │“Giriş yap”                  └ “Zaten hesabım var” ──▶ /login
   ▼
 signIn → /(tabs) Ana Sayfa  → arka planda GET /me (profil oluşur, created=true) + GET /time
```

Adımlar ve kopya (mevcut kopyayı başlangıç olarak kullan):

1. `/login`: display `Merak` · body `Her akşam beş soru. Her gün biraz kültür.` · alanlar `E-posta` (placeholder `sen@ornek.com`), `Şifre` · primary `Giriş yap` · ghost `Hesap oluştur` · footer `M0 yerel test sürümü. Yarışmalar ödülsüzdür; katılım ücretsizdir.`
2. Hata durumları inline, formun altında, assertive duyuru (§0.3): `E-posta veya şifre hatalı.` · `Bu e-posta zaten kayıtlı. Giriş yapmayı dene.` · `Şifre en az 8 karakter olmalı.` · `Kimlik sunucusuna ulaşılamadı. Yerel stack çalışıyor mu?`
3. `/register`: h1 `Hesap oluştur` · body `Yerel test ortamında e-posta doğrulaması kapalıdır.` · `E-posta`, `Şifre (en az 8 karakter)` · primary `Kaydol` · ghost `Zaten hesabım var`.
4. Kayıt sonrası oturum gelmezse: `Kayıt alındı; e-posta doğrulaması gerekiyor olabilir. Giriş yapmayı dene.`
5. Giriş sonrası ilk ekran her zaman Ana Sayfa’dır. Klavye açıkken CTA’lar görünür kalmalı (keyboard avoidance tasarla).
6. **Mevcut:** iki auth ekranı arası geçiş `Link` **push**’tur (`Hesap oluştur` register’ı login’in üstüne, `Zaten hesabım var` yeni bir login’i onun üstüne iter; yığın büyür, Android geri tuşu önceki auth ekranına döner). Tasarımda tek seviyeli kabul et; mühendislik notu: `Link`te `replace` kullan `[M1+]`.
7. Şifremi unuttum, sosyal giriş, OTP, şifre göster/gizle: M0’da yok; tasarlarsan `[M1+]` etiketle.

### 2.7 Akış B — Ana Sayfa → oturum → lobi → soru → reveal → sonuç → ilgili kart

Giriş noktaları: Ana Sayfa’daki ve Yarış’taki QuizSessionCard (aynı bileşen), Profil › Yarışma geçmişi `Sonucu gör`. Hepsi `/quiz/[id]` rotasına gider; katılma işlemi ekranın içinde yapılır.

Kart CTA matrisi (`QuizSessionCard`, as-built — aynen kullan; kullanıcıya **5 durum** gelir, `draft` hiç gelmez):

| Oturum durumu | Katılmış mı | Rozet | Buton | Hedef faz |
|---|---|---|---|---|
| scheduled | hayır | `Planlandı` (accent) | `Katıl` (primary) | preview |
| scheduled | evet | `Planlandı` | `Bekleme salonu` (primary) | scheduled (otomatik devam) |
| lobby / live | hayır | `Bekleme salonu açık` / `Canlı` (live) | `Katıl` (live) | preview → joining |
| lobby / live | evet | aynı | `Oturuma dön` (live) | lobby / question |
| completed | evet / hayır | `Tamamlandı` (muted) | `Sonucu gör` / `Detay` | completed |
| cancelled | evet / hayır | `İptal edildi` (muted) | `Sonucu gör` / `Detay` — as-built; öneri (§3.3 ile aynı): her iki durumda `Ayrıntı`, iptalde sonuç yoktur, etiket sonuç ima etmemeli `[M1+ küçük düzeltme]` | cancelled |
| session = null | — | — | buton yok; `Planlanmış test oturumu yok` | — |

Canlı oturum ekranı fazları (tek rota, `useQuizSession`):

```
 mount ─GET /quiz/sessions/:id─▶ loading
   ├─ hata ───────────────▶ error  (“Bir sorun oldu” + “Tekrar dene”)
   ├─ cancelled ──────────▶ cancelled
   ├─ completed ──────────▶ completed (GET result; “Sonuç hesaplanıyor…”)
   └─ diğer ──────────────▶ preview (“Katıl”) ──▶ joining (“Katılınıyor…”)
        │ cihazda token + myParticipation varsa otomatik devam (preview çerçevesi gösterilmez)
        ▼ snapshot
  scheduled (“Katıldın · Bekleme salonu N sonra açılır.”)
     ─WS session.lobby─▶ lobby (“Bekleme salonu · İlk soru N sonra açılır. Hazır ol.”)
     ─WS question.opened─▶ question (Soru n/5, sayaç, 4 seçenek, cevap durumu)
        ─cihaz saati closesAt’i geçti─▶ expired (“Süre doldu” · “Durumu yenile”)
        ─WS question.revealed─▶ reveal (✓/✗, “Açıklama”, “Sonraki soru N sn içinde.” | “Son soruydu. Sonuçlar hesaplanıyor…”)
           ─ 5. sorudan sonra WS session.completed ─▶ completed
     ─herhangi bir anda WS session.cancelled─▶ cancelled (terminal)
  completed ──“Kartı aç”──▶ /content/[id]?from=quiz&sessionId=… (quiz_to_content_opened)
```

Tasarım talimatları:

1. 11 fazın **her biri** için ayrı çerçeve çiz: loading, error, preview, joining, scheduled, lobby, question, expired, reveal, completed, cancelled. Eksik faz kabul edilmez.
2. Faz geçişleri anında olur; soru açıldığında soru ve seçenekler gecikmesiz render edilir. 3-2-1 geri sayım, giriş animasyonu, konfeti **yok**.
3. question fazı kaydırılmaz (scroll kapalı); prompt bütçesi ve taşma kuralı için **bkz. §1.4/2** (as-built taşma kırpılır; T1/11 ile prompt bölgesi kaydırılır, seçenekler ve sayaç sabit).
4. Bağlantı şeridi (warningSoft `#FDEFD8`) için **bkz. §4.12**: soru ve expired fazlarında başlık satırının üstünde sabit slot rezerve edilir (yükseklik ölçüme dayalı, §4.12), seçenekler hiç kaymaz; diğer fazlarda şerit içeriği aşağı iter. Kopya: `Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.` / `Yeniden bağlanılıyor… durum sunucudan yenilenecek.` Not: mevcut kodda başlangıç durumu `offline` olduğundan şerit preview/loading/joining/error’da da görünür; tasarımda şerit **yalnızca socket açıldıktan sonra** tanımlanır (T1/3).
5. Başlık satırındaki `v{stateVersion}` rozeti hata ayıklama göstergesidir; tüketici tasarımında **gösterme** (T1/2).
6. completed fazında sıra: hero (puan, x/5 doğru, sıra/katılımcı, `Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.`) → `Merakın devam etsin` ilgili kart + primary `Kartı aç` → `Sorular` → `Sıralama` (kompakt liste, tam ekran tablo değil). Katılmayan kullanıcı için izleyici görünümü §4.10/1.
7. `/content/[id]` dönüşü: Geri → sonuç ekranı (stack korunur), tekrar Geri → sekmeler.

### 2.8 Akış C — Keşfet → kart → tamamla / kaydet

```
/discover ─chip (Tümü | konu)─▶ GET /content?kind=card&topic=slug (bayat liste görünür kalır, spinner yok)
   └─ kart dokunma ─▶ /content/[id]?from=feed  (content_opened{from:'feed'})
        ├─ “Tamamladım” ─POST complete─▶ toast “+10 XP · toplam N” [+ “ · Günlük görev tamamlandı.”] → buton “Tamamlandı ✓” (disabled)
        │      tekrar: “Bu kartı daha önce tamamlamıştın; XP bir kez verilir.”
        ├─ “Kaydet” ⇄ “Kaydedildi ✓”  (POST/DELETE save; toggle)
        ├─ “Kaynağı aç” → sistem tarayıcı (Linking.openURL)
        └─ Geri → /discover (rozetler M0’da yenilenmez — bkz. §2.1/3)
```

1. `from` değerleri: Ana Sayfa’dan `home`, Keşfet’ten `feed`, Kültür’den `radar`, sonuçtan `quiz`, Profil › Kaydettiklerim’den `feed`. Tasarım navigasyon notlarında her giriş noktasına `from` değerini yaz; analitik buna bağlıdır.
2. Chip ölçüsü: **bkz. §1.5/4** (48 / paddingH 16, hitSlop yok; as-built 40/12).
3. Konu boşsa: StateView `Henüz bir şey yok` başlığı ile mesaj `Bu konuda yayınlanmış kart yok.`
4. Toast inline, polite duyuru, kendiliğinden kapanmaz; tasarımda 4 sn sonra sönen ancak ekran okuyucuya bir kez duyurulan bir satır öner `[M1+]`. As-built toast metni `Günlük görev tamamlandı!` ünlemlidir; T1/18 ile `Günlük görev tamamlandı.`

### 2.9 Akış D — Kültür Radarı → öneri → kaydet

```
/culture ─GET /content?kind=radar_pick─▶ 4 kart (“Kitap|Film · yaratıcı · yıl”, başlık, özet; dk okuma satırı yok)
   └─ kart ─▶ /content/[id]?from=radar  (content_opened{from:'radar'})
        ├─ caption “Kültür Radarı · Kitap|Film” · h1 · “{creator} · {year}” · gövde
        ├─ Card accent “Neden öneriyoruz” (whyRecommended)
        ├─ “Kaynak” bloğu · “Tamamladım” + “Kaydet”
        └─ Geri → /culture
```

1. Filtre (kitap/film), kapak görseli, satın alma/affiliate bağlantısı **yok**; `Kaynağı aç` yalnızca editoryal kaynağa gider.
2. Liste boşsa varsayılan StateView: `Henüz bir şey yok` / `Burası yakında dolacak.`
3. Radar önerisinde `Tamamladım` da vardır (aynı detay ekranı); kaldırma, ama `Kaydet`i Radar için görsel olarak öne çıkarabilirsin — iki buton aynı satırda kalır.

### 2.10 Akış E — Profil → geçmiş / kaydedilenler / düzenle / çıkış

```
/profile (odakta GET /learning/progress + /learning/saved + /quiz/history)
   ├─ “Profili düzenle” → inline düzenleme (Görünen ad; İlgi alanları “virgülle: sanat, tarih”)
   │      “Kaydet” → PATCH /me → görünüm moduna dön · “Vazgeç” → değişiklik atılır
   ├─ Yarışma geçmişi · satır: başlık · “{tarih} · {puan} puan · {sıra}. sıra” | “iptal edildi”
   │      “Sonucu gör” → /quiz/[id] (completed fazı)
   ├─ Kaydettiklerim · ContentCardView → /content/[id]?from=feed
   └─ “Çıkış yap” → anında signOut → Gate → /login
```

1. Çıkışta M0’da onay yoktur. Tasarımda tek adımlı onay (native alert, `Çıkış yap` / `Vazgeç`) öner — `[M1+]`. **Canlı oturum sırasında Geri → Profil → Çıkış mümkündür**; katılım sunucuda kalır, kapanan sorular 0 puan sayılır, aynı hesapla geri dönülünce devam edilir. `[M1+]` onay metnine bu uyarıyı ekle: `Canlı bir oturuma katıldın; çıkarsan sen yokken kapanan sorular 0 puan sayılır.`
2. Profil altındaki üç stat yalnızca mevcut veridir: `Öğrenme XP`, `Tamamlanan`, `Kayıtlı`. Haftalık puan, streak, rozet **yok**.
3. Not satırını koru: `Yarışma puanı ile öğrenme XP’si ayrı tutulur; bu puanlar XP’ye dönüşmez.`

### 2.11 Derin bağlantılar

`app.json` şeması `merak`’tır; rotalar expo-router ile otomatik eşlenir. M0’da ayrı bir deep-link işleyicisi yoktur — aşağıdaki davranışın “kapı” kısmı as-built, “hedefi hatırlama” kısmı öneridir.

| Bağlantı | Hedef | Oturum yoksa (as-built) | `[M1+]` |
|---|---|---|---|
| `merak:///` | Ana Sayfa | `/login`’e yönlendirilir, girişten sonra Ana Sayfa | — |
| `merak:///quiz/{sessionId}` | Canlı oturum (faz sunucu durumundan türetilir: preview/lobby/question/completed/cancelled) | `/login`; **hedef kaybolur**, giriş sonrası Ana Sayfa’ya düşer | Hedefi sakla, girişten sonra oturuma götür; geçersiz id → error fazı `Aradığın kayıt bulunamadı.` |
| `merak:///content/{id}` | İçerik detayı (`from` yoksa analitik `unknown`) | aynı | `from=link` değeri önerilir; yayında değilse `Bu içerik henüz yayında değil.` |
| `merak:///play`, `/discover`, `/culture`, `/profile` | İlgili sekme | aynı | — |

Talimatlar: derin bağlantıyla açılan canlı oturumda da aynı 11 faz geçerlidir; `Katıl` ekranı atlanmaz (otomatik devam hariç). Bildirim yok (kapsam dışı), dolayısıyla “oturum başlıyor” derin bağlantısı M0’da üretilmez. Evrensel bağlantı (https) alan adı A-1’e bağlıdır; tasarlama.

### 2.12 Canlı oturumda geri / çıkış davranışı

As-built: başlık `Geri` ve Android geri tuşu ekranı anında kapatır; uyarı yoktur. Katılım cihazdaki `participationToken` ile saklanır; aynı cihazdan `/quiz/[id]`’ye dönüldüğünde otomatik devam edilir ve sunucu anlık durumu (başka bir soru, reveal ya da sonuç) gösterilir. Sen yokken kapanan sorular sunucuda 0 puan sayılır; süre durmaz. İkinci cihaz devralamaz (PARTICIPATION_EXISTS: `Bu oturuma başka bir cihazdan katıldın. M0 sürümünde ikinci cihaz devralamaz.`).

Tasarla `[M1+]`; M0’da `beforeRemove` yok — **bu onay yalnızca [M1+] sayfasındadır, §5.6 “Geri” satırı buraya atıf yapar:**

1. question, lobby, scheduled ve expired fazlarında Geri’ye basılınca tek adımlı onay (native alert, reduce-motion’a uygun):
   - Başlık: `Oturumdan ayrılıyorsun`
   - Gövde: `Ayrılırsan katılım hakkın gitmez; aynı cihazdan geri dönebilirsin. Sen yokken kapanan sorular 0 puan sayılır, süre durmaz.`
   - Butonlar: `Kal` (varsayılan, primary) · `Ayrıl` (secondary). Yıkıcı/kırmızı ton kullanma; bu bir hata değil.
2. reveal, completed, cancelled, preview, error fazlarında onay **yok**; Geri doğrudan çıkar.
3. Uygulama arka plana alınırsa (home tuşu) onay çıkmaz; dönüşte `Yeniden bağlanılıyor…` şeridi ve snapshot ile kaldığı faz gösterilir. Sayaç dolu başa dönmez; kalan ortak süre gösterilir.
4. Çıkıştan sonra Ana Sayfa/Yarış kartı `Oturuma dön` butonunu gösterir (joined && aktif). Bu buton tasarımda görünür ve live tonludur.
5. “Oturumdan ayrıldım, katılımımı sil” diye bir işlem yoktur; tasarlama.

### 2.13 Boş ve yeni kullanıcı deneyimi

Yeni hesabın ilk 10 dakikasını çerçevele. Tüm boş durumlar paylaşılan StateView bileşenini kullanır (ortalanmış, minHeight 160, polite duyuru); her sekme için ayrı illüstrasyon **yok**.

| Yer | Yeni kullanıcı görünümü | Kopya (as-built) |
|---|---|---|
| Ana Sayfa, oturum yok | muted kart, buton yok | caption `Günün 5’i` · h3 `Planlanmış test oturumu yok` · `Yönetim panelinden ödülsüz bir test oturumu planlandığında burada görünür.` |
| Ana Sayfa, günlük görev | 0/3, boş ProgressBar, `0 XP` | `Bugün 3 farklı içerik tamamla` · `0/3 içerik · Europe/Istanbul gününe göre` |
| Ana Sayfa, kart yok | StateView empty | `Yayınlanmış kart yok.` |
| Keşfet, konu boş | StateView empty | `Bu konuda yayınlanmış kart yok.` |
| Kültür, boş | StateView empty | `Henüz bir şey yok` / `Burası yakında dolacak.` |
| Profil, statlar | `0` · `0` · `0` | `Öğrenme XP` Profile’dan gelir, hiçbir zaman `–` göstermez; yalnızca `Tamamlanan`/`Kayıtlı` progress gelmeden `–`. `İlgi alanları: henüz seçilmedi` |
| Profil, profil yüklenemedi (GET /me hata) | As-built: sonsuz `Yükleniyor…` StateView, mesaj yok, retry yok | `[M1+]`: StateView error + API metni + `Tekrar dene` → `refreshProfile()`; mühendislik notu: AuthProvider profil hatasını ayrı state olarak tutsun (bkz. §3.7) |
| Profil, geçmiş | StateView empty | `Henüz bir oturuma katılmadın.` |
| Profil, kaydedilenler | StateView empty | `Kaydettiğin içerik yok.` |
| Her yerde hata / çevrimdışı | StateView error / offline + `Tekrar dene` | `Bir sorun oldu` / `Tekrar denemek ister misin?` · `Bağlantı yok` / `İnternete bağlanınca kaldığın yerden devam edebilirsin.` |

Kurallar: boş durumlar yönlendirici ama abartısız (`Keşfet’e göz at` gibi tek ghost buton `[M1+]`); “binlerce kişi”, “ilk kazanan sen ol” gibi sahte sosyal kanıt yok. Yeni kullanıcı için seed içerik `Örnek test içeriği` rozetiyle görünür; bunu gizleme.

### 2.14 Web ve tablet uyarlaması (kısa)

1. M0 kanıtı Expo web 390 × 844’tür; iOS `supportsTablet=false`. Tabletteki native davranış doğrulanmadı — tasarım notu olarak yaz.
2. Web/geniş ekran: içerik sütunu için **bkz. §5.7** (560 pt ortalanmış; seçenek listesi de 560), sekme çubuğu altta kalır (yan ray `[M1+]`). Soru ekranında seçenekler tek sütun; iki sütunlu seçenek yerleşimi **yapma** (per-user sıralama ve okuma sırası bozulur).
3. Klavye: web’de seçenekler Tab ile gezilebilir, Enter/Space ile seçilir; odak halkası `focus/ring` (§1.3).
4. Yatay mod: uygulama portrait’e kilitlidir; yatay çerçeve çizme.

### 2.15 Kapsam dışı ve yer tutucu yasağı

Aşağıdakiler ROADMAP kararıyla M0 dışıdır ve **çalışan UI gibi** hiçbir çerçevede görünmez: haftalık sıralama, lig terfisi, sezon, ödül tahsisi/ödül görseli, ödeme/premium/sponsor/affiliate, düello, arkadaşlık, kulüp, bildirim, görsel/ses/eşleştirme/sıralama soru tipleri, AI içerik üretimi arayüzü, gecikme telafisi, mağaza/üretim. Yedi yan modülden yalnızca Kültür Radarı vardır; Bilgi Yolculukları, Bugün Ne Yapsam?, Yaşayan Şehir, Kültür Pasaportu, Kültür Kulüpleri, Farklı Bakışlar için **boş ekran, kilitli kart, “Yakında” rozeti, gri sekme veya menü satırı yapma**. Bu alanları keşfetmek istersen ayrı bir sayfada, her çerçevenin köşesinde “M1/M2 önerisi — uygulanmadı” etiketiyle çiz; ana akış çerçevelerine bağlama.

### 2.16 Kontrol listesi (bu bölüm için)

- [ ] 5 sekme, verilen sıra ve etiketlerle; rozet/sayaç yok; aktif renk accent, pasif `text/tertiary`.
- [ ] `/content/[id]` ve `/quiz/[id]` başlık çubukları belirtilen tint ve `Geri` etiketiyle.
- [ ] Canlı oturumun 11 fazı + bağlantı şeridinin 2 durumu çerçevelendi.
- [ ] Oturum kartı: **5 kullanıcı durumu × katıldı/katılmadı + boş = 11 çerçeve** (Taslak kullanıcıya hiç gelmez).
- [ ] Akış A–E numaralı adımlarıyla ve `from` değerleriyle belgelendi.
- [ ] Derin bağlantı tablosu; oturum yoksa davranış as-built olarak yazıldı.
- [ ] Ayrılma onayı yalnızca belirtilen fazlarda, `Kal` varsayılan, `[M1+]` sayfasında.
- [ ] 11 boş/özel durum satırının her biri kopyasıyla var.
- [ ] Kapsam dışı listesinden hiçbir öğe ana akışta yok; yer tutucu yok.
- [ ] Tüm dokunma alanları ≥ 48 pt, chip’ler dahil; 1.6×’te sekme etiketleri (1.3× tavan) ve soru ekranı (§1.4/2) kırılmıyor.


---

## 3. Ekran ekran spesifikasyon: kimlik, Ana Sayfa, Keşfet, içerik detayı, Kültür Radarı, Profil, Yarış

Bu bölümdeki her ekranı aynı sırayla ele al: amaç → yerleşim (üstten alta) → bileşen ve veri alanı → durumlar → mikro-metin → erişilebilirlik → ölçüler. Katman etiketleri §0.1’deki gibidir: “Mevcut:” / etiketsiz = T0 (bugün `apps/mobile` içinde var; başlangıç noktası olarak aynen al), `[T1]` = ana çerçevelerde gösterilen M0 düzeltmesi (kapalı liste §0.1), `[M1+]` = ayrı sayfada tutulan öneri.

### 3.0 Bu bölümün ortak kuralları

1. **Ekran çerçevesi** (`Screen`): SafeArea top/left/right; yatay padding 16; üst padding 12; bölümler arası dikey boşluk 16; kaydırma alanı alt padding 32. Tab ekranlarında başlık çubuğu yoktur, h1 doğrudan status bar altında başlar. Stack ekranlarında (içerik detayı) native header: geri oku + `Geri`, tint accent, zemin bg, gölge yok, başlık boş.
2. **Kart** (`Card`): radius 16, padding 16, iç gap 8, gölge 0/4 blur 12 opaklık %6; tonlar surface, muted, accent, live (hex için §1.3). Her kartta aynı yüzey rengi; farklılaşmayı konu caption’ı ve ton taşır. Kart başına rastgele renk kullanma.
3. **Buton** (`Button`): minHeight 48, pill, paddingH 24, metin bodyStrong 16/24 w600. Tonlar: primary (accent zemin, beyaz), secondary (surfaceMuted, ink), live (`live/default`, beyaz), ghost (şeffaf, accent), danger (dangerSoft, danger). `loading`: etiket yerine spinner, buton kilitli; `disabled` opaklık .5; basılı .85. İkon slotu yok → `[M1+]` sol ikon slotu 20 pt.
4. **Metin girişi**: body 16/24 ink; kenarlık 1 pt `border/input` (as-built `line`); radius 12; padding 12; zemin surface; minHeight 48; placeholder `text/placeholder`. Etiket: caption inkMuted, alanın üstünde, 8 pt boşluk. `TextInput` 1.6× tavanına alınır (T1/13).
5. **Rozet** (`Badge`): caption 12/16 w600 +0.4 BÜYÜK HARF; padding 8×4; radius 8; tonlar muted/accent/live/success/danger/warning/neutral.
6. **Türkçe büyük harf**: bkz. §1.4/1 (UPPERCASE korunur, dönüşüm locale-duyarlı; tasarımda `GÜNÜN 5’İ`, `ÖRNEK TEST İÇERİĞİ`, `SANAT VE MİMARİ`). Kişi adı içeren hiçbir metni büyük harfe çevirme.
7. **Ortak durum bileşeni** (`StateView`): ortalanmış, padding 24, gap 8, minHeight 160, polite duyuru. Varsayılan metinler — loading: spinner (accent) + h3 `Yükleniyor…`; empty: h3 `Henüz bir şey yok` / small `Burası yakında dolacak.`; error: `Bir sorun oldu` / `Tekrar denemek ister misin?`; offline: `Bağlantı yok` / `İnternete bağlanınca kaldığın yerden devam edebilirsin.` Retry: secondary `Tekrar dene`, marginTop 12. Ekranlar error mesajı olarak API’nin Türkçe metnini (`errorMessagesTr` ya da §6.8b sunucu özel mesajları) veya istemci ağ metnini (`Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.`) geçer. Bu kodlar için yeni cümle uydurma. StateView başlığı `header` rolü almaz (polite duyuru olarak kalır).
8. **Yenileme kuralı** (`useAsync`): veri yokken loading/error/offline gösterilir; veri varken yeniden yüklemede eski liste yerinde kalır, spinner yoktur. **Pull-to-refresh M0’da hiçbir ekranda çalışmaz** (Ana Sayfa’da ScrollView’a bağlanmamış `RefreshControl`; Keşfet, Kültür ve Profil’de yok). Tasarımda gösterge çizme; `[M1+]` olarak ayrı sayfada: dört liste ekranında accent spinner, mühendislik notu RefreshControl’ü ScrollView’a bağla. Skeleton yoktur; `[M1+]` surfaceMuted bloklardan kart silueti, reduced motion’da parıltısız.
9. **Görsel yok**: kart, Radar ve detayda kapak, poster, fotoğraf, ikon-illüstrasyon kullanma (lisans kararı, ROADMAP). Metin yığını da yasak: gövde 16/24 body, paragraflar arası 16.
10. **Erişilebilirlik tabanı**: tüm dokunulabilirler ≥48×48; tüm metinler 1.6× ölçeğe kadar büyür → her ekranı 1.0× ve 1.6× olarak teslim et, 1.6×’te hiçbir buton metni kırpılmasın (gerekirse iki satır, minHeight büyür). **Kontrast oranları için tek kaynak §1.3** (inkFaint ve live/beyaz ✗ çiftleri T1 değerleriyle çözülür). Ekran okuyucu: her etkileşimli öğede rol ve etiket; `T` v=display|h1|h2|h3 varsayılan `accessibilityRole="header"` (T1/14); değişen durum metinlerinde duyuru (§0.3). Reduced motion: bu ekranlarda animasyon yoktur; önerdiğin geçişler §1.7 tablosuna uyar.

### 3.1 Giriş — `/(auth)/login`

**Amaç.** E-posta + şifre ile oturum açmak (yerel Supabase Auth). Tek görev, tek birincil buton. Marka yalnızca kelime işareti; “Merak” çalışma adıdır (A-1), logotipi token dışına bakmayan, değiştirilebilir biçimde çiz.

**Yerleşim (üstten alta).** Spacer 48 → display `Merak` (32/38 w800) → body inkMuted slogan → Card(surface): [caption `E-posta` → input] [caption `Şifre` → input] [hata satırı] [primary `Giriş yap`] [ghost `Hesap oluştur`] → dipnot small inkMuted (T1/10; as-built inkFaint), paddingH 8. Kart ile dipnot arası 16.

**Bileşenler ve veri.** Veri alanı yok (sunucuya e-posta/şifre gider; profil ilk `GET /me` ile sunucuda üretilir, kullanıcı adı burada sorulmaz). Inputlar: e-posta (`autoCapitalize none`, klavye email, `autoComplete email`, testID `login-email`), şifre (`secureTextEntry`, `onSubmitEditing` = gönder, testID `login-password`), gönder butonu testID `login-submit`.

**Durumlar.**

| Durum | Görünüm |
|---|---|
| idle | Boş alanlar, primary aktif. |
| busy | `Giriş yap` spinner’a döner ve kilitlenir; alanlar düzenlenebilir kalır (mevcut) → `[M1+]`: alanlar da `editable=false`. |
| error | Kartın içinde, butonun üstünde small danger metin; assertive duyuru. **Form altı tek satır; alan kenarlığı değişmez** (mevcut). Alan altı hata / danger kenarlık `[M1+]`. |
| ağ yok | Aynı hata satırı, metin: `Kimlik sunucusuna ulaşılamadı. Yerel stack çalışıyor mu?` (mevcut; yerel test diline uygun, üretim metni değildir). |

**Mikro-metin.**

| Öğe | Mevcut | Not |
|---|---|---|
| Slogan | `Her akşam beş soru. Her gün biraz kültür.` | Ton olarak tut; saat vaadi değildir (M0’da program yok). |
| Etiketler | `E-posta`, `Şifre` | Aynen. |
| Placeholder | `sen@ornek.com`, `••••••••` | Aynen. |
| Hatalar | `E-posta veya şifre hatalı.` · `Bu e-posta zaten kayıtlı. Giriş yapmayı dene.` · `Şifre en az 8 karakter olmalı.` · `Kimlik sunucusuna ulaşılamadı. Yerel stack çalışıyor mu?` · eşleşmeyen GoTrue mesajı İngilizce ham gelir | `[M1+]`: ham İngilizce mesaj için genel Türkçe sığınak `Giriş yapılamadı. Lütfen tekrar dene.` (AuthProvider.mapAuthError). |
| Butonlar | `Giriş yap`, `Hesap oluştur` | Aynen. |
| Dipnot | `M0 yerel test sürümü. Yarışmalar ödülsüzdür; katılım ücretsizdir.` | Zorunlu dürüstlük etiketi; kaldırma, küçültme (small 14), inkMuted (T1/10). |

**Erişilebilirlik.** Input `accessibilityLabel` `E-posta` / `Şifre`; hata assertive duyuru (iki platform, §0.3); `Giriş yap` `accessibilityState busy` yüklenirken; klavye açıkken kart görünür kalır (KeyboardAvoiding; iOS’ta kaydırma). Şifre göster/gizle yoktur → `[M1+]` 48×48 ikon butonu, etiket `Şifreyi göster/gizle`. Şifremi unuttum, sosyal giriş, beni hatırla, onboarding **yok**; tasarlama.

**Ölçüler.** Input 48 (1.6×’te ≈64; T1/13); buton 48; kart iç gap 8 (etiket–input 8, input–etiket 8 → `[M1+]`: alan grupları arası 12); dipnot 14/20.

### 3.2 Kayıt — `/(auth)/register`

**Amaç.** E-posta + şifre ile hesap açmak. Kullanıcı adı, görünen ad, ilgi alanı burada sorulmaz (sunucu üretir; A-6).

**Yerleşim.** Spacer 48 → h1 `Hesap oluştur` → body inkMuted `Yerel test ortamında e-posta doğrulaması kapalıdır.` → Card: [caption `E-posta` → input testID `register-email`] [caption `Şifre (en az 8 karakter)` → input testID `register-password`] [hata small danger] [primary `Kaydol` testID `register-submit`] [ghost `Zaten hesabım var`].

**Akış ve durumlar.** idle → busy (spinner) → başarı: oturum açılır, `/(tabs)`’a yönlenir, ekran arası animasyon yok. Kayıt alınıp oturum dönmezse ikinci deneme giriş yapar; o da başarısızsa hata: `Kayıt alındı; e-posta doğrulaması gerekiyor olabilir. Giriş yapmayı dene.` Diğer hatalar §3.1’deki tablodan. Hata satırında duyuru eksik (mevcut) → assertive ekle (§0.3).

**Mikro-metin.** Mevcut metinleri aynen al. `Yerel test ortamında e-posta doğrulaması kapalıdır.` notu zorunludur; üretimde değişecek bir “ortam notu” olarak ayrı stilde (small inkMuted, warningSoft şerit **değil**; alarm değil bilgi).

**Erişilebilirlik ve ölçüler.** §3.1 ile aynı. Şifre gücü göstergesi, sözleşme/onay kutusu **yok**; önerirsen `[M1+]` ve yasal metin içermeyen yer tutucu olarak. Geçiş davranışı (push yığını) için §2.6/6.

### 3.3 Ana Sayfa — `/(tabs)/index`

**Amaç.** Günün giriş noktası: sıradaki test oturumu, günlük görev + öğrenme XP’si, dört keşif kartı. Başka hiçbir şey: tanıtım bandı, seri ateşi, lider tablosu, sponsor, sahte sayaç **yok**. Veri: `GET /home` → `{ quiz: CurrentQuizResponse, cards: ContentCardSummary[≤4], progress: LearningProgress }`; tab odaklandığında (ilk yükleme başarılıysa) sessizce yeniden çekilir (§2.1/3).

**Yerleşim.** Selamlama → h1 `Bugün ne öğreniyoruz?` → **Günün oturumu kartı** (`QuizSessionCard`) → **Günlük görev kartı** → h2 `Keşif kartları` → 4 × `ContentCardView` (from=`home`) → alt boşluk 32.

**Selamlama.** Mevcut: caption inkMuted `Merhaba, {Profile.displayName}` (büyük harfe dönüşür: `MERHABA, AYŞE`). `[M1+]`: small inkMuted, normal yazım `Merhaba, Ayşe`. Profil **yüklenirken de, yüklenemediğinde de** (GET /me hatası → `profile=null`) yalnızca `Merhaba` görünür; tasarımda bu yedek çerçeveyi göster.

**Günün oturumu kartı — 5 kullanıcı durumu + boş.** Her durumda caption live-color `Günün 5’i · ödülsüz test` (ödülsüz etiketi sabittir, hiçbir durumda düşmez), sağda durum rozeti, h2 `QuizSessionSummary.title`, gövde satırı body inkMuted, tek CTA (testID `quiz-open`, her zaman `/quiz/[id]`’ye gider; katılım orada olur). `joined = myParticipation != null`. Geri sayım saniyede bir `serverNow()` ile yenilenir; `formatCountdown`: ≤0 → `şimdi`, `2 sa 5 dk`, `1 dk 13 sn`, `46 sn`.

| Durum | Kart tonu | Rozet | Gövde satırı (veri) | CTA (katılmadı / katıldı) |
|---|---|---|---|---|
| yok (`session = null`) | muted | — | caption inkMuted `Günün 5’i` · h3 `Planlanmış test oturumu yok` · small `Yönetim panelinden ödülsüz bir test oturumu planlandığında burada görünür.` `[M1+]`: `Şu an planlanmış bir oturum yok. Yeni bir ödülsüz test oturumu planlandığında burada görünür.` (son kullanıcıya “yönetim paneli” deme) | CTA yok |
| scheduled | surface | accent `Planlandı` | `Başlangıç: {countdown(scheduledStartAt)} sonra · {questionCount} soru · {round(rules.questionDurationMs/1000)} sn/soru` — süre **veriden**, 12’yi sabit yazma | primary `Katıl` / primary `Bekleme salonu` (`[M1+]`: `Oturumu aç`; lobi henüz açık değil) |
| lobby | live | live `Bekleme salonu açık` | `{countdown} sonra başlıyor · {participantCount} katılımcı` — gerçek sayı, sıfırsa `0 katılımcı` göster, gizleme | live `Katıl` / live `Oturuma dön` |
| live | live | live `Canlı` | `Şu an canlı · {currentQuestionPosition}/{questionCount}. soru` | live `Katıl` / live `Oturuma dön` |
| completed | surface | muted `Tamamlandı` | `Sonuçlar hazır.` | primary `Detay` / primary `Sonucu gör` |
| cancelled | surface | muted `İptal edildi` | `İptal edildi ({cancelReasonTr}).` → `yönetici iptal etti`, `sunucu yeniden başladı`, `başlangıç kaçırıldı`, `bir sorunun onayı geri çekildi`, `bir soru değiştirildi` | `Detay` / `Sonucu gör` (as-built); öneri: iptalde her iki durumda `Ayrıntı` — sonuç yoktur, etiket sonuç ima etmemeli `[M1+ küçük düzeltme]` |
| **≤0 geri sayım** (scheduled/lobby) | aynı | aynı | As-built bozuk kopya: `Başlangıç: şimdi sonra · 5 soru…` / `şimdi sonra başlıyor · 2 katılımcı` (bekçi 1,5 sn; zamanlayıcı gecikirse 60 sn’ye kadar). `[M1+ öneri]` ≤0 → `Başlıyor…` / `Bekleme salonu açılıyor…` (tek yerde, `formatCountdown` çağıran bileşende). Çerçeve: §4.18/1 | aynı |

Canlı/lobi kartı tek “enerjik” yüzeydir (liveSoft zemin, live CTA); kalan sayfa sakin. Katılımcı sayısı dışında hiçbir sosyal kanıt yok. Ödül, sponsor, kazanan alanı **yok**. Taslak (`draft`) kullanıcıya hiç gelmez (`/quiz/current` yalnızca lobby/live ya da sıradaki scheduled oturumu döner).

**Günlük görev kartı** (surface). Üst satır: caption inkMuted `Günlük görev` — sağda caption accent `{LearningProgress.learningXpTotal} XP` (bu XP öğrenme XP’sidir; yarışma puanı buraya asla girmez). h3 `dailyTask.title` (sunucu metni: `Bugün 3 farklı içerik tamamla`). `ProgressBar` accent, yükseklik 8, değer `dailyTask.progress / dailyTask.target`, `accessibilityLabel` `Günlük görev ilerlemesi`, `accessibilityValue` 0–100. Alt satır small inkMuted: tamamlanmadıysa `{progress}/{target} içerik · Europe/Istanbul gününe göre`, tamamlandıysa `Bugünkü görev tamam.` `[M1+]`: `{progress}/{target} içerik · gün 00:00 İstanbul saatinde yenilenir`. Ödül sandığı, jeton, seri sayacı **yok**; görev XP vermez, bunu ima eden ikon kullanma.

**Keşif kartları.** `ContentCardSummary` ×4 (anatomi §3.4’te). Boşsa `StateView empty` mesaj `Yayınlanmış kart yok.`

**Durumlar.** loading (veri yok): h1 altında StateView loading. error: StateView error, mesaj = API metni (ör. `Oturumun süresi doldu. Lütfen yeniden giriş yap.`), `Tekrar dene`. offline: StateView offline + `Tekrar dene`. Yenileme: bkz. §3.0/8 (pull-to-refresh M0’da yok).

**Erişilebilirlik.** `QuizSessionCard` kökü `accessible`, label `Günün 5’i, ödülsüz test. {statusLabel}. {gövde satırı}` — geri sayım label’da **1 dk hassasiyetle** (`1 dakika sonra`), saniye değil; geri sayım metnine duyuru **verme** (okuyucuyu boğar). CTA `accessibilityLabel` = buton metni; `[M1+]`: `accessibilityHint` `Günün 5’i oturum ekranını açar`. Rozete `accessibilityLabel` `Durum: Canlı`. Kart tonu tek taşıyıcı değildir: durum rozeti metni her zaman vardır.

**Ölçüler.** Kartlar arası 16; oturum kartı iç gap 8; CTA tam genişlik 48; h2 20/26; XP caption 12.

### 3.4 Keşfet — `/(tabs)/discover`

**Amaç.** Yayınlanmış kısa kartları konuya göre gezmek. Arama, sıralama, sayfalama, görsel **yok** (tek sayfa, en çok 30). Veri: `GET /content?kind=card[&topic=slug]` → `{ items: ContentCardSummary[], topics: Topic[] }`.

**Yerleşim.** h1 `Keşfet` → body inkMuted `Kısa kartlar, net kaynaklar. Okuyup “tamamladım” diyerek XP kazanırsın.` → konu chip satırı → liste.

**Konu chip’leri.** `Tümü` + her `Topic.name` (seed: Sanat ve Mimari, Tarih, Bilim ve Doğa, Edebiyat, Dünya ve Coğrafya). Sarmalı satır (wrap), gap 8; tüm chip’ler görünür, gizli kaydırma yok. Ölçü ve dokunma kuralı **bkz. §1.5/4** (48 / paddingH 16; mevcut 40/12). Pasif: surfaceMuted zemin + 1 pt `border/input`, ink small metin; seçili accent/beyaz. `accessibilityRole="button"`, `accessibilityState={{selected}}`; `[M1+]`: etiket `Konu: Tarih, seçili`. Chip’ler ilk veri gelmeden görünmez (mevcut) → `[M1+]`: ilk yüklemede chip satırı yerine 48 pt yükseklik rezerve et, sıçrama olmasın. 1.6×’te chip metni tek satır kalmalı, gerekirse chip büyür.

**Kart anatomisi (`ContentCardView`, Ana Sayfa/Keşfet/Kültür/Profil ortak).** Pressable, `accessibilityRole="button"`, `accessibilityLabel` = `${title}. ${subtitle}`, testID `content-card-${slug}`, basılı opaklık .9, surface, radius 16, padding 16, iç gap 4.

| Sıra | Öğe | Veri | Stil |
|---|---|---|---|
| 1 sol | Konu caption | `topic.name` (card) · `Kitap|Film · creator · year` (radar_pick) | caption accent |
| 1 sağ | Rozetler | `isCompleted` → `Tamamlandı` (success); `isSaved` → `Kayıtlı` (accent) | Badge, gap 4 |
| 2 | Başlık | `title` (≤140) | h3 17/22, satır sınırı yok |
| 3 | Özet | `summary` (≤300) | small inkMuted, en çok 3 satır |
| 4 | Okuma süresi | `readingMinutes` → `{n} dk okuma` (radar’da null → satır yok) | caption `text/tertiary` (T1/10; as-built inkFaint) |

`Örnek test içeriği` rozeti: `ContentCardSummary` içinde `productionMethod` **yoktur**, bu rozet M0’da yalnızca detayda görünür. Listede göstermek için `[M1+]` kontrata `productionMethod` ekle; tasarımda listede 2. rozet olarak warning tonunda yer ayır (sağ üst, en çok üç rozet sığmalı; sığmazsa alt satıra sar).

**Durumlar.** loading: StateView loading (h1 ve açıklama görünür kalır). error/offline: StateView + API metni + `Tekrar dene`. Konu için boş: StateView empty mesaj `Bu konuda yayınlanmış kart yok.` (başlık `Henüz bir şey yok` kalır → `[M1+]` başlık `Bu konuda kart yok`, mesaj `Başka bir konu seç.`). Konu değişimi: eski liste yeni veri gelene kadar kalır; `[M1+]`: chip satırının altında 2 pt accent ilerleme çizgisi (≤200 ms, reduced motion’da statik). Mühendislik notu: Keşfet tab odaklandığında yeniden çekmez; detaydan dönünce `Tamamlandı/Kayıtlı` rozetleri bayat kalabilir — tasarım, rozetlerin dönüşte güncel olduğunu varsayar; `useFocusEffect` ekle `[M1+]`.

**Ölçüler.** Chip 48 / paddingH 16 / gap 8; kart padding 16; liste kartları arası 16.

### 3.5 İçerik detayı — `/content/[id]?from=&sessionId=`

**Amaç.** Kartı veya Radar seçkisini okumak, kaynağı görmek, bir kez `Tamamladım` demek (XP), kaydetmek. Öğrenme akışının sonu `Tamamladım` ve `Kaydet`tir; bunları gömme. Veri: `GET /content/:id` → `ContentDetail`. Analitik: `from==='quiz'` → `quiz_to_content_opened` (sessionId ile); aksi `content_opened` (`props.from` = home|feed|radar|unknown).

**Yerleşim (üstten alta).**
1. Native header: geri `Geri` (accent), başlık yok.
2. Üst satır: sol caption accent — card: `topic.name`; radar_pick: `Kültür Radarı · Kitap|Film`. Sağ: `productionMethod==='seed_sample'` → Badge warning `Örnek test içeriği`. (`[M1+]` `ai_assisted`/`ai_generated` için `Yapay zekâ destekli` rozeti; M0’da böyle içerik yok.)
3. h1 `title` (26/32, `header` rolü).
4. Radar ise bodyStrong inkMuted `{creator} · {year}`.
5. body `body` (≤6000, düz metin; boş satır = paragraf; markdown/görsel yok). Paragraf arası 16.
6. Radar ise Card accent: caption accent `Neden öneriyoruz` + body `whyRecommended` (≤400).
7. **Kaynak kutusu** Card muted: caption inkMuted `Kaynak` → small `source.title ?? 'Belirtilmemiş'` → `source.url` varsa ghost `Kaynağı aç` (dış tarayıcı) → caption doğrulama satırı: `{verified ? 'Editör tarafından kontrol edildi' : 'Kaynak henüz editör tarafından doğrulanmadı'} · {language.toUpperCase()} · sürüm {revisionVersion}`. **Tek kural (§5.3.22 ve §6.7/6 buraya atıf yapar):** doğrulandı → caption `ink`, önde `✓` glifi (success/accent değil; CTA değildir; SR label `Editör tarafından kontrol edildi`); doğrulanmadı → caption `inkMuted`, glif yok, **warning/danger yok** (alarm değil, dürüst bilgi). As-built ikisi de inkFaint → T1/10. Seed içerik hiçbir zaman “doğrulandı” göstermez.
8. **Durum satırı** (mevcut “toast”): small, polite duyuru, testID `content-toast`; overlay değil, yerinde satır; otomatik kapanmaz, sonraki işlemde değişir. Mühendislik notu: hata metinleri de accent renkte basılıyor (`color={colors.accent}`) → başarı accent, hata danger `[M1+ küçük düzeltme]`.
9. Eylem satırı (Row, gap 8): primary `Tamamladım` (testID `content-complete`; `isCompleted` → `Tamamlandı ✓`, disabled, opaklık .5) + secondary `Kaydet` (testID `content-save`; `isSaved` → `Kaydedildi ✓`). `[M1+]`: tamamlanmış durumu “bozuk buton” gibi görünen opaklık .5 yerine accentSoft zemin + accent metin + ✓ ile çiz, `accessibilityState disabled` kalsın; kaydedilmiş durum accentSoft/accent, etiket `Kaydedildi ✓` (toggle; tekrar basınca kaydı kaldırır → `accessibilityHint` `Kaydı kaldırır`).
10. Dipnot small inkMuted: `“Tamamladım” bir öğrenme kanıtı değil, kendi ilerlemeni takip etmen için bir işarettir.` (zorunlu; “öğrendin”, “ustalaştın” dili yok).

**Quiz’den gelindiyse bağlam şeridi — `[M1+]`.** Route param `from=quiz&sessionId` bugün vardır ama görsel karşılığı yoktur. Öner: h1’in üstünde accentSoft şerit, radius 12, padding 12: caption accent `Günün 5’i` + small `Bu kart, az önce oynadığın bir sorunun konusundan.` + ghost `Sonuca dön` (`router.back()`). (`relatedContent` soruya bağlı kart yoksa aynı konudan herhangi bir yayınlanmış karta düşer — sunucu yedeği; bu yüzden kopya “konusundan” der, “soruyla ilgili” demez.) Şerit puan göstermez, XP’yi yarışmaya bağlamaz.

**Durumlar.**

| Durum | Görünüm / metin |
|---|---|
| loading | Tam ekran StateView loading (header görünür). |
| error | StateView error + API metni + `Tekrar dene`. `CONTENT_NOT_PUBLISHED` → `Bu içerik henüz yayında değil.`; `NOT_FOUND` → `Aradığın kayıt bulunamadı.` Bu ikisinde retry anlamsızdır → `[M1+]`: retry yerine ghost `Geri dön`. |
| offline | StateView offline + `Tekrar dene`. |
| complete busy | `Tamamladım` spinner; `Kaydet` aktif kalır. |
| complete başarı (ilk) | Durum satırı: `+{xpAwarded} XP · toplam {learningXpTotal}` + `dailyTask.completedNow` ise ` · Günlük görev tamamlandı.` (as-built `…tamamlandı!`; T1/18 ünlemsiz). Örnek: `+10 XP · toplam 30 · Günlük görev tamamlandı.` XP miktarı veriden gelir; `10`u sabit çizme. Konfeti, ses, modal **yok**. |
| complete tekrar | `Bu kartı daha önce tamamlamıştın; XP bir kez verilir.` |
| save başarı | Durum satırı yok, buton etiketi döner (`[M1+]`: polite duyuru ile `Kaydedildi` / `Kayıt kaldırıldı`). |
| hata | Durum satırında `describeError` metni, danger. |

**Erişilebilirlik.** `Kaynağı aç` `accessibilityLabel` `Kaynağı aç: {source.title}, tarayıcıda açılır`; rozet `Örnek test içeriği` okunabilir metin; gövde 1.6×’te taşmadan kayar; eylem satırı 1.6×’te iki satıra sarar (Row wrap mevcut).

**Ölçüler.** Başlık–gövde 16; kaynak kutusu padding 16; eylem butonları 48, aralık 8; dipnot 14/20.

### 3.6 Kültür Radarı — `/(tabs)/culture`

**Amaç.** Kültür sekmesi M0’da yalnızca Radar’dır: dört editör seçkisi (kitap/film), kısa gerekçe, kaydet. Diğer altı modül için yer tutucu, “Yakında” karesi, kilitli ikon **yok**. Veri: `GET /content?kind=radar_pick` → `items: ContentCardSummary[]` (seed: Tutunamayanlar, Sapiens, Bir Zamanlar Anadolu’da, Ruhların Kaçışı). Filtre (kitap/film), satın alma/affiliate bağlantısı, kapak görseli **yok**.

**Yerleşim.** h1 `Kültür Radarı` → body inkMuted `Editör seçkisi: dört kitap ve film önerisi, kısa gerekçeyle. Beğendiğini kaydet.` → 4 × `ContentCardView` (from=`radar`).

**Radar kartı (mevcut).** Caption accent `Kitap|Film · {creator} · {year}` (ör. `Kitap · Oğuz Atay · 1972`) → h3 `title` → small inkMuted `summary` (3 satır) → okuma süresi satırı yok (`readingMinutes` null) → rozetler `Kayıtlı`/`Tamamlandı`. Sakin ton; live rengi bu sekmede hiç görünmez.

**Tipografik kapak çözümü — `[M1+]` (görsel yerine).** Kartın solunda 56×80 pt dikey blok, radius 8, zemin accentSoft, 1 pt line kenarlık: üstte caption accent `KİTAP`/`FİLM` (Türkçe büyük harf), ortada h2 accent `year` (ör. `1972`), altta 2 pt accent çizgi. Kitap için blok kenarı “sırt” hissi verecek 4 pt koyu accent şerit; film için üst/alt 2 pt line “perforasyon”. Kapak sanatı, afiş, yazar fotoğrafı, logo **kullanma**. Ekran okuyucu için blok `accessible={false}` (bilgi zaten caption’da). 1.6×’te blok sabit kalır, metin yanında sarar.

**Detayda (§3.5) Radar’a özgü öğeler.** Caption `Kültür Radarı · Kitap|Film`; bodyStrong `{creator} · {year}`; Card accent `Neden öneriyoruz` (`whyRecommended`); kaynak kutusu editör kaynağına gider (affiliate değil).

**Durumlar.** loading: StateView loading. error/offline: StateView + API metni + `Tekrar dene`. empty: varsayılan `Henüz bir şey yok / Burası yakında dolacak.` → `[M1+]`: `Radar’da henüz seçki yok` / `Editör seçkisi yayınlandığında burada görünür.` Mühendislik notu: ekran yalnızca ilk açılışta çeker; detaydan dönünce `Kayıtlı` rozeti bayat kalabilir → `useFocusEffect` ekle `[M1+]`.

**Erişilebilirlik ve ölçüler.** Kart etiketi `{title}. Kitap · {creator} · {year}`; h1 header rolü; kartlar arası 16; padding 16.

### 3.7 Profil — `/(tabs)/profile`

**Amaç.** Kimlik, öğrenme istatistikleri, profil düzenleme, yarışma geçmişi, kaydedilenler, çıkış. Avatar, ayarlar, bildirim, dil, yasal, hesap silme, rozet/başarım, seri **yok**. Veri: `Profile` (AuthProvider), `GET /learning/progress` → `LearningProgress`, `GET /learning/saved` → `items`, `GET /quiz/history` → `items[{session, totalPoints|null, rank|null}]`; üçü her tab odağında koşulsuz yenilenir.

**Yerleşim.** h1 `Profil` → **Profil kartı** → h2 `Yarışma geçmişi` + ayrım notu → geçmiş listesi → h2 `Kaydettiklerim` → kaydedilen kartlar → danger `Çıkış yap` (testID `sign-out`).

**Profil kartı (surface), görüntüleme modu.**
1. h2 `Profile.displayName`.
2. small inkMuted `@{username}` + rol: mevcut `· {role}` ham İngilizce (`· editor`). `[M1+]`: `role !== 'member'` ise Badge accent `Editör` / `Admin`; üye için rozet yok. E-posta **asla** gösterilmez.
3. İstatistik satırı (Row gap 16; her Stat: h2 değer / caption inkMuted etiket): `Öğrenme XP` = `Profile.learningXpTotal` (Profile’dan gelir, hiçbir zaman `–` göstermez) · `Tamamlanan` = `LearningProgress.completedCount` · `Kayıtlı` = `LearningProgress.savedCount`; progress gelmeden bu ikisi `–`. Bu üçü **öğrenme** metrikleridir; yarışma puanı toplamı burada yoktur ve eklenmez.
4. small inkMuted (T1/10; as-built inkFaint) `İlgi alanları: {interests.join(', ') || 'henüz seçilmedi'}` — düz liste; “sana özel” dili yok (A-6).
5. secondary `Profili düzenle`.

**Düzenleme modu (kart içinde, gap 8).** Input `Görünen ad` (placeholder `Görünen ad`, 1–60) → Input `İlgi alanları` (placeholder `İlgi alanları (virgülle: sanat, tarih)`; virgülle ayrılır, kırpılır, en çok 10 × ≤40) → hata small danger (form altı tek satır; kenarlık değişmez) → Row: primary `Kaydet` + ghost `Vazgeç`. Kaydet → `PATCH /me {displayName, interests}` → `refreshProfile`. `[M1+]`: her alanın üstünde caption etiket (§3.0/4), sayaç `0/60` caption inkMuted sağda; ilgi alanları için chip önizlemesi (yalnızca görünüm, yine virgüllü metin gönderilir).

**Kullanıcı adı alanı — `[M1+]` (API hazır, mobil formda alan yok).** Input `Kullanıcı adı`: kural 3–24 karakter, yalnızca `a-z`, `0-9`, `_`; `autoCapitalize none`. Yardım metni (caption inkMuted, her zaman görünür): `Küçük harf, rakam ve alt çizgi; 3–24 karakter.` Yerel kural ihlali: `Küçük harf, rakam ve alt çizgi kullan.` (kontrat metni). Sunucu `USERNAME_TAKEN` (409): alan altında danger `Bu kullanıcı adı alınmış.`, assertive duyuru. `VALIDATION_FAILED`: `Gönderilen veri geçersiz.` Lider tablosunda görünen ad değil **kullanıcı adı** gösterilir; bunu yardım metninde söyle: `Sıralamada bu adla görünürsün.`

**Yarışma geçmişi.** Başlığın altında small inkMuted zorunlu not: `Yarışma puanı ile öğrenme XP’si ayrı tutulur; bu puanlar XP’ye dönüşmez.` Her öğe Card surface: h3 `session.title` → small inkMuted `{tarih} · ` + (`status==='completed'` ? `{totalPoints ?? 0} puan · {rank}. sıra` : `iptal edildi`) → tamamlanmışsa ghost `Sonucu gör` (`/quiz/[id]`). Puan satırı sakin kalır (inkMuted); live rengi geçmişte kullanılmaz. **rank null** → mevcut kod `N puan · ` (sondaki ayırıcı kalır); tasarımda `N puan · sıralama dışı` kullan `[M1+ küçük düzeltme]`. Tarih: mevcut `toLocaleString('tr-TR')` → `15.10.2026 00:56:02` ve **cihaz saat dilimini** kullanır (Europe/Istanbul için `timeZone` seçeneği verilmeli `[M1+ küçük düzeltme]`; tasarım İstanbul saatini varsayar); öneri biçimi (tüm ekranlar, §6.7/7 ile aynı): `15 Ekim 2026, 21:00`. İptal satırına sebep ekle (`[M1+]`): `iptal edildi · {cancelReasonTr}`. Boş: StateView empty mesaj `Henüz bir oturuma katılmadın.` (`[M1+]` başlık: `Henüz oturum yok`).

**Kaydettiklerim.** `ContentCardView` listesi (from boş → `feed`; `[M1+]`: from=`profile` için kontrata değer eklenmesi, analitik ayrımı için). Boş: `Kaydettiğin içerik yok.` (`[M1+]` mesaj: `Bir kartta “Kaydet”e dokununca burada birikir.`).

**Çıkış.** danger `Çıkış yap`, anında çıkar (mevcut). `[M1+]` onay alt sayfası: h3 `Çıkış yapmak istiyor musun?` · small `Kayıtlı içeriklerin ve XP’n hesabında kalır.` + canlı oturum uyarısı (§2.10/1) · danger `Çıkış yap` / ghost `Vazgeç`; 48 pt butonlar, reduced motion’da kaydırma animasyonsuz.

**Durumlar.**

| Durum | Görünüm |
|---|---|
| Profil yükleniyor | Profil kartı yerine StateView loading. |
| **Profil yüklenemedi (GET /me hata: ağ, AUTH_TOKEN_EXPIRED, INTERNAL)** | As-built: `AuthProvider.refreshProfile` `profile=null` bırakır → sonsuz `Yükleniyor…`, mesaj yok, retry yok. `[M1+]`: StateView error + API metni + `Tekrar dene` → `refreshProfile()`; mühendislik notu: AuthProvider profil hatasını ayrı state olarak tutsun. Çerçeveyi `[M1+]` sayfasında çiz. |
| Görünüm / düzenleme / düzenleme hatası | Yukarıda. |
| Geçmiş/kaydedilen yükleniyor | Bölüm boş görünür (mevcut, spinner yok) → `[M1+]`: bölüm başlığı altında 48 pt kompakt yükleniyor satırı (küçük spinner + small `Yükleniyor…`); 160 pt’lik StateView bölüm içinde çok büyük. |
| Bölüm hatası | Bölüm altında small danger API metni + ghost `Tekrar dene` (mevcut kod bölüm hatasını göstermiyor → `[M1+]`). |
| Çevrimdışı | Ekran üstünde tek StateView yerine bölüm bazlı (profil önbellekten gelir, listeler offline mesajı) `[M1+]`. |

**Erişilebilirlik.** İstatistikler tek öğe olarak okunsun: `accessibilityLabel` `Öğrenme XP: 30; Tamamlanan: 3; Kayıtlı: 2`. Rol rozeti metin. Düzenleme inputları `accessibilityLabel` `Görünen ad`, `İlgi alanları`, `Kullanıcı adı`. `Sonucu gör` etiketine oturum adını ekle: `Sonucu gör: Web demo — ödülsüz test`. `Çıkış yap` `accessibilityRole="button"`, danger tonu tek taşıyıcı değil (metin açık).

**Ölçüler.** Profil kartı padding 16; istatistik sütunları gap 16, h2 20/26 + caption 12/16; input 48; butonlar 48; bölümler arası 16; çıkış butonu üstünde 32 boşluk, tab bar (64) üstünde 32 alt padding.

### 3.8 Yarış — `/(tabs)/play`

**Amaç.** Yarışma merkezi: mevcut ya da sıradaki ödülsüz test oturumu ve kuralların kısa, dürüst özeti. Takvim, haftalık sıralama, lig, sezon, ödül, sponsor **yok**. Veri: `GET /quiz/current` → `{ session: QuizSessionSummary|null, serverTime, myParticipation|null }`; tab odağında yalnızca ilk yükleme başarılıysa yeniden çekilir (§2.1/3). testID `play-screen`.

**Yerleşim (üstten alta).** h1 `Yarış` → body inkMuted `Herkes aynı anda, aynı beş soru. Doğru ve hızlı cevap daha çok puan; yanlış cevap elemez.` → [StateView loading | error/offline + `Tekrar dene`] → `QuizSessionCard` (§3.3 tablosu; §4.1) → Card muted **Kurallar**: caption inkMuted `Kurallar (M0 deneme ayarı)` + dört small inkMuted madde (as-built `small`; koru): `• Soru başına 12 saniye; puan 60–100 arası, hız sunucu saatine göre hesaplanır.` / `• İlk kabul edilen cevap geçerlidir; değiştirilemez.` / `• Geç katılırsan henüz açılmamış sorulardan itibaren yarışırsın.` / `• Bu sürümde oturumlar ödülsüz yerel testtir.` Kurallar kartı **her durumda** (loading, error, offline, loaded, boş) render edilir; StateView’un altında kalır.

**Bileşen ve veri.** `QuizSessionCard` Ana Sayfa’dakiyle aynı bileşendir; `joined = !!myParticipation`. Kurallar kartı sabit metindir: `12 saniye` koddadır, oturumun gerçek `rules.questionDurationMs` değeri yalnızca oturum kartında görünür (demo oturumunda `8 sn/soru`). `[M1+]`: kurallar kartının ilk maddesini `session.rules`’tan türet (`Soru başına {N} saniye…`); oturum yoksa varsayılan 12 ve `deneme ayarı` etiketi.

**Durumlar.**

| Durum | Görünüm |
|---|---|
| loading (veri yok) | h1 + açıklama → StateView loading → kurallar kartı. |
| error | h1 + açıklama → StateView error + API metni + `Tekrar dene` → kurallar kartı. |
| offline | StateView offline + `Tekrar dene` → kurallar kartı. |
| loaded × `session=null` | Oturum kartı boş durumu (`Planlanmış test oturumu yok`) → kurallar kartı. |
| loaded × scheduled / lobby / live / completed / cancelled × katıldı/katılmadı | Oturum kartı §3.3 tablosu (10 çerçeve) → kurallar kartı. Lobby/live’da kart live tonlu; sayfanın geri kalanı sakin. |

**Mikro-metin.** Yukarıdaki dizeler aynen; `Kurallar (M0 deneme ayarı)` başlığı deneme ayarı etiketini taşır, kaldırılamaz (Brief §1: deneme ayarı nihai karar gibi yazılmaz). “Adil”, “eşit şans”, “hile korumalı” sözcükleri yok; hız nötr anlatılır (`sunucu saatine göre`).

**Erişilebilirlik.** h1 header rolü; oturum kartı kökü `accessible` (§3.3); kurallar kartı düz metin, maddeler ayrı `T` öğeleri (her madde ayrı okunur); `Tekrar dene` 48 pt; geri sayım duyurusu yok.

**Ölçüler.** Bölümler arası 16; kurallar kartı padding 16, iç gap 8; madde metni 14/20; 1.6×’te maddeler sarar, kart büyür. Teslim: `M0 / Yarış / {loading|error|offline|loaded}` × oturum kartı 5 durum × katıldı/katılmadı + boş (toplam 3 + 11 çerçeve), 390×844 light 1.0× (P0: loaded × scheduled, lobby, completed, null).


---

## 4. Canlı yarışma deneyimi (Günün 5’i) — tüm durumlar ve zamanlama

### 4.0 Kaynak, değişmezler ve ortak çerçeve

Bu bölümün tek doğruluk kaynağı uygulanmış koddur: `apps/mobile/app/quiz/[id].tsx` (ekran), `apps/mobile/src/features/quiz/useQuizSession.ts` (faz makinesi), `apps/mobile/src/lib/socket.ts` (bağlantı durumları), `apps/mobile/src/features/quiz/QuizSessionCard.tsx` (giriş kartı, `formatCountdown`, `cancelReasonTr`), `packages/contracts/src/{quiz,ws,common,scoring}.ts` (veri ve hata metinleri). Mevcut mikro-metinler aşağıda **tırnak içinde, değiştirilmeden** verilir; bunları başlangıç noktası olarak kullan, yeniden yazma. T1 düzeltmeleri §0.1’deki kapalı listedir; diğer her yeni şey `[M1+]`.

Tasarım boyunca uyulacak değişmezler (her ekranda kontrol et):

1. **Sunucu saati tek otoritedir.** Her geri sayım `serverNow()` (GET /time ofseti) ile `closesAt`, `nextOpensAt`, `lobbyOpensAt`, `scheduledStartAt` farkından hesaplanır. Cihaz sayacı yalnızca gösterimdir; sayacın sıfırlanması hiçbir durumu *belirlemez*, sadece `state.resync` tetikler. Tasarımda “sayaç bitti = sonuç geldi” varsayma; arada `expired` fazı vardır.
2. **Sızıntı sınırı.** Soru açılmadan önce ne soru, ne seçenek; reveal gelmeden önce ne doğru cevap, ne puan gösterilir. `Cevabın kabul edildi` **doğruluk değil teslim** bilgisidir.
3. **Asla sahte başarı.** Teslim bilinmiyorsa (`unknown`) “gönderildi” denmez; “iletilemedi” + `Tekrar gönder` gösterilir.
4. **İlk kabul edilen cevap kesindir.** Değiştirme, geri alma, onay adımı yoktur; tek dokunuş gönderir.
5. **Ödülsüz test etiketi** her fazda görünür kalır: stack başlığı `Günün 5’i · Test`, üst satır `Ödülsüz test oturumu`, ön izleme `Katılım ücretsizdir. Bu sürümde ödül yoktur.`, sonuç `Bu test oturumu ödülsüzdür.` (yedi zorunlu konumun tam listesi §6.7/5).
6. **Sahte sayaç/kazanan/sponsor/ödül yok.** Katılımcı sayısı yalnızca `participantCount`’tır; “şu an N kişi cevaplıyor”, “en hızlı sen” gibi istemci iddiaları yoktur.
7. **Yarışma puanı ≠ öğrenme XP.** Bu ekranlarda “XP” kelimesi geçmez; yalnızca `puan`. Sonuç ekranından içerik kartına geçiş (`Kartı aç`) XP’ye *köprü*dür, puanı XP’ye çevirmez.
8. **Animasyon içeriği veya cevap geri bildirimini geciktirmez.** `question.opened` geldiği an prompt ve 4 seçenek tam opak ve dokunulabilir olmalı (0 ms). Seçeneğe basınca vurgu aynı kare içinde; alındı rozeti sunucu makbuzu gelir gelmez (0 ms).
9. **Gereksiz adalet/anti-hile iddiası yok.** “Adil”, “eşit şans”, “gecikme telafili”, “hile korumalı” sözcükleri ve rozetleri kullanılmaz. Hız nötr anlatılır: “sunucu saatine göre”.

**Ortak çerçeve (her fazda aynı):**

| Öğe | M0’da uygulanmış hali | Tasarım talimatı |
|---|---|---|
| Native stack başlığı | title `Günün 5’i · Test`, geri `Geri`, tint `live #D9480F`, arka plan `bg #F6F3EE`, gölge yok | Koru; tint `live/default` (T1/7). Başlıkta Türkçe kesme işareti `’` (U+2019). Geri oku 48×48 dokunma alanı. |
| Bağlantı şeridi | yalnızca `reconnecting`/`offline` iken, bkz. §4.12 | §4.12 kanonik: soru/expired fazlarında rezerve slot, diğer fazlarda akışta. |
| Üst satır | `Row space-between`: caption live `Ödülsüz test oturumu` + Badge muted `v{stateVersion}` | Caption’ı koru. `v13` rozeti **geliştirici göstergesidir**; tasarımda gösterme (T1/2: yalnızca `__DEV__`’de render et). |
| Ekran dolgusu | `paddingHorizontal 16`, `paddingTop 12`, dikey `gap 16`; `question` fazında kaydırma kapalı, diğer fazlarda `ScrollView` | Koru. Soru fazında seçenekler asla hareket etmemeli (kaydırma kapalı olmasının nedeni budur). |
| Ton | Tüm canlı yarışma yüzeyleri `live`/`liveSoft` ile enerjik; metin `ink` ile okunur; `accent` (teal) yalnızca öğrenme köprüsü (`Açıklama`, `Merakın devam etsin`) | `live` ve `accent` aynı öğede birleşmez. Kırmızı (`danger`) yalnızca ret/yanlış için; yeşil (`success`) yalnızca reveal/sonuçtaki doğru için. |

### 4.1 Giriş noktası: oturum kartı (Ana Sayfa ve Yarış)

`QuizSessionCard` iki sekmede de aynıdır; tüm yollar `/quiz/[id]`’ye çıkar, katılım o ekranda yapılır. Tam tablo §3.3; özet:

- **Oturum yok** (`session === null`): Card `muted`: caption inkMuted `Günün 5’i` · h3 `Planlanmış test oturumu yok` · small inkMuted `Yönetim panelinden ödülsüz bir test oturumu planlandığında burada görünür.` Buton yok. Sahte “yarın 21:00” vaadi ekleme (takvim M1).
- **Oturum var**: Card tonu `lobby|live` → `live`, aksi `surface`. Üst satır caption live `Günün 5’i · ödülsüz test` + durum rozeti (`Planlandı` accent · `Bekleme salonu açık` live · `Canlı` live · `Tamamlandı` muted · `İptal edildi` muted · `Taslak` kullanıcıya hiç gelmez). h2 `session.title`.

| status | Gövde satırı (body inkMuted) | CTA (katılmadı → katıldı) | Buton tonu |
|---|---|---|---|
| scheduled | `Başlangıç: {countdown} sonra · {questionCount} soru · {sn} sn/soru` | `Katıl` → `Bekleme salonu` | primary |
| lobby | `{countdown} sonra başlıyor · {participantCount} katılımcı` | `Katıl` → `Oturuma dön` | live |
| live | `Şu an canlı · {currentQuestionPosition}/{questionCount}. soru` | `Katıl` → `Oturuma dön` | live |
| completed | `Sonuçlar hazır.` | `Detay` → `Sonucu gör` | primary |
| cancelled | `İptal edildi ({cancelReasonTr}).` | `Detay` → `Sonucu gör` (as-built; öneri: ikisi de `Ayrıntı`, iptalde sonuç yoktur `[M1+ küçük düzeltme]`) | primary |
| ≤0 geri sayım | as-built `Başlangıç: şimdi sonra …` / `şimdi sonra başlıyor …` (bkz. §3.3) | aynı | aynı |

`formatCountdown`: `≤0 → "şimdi"`, saat varsa `"{h} sa {m} dk"`, dakika varsa `"{m} dk {sec} sn"`, aksi `"{sec} sn"`. Kart 1 sn’de bir yeniler; sayılar `tabular-nums` (T1/5, bkz. §1.4). Süre değeri her zaman `session.rules.questionDurationMs`’ten gelir (demo oturumunda 8 sn görünür); Yarış sekmesindeki kurallar kartı 12 sn’yi sabit yazar — bunu veri odaklı yapmak `[M1+]` (§3.8).

### 4.2 Faz haritası (11 istemci fazı)

| Faz | Tetikleyici | Pano | Kaydırma | Çıkış |
|---|---|---|---|---|
| `loading` | mount → GET /quiz/sessions/:id | StateView `Yükleniyor…` | açık | yanıt gelince |
| `error` | ilk GET hata | StateView error + `Tekrar dene` | açık | retry |
| `preview` | oturum biliniyor, bu cihazda katılım yok / join hata | Katıl kartı | açık | `Katıl` |
| `joining` | join() | StateView `Katılınıyor…` | açık | snapshot |
| `scheduled` | snapshot status scheduled | Waiting `Katıldın` | açık | `session.lobby` |
| `lobby` | `session.lobby` / snapshot lobby | Waiting `Bekleme salonu` | açık | `question.opened` |
| `question` | `question.opened` / snapshot open & `closesAt > now` | QuestionPane | **kapalı** | yerel `closesAt` → `expired`; `question.revealed` |
| `expired` | yerel saat `closesAt`’i geçti, reveal henüz yok | Card `Süre doldu` (T1/4: soru panosu kilitli kalır) | açık | `question.revealed` (≈0–1 sn) |
| `reveal` | `question.revealed` / snapshot reveal | RevealPane | açık | `question.opened` veya `session.completed` |
| `completed` · sonuç yüklendi | `session.completed` / status completed / join → SESSION_COMPLETED | `Sonuç hesaplanıyor…` → ResultPane | açık | — (terminal) |
| `completed` · **sonuç yüklenemedi** | GET /result hata (ağ, NOT_FOUND, INVALID_TRANSITION `Oturum henüz tamamlanmadı.`) | **Mevcut kod: sonsuz `Sonuç hesaplanıyor…`, hata gösterilmez, retry yok, bekçi bu fazda çalışmaz.** T1/21: StateView error, title `Bir sorun oldu`, message = API/NETWORK metni, Button secondary `Tekrar dene` → `loadResult()` (küçük düzeltme: `phase completed && !result && error` → error StateView) | açık | retry |
| `cancelled` | `session.cancelled` / status cancelled / join → SESSION_CANCELLED | Card `Oturum iptal edildi` | açık | — (terminal) |

Otomatik devam: cihazda `merak.participation.<sessionId>` token’ı varsa **ve** sunucu `myParticipation` döndürüyorsa `join()` otomatik çalışır ve doğru faza inilir (uygulama kapanıp açılınca, derin bağlantıyla). **Kodda preview bir kare görünebilir** (ilk effect önce `phase: 'preview'` yazar, sonra `join()` bekler); tasarımda otomatik devamda preview çerçevesi gösterilmez, doğrudan joining → faz. `[M1+ küçük düzeltme]`: ilk setState’te token + myParticipation varsa phase `joining`. “Kaldığın yerden devam” ara ekranı yok.

### 4.3 `loading`, `error`, oturum bulunamadı / süresi geçmiş

- `loading`: ortalı `ActivityIndicator(accent)` + h3 `Yükleniyor…`, minHeight 160. Üst satır (`Ödülsüz test oturumu`) oturum gelmeden **gösterilmez**. İskelet (skeleton) yok; bu fazda beyaz kart çizme.
- `error`: StateView title `Bir sorun oldu`, message = sunucu metni (ör. `Aradığın kayıt bulunamadı.`, ağda `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.`), Button secondary `Tekrar dene`. Mevcut kodda `Tekrar dene` → `join()` çağırır; oturum hiç yüklenmediyse join de başarısız olur ve ekran boş kalabilir. T1/12: NOT_FOUND için retry yerine ghost `Yarış sekmesine dön`; ağ hatası için retry ilk GET’i tekrarlasın. **Ağ hatasında M0 iki mesaj basar** (başlangıç `connection='offline'` → şerit `Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.` + StateView `Bağlantı kurulamadı…`); tasarımda yalnızca StateView gösterilir, şerit socket açılmadan çizilmez (T1/3).
- “Süresi geçmiş” ayrı bir faz **değildir**: başlangıcı 60 sn’den fazla kaçmış planlı oturumu sunucu `missed_start` ile iptal eder → `cancelled`; biten oturum `completed` → sonuç. Tasarımda “süresi geçti” adlı üçüncü bir ekran üretme; bu iki pano yeter.

### 4.4 `preview` — ön izleme / Katıl kartı

Yerleşim (Card `surface`, gap 8):
1. h1 `session.title` (ör. `Web demo — ödülsüz test`).
2. body inkMuted `{questionCount} soru · soru başına {round(questionDurationMs/1000)} sn · {participantCount} katılımcı`.
3. small inkMuted `Başlangıç: {toLocaleString('tr-TR')}` (ör. `Başlangıç: 15.10.2026 21:00:00`). Mühendislik notu: `toLocaleString` **cihaz saat dilimini** kullanır; Europe/Istanbul için `timeZone` seçeneği verilmeli `[M1+ küçük düzeltme]`; tasarım İstanbul saatini varsayar. Öneri biçimi (§6.7/7): `15 Ekim 2026, 21:00`.
4. Hata satırı (small `danger`, yalnızca `state.error` varsa) — tam metinler aşağıda.
5. Button `live` `Katıl` (minHeight 48, pill, testID `quiz-join`). **Buton spinner’ı yoktur**: basınca kart kalkar, yerine StateView loading `Katılınıyor…` gelir (§4.5). `[M1+]`: buton içi loading.
6. caption inkMuted (T1/10; as-built inkFaint) `Katılım ücretsizdir. Bu sürümde ödül yoktur.`

Ön izleme `scheduled`, `lobby` ve `live` oturumlar için aynıdır (geç katılım serbest; uygunluk sunucuda). Kart dışında hiçbir şey yok: katılımcı listesi, avatar, sohbet, “hazırım” butonu, sponsor yok.

**Katılım hataları (kartın içinde, sakin, `danger` metin; alarm ikonu yok). Aynı hata satırı 11 olası metin taşır; zorunlu çerçeve 3: `PARTICIPATION_EXISTS` (ikinci cihaz), `NETWORK`, `Beklenmeyen bir hata oldu. Lütfen tekrar dene.` (socket açılamadı / INTERNAL). Diğer metinler aynı satırı kullanır; satır en uzun metinle (PARTICIPATION_EXISTS, 2 satır) ölçülür.** Kod incelemesi notu: katılım isteği `SESSION_NOT_JOINABLE`’ı yalnızca taslak oturumda, `PARTICIPATION_TOKEN_INVALID`’i hiç üretmez (yanlış belirteçli ikinci katılım `PARTICIPATION_EXISTS` döner); bu iki satır yalnızca kenar durum notudur.

| Kod | Metin (değiştirme) | Tasarım davranışı |
|---|---|---|
| `PARTICIPATION_EXISTS` | `Bu oturuma başka bir cihazdan katıldın. M0 sürümünde ikinci cihaz devralamaz.` | **İkinci cihaz ekranı.** `Katıl` butonu kalır ama tekrar basınca aynı hata döner; devralma/transfer affordance’ı **yok**. `[M1+]`: hata görünürken `Katıl`’ı `secondary` tona düşür ve altına small inkMuted `İlk katıldığın cihazdan devam edebilirsin.` |
| `SESSION_NOT_JOINABLE` | `Bu oturuma şu anda katılınamıyor.` | Metni göster; buton kalır. **Pratikte yalnızca id ile açılan taslak oturumda** (join önce cancelled/completed’ı kontrol eder; `/quiz/current` ve `/home` taslak döndürmez); normal akışta ulaşılmaz, çerçeve basit tutulur. |
| `PARTICIPATION_TOKEN_INVALID` | `Katılım bilgin doğrulanamadı. Oturuma yeniden katıl.` | Katılım isteği bu kodu üretmez; socket aboneliği (`session.subscribe` ack) bu kodla düşerse yerel `subscribe.error` metni olarak yalnızca `preview`/`error` fazında görünür. Metin + `Katıl` (yeniden katılım). Asıl görüldüğü yer cevap satırıdır (§4.7). |
| `SESSION_COMPLETED` | (gösterilmez) | Doğrudan sonuç yüklenir → `completed`. |
| `SESSION_CANCELLED` | `Bu oturum iptal edildi.` | Doğrudan `cancelled` panosu, `cancelMessage` = bu metin. |
| `RATE_LIMITED` | `Çok hızlı istek gönderdin. Biraz bekleyip tekrar dene.` | Metin; buton kalır. |
| `NOT_FOUND` | `Aradığın kayıt bulunamadı.` | Oturum yükleme ile katılma arasında silindiyse; metin + buton kalır (T1/12 ile ghost `Yarış sekmesine dön`). |
| `VALIDATION_FAILED` | `Gönderilen veri geçersiz.` | Bozuk saklanmış `participationToken` (<16 karakter) strict şemayı geçemez; metin + `Katıl`. |
| `AUTH_*` (401) / `INTERNAL` | `Devam etmek için giriş yapmalısın.` / `Oturum doğrulanamadı. Lütfen yeniden giriş yap.` / `Oturumun süresi doldu. Lütfen yeniden giriş yap.` / `Beklenmeyen bir hata oldu. Lütfen tekrar dene.` | Aynı danger satırı; otomatik `/login` yönlendirmesi **yok** (§6.8). |
| Socket açılamadı (katılım yine de oluştu) | `Beklenmeyen bir hata oldu. Lütfen tekrar dene.` (`openSocket` `Error('AUTH_REQUIRED')` fırlatınca `describeError` INTERNAL metnini verir) | Faz `preview`e düşer ama katılım sunucuda oluştu ve token saklandı; tekrar `Katıl` → devam. Tasarımda ayrı çerçeve gerekmez; nota yaz. |
| NETWORK | `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.` | Metin; buton kalır. |

### 4.5 `joining`

StateView loading, title `Katılınıyor…`. Sıra: saat eşitleme (GET /time) → POST join → token’ı güvenli depoya yaz → snapshot uygula → socket aç. Tipik süre < 1 sn; ara animasyon tasarlama, yalnızca spinner. Kullanıcı bu anda geri tuşuna basabilir; katılım sunucuda kalır, kart `Oturuma dön` gösterir.

### 4.6 `scheduled` (“Katıldın”) ve `lobby` (“Bekleme salonu”)

İkisi de aynı `Waiting` kartıdır: Card `live` (`liveSoft #FDE4D8`), testID `quiz-waiting`, gap 8:

| | `scheduled` | `lobby` |
|---|---|---|
| h1 | `Katıldın` | `Bekleme salonu` |
| body inkMuted | `Bekleme salonu {formatCountdown(lobbyOpensAt − now)} sonra açılır.` | `İlk soru {formatCountdown(scheduledStartAt − now)} sonra açılır. Hazır ol.` |
| small inkMuted | `{participantCount} katılımcı bekliyor. Sorular herkese aynı anda, sunucu saatine göre açılır.` | aynı; `participantCount` her `session.lobby` olayında güncellenir |
| **≤0** | as-built `Bekleme salonu şimdi sonra açılır.` (bekçi 1,5 sn; zamanlayıcı gecikirse 60 sn’ye kadar) → `[M1+ öneri]` `Bekleme salonu açılıyor…` | as-built `İlk soru şimdi sonra açılır. Hazır ol.` → `[M1+ öneri]` `Başlıyor…` |

Zamanlama: lobi `scheduledStartAt − lobbyLeadMs` (varsayılan 60 sn) anında açılır; sayaç 100 ms tikle yenilenir (saniye hassasiyetiyle göster). Sunucu olayı 1,5 sn gecikirse istemci sessizce `state.resync` yollar — bunun için UI yok, spinner koyma. Lobide **olmayanlar**: katılımcı adları/avatarları, sohbet, “hazırım” butonu, ses, 3-2-1 perdesi. Ekranın alt yarısı boştur (bkz. 06 ekran görüntüsü); bu boşluğu doldurmak için sahte içerik üretme. `[M1+]`: alt bölgeye kurallar kartının kısa hali (`İlk kabul edilen cevap geçerlidir · {sn} sn/soru · yanlış elemez`) — yalnızca `session.rules`’tan okunan değerlerle.

### 4.7 `question` — soru ekranı

**Yerleşim (kaydırma kapalı, container gap 16, testID `quiz-question`):**

0. **Şerit slotu** (§4.12): başlık satırının üstünde rezerve; slot yüksekliği = en uzun şerit metninin (`Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.`, 67 karakter) o ölçek ve genişlikteki ölçülen yüksekliği; 390 pt’de tahmini 1.0× ≈ 64 pt (2 satır), 1.6× ≈ 120 pt (3 satır); boşken görünmez ama yer tutar; slot yüksekliği §1.4/2 prompt bütçesinden düşülür.
1. **Üst satır** `Row space-between`: caption inkMuted `Soru {position}/{total}` (ör. `SORU 1/5`) · sağda sayaç h2 `{ceil(remainingMs/1000)} sn`, testID `quiz-timer`, rengi `ink`; **≤3 sn’de `live/vivid`** (büyük metin, bg üstünde 3.88). Sayaç için sabit genişlik (min 64 pt) ve `tabular-nums` (T1/5).
2. **İlerleme çubuğu** 8 pt pill, track `progress/track`, dolgu `live/vivid`, `value = remainingMs/durationMs` (soldan sağa **boşalır**), a11y role progressbar, label `Kalan süre`, değer 0–100.
3. **Soru metni** h1 26/32 w800, testID `quiz-prompt`; sözleşme sınırı 8–400 karakter. Sol hizalı, ortalama yok. Bütçe ve taşma kuralı **bkz. §1.4/2** (T1/11: bütçe aşılırsa prompt bölgesi kendi içinde kaydırılır).
4. **Geç katılım uyarısı** (yalnızca `position < eligibleFromPosition`): small `warning` `Bu soru sen katılmadan önce açıldı; bir sonraki sorudan itibaren yarışacaksın.` ve tüm seçenekler kilitli (opacity .6). Bu metin tek bileşende kalsın; A-4 kararı değişirse tek yerden güncellenir.
5. **Seçenekler** (her zaman 4, sunucudan kullanıcıya özel sabit sırada, `optionId` ile): dikey, **gap 12** (T1/9; as-built 8); her biri Pressable minHeight 56, radius 16, paddingHorizontal 16, bg `surface`, border 2 `border/input` (T1/7; as-built `line`), metin bodyStrong `ink`, çok satır serbest (dikey padding ≥ 12 ki 2 satır 56’yı aşabilsin). testID `quiz-option-{0..3}`, a11y role button, label `Seçenek {i+1}: {label}`. **Harf (A/B/C/D) yok** — sıra kişiye özeldir, ortak referans olamaz. Onay adımı yok: tek dokunuş gönderir. Erişilebilirlik durumu (T1/15): seçili seçenek `accessibilityState {selected:true}` + `accessibilityHint "Cevabın gönderildi; değiştirilemez"`; `disabled` yalnızca seçilmemiş kilitli seçeneklerde (as-built seçili `{disabled:true, selected:true}` → “devre dışı” duyurusu cevabı geçersiz sandırır).
6. **Durum satırı** (`AnswerStatus`, bkz. tablo), yükseklik sabit (≥ 24 pt).

**Seçenek görsel durumları (kanonik; §5.3.13 buraya atıf yapar):**

| Durum | Arka plan | Kenarlık | Metin | Opaklık |
|---|---|---|---|---|
| boş (idle, eligible) | surface | `border/input` 2 pt | ink | 1 |
| basılı | surface | `border/input` | ink | .85 (0 ms) |
| **seçildi** (`answer.optionId === optionId`) | **`live/default` #B5380A** | `live/default` | `#FFF` (5.94 ✓) | 1 |
| kilitli, seçilmemiş | surface | `border/input` | ink | .6 |
| kilitli, seçilmiş (submitting/accepted/unknown) | `live/default` | `live/default` | `#FFF` | 1 |

`locked = !eligible || answer.status ∈ {submitting, accepted, unknown}`; `idle` ve `rejected` dokunulabilir kalır. Seçili durum için renge ek glif/etiket `[M1+]`: sağda “seçildi” metni (ekran okuyucu zaten `selected` alır). As-built seçili zemin #D9480F + beyaz 4.30 ✗ → T1/7.

**Cevap teslim durumları (`AnswerState.status`) — hepsi seçeneklerin altında, aynı yerde, yükseklik sabit ki içerik zıplamasın:**

| status | Görünüm | Metin | Duyuru |
|---|---|---|---|
| `idle` | small **inkMuted** (T1/10) | `Bir seçenek seç. İlk kabul edilen cevap geçerlidir.` | — |
| `submitting` | small inkMuted; seçilen seçenek zaten `live/default`; tüm seçenekler kilitli | `Gönderiliyor…` | polite |
| `accepted` | Badge `status/neutral` (bkz. §1.3: surfaceMuted zemin, inkMuted metin, **glif yok**) | `Cevabın kabul edildi` | polite |
| `rejected` | small `danger`; seçenekler **kilidi açılır** | sunucu metni (tablo altta) | assertive |
| `unknown` | Row: small `warning` + Button secondary `Tekrar gönder` | `Cevabın iletilemedi; bağlantı gelince aynı cevapla tekrar denenir.` | polite |

**Alındı rozeti tonu:** M0 kodu `accepted` rozetini `success` (yeşil) tonla çizer; bu “doğru” diye okunabilir. **Tasarımda alındı rozeti §1.3 `status/neutral`** (T1/1). Accent quiz ekranında yalnızca `Açıklama` ve `Merakın devam etsin` kartlarında. Makbuz `replayed` ise ya da `ANSWER_ALREADY_ACCEPTED` dönerse mesaj (`Cevabın zaten kayıtlıydı.` / `Bu soru için cevabın zaten kabul edildi; cevap değiştirilemez.`) kodda rozetin altında gösterilmez; `[M1+]`: rozetin altında small inkMuted olarak göster.

**Ret metinleri (`rejected`; sunucudan verbatim, yeniden yazma). Hepsi danger satırı, assertive; suçlayıcı olmayan metin:**

| Kod | Metin | Sonraki dokunuş |
|---|---|---|
| `QUESTION_CLOSED` | `Sorunun süresi doldu; bu cevap kabul edilmedi.` | Seçenekler açık görünür ama süre bittiği için pratikte `expired` panosuna geçilir. (Oturum soru ortasında iptal edilir ya da biterse sunucu bu kodu değil `SESSION_CANCELLED` / `SESSION_COMPLETED` döner; `live` dışındaki diğer durumlarda `QUESTION_NOT_OPEN` — bkz. “Diğer kodlar”.) |
| `NOT_ELIGIBLE_FOR_QUESTION` | `Bu soru açıldıktan sonra katıldığın için cevaplayamazsın. Bir sonraki sorudan devam et.` | Normalde uyarı satırı (madde 4) bunu önler; saat kayması durumunda gelir. |
| `ANSWER_ALREADY_ACCEPTED` | `Bu soru için cevabın zaten kabul edildi; cevap değiştirilemez.` | **Ret değil, kabul** olarak işlenir + resync. |
| `OPTION_INVALID` | `Seçenek bu soruya ait değil.` | Farklı seçeneğe tekrar basılabilir (ilk geçerli cevap hakkı tüketilmez). |
| `IDEMPOTENCY_KEY_CONFLICT` | `Aynı istek anahtarıyla farklı bir cevap gönderildi; istek reddedildi.` | Nadir; tekrar basılabilir. |
| `RATE_LIMITED` | `Çok hızlı istek gönderdin. Biraz bekleyip tekrar dene.` | Tekrar basılabilir. |
| `QUESTION_NOT_OPEN` | `Soru henüz açılmadı.` | Saat kayması; tekrar basılabilir. |
| `PARTICIPATION_TOKEN_INVALID` / `NOT_PARTICIPANT` | `Katılım bilgin doğrulanamadı. Oturuma yeniden katıl.` / `Bu oturuma katılmış görünmüyorsun.` | `[M1+]`: satırın altında ghost `Yeniden katıl`. |
| **Diğer kodlar** | `SESSION_CANCELLED` `Bu oturum iptal edildi.` / `SESSION_COMPLETED` `Bu oturum tamamlandı.` (cevap gönderilirken oturum iptal edildi ya da bitti; hemen ardından `session.cancelled`/`session.completed` fazı gelir) · `NOT_FOUND` → sunucu özel `Soru bu oturuma ait değil.` (§6.8b) · `VALIDATION_FAILED` `Gönderilen veri geçersiz.` · `AUTH_*` · `PAYLOAD_TOO_LARGE` `İstek çok büyük.` · `INTERNAL` `Beklenmeyen bir hata oldu. Lütfen tekrar dene.` | Aynı danger satırı; seçenekler açılır. |

**Teslim bilinmiyor (`unknown`):** ağ hatasında aynı `idempotencyKey` ile 3 deneme (400/800/1200 ms geri çekilme) başarısızsa. Seçilen seçenek `live/default` kalır (kullanıcı ne seçtiğini görür), `Tekrar gönder` aynı seçeneği aynı anahtarla yollar; sunucu makbuzu zaten yazmışsa `replayed:true` döner ve `accepted` olur. Yeniden bağlanınca snapshot’taki `myParticipation.answers` yerel durumu `accepted` olarak **ezer** — bu durumda rozet kendiliğinden belirir; ek animasyon yok.

**Potansiyel puan ipucu:** sayacın yanında azalan “doğruysa ≤ N” göstergesi **tasarlanmaz**. İstemci saatiyle hesaplanan değer sunucunun `receivedAt`’ından yüksek çıkabilir ve “hız telafisi var/adaletsiz” algısı üretir (Brief §6: gecikme telafisi yok; §4.0/9). Öneri belgeden kaldırılmıştır.

### 4.8 `expired` — süre doldu, reveal bekleniyor

Cihaz saati `closesAt`’i geçince reveal gelene kadar (normalde 0–1 sn; sunucu tiki 250 ms + ağ) bu faz görünür. As-built: Card `muted`: h2 `Süre doldu` · body inkMuted `Doğru cevap sunucudan geliyor… Yeni cevap kabul edilmez.` · Button ghost `Durumu yenile` (elle resync); soru panosu **kaldırılır**, seçilen seçenek reveal gelene kadar kaybolur; sayaç bitiminde pano kalkınca VoiceOver odağı ekran başına atlar. **T1/4:** soru panosunu kilitli bırak, sayaç yerine `Süre doldu` yaz, açıklama satırını durum satırına koy — seçenekler yerinde kalır, reveal gelince yalnızca renk değişir (görsel süreklilik); odak sayaç satırına taşınır, pano kaldırılmaz. 1,5 sn geçerse bekçi otomatik resync yapar; `[M1+ küçük düzeltme]`: `Durumu yenile`yi yalnızca 1,5 sn sonra göster. **`connection ≠ connected` iken `Durumu yenile` etkisizdir** (`resync()` socket bağlı değilse sessizce döner): tasarımda butonu disabled göster ve şerit metnine güven; bağlantı gelince otomatik resync zaten var.

### 4.9 `reveal` — sonuç ve açıklama

Sunucu `closesAt`’te soruyu kapatıp `question.revealed` yayınlar; `revealDurationMs` (varsayılan 6 sn; demo 3 sn) sonra sıradaki soru. Container testID `quiz-reveal`, gap 16, kaydırılabilir:

1. Üst satır: caption inkMuted `Soru {position}/{total} · sonuç` + sonuç rozeti (4 varyant): `myAnswer && isCorrect` → Badge `success` `Doğru · +{points} puan` (ör. `Doğru · +97 puan`) · `myAnswer && !isCorrect` → Badge `danger` `Yanlış · 0 puan` · `myAnswer === null` → Badge `muted` `Cevapsız · 0 puan` · **`myAnswer === null` + yerel seçim (teslim `unknown`/`submitting` iken süre doldu)** → Badge `muted` `Cevapsız · 0 puan` + small warning `Bu seçim sunucuya ulaşmadı; cevapsız sayıldı.`; yerel seçim ✗ ile **boyanmaz**, nötr kalır (T1/20: `isMine` yalnızca `reveal.myAnswer.optionId`’den türer; as-built `mine?.optionId ?? answer?.optionId` yerel seçimi dangerSoft + ` ✗` + “senin cevabın” etiketiyle boyar — iki çelişen sinyal). Not: reveal’deki danger tonu anlık geri bildirimdir (renk + ✗ + metin); sonuç özetinde `muted` kullanılması kasıtlıdır (§4.10/3). İkisi de yetişkin tonda, “elendin/kaybettin” dili yok.
2. h2 `prompt` (soru fazındaki h1’den bir kademe küçük; açıklamaya yer açar).
3. Seçenekler, soru fazıyla **aynı geometri ve aynı sıra**, dokunulamaz: doğru → border `status/success`, bg `successSoft`, metin `status/success` + ` ✓`; benim yanlışım → border `danger`, bg `dangerSoft`, metin `danger` + ` ✗`; diğerleri nötr. Erişilebilirlik (T1/15): reveal seçenekleri `accessible={true}`, label `{label}, doğru cevap` / `{label}, senin cevabın` / ikisi birden; ✓/✗ glifleri `accessibilityElementsHidden` ile SR’den gizlenir, anlam label’dadır (TTS’te “check mark/ballot x” okunmaz). Renk tek taşıyıcı değildir: glif + metin + kenarlık kalınlığı (2 pt) birlikte.
4. Card `accent`: caption accent `Açıklama` + body `explanation` (≤1000 karakter). 6 sn’de göz atılabilir olmalı: ilk 2 satır ekranda, gerisi kaydırmayla; açıklama fazla uzunsa kart kesilmez.
5. Altbilgi small inkMuted: `nextOpensAt` varsa `Sonraki soru {ceil(ms/1000)} sn içinde.` (500 ms tik), yoksa `Son soruydu. Sonuçlar hesaplanıyor…`.

Puan rozeti değerleri sunucunundur (60–100 ya da 0): `round(60 + 40 × (1 − elapsedMs/durationMs))`. Örnekler (12 sn): 0 sn → 100, 3 sn → 90, 6 sn → 80, 9 sn → 70, 11,9 sn → 60; yanlış/cevapsız → 0. Yüzde kaçının doğru bildiği, soru bazlı sıralama, seri (streak) gösterilmez.

### 4.10 `completed` — sonuç ekranı

`session.completed` gelince GET /quiz/sessions/:id/result; gelene kadar StateView loading title `Sonuç hesaplanıyor…` (son reveal’in bekçi süresi 7,5 sn). Yüklenemezse §4.2’deki error StateView (T1/21). Profil → `Sonucu gör` ve kart → `Sonucu gör`/`Detay` doğrudan buraya iner. Container testID `quiz-result`, gap 16, kaydırılabilir; sıralama:

1. **Hero** Card `live`: caption live `Oturum tamamlandı` · display 32/38 `{totalPoints} puan` (testID `result-points`) · body inkMuted `{correctCount}/{questions.length} doğru · {rank ? "{rank}. sıra" : "sıralama dışı"} / {participantCount} katılımcı` · caption **inkMuted** (T1/10; liveSoft üstünde 5.52 ✓) `Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.` Konfeti, kupa, madalya, “tebrikler” yok; 0 puan da aynı sakin hero ile gösterilir (yetişkin ton).
   **İzleyici görünümü (`participantId === null` — katılmayan kullanıcı Profil ya da kart `Detay` ile gelir; sunucu `correctCount:0, totalPoints:0, rank:null` döner):** hero Card `surface` (live değil): caption inkMuted `Oturum tamamlandı` · h2 `Bu oturuma katılmadın` · body inkMuted `{participantCount} katılımcı · sonuçlar aşağıda` · caption inkMuted `Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.` `{totalPoints} puan` ve `x/5 doğru` **basılmaz** (yarışmamış birine sahte sıfır sonuç gösterilmez); Sorular kartlarında rozet (`cevapsız`) ve `Senin cevabın` satırı gösterilmez; Sıralama aynen; Kültür köprüsü gösterilir. (As-built izleyiciye `0 puan · 0/5 doğru · sıralama dışı` basar → bu görünüm `[M1+ küçük düzeltme]` olarak ana sayfaya değil ayrı çerçeveye.)
2. **Kültür köprüsü** Card `accent` (yalnızca `relatedContent`’i olan ilk soru varsa): caption accent `Merakın devam etsin` · h3 `related.title` · small inkMuted `related.summary` · Button primary `Kartı aç` (testID `result-related`) → `/content/[id]?from=quiz&sessionId=…` (`quiz_to_content_opened` olayı). Bu kart hero’nun hemen altında, ilk ekranda görünür olmalı (K12 çıktısı). `relatedContent`: soruya bağlı kart, yoksa aynı konudan bir kart (sunucu yedeği).
3. h2 `Sorular` → her soru Card `surface`: Row caption inkMuted `Soru {position}` + Badge (`myOptionId && isCorrect` → success `+{points}` · `myOptionId && !isCorrect` → muted `0 puan` · cevapsız → muted `cevapsız`) · bodyStrong prompt · small `status/success` `Doğru: {correctLabel}` · yanlışsa small `danger` `Senin cevabın: {myLabel}` · small inkMuted explanation · `relatedContent` varsa Button ghost `İlgili kart`. Yanlış cevap rozeti kasıtlı olarak `muted` (kırmızı utandırma yok); koru.
4. h2 `Sıralama` → tek Card, satırlar minHeight 48, `space-between`: sol `{rank}. {username}{isMe ? " (sen)" : ""}` (isMe → bodyStrong), sağ bodyStrong `{totalPoints}`. Eşitler aynı rakamı taşır (1, 1, 3); tie-break rozeti yok. Tam ekran tablo değil, hero altında kompakt liste. **Sunucu en fazla 50 satır + kendi satırın** döner; 51+ katılımcıda listenin altında small inkMuted `İlk 50 gösteriliyor` `[M1+]`. `[M1+]`: 20+ katılımcıda kendi satırını listenin üstüne sabitle; `username` yanına `correctCount` (`3 doğru`).
5. Trailing Spacer 16.

Olmayanlar: paylaş, haftalık toplam, XP, “tekrar oyna”, animasyon.

### 4.11 `cancelled`

Card `muted` (alarm kırmızısı değil): h2 `Oturum iptal edildi` · body inkMuted = öncelik sırasıyla (a) WS `message`, (b) `Sebep: {cancelReasonTr}.`, (c) boş · small **inkMuted** (T1/10; surfaceMuted üstünde 5.60 ✓) `Verdiğin cevaplar denetim için saklanır; bu oturum sıralamaya girmez.` Buton yok; çıkış yalnızca `Geri`.

**İki gövde varyantı — ikisini de çerçevele:** WS `message` yalnızca ekran açıkken gelir; oturum sonradan açılırsa (GET) ayrıntı gelmez → yalnızca `Sebep: {cancelReasonTr}.`

| reason | `cancelReasonTr` | WS message (aynen) | Not |
|---|---|---|---|
| `admin_cancelled` | `yönetici iptal etti` | Admin’in yazdığı 3–300 karakterlik gerekçe | 300 karaktere göre tasarla. |
| `server_restart` | `sunucu yeniden başladı` | `API süreci canlı oturum sırasında yeniden başladı` | Dürüst kal; “teknik bir sorun” muğlaklığı yok. |
| `missed_start` | `başlangıç kaçırıldı` | `Planlanan başlangıç kaçırıldı (API kapalıydı)` | Planlı oturum 60 sn’den fazla kaçtı. |
| `question_approval_withdrawn` | `bir sorunun onayı geri çekildi` | Başlangıçta: `İlk soru açılamadı`; sonraki sorularda: `Soru {N} açılamadı`; lobi öncesi yeniden doğrulamada: `Soru {questionId}` (**UUID**, kullanıcıya uygun değil → `[M1+ küçük düzeltme]`: bu ayrıntıyı gösterme, `Sebep:` yedeğine düş) | |
| `question_revision_changed` | `bir soru değiştirildi` | Lobi öncesi yeniden doğrulamada `Soru {questionId}` (UUID; aynı not) | |

Join → `SESSION_CANCELLED` yolunda gövde `Bu oturum iptal edildi.` olur. Sonuç/sıralama/puan hiçbir yerde gösterilmez; “yarı başarı” görseli yok.

### 4.12 Bağlantı şeridi (`connecting` · `connected` · `reconnecting` · `offline`) — kanonik

Yalnızca iki durumun UI’ı vardır; `connecting`/`connected` sessizdir (yeşil “bağlı” rozeti ekleme). Şerit: View bg `warningSoft #FDEFD8`, radius 12, padding 12, small `warning`, polite duyuru (açılış ve kapanış), içeriğin üstünde (başlık altı).

**Yerleşim kuralı (tek kural; §2.7/4 ve §5.3.15 buraya atıf yapar):** `question` ve `expired` fazlarında başlık satırının üstünde **sabit slot rezerve edilir**: slot yüksekliği = en uzun şerit metninin (`Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.`, 67 karakter) o ölçek ve genişlikteki ölçülen yüksekliği; 390 pt’de tahmini 1.0× ≈ 64 pt (2 satır), 1.6× ≈ 120 pt (3 satır) (small 14/20 metin, 1.6×’te ≈ 22/32, + 24 padding; tasarımda iki ölçekte ölç); boşken görünmez ama yer tutar; slot yüksekliği §1.4/2 prompt bütçesinden düşülür (1.6×’te soru ekranının en pahalı kalemi budur, A-3 raporuna yazılır; `[M1+ öneri]`: soru fazına özel tek satırlık kısa şerit kopyası); şerit bu slotu doldurur, **seçenekler hiç kaymaz**. Diğer fazlarda şerit akışa katılır ve içeriği aşağı iter (200 ms; RM anında).

| connection | Metin | Ne zaman |
|---|---|---|
| `reconnecting` | `Yeniden bağlanılıyor… durum sunucudan yenilenecek.` | socket `disconnect` / `reconnect_attempt` (token tazelenir; `connection_interrupted` olayı) |
| `offline` | `Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.` | `connect_error` |

Davranış: şerit varken soru panosu **değişmez** (son bilinen durum), seçenekler görünür kalır; cevap POST’u REST üzerinden yine denenebilir (3 deneme → `unknown`). Yeniden bağlanınca `session.subscribe` → snapshot: UI sunucu durumuna atlar (başka soru ya da reveal olabilir), kabul edilmiş cevaplar geri gelir, sayaç tam süreye **sıfırlanmaz** (ortak `closesAt`). Bilinen M0 tuhaflığı: başlangıç `connection = 'offline'` olduğu için şerit `loading/error/preview/joining`’de de çizilir; T1/3: şeridi yalnızca socket en az bir kez açıldıktan sonra ve `phase ∈ {scheduled, lobby, question, expired, reveal}` iken göster.

### 4.13 Zamanlama diyagramı — bir soru döngüsü (varsayılan kurallar: 12 sn soru, 6 sn reveal)

```
t = Q1 opensAt (sunucu). Sayaç = closesAt − serverNow(); tik 100 ms.
───────────────────────────────────────────────────────────────────────────────
t−60.0  session.lobby           → “Bekleme salonu” · “İlk soru 1 dk 0 sn sonra açılır. Hazır ol.”
t−0.0   question.opened (v+1)    → faz question. Prompt + 4 seçenek anında; “12 sn”; çubuk %100;
                                   “Bir seçenek seç. İlk kabul edilen cevap geçerlidir.”
                                   SR tek duyuru: “Soru 1/5. {prompt}. 12 saniye.” (§4.15/1)
t+3.4   dokunuş: seçenek 2       → aynı karede live/default dolgu; diğer 3 kilit (.6); “Gönderiliyor…”;
                                   POST /answers {optionId, idempotencyKey}
t+3.6   makbuz (accepted)        → rozet “Cevabın kabul edildi” (nötr; doğruluk/puan YOK; sunucu içeride
                                   round(60+40×(1−3600/12000)) = 88 hesapladı, saklıyor)
t+9.0   kalan 3 sn               → sayaç rengi ink → live/vivid; çubuk %25; SR assertive “3 saniye kaldı”
t+12.0  closesAt (cihaz)         → faz expired: sayaç yerine “Süre doldu” · seçenekler kilitli kalır (T1/4)
t+12.0…12.3 sunucu tik (250 ms)  → open→closed→revealed tek transaction
t+12.3  question.revealed (v+1)  → faz reveal: “Doğru · +88 puan”, doğru seçenek ✓ yeşil, benimki
                                   (yanlışsa) ✗ kırmızı, “Açıklama”, “Sonraki soru 6 sn içinde.”
t+13.5  reveal gelmediyse        → bekçi: state.resync (UI’da gösterge yok)
t+18.0  nextOpensAt → Q2 opened  → faz question (yeni idempotencyKey, taze AnswerState)
t+19.5  Q2 gelmediyse            → bekçi: state.resync
…
Q5 reveal: nextOpensAt = null    → “Son soruydu. Sonuçlar hesaplanıyor…”
Q5 +6.0 session.completed        → faz completed; GET /result → “Sonuç hesaplanıyor…” → ResultPane
Q5 +7.5 completed gelmediyse     → bekçi: state.resync
```

Geç katılan (Q2 açıkken katılan, `eligibleFromPosition = 3`): Q2 ekranı kilitli + `Bu soru sen katılmadan önce açıldı…`; Q2 reveal’de `Cevapsız · 0 puan`; Q3’ten itibaren normal. Yeniden bağlanan (Q3’ün 5. saniyesinde kopup 8. saniyesinde dönen): snapshot → Q3 `question` fazı, sayaç `4 sn` (kalan ortak süre), daha önce kabul edilmiş cevabı varsa rozet hazır.

### 4.14 WS olayları → UI tepkisi

| Olay / mesaj | Yük | UI tepkisi |
|---|---|---|
| `session.subscribe` ack `{ok:true, snapshot}` | SessionSnapshot | `applySnapshot`: faz `session.status`’tan türetilir; `live` ise `currentQuestion.open && closesAt>now` → `question`, `reveal` varsa → `reveal`, aksi `expired`; `myParticipation.answers` yerel cevapları `accepted` olarak ezer. |
| `session.subscribe` ack `{ok:false}` | code, message (ör. `Önce oturuma abone ol.`) | Yerel `subscribe.error` → `state.error` yazılır; **kodda yalnızca `error`/`preview` fazında görünür**. `[M1+]`: diğer fazlarda bağlantı şeridi tonunda satır olarak göster. |
| `session.state` | snapshot | **Sözleşmede tanımlı; M0’da sunucu yayınlamaz, istemci dinlemez.** Snapshot yalnızca subscribe/resync ack’iyle gelir. |
| `session.lobby` | scheduledStartAt, participantCount | faz `lobby`; Waiting kartı sayaç + katılımcı sayısı güncellenir. |
| `question.opened` | OpenQuestionView | faz `question`; önceki reveal temizlenir; yeni `AnswerState` (yeni idempotencyKey); `currentQuestionPosition` güncellenir. 0 ms gecikme. |
| `question.revealed` | RevealView | faz `reveal`; `myAnswer` varsa yerel cevap `accepted`+`optionId`; soru panosu kalkar, reveal panosu gelir (cross-fade ≤200 ms, RM anında). |
| `session.completed` | zarf | faz `completed`; GET /result; `Sonuç hesaplanıyor…` → ResultPane (hata → T1/21). |
| `session.cancelled` | reason, message | faz `cancelled`; `cancelMessage = message`, `cancelledReason = reason`. |
| `state.resync` ack | snapshot | `applySnapshot`; `state_resynced` analitiği. Tetikleyiciler: bekçi (expired >1,5 sn; reveal’de `nextOpensAt` +1,5 sn; son reveal 7,5 sn; lobby/scheduled zamanı +1,5 sn), `Durumu yenile`, `ANSWER_ALREADY_ACCEPTED`. Socket bağlı değilse sessizce döner. |
| `stateVersion ≤ son uygulanan` | — | Olay **düşürülür**; UI değişmez (eski/tekrar olay). |
| socket `disconnect`/`reconnect_attempt` | — | connection `reconnecting` → şerit. |
| socket `connect_error` | — | connection `offline` → şerit. |
| socket `connect` | — | connection `connected`; şerit kalkar; otomatik `session.subscribe`. |

### 4.15 Erişilebilirlik (zamanlı akışa özel)

M0’da mevcut: tüm butonlarda role/label; seçeneklerde `Seçenek N: {label}` + `selected/disabled` state; sayaçta label `{N} saniye kaldı`; ilerleme çubuğunda progressbar + 0–100 değer; durum satırlarında Android live region (iOS’ta duyuru yok — §0.3); `maxFontSizeMultiplier 1.6` (`TextInput` hariç; T1/13); butonlar ≥48, seçenekler ≥56 pt. A-3 açık kararı: 12 sn’nin herkes için uygun olduğu **iddia edilmez**; tasarım raporunda neyin kırıldığını yaz. Uygulama metin ölçeğini 1.6× ile sınırlar; bu WCAG 1.4.4 (%200) altında bilinçli bir M0 sınırlamasıdır ve raporda yazılır.

Tasarla ve kontrol et:

1. **Ekran okuyucu zaman bütçesi ve duyuru stratejisi.** Varsayılan TTS hızı ≈14 karakter/sn:

   | Metin | Süre |
   |---|---|
   | prompt 60 karakter | ≈ 4 sn |
   | prompt 120 karakter | ≈ 9 sn |
   | prompt 400 karakter | ≈ 29 sn |
   | 4 seçenek × 20 karakter | ≈ 6 sn |

   Sonuç: 12 sn’de ekran okuyucuyla cevaplanabilir soru = **prompt ≤ 60 + seçenek ≤ 20 karakter**; bunun üstü A-3 bulgusu olarak raporlanır. Duyuru şablonu (T1’e aday; `[M1+]`): `question.opened` anında tek duyuru `Soru {position}/{total}. {prompt}. {rules.questionDurationMs/1000} saniye.` (12 sabit yazılmaz; demo 8 sn) ve erişilebilirlik odağı prompt’a; her saniye anons **yok**; yalnızca **3 sn** kala assertive (`queue:false`) `3 saniye kaldı` (6 sn duyurusu kaldırıldı — prompt okunurken kuyrukta kalır); sayaç öğesi odaklanınca güncel `N saniye kaldı` okunur. `expired`’da pano kaldırılmaz, odak sayaç satırına taşınır (T1/4). Kabulde `Cevabın kabul edildi` polite; reveal’de `Doğru, artı 88 puan. Doğru cevap: Marie Curie.` tek duyuru; ilerleme çubuğu anons etmez (`accessibilityElementsHidden` `[M1+]`).
2. **Büyük yazı (1.6×)**: bütçe ve taşma kuralı **bkz. §1.4/2** (as-built taşma kırpılır; T1/11 prompt bölgesi kaydırılır; seçenekler, durum satırı ve sayaç sabit). Mockup’ları 1.0×, 1.3× ve 1.6×’te, iki prompt uzunluğunda (80 ve 400 karakter) teslim et; kırılanları A-3 bulgusu olarak listele.
3. **Renk körlüğü ve kontrast**: doğru/yanlış için renk + glif (` ✓`/` ✗`) + kenarlık + metin etiketi birlikte (mevcut). Seçili durum `live/default` dolgu + beyaz metin; `[M1+]` glif ekle. **Kontrast değerleri için tek kaynak §1.3 tablosudur**; bu bölümde rakam tekrar edilmez.
4. **Dokunma**: seçenekler 56 pt, `Katıl`/`Tekrar gönder`/`Kartı aç` 48 pt, geri oku 48×48. Seçenek aralığı 12 (T1/9), 1.3×+ dahil sabit.
5. **Motor/bilişsel**: soru fazında geri tuşu dışında dikkat dağıtıcı yok; sayaç dışında yanıp sönen öğe yok.

### 4.16 Hareket (motion) ve reduced motion

**Kanonik tablo §1.7’dedir; bu bölüm yalnızca yarışma öğelerini özetler (değerler §1.7 ile aynı):** soru açılışı anında · seçenek basma 0 ms · seçili dolgu anında · **alındı rozeti anında (0 ms)** · ilerleme çubuğu 100 ms tik, RM’de saniyede bir adım · sayaç ≤3 sn yalnızca renk (nabız/ölçek yok) · reveal kenarlık/zemin anında, pano cross-fade ≤200 ms, RM anında · sonuç hero puanı anında (sayaç animasyonu yok). Yasak: 3-2-1 perdesi, konfeti, parçacık, soruyu geciktiren “ısınma” ekranı, otomatik oynayan ses.

### 4.17 Türkçe tipografi ve kopya notları (bu akışa özel)

- Caption büyük harf: **bkz. §1.4/1**. Mockup’larda doğru biçim: `EŞİT PUANLAR AYNI SIRAYI PAYLAŞIR`, `MERAKIN DEVAM ETSİN`, `CEVABIN KABUL EDİLDİ`, `GÜNÜN 5’İ` (ekran görüntülerinde `EŞIT PUANLAR`, `MERAKIN DEVAM ETSIN`, `CEVABIN KABUL EDILDI` görünür).
- Kesme işareti her yerde `’` (U+2019): `Günün 5’i`, `Nobel’ini`. `'` kullanma.
- Sayı/tarih `tr-TR`: as-built `15.10.2026 21:00:00`; öneri `15 Ekim 2026, 21:00` (§6.7/7); binlik ayırıcı nokta, ondalık virgül.
- Hitap “sen”; emir kipi kısa: `Katıl`, `Hazır ol.`, `Kartı aç`. “Aferin”, “harikasın”, “maalesef” yok.
- Metin uzunluğu: Türkçe İngilizceden ~%20 uzundur; rozetler (`Doğru · +100 puan`, `Cevabın kabul edildi`) tek satırda kalmalı; 1.6×’ta sarmaya izin ver, kırpma.

### 4.18 Teslim kontrol listesi (işaretlenebilir; P0/P1 etiketleri §5.9/0)

1. 11 faz × 390×844 (P0) + 360×800 (P1), her biri 1.0× (P0) ve 1.6× (P1); soru ekranı ayrıca 1.3×. `scheduled` ve `lobby` için ≤0 (`şimdi`) çerçevesi (P1).
2. `question` fazı × 5 cevap durumu (idle, submitting, accepted, rejected, unknown) (P0) + geç katılım kilidi (P1).
3. `reveal` × 4 sonuç (doğru / yanlış / cevapsız / cevapsız + yerel seçim) × (`nextOpensAt` var/yok) (P0: ilk üç).
4. `completed` × (katılımcı / izleyici) × (sonuç yüklendi / yüklenemedi) × (ilgili kart var/yok) × (sıralama 2 / 25 / 50+kendi).
5. `cancelled` × 5 sebep × (WS message var / yalnızca `Sebep:`) + admin serbest metni (300 karakter) (P0: admin_cancelled).
6. Bağlantı şeridi × (`reconnecting`, `offline`) her canlı fazın üstünde; soru/expired’da rezerve slot (P1).
7. Katılım hataları: 11 olası metin, tek satır; **3 zorunlu çerçeve** (PARTICIPATION_EXISTS, NETWORK, INTERNAL/socket açılamadı) (P1); diğerleri §4.4 tablosunda not olarak.
8. `stateVersion` rozeti mockup’larda yok; `Ödülsüz test oturumu` caption’ı her fazda var.
9. Hiçbir ekranda: XP, ödül, sponsor, sahte sayaç, A/B/C/D harfleri, “adil/anti-hile” iddiası, “elendin”, potansiyel puan ipucu.
10. Tüm metinler yukarıdaki tablolardan verbatim; yeni metinler `[M1+]` etiketiyle ayrı listede.

### 4.19 `[M1+]` — ayrı tutulacak fikirler (M0’da uygulanmadı)

- **Isınma (lobi sonu)**: `scheduledStartAt − 5 sn`’den itibaren Waiting kartında büyük sayaç (`5 · 4 · 3 · 2 · 1`); `opensAt`’te soru hiçbir perde olmadan anında gelir; reduced motion’da yalnızca rakam değişir. Soru ekranını **asla** geciktirmez.
- **Ses ve haptik**: tek kanonik tablo **§1.8** (kabul = `selection`, doğruluk ima etmez; reveal = yok; 3 sn kala yok; varsayılan kapalı).
- **Geçmiş karşılaştırması**: `GET /quiz/history` ile “son 5 oturum ortalaman” (puan, XP değil).
- **Geliştirici paneli**: `stateVersion`, `connection`, `lastSyncedAt`, RTT — uzun basışla açılan gizli alan; üretimde kapalı.
- **Sosyal paylaşım kartı**: §6.9 gereği tasarlanmaz; yalnızca ayrı “M1/M2 önerisi — uygulanmadı” sayfasında, ana akışa bağlanmadan; `isTest` olduğu sürece “ödülsüz test” ibaresi karttan silinemez.
- **Küçük düzeltmeler**: T1 kapalı listesi §0.1’dedir; burada tekrar edilmez.


---

## 5. Bileşen kütüphanesi, tasarım sistemi teslimatları ve platform uyarlamaları

Bu bölüm, Claude Design’ın üreteceği tasarım sisteminin tam envanteridir. Çıkış noktası uygulamada **zaten var olan** token ve bileşenlerdir (`apps/mobile/src/theme/tokens.ts`, `apps/mobile/src/components/primitives.tsx`, `ContentCard.tsx`, `features/quiz/QuizSessionCard.tsx`, `app/quiz/[id].tsx`). Var olanı yeniden adlandırma; eksik olanı ekle; T1 kapalı listesi (§0.1) dışında M0 kodunun ötesine geçen her şeyi **`[M1+]`** olarak işaretle. Bölüm boyunca geçerli sabitler: ödülsüz test etiketi her yarışma yüzeyinde kalır; sahte sayaç/kazanan/sponsor/ödül yok; yarışma puanı (live tonu) ile öğrenme XP’si (accent tonu) aynı bileşende birleştirilmez; canlı yarışma enerjik, kültür akışı sakin; hiçbir animasyon içeriği veya cevap geri bildirimini geciktirmez; lisansı belirsiz görsel kullanılmaz.

### 5.1 Token tablosu (mevcut `tokens.ts` → tasarım token adı)

Tasarım dosyasındaki token adları `tokens.ts` alanlarıyla birebir eşleşir; ek bir “marka” katmanı açma (A-1: Merak çalışma adıdır, nihai marka kilitlenmez). **Değer önerileri (T1) ve dark değerler yalnızca §1.3’tedir; bu tablo light as-built değerini ve kullanım kuralını verir, değer için §1.3’e bakılır.** Dark sütunu M0’da uygulanmamıştır (`app.json` → `userInterfaceStyle: "light"`).

| Tasarım token | `tokens.ts` alanı | Light (as-built) | T1 / Dark | Kullanım kuralı |
|---|---|---|---|---|
| color/bg | `colors.bg` | #F6F3EE | bkz. §1.3 | Ekran zemini (“sıcak kâğıt”). Saf siyah/beyaz zemin kullanma. |
| color/surface | `colors.surface` | #FFFFFF | bkz. §1.3 | Kart, giriş alanı, tab bar, seçenek butonu. |
| color/surfaceMuted | `colors.surfaceMuted` | #EFEAE2 | bkz. §1.3 | Muted kart, secondary buton, chip (pasif), muted/neutral badge. |
| color/ink | `colors.ink` | #17161A | bkz. §1.3 | Birincil metin. |
| color/inkMuted | `colors.inkMuted` | #5E5A66 | bkz. §1.3 | İkincil metin (özet, alt satır, tonlu kartlardaki tüm ikincil metin). |
| color/inkFaint → text/tertiary | `colors.inkFaint` | #9A96A3 | **T1 → §1.3** | Üçüncül metin; yalnızca bg/surface üzerinde; `{n} dk okuma`, placeholder. |
| color/line | `colors.line` | #E2DDD4 | bkz. §1.3 | Ayraç, progress track, dekoratif kart ayrımı. Etkileşimli sınır **değil** (→ border/input). |
| border/input (yeni) | — | — | **T1 → §1.3** | Giriş alanı 1 pt, seçenek nötr 2 pt, pasif chip 1 pt. |
| color/accent | `colors.accent` | #1F5F5B | bkz. §1.3 | Kültür/öğrenme: primary buton, aktif tab, topic caption, XP, ghost buton metni, link. |
| color/accentSoft | `colors.accentSoft` | #DCEBE8 | bkz. §1.3 | Accent kart (`Açıklama`, `Neden öneriyoruz`, `Merakın devam etsin`), accent badge zemini. |
| color/live → live/default | `colors.live` | #D9480F | **T1 → §1.3** (#B5380A) | Canlı yarışma: live buton, seçili seçenek, quiz başlık tint, live caption/rozet metni. |
| live/vivid (yeni ad) | `colors.live` | #D9480F | bkz. §1.3 | Yalnızca progress dolgusu ve ≥20 pt w700 sayaç. |
| color/liveSoft | `colors.liveSoft` | #FDE4D8 | bkz. §1.3 | Live kart (session card aktifken, bekleme kartı, sonuç hero), live badge zemini. |
| color/success → status/success | `colors.success` | #2B7A3D | **T1 → §1.3** (#256B36) | Yalnızca reveal ve sonuç ekranında “doğru”; listede `Tamamlandı` badge’i. |
| color/successSoft | `colors.successSoft` | #DDF1E1 | bkz. §1.3 | Doğru seçenek zemini, success badge zemini. |
| color/danger | `colors.danger` | #B42318 | bkz. §1.3 | Reddedilen cevap metni, yanlış seçenek, `Çıkış yap` metni, form hatası. |
| color/dangerSoft | `colors.dangerSoft` | #FBE3E0 | bkz. §1.3 | Yanlış seçenek zemini, danger buton zemini, danger badge. |
| color/warning | `colors.warning` | #A15C00 | bkz. §1.3 | Bağlantı şeridi metni, geç katılım uyarısı, `unknown` cevap durumu, `Örnek test içeriği` badge metni. |
| color/warningSoft | `colors.warningSoft` | #FDEFD8 | bkz. §1.3 | Şerit zemini, warning badge zemini. |
| color/overlay | `colors.overlay` | rgba(23,22,26,.55) | bkz. §1.3 | Tanımlı, M0’da kullanılmıyor. Yalnızca `[M1+]` modal/sheet için. |
| space/xs…xxxl | `space.xs/sm/md/lg/xl/xxl/xxxl` | 4 / 8 / 12 / 16 / 24 / 32 / 48 | aynı | 4’lük grid dışında değer kullanma. Ekran yan boşluğu 16, kart iç boşluğu 16, kart içi dikey aralık 8, bölüm aralığı 16; seçenekler arası 12 (T1). |
| radius/sm…pill | `radius.sm/md/lg/xl/pill` | 8 / 12 / 16 / 24 / 999 | aynı | Badge 8, input ve şerit 12, kart ve seçenek 16, buton ve chip pill. 24 M0’da kullanılmıyor. |
| touch/min | `touch.min` | 48 | aynı | Her dokunulabilir öğenin en küçük boyutu. |
| motion/fast, motion/base | `motion.fast/base` | 120 ms / 200 ms | aynı | M0’da hiçbir animasyon yok. Önerilen hareketler §1.7 tablosundadır; reduced motion’da anında. |
| shadow/card | `shadow.card` | #17161A, opacity .06, blur 12, y 4; Android elevation 2 | dark: gölge yok + 1 pt border/subtle (§1.3) | Yalnızca surface kartlarda. Zemin kartlarında (muted/accent/live) gölge + ton birlikte var. |

Tipografi token’ları (sistem fontu; özel font yüklenmez — `expo-font` eklentisi var ama font yok; iOS SF Pro, Android Roboto, web sistem yığını):

| Token | `type.*` | Boyut/satır | Ağırlık | Ek | Nerede |
|---|---|---|---|---|---|
| type/display | `display` | 32/38 | 800 (Android 700, T1/22) | ls −0.5 | `Merak` (giriş), `97 puan` (sonuç hero). |
| type/h1 | `h1` | 26/32 | 800 (Android 700) | ls −0.3 | Sekme başlıkları, soru metni, içerik başlığı, bekleme kartı başlığı. |
| type/h2 | `h2` | 20/26 | 700 | — | Bölüm başlıkları (`Keşif kartları`, `Sorular`, `Sıralama`), sayaç, stat değeri, session başlığı. |
| type/h3 | `h3` | 17/22 | 700 | — | Kart başlıkları, StateView başlığı, günlük görev başlığı. |
| type/body | `body` | 16/24 | 400 | — | Gövde metni, açıklama, oturum kartı gövde satırı. |
| type/bodyStrong | `bodyStrong` | 16/24 | 600 | — | Buton etiketi, seçenek metni, leaderboard `(sen)` satırı, soru özeti. |
| type/small | `small` | 14/20 | 400 | — | Özet, alt bilgi, hata/durum satırları, chip etiketi, Yarış kurallar kartı maddeleri (as-built `small`; koru, §5.3.24). |
| type/caption | `caption` | 12/16 | 600 | ls +0.4, UPPERCASE (`textTransform: 'uppercase'`, `locale: 'tr-TR'` T1/6) | Etiketler, badge metni, `SORU 1/5`. Türkçe büyük harf kuralı §1.4/1. |
| type/mono | `mono` | 14/20 | — | monospace | Tanımlı, kullanılmıyor; yalnızca admin `İşlem`/`Detay` sütunu için. |

### 5.2 Türkçe tipografi, font ölçekleme ve yoğunluk kuralları

1. **Büyük harf dönüşümü:** bkz. §1.4/1 (UPPERCASE korunur; locale-duyarlı dönüşüm T1/6; iki varyant karşılaştırma sayfasında). Tasarım dosyasında bütün caption örnekleri doğru yazılır: `GÜNÜN 5’İ · ÖDÜLSÜZ TEST`, `ÖRNEK TEST İÇERİĞİ`; h2 başlıklar dönüşümsüz (`Keşif kartları`).
2. Apostrof `’` (U+2019) ve tırnak `“ ”` (U+201C/U+201D) kullan; düz tırnak kullanma. `Günün 5’i`, `Kaplumbağa Terbiyecisi’nin hikâyesi` örnek yazımlardır.
3. Türkçe metin İngilizce’den ~%20–30 uzundur; her bileşeni **en uzun gerçek kopya** ile test et: buton `Bekleme salonu açık` (badge), hata satırı `Bu soru açıldıktan sonra katıldığın için cevaplayamazsın. Bir sonraki sorudan devam et.` (iki satır, sarmalı).
4. **Font ölçekleme:** tüm metin ve girişler 1.6× tavanlıdır (`T` ve T1/13 ile `TextInput`). Her ekranı 1.0× ve 1.6×’te çerçevele; 1.3× yalnızca soru ekranı için. 1.6×’te body 25,6 pt, h1 41,6 pt olur. Kurallar:
   - Metin hiçbir yerde kırpılmaz (ellipsis yok); yalnızca `ContentCard` özeti `numberOfLines={3}` ile sınırlıdır (mevcut davranış, koru).
   - Soru metni ve dört seçenek **asla** kırpılmaz; bütçe ve taşma kuralı **bkz. §1.4/2** (burada ayrı bir kademe tanımlanmaz). A-3 gereği “12 saniyede büyük yazıyla eşit erişim” iddiası yazma; bu sınırlamayı handoff notuna yaz.
   - Buton etiketi 1.6×’te iki satıra sarar; buton `minHeight: 48` korunur, yükseklik büyür, pill radius korunur.
   - Satır içi badge’ler 1.6×’te caption 19 pt olur; badge tek satır kalır, satır sararsa `Row` `flexWrap` ile alta iner (mevcut `Row` sarmalıdır).
   - Tab bar etiketi 1.3× tavanlı (T1/13, §2.3).
5. **Yoğunluk:** tek yoğunluk; “compact” modu yok. Kart içi dikey aralık 8, kartlar arası 16, bölüm başlığı üstünde ek 8 (toplam 24). Liste öğeleri arasında ayraç çizgisi değil 16 pt boşluk.
6. **Metin yığını yasağı (brief §9):** body paragrafları 16/24, paragraf arası 16; içerik gövdesi 6000 karaktere kadar olabilir — ara başlık token’ı yok; tasarımcı paragraf aralığıyla ritim kurar, dekoratif ilk harf/alıntı bloğu önermez.

### 5.3 Bileşen envanteri

Her bileşen için: varyantlar, durumlar (default / pressed / disabled / focus / selected / loading), ölçüler, token’lar, erişilebilirlik rolü. Durum isimleri koddaki prop adlarıyla aynıdır.

**5.3.1 T (Text)** — `primitives.tsx › T`. Varyant `v` (§5.1 tablosu), `color` (varsayılan ink). A11y: RN Text; display/h1/h2/h3 varsayılan `header` rolü (T1/14); `accessibilityLiveRegion` ve `numberOfLines` prop olarak geçer. Tasarım sayfasında 9 varyant × light/dark × 1.0/1.6× göster.

**5.3.2 Screen** — SafeAreaView kenarları top/left/right (alt kenar tab bar veya stack tarafından karşılanır), zemin `bg`, yatay boşluk 16, üst boşluk 12, çocuklar arası 16, alt boşluk 32. `scroll=false` yalnızca soru fazında. Sekme ekranlarında başlık çubuğu yok; h1 doğrudan durum çubuğunun altında başlar.

**5.3.3 Card** — tonlar: `surface` · `muted` · `accent` · `live` (hex §1.3). Radius 16, padding 16, iç gap 8, `shadow.card`. Etkileşimsiz (basılabilir kartlar ayrı bileşendir: ContentCard). Ton kullanım kuralı: surface = nötr içerik; muted = kurallar, kaynak, süre doldu, iptal; accent = öğrenmeye yönlendiren blok (açıklama, neden öneriyoruz, ilgili kart); live = yarışma anı (aktif oturum kartı, bekleme, sonuç hero). Bir ekranda live ve accent kartlar alt alta gelebilir (sonuç ekranı), aynı kart içinde iki ton olamaz. Tonlu kartlarda ikincil metin daima `inkMuted` (§1.3 tertiary kuralı).

**5.3.4 Button** — tonlar ve değerler:

| Ton | Zemin | Metin | Kullanım |
|---|---|---|---|
| primary | accent | `text/onAccent` #FFF | Öğrenme/kültür CTA’ları: `Giriş yap`, `Kaydol`, `Tamamladım`, `Kartı aç`, `Kaydet` (profil); oturum kartında `Katıl` (scheduled), `Bekleme salonu` (scheduled + katılmış), `Sonucu gör`, `Detay`. |
| secondary | surfaceMuted | `text/onSecondary` ink | `Kaydet`/`Kaydedildi ✓` (içerik), `Profili düzenle`, `Tekrar dene`, `Tekrar gönder`. |
| live | `live/default` | `text/onLive` #FFF (5.94) | Yalnızca canlı yarışma: `Katıl` (preview; oturum kartında lobby/live + katılmamış), `Oturuma dön`. |
| ghost | şeffaf | `text/ghost` accent | `Hesap oluştur`, `Zaten hesabım var`, `Kaynağı aç`, `Vazgeç`, `Durumu yenile`, `Sonucu gör` (Profil geçmişi), `İlgili kart`, `Yarış sekmesine dön` (T1/12). |
| danger | dangerSoft | `text/onDanger` danger | Yalnızca `Çıkış yap`. |

Ölçüler: minHeight 48, yatay padding 24, pill, metin bodyStrong, ortalanmış, tam genişlik (kart içinde) veya `Row` içinde içerik genişliği. Durumlar: default · pressed (opacity .85, 0 ms) · disabled (opacity .5, `accessibilityState.disabled`) · loading (etiket yerine ActivityIndicator aynı renkte, buton devre dışı, `accessibilityState.busy`) · focus (`focus/ring` §1.3; T1/19). İkon desteği yok; ikonlu buton tasarlama. A11y: `accessibilityRole="button"`, label = title.

**5.3.5 Badge** — tonlar: muted (surfaceMuted/inkMuted) · **neutral** (= `status/neutral`, surfaceMuted/inkMuted, glifsiz; alındı rozeti) · accent (accentSoft/accent) · live (liveSoft/`live/default`) · success (successSoft/`status/success`) · danger (dangerSoft/danger) · warning (warningSoft/warning; 12 pt w600 4.58 ✓). Padding 8×4, radius 8, caption metni, içerik genişliği. Etkileşimsiz, rol yok (metin olarak okunur). Mevcut etiket seti: `Tamamlandı` (success), `Kayıtlı` (accent), `Taslak/Planlandı/Bekleme salonu açık/Canlı/Tamamlandı/İptal edildi` (accent/live/muted), `Örnek test içeriği` (warning), `Cevabın kabul edildi` (neutral, T1/1), `Doğru · +97 puan` (success), `Yanlış · 0 puan` (danger), `Cevapsız · 0 puan` (muted), `+97` / `0 puan` / `cevapsız` (sonuç kartları), `v13` (stateVersion — bkz. §5.3.26).

**5.3.6 Chip** — `discover.tsx › Chip`. Pasif: surfaceMuted zemin + 1 pt `border/input`, ink small metin; aktif: accent zemin, #FFF metin. Ölçü kuralı **bkz. §1.5/4** (minHeight 48, paddingH 16, hitSlop yok; as-built 40/12). Durumlar: default · pressed (opacity .85) · selected (`accessibilityState.selected`) · focus. Satır sarmalı (`flexWrap`), gap 8; yatay kaydırma yok. Seçili chip `Tümü` varsayılandır. A11y rolü button.

**5.3.7 Row / Spacer** — Row: yatay, dikey ortalı, sarmalı, gap 8 (varsayılan) / 4 (badge grubu) / 16 (stat grubu). Spacer: 16 varsayılan, 48 (giriş ekranı üstü).

**5.3.8 ProgressBar** — yükseklik 8, pill, track `progress/track`, dolgu accent (günlük görev) veya `live/vivid` (kalan süre). A11y: `progressbar`, label (`Günlük görev ilerlemesi`, `Kalan süre`), değer 0–100. Timer varyantı soldan sağa boşalır (value = kalan/süre); ≤3 sn’de çubuk rengi değişmez (renk değişimi sayaç rakamındadır). Hareket ve reduced motion kuralı **bkz. §1.7** (100 ms tik; RM saniyede bir adım).

**5.3.9 StateView** — ortalanmış, padding 24, gap 8, minHeight 160, polite duyuru. Türler ve sabit kopya: loading → spinner (accent) + h3 `Yükleniyor…`; empty → `Henüz bir şey yok` / `Burası yakında dolacak.`; error → `Bir sorun oldu` / `Tekrar denemek ister misin?` + secondary `Tekrar dene`; offline → `Bağlantı yok` / `İnternete bağlanınca kaldığın yerden devam edebilirsin.` + `Tekrar dene`. Ekrana özel mesajlar (koddan): `Yayınlanmış kart yok.`, `Bu konuda yayınlanmış kart yok.`, `Henüz bir oturuma katılmadın.`, `Kaydettiğin içerik yok.`, `Katılınıyor…`, `Sonuç hesaplanıyor…`, API hata metinleri (örn. `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.`). Kural: veri zaten ekrandaysa yeniden yüklemede StateView gösterilmez; liste yerinde kalır. Skeleton yok (`[M1+]`: skeleton yalnızca ContentCard listesi için, maks. 3 kart, 200 ms’den kısa yüklemede hiç gösterme).

**5.3.10 TextInput** — body metin, ink, 1 pt `border/input` kenarlık (as-built `line`), radius 12, padding 12, surface zemin, minHeight 48, placeholder `text/placeholder`. Üstünde caption inkMuted etiket (`E-posta`, `Şifre`, `Şifre (en az 8 karakter)`); profil formunda etiket yok, yalnızca placeholder (`Görünen ad`, `İlgi alanları (virgülle: sanat, tarih)`) — tasarımcı etiket ekler `[M1+]`. Durumlar: default · focus (kenarlık accent 2 pt) · **error `[M1+]`** (kenarlık danger; altında alan altı small danger metin) — **as-built: form altı tek satır, kenarlık değişmez** · disabled (opacity .5) · secure (şifre; göster/gizle yok, `[M1+]`). A11y: `accessibilityLabel` zorunlu. Mühendislik notu (T1/13): `TextInput`’a `maxFontSizeMultiplier={1.6}` eklenir (iOS’ta aksi halde 3×’e büyür); 1.6×’te input yüksekliği 48 → ≈64 (25,6 pt metin + 24 padding).

**5.3.11 ContentCard** — `ContentCard.tsx`. Basılabilir surface kart, radius 16, padding 16, gap 4, gölge; pressed opacity .9. Yapı: üst satır (caption accent alt başlık + sağda badge grubu gap 4) → h3 başlık → small inkMuted özet (3 satır) → caption `text/tertiary` `N dk okuma` (yalnızca kart; T1/10). Varyantlar: `card` (alt başlık = konu adı, örn. `Sanat ve Mimari`) · `radar_pick` (alt başlık = `Kitap · Oğuz Atay · 1972`; okuma süresi satırı yok). Badge kombinasyonları: yok / Tamamlandı / Kayıtlı / ikisi. Görsel, kapak, poster yok (lisans kararı); kapak alanı tasarlama. A11y: rol button, label `"${başlık}. ${altBaşlık}"`, testID `content-card-${slug}`. Dark’ta sınır `border/input` (etkileşimli kart).

**5.3.12 QuizSessionCard** — `QuizSessionCard.tsx`. Null durum: muted kart, caption inkMuted `Günün 5’i`, h3 `Planlanmış test oturumu yok`, small `Yönetim panelinden ödülsüz bir test oturumu planlandığında burada görünür.`, buton yok. Oturum durumu: kart tonu lobby/live’da `live`, diğerlerinde `surface`; caption live `Günün 5’i · ödülsüz test` (silinemez) + durum badge’i; h2 başlık; durum satırı (body inkMuted): scheduled `Başlangıç: 1 dk 13 sn sonra · 5 soru · 12 sn/soru` (değerler `session.rules`’tan), lobby `46 sn sonra başlıyor · 2 katılımcı`, live `Şu an canlı · 3/5. soru`, completed `Sonuçlar hazır.`, cancelled `İptal edildi (yönetici iptal etti).`; CTA matrisi §2.7. Kök `accessible`, label §3.3. **Tasarla: 5 kullanıcı durumu × katıldı/katılmadı + boş = 11 çerçeve** (Taslak kullanıcıya hiç gelmez) + ≤0 varyantı. Geri sayım 1 sn’de bir tiker; sayı değişiminde animasyon yok; `tabular-nums`.

**5.3.13 OptionButton (seçenek butonu)** — `quiz/[id].tsx › styles.option`. Tam genişlik, minHeight 56, radius 16, yatay padding 16, dikey ortalı, bodyStrong metin, 2 pt kenarlık, seçenekler arası 12 (T1/9). Harf (A/B/C/D) yok — sıra kullanıcıya özeldir. **Görsel durum tablosu kanonik olarak §4.7’dedir**; özet:

| Durum | Zemin | Kenarlık | Metin | A11y |
|---|---|---|---|---|
| idle | surface | `border/input` | ink | button, label `Seçenek 1: Niels Bohr` |
| pressed | surface | `border/input` | ink (.85) | — |
| picked (submitting/accepted/unknown) | `live/default` #B5380A | `live/default` | #FFF (5.94) | `selected: true` + hint `Cevabın gönderildi; değiştirilemez` (T1/15; `disabled` **değil**) |
| locked, picked değil | surface | `border/input` | ink (.6) | `disabled: true` |
| late-join locked (eligible değil) | surface | `border/input` | ink (.6) | `disabled: true`; üstte warning satırı |
| rejected sonrası | idle’a döner (tekrar seçilebilir) | | | |
| reveal · correct | successSoft | `status/success` | `status/success` + ` ✓` | `accessible`, label `…, doğru cevap`; glif SR’den gizli |
| reveal · mine-wrong | dangerSoft | danger | danger + ` ✗` | label `…, senin cevabın` |
| reveal · mine-correct | = correct | | | label `…, doğru cevap, senin cevabın` |
| reveal · other | surface | `border/input` | ink | — |
| reveal · local-only pick (teslim bilinmiyor) | surface (nötr; ✗ **yok**) | `border/input` | ink | — ; üst satırda warning notu (§4.9/1) |

Focus halkası T1/19. Dokunma → anında picked görünümü (optimistic highlight) + `Gönderiliyor…`; alındı rozeti sunucu yanıtından önce gösterilmez. Hiçbir durumda doğruluk ipucu reveal’dan önce verilmez (sızıntı sınırı).

**5.3.14 AnswerStatus (satır içi cevap geri bildirimi)** — seçeneklerin altında, tek bileşen, beş durum: idle → small **inkMuted** `Bir seçenek seç. İlk kabul edilen cevap geçerlidir.`; submitting → small inkMuted `Gönderiliyor…` (polite); accepted → Badge **neutral** `Cevabın kabul edildi` (bkz. §1.3 `status/neutral`; glif yok; T1/1 — as-built `success` tonu “doğru” diye okunabilir); rejected → small danger sunucu mesajı (assertive), seçenekler yeniden seçilebilir; unknown → Row: small warning `Cevabın iletilemedi; bağlantı gelince aynı cevapla tekrar denenir.` + secondary `Tekrar gönder`. Beş durumun dördü aynı yüksekliği (≥ 24 pt) korur; unknown iki satıra çıkar — seçenek listesi yukarı kaymaz, boşluk alttan alınır.

**5.3.15 Banner (bağlantı)** — `styles.banner`: warningSoft zemin, radius 12, padding 12, small warning metin, polite duyuru. Kopya: offline `Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.` · reconnecting `Yeniden bağlanılıyor… durum sunucudan yenilenecek.` Kapatma düğmesi yok; sunucu durumu düzelince kaybolur. **Yerleşim kuralı bkz. §4.12** (soru/expired fazlarında ölçüme dayalı rezerve slot; diğer fazlarda akışta). Bilinen tuhaflık: ilk bağlantı durumu `offline` → T1/3.

**5.3.16 Countdown / Timer** — iki biçim. (a) Metin geri sayımı `formatCountdown`: `şimdi` / `2 sa 5 dk` / `1 dk 13 sn` / `46 sn`; body veya small, inkMuted, 1 sn tik. (b) Soru sayacı: h2, sağa yaslı, `"${sn} sn"`, ink; ≤3 sn’de `live/vivid`; a11y label `N saniye kaldı` (duyuru yalnızca **3 sn** kala assertive — §4.15/1 ile aynı); `testID quiz-timer`; min genişlik 64 pt, `tabular-nums`. Sayı değişiminde yanıp sönme, ölçek, sallanma yok. Cihaz saati değil sunucu saati (`serverNow`) kaynaktır; tasarım notu olarak yaz.

**5.3.17 Stat tile** — `profile.tsx › Stat`: h2 değer üstte, caption inkMuted etiket altta, yatay Row gap 16. Etiketler: `Öğrenme XP`, `Tamamlanan`, `Kayıtlı`; progress yokken son ikisi `–`. Yarışma puanı bu satıra girmez (puan ≠ XP). Tasarla: 3 tile tek satırda; 1.6×’te ikinci satıra sarar.

**5.3.18 Leaderboard row** — Card içinde satır: minHeight 48, space-between; sol `"${rank}. ${username}${isMe ? ' (sen)' : ''}"` (isMe → bodyStrong, değilse body), sağ bodyStrong toplam puan. Eşit puanlar aynı sırayı taşır (1, 1, 3) — ek “beraberlik” rozeti yok. Satırlar arası ayraç yok; isMe satırı için ton değişimi yok (kalınlık yeterli; `[M1+]`: liveSoft hafif zemin — yarışma bağlamı). Sunucu ≤50 satır + kendi satır (§4.10/4). Tam ekran tablo yasaktır (brief §9); kart içinde liste, sonuç hero’nun altında.

**5.3.19 Toast / inline feedback** — M0’da yüzen snackbar yok; içerik detayında `content-toast` satır içi small accent metin, polite, kapanmaz, bir sonrakiyle değişir. Kopya: `+10 XP · toplam 30 · Günlük görev tamamlandı.` (T1/18), `Bu kartı daha önce tamamlamıştın; XP bir kez verilir.`, hata metinleri (danger `[M1+ küçük düzeltme]`). Tasarla: satır içi varyant (mevcut) + `[M1+]` alt kenardan 48 pt yukarıda, surface zemin, 1 pt line, radius 12, 4 sn sonra kapanan, reduced motion’da fade’siz snackbar. Yüzen bileşen soru fazında **asla** seçeneklerin üstüne gelmez.

**5.3.20 Waiting card** — live ton, `quiz-waiting`: h1 `Katıldın` / `Bekleme salonu` · body inkMuted alt satır (`Bekleme salonu 46 sn sonra açılır.` / `İlk soru 12 sn sonra açılır. Hazır ol.`) · small inkMuted `2 katılımcı bekliyor. Sorular herkese aynı anda, sunucu saatine göre açılır.` Katılımcı sayısı gerçek `participantCount`’tur; avatar, isim listesi, sohbet, “hazırım” düğmesi, ses yok. ≤0 varyantı §4.6.

**5.3.21 Explanation card / Why card / Related card** — üçü de `Card tone="accent"`: caption accent başlık (`Açıklama` / `Neden öneriyoruz` / `Merakın devam etsin`) + body (veya h3 + small + primary `Kartı aç`). Reveal’da açıklama 1000 karaktere kadar; 6 sn reveal süresinde kaydırılabilir kalır, reveal otomatik geçişte kesilir — kullanıcı sonuç ekranında aynı açıklamayı yeniden görür.

**5.3.22 Source block** — `Card tone="muted"`: caption `Kaynak` · small başlık (`Belirtilmemiş` yedeği) · ghost `Kaynağı aç` (yalnızca url varsa) · doğrulama satırı `Editör tarafından kontrol edildi · TR · sürüm 1` veya `Kaynak henüz editör tarafından doğrulanmadı · TR · sürüm 1`. **Görsel kural bkz. §3.5/7** (doğrulandı: caption ink + ✓; doğrulanmadı: caption inkMuted, glif yok, warning/danger yok).

**5.3.23 Daily task card** — surface: üst satır caption `Günlük görev` + sağda caption accent `30 XP` · h3 `Bugün 3 farklı içerik tamamla` (sunucu metni) · ProgressBar accent · small `1/3 içerik · Europe/Istanbul gününe göre` veya `Bugünkü görev tamam.` Ödül sandığı, alev, seri sayacı yok.

**5.3.24 Rules card** — Yarış sekmesi, muted: caption `Kurallar (M0 deneme ayarı)` + 4 madde (small inkMuted, `• ` önekli; as-built `small`, koru). Bilinen tuhaflık: `12 saniye` sabit yazılıdır; `session.rules`’tan türetilen varyant `[M1+]` (§3.8).

**5.3.25 Result hero** — live kart: caption live `Oturum tamamlandı` · display `97 puan` · body inkMuted `1/5 doğru · 1. sıra / 2 katılımcı` (rank null → `sıralama dışı`) · caption **inkMuted** `Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.` (T1/10). İzleyici varyantı §4.10/1 (surface kart, puan basılmaz). Konfeti, kupa, paylaş, “tekrar oyna” yok.

**5.3.26 Header satırı (quiz)** — caption live `Ödülsüz test oturumu` + sağda muted badge `v13` (stateVersion). Badge son kullanıcı için debug bilgisidir; tasarımda gösterme (T1/2, yalnızca `__DEV__`).

**5.3.27 Tab bar** — surface zemin, üst 1 pt line, yükseklik 64 + alt güvenli alan, paddingTop 6 / paddingBottom 8, ikon 24, etiket 12/600 (1.3× tavan); aktif accent, pasif `tab/inactive` (= `text/tertiary`, T1). Rozet, nokta, sayaç yok. Sıra ve ikonlar: Ana Sayfa (home-outline→home) · Keşfet (compass-outline→compass) · Yarış (flash-outline→flash) · Kültür (library-outline→library) · Profil (person-outline→person). Yarış sekmesi aktifken de accent kalır (tab bar’da live tonu kullanma).

**5.3.28 Stack header** — bg zemin, gölge yok, geri oku + `Geri`; içerik detayı: başlık boş, tint accent; quiz: başlık `Günün 5’i · Test`, tint `live/default`. Başlık h3 ağırlığında sistem başlığıdır; özel başlık bileşeni tasarlama.

### 5.4 İkon seti

1. M0 ikon kaynağı `@expo/vector-icons › Ionicons`; yalnızca tab bar’da 5 çift kullanılır. Tasarım dosyasında Ionicons’u 24 pt, 1,5–2 pt çizgiyle, outline/filled çiftleriyle göster; başka ikon ailesiyle karıştırma.
2. İzinli ek ikonlar (hepsi Ionicons, hepsi `[M1+]`, her biri yalnızca listelenen yerde): `arrow-back` (stack geri), `checkmark` (`Tamamlandı ✓`, `Kaydedildi ✓` — şu an metin karakteri `✓`; **alındı rozetinde kullanılmaz**), `close` (yanlış seçenek `✗`), `cloud-offline-outline` (offline şerit), `sync-outline` (reconnecting), `time-outline` (süre doldu), `open-outline` (Kaynağı aç), `bookmark-outline/bookmark` (Kaydet), `eye-off/eye` (şifre göster).
3. Yasak ikonlar: kupa, madalya, taç, para/coin, hediye, alev/seri, sponsor logosu, yıldız puanı, roket, konfeti. Yarışma enerjisi renk ve tipografiyle verilir, ödül imgesiyle değil.
4. İkonlar tek renk, `currentColor`; ikon tek başına anlam taşıyorsa `accessibilityLabel` zorunlu; dekoratifse `accessibilityElementsHidden`.
5. Uygulama ikonu / splash: `app.json` splash yalnızca #F6F3EE zemindir, görsel yok. Tasarımcı `[M1+]` olarak soyut, harf veya kelime içermeyen, iki renkli (accent + bg) bir uygulama ikonu önerebilir; “Merak” kelimesini ikona gömme (A-1).

### 5.5 Boş durum illüstrasyon yaklaşımı

1. M0’da illüstrasyon yoktur; boş durumlar metin + isteğe bağlı buton ile çözülür (§5.3.9). Teslimatta bu “metin-önce” varyant zorunludur.
2. `[M1+]` illüstrasyon eklenirse: yalnızca özgün, vektör, tek çizgi ağırlığında (1,5 pt), 64×64 pt, iki ton (line + accent veya line + live), insan figürü/maskot/karikatür yok, yüz yok, kültürel eser tasviri yok (lisans ve temsil riski). Stok görsel, AI üretimi fotoğraf, kitap kapağı, film karesi, tablo reprodüksiyonu kullanılmaz.
3. Boş durum metni sahte sosyal kanıt içeremez (“binlerce kişi…”); mevcut kopya korunur.

### 5.6 iOS / Android uyarlamaları

| Konu | iOS | Android | Tasarım talimatı |
|---|---|---|---|
| Güvenli alan | Üst çentik/Dynamic Island (47–59 pt), alt ana gösterge (34 pt) | Durum çubuğu 24–32 pt, `edgeToEdgeEnabled: true` → navigasyon çubuğu altına çizim | `Screen` üst/yan kenarları karşılar; tab bar 64 + alt inset. 390×844 (iOS) ve 360×800 (Android, 3-buton gezinme 48 pt) çerçevelerinde inset’leri ayrı katman olarak göster. |
| Durum çubuğu | `StatusBar style="dark"` (light zemin) | aynı; dark modda `light` `[M1+]` | Zemin #F6F3EE üstünde koyu ikonlar. |
| Sistem fontu | SF Pro (800 mevcut) | `fontWeight "800"` cihaza göre 700 ya da 900’e çözülür | T1/22: display/h1 Android’de açıkça `"700"`, iOS’ta `"800"`. Mockup: iOS 800, Android 700 varyantı; harf aralığı aynı. |
| Geri | Stack’te kenardan kaydırma + `Geri` | Sistem geri jesti/butonu | Quiz ekranından çıkış katılımı bozmaz (katılım token’ı cihazda; karttan `Oturuma dön` ile devam). **M0’da onay yok; §2.12’deki tek adımlı onay yalnızca `[M1+]` sayfasında.** Soru fazında geri jestinin yanlışlıkla tetiklenmesini azaltmak için sol kenardan 16 pt güvenli boşluk bırak. |
| Dokunma geri bildirimi | Haptik yok (M0) | yok | `[M1+]` **bkz. §1.8** (seçim/kabul `selection`; reveal’da yok). |
| Klavye | Form ekranlarında (giriş, kayıt, profil) ScrollView `keyboardShouldPersistTaps="handled"` | aynı | Giriş kartı klavye açıkken görünür kalmalı; 360×800’de klavye 300 pt → kart yukarı kayar, Spacer 48 → 16’ya düşebilir. |
| Pull-to-refresh | Ana Sayfa’da `RefreshControl` ScrollView’e bağlı değil (çalışmıyor) | aynı | **bkz. §3.0/8**: M0 çerçevelerinde gösterge yok; `[M1+]` düzgün bağlanınca accent spinner. |
| Bağlantı türü/pil | — | — | Bağlantı kalitesi göstergesi tasarlama (RTT skora etki etmez, gösterilmez). |

### 5.7 Web / tablet (içerik genişliği için kanonik)

1. Mevcut ekran görüntüleri Expo web 390×844’tür; native kanıt değildir. Web için: **içerik sütunu maks. 560 pt, ortalanmış**; soru ekranında seçenek listesi de 560; zemin bg kenarlara taşar; tab bar sütun genişliğinde (viewport değil). Hover: buton/kart opacity .92; focus halkası `focus/ring` (§1.3). §1.5/9 ve §2.14/2 bu değere atıf yapar.
2. Tablet: `supportsTablet: false`; M0 kapsamı dışı. `[M1+]` ≥768 pt’te iki sütun yalnızca Keşfet/Kültür listelerinde (kart genişliği (W−48)/2, gap 16); soru ekranı her zaman tek sütun, maks. 560; sonuç ekranı tek sütun.
3. Admin paneli ayrı sistemdir (maks. 1100 px, 2 sütunlu grid, masaüstü) ve bu bölümün kapsamında değildir; token değerlerini `styles.css` değişkenleriyle paylaşır (`--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--live`, `--ok`, `--warn`, `--danger`); T1 değerleri admin’e de uygulanır (§6.1/3).

### 5.8 Dark mode kuralları `[M1+]` — M0 yalnızca light

1. Semantik token’lar değişir, bileşen stilleri değişmez: dark yalnızca `colors` haritasıdır. **Dark değerleri: bkz. §1.3 dark eşleme tablosu** (tek set; burada hex tekrar edilmez). Yeni bileşen varyantı açma.
2. Zemin `bg/canvas` dark (saf siyah değil); surface kartlar gölge yerine 1 pt `border/subtle`; etkileşimli kart (ContentCard) `border/input` dark.
3. Accent ve live açıklaşır, soft zeminler koyulaşır; soft zemin üstündeki metin için §1.3 dark ölçümleri (hepsi ≥5.4) kullanılır; her çift için ölçüm tablosu teslim et.
4. Seçili seçenek dark’ta live zemin + `text/onLive` dark (#151417).
5. Success/danger ayrımı yalnızca renkle değil ✓/✗ glifleri ve metinle verilir (light’ta da geçerli).
6. Durum çubuğu `light`; splash zemin `bg/canvas` dark.
7. Sistem ayarını izle; uygulama içi anahtar yok.

### 5.9 Teslimat formatı (Claude Design’dan beklenen)

**5.9/0 Teslim öncelikleri** (kabul için asgari; büyük matrisin sırası budur):

| Öncelik | Kapsam | Yaklaşık çerçeve |
|---|---|---|
| **P0** (kabul için zorunlu; 390×844, light, 1.0×) | Giriş idle/error · Ana Sayfa loaded (scheduled, lobby, completed, null) · Keşfet loaded · Kültür loaded · Profil view · Yarış loaded (scheduled, lobby, completed, null) · İçerik detayı card + radar + completed · Quiz 11 faz · question × idle/accepted/rejected/unknown · reveal doğru/yanlış/cevapsız · result katılımcı · cancelled admin_cancelled | ≈44 |
| **P1** | P0’ın 1.6× ve 360×800 varyantları · soru ekranı 1.3× · bağlantı şeritleri · 3 zorunlu katılım hatası (§4.4) · reveal 4. varyant · result izleyici / yüklenemedi · ≤0 sayaç · TabBar 1.6× · bileşen sayfaları (light) | — |
| **P2** | Dark (`[M1+]`) · üç yön keşfi (§1.2) · `[M1+]` sayfaları · admin (§6) | — |

1. **Tokens sayfası:** §1.3 ve §5.1 tablolarının tamamı; JSON ve CSS değişkeni olarak dışa aktarım. Şema (her renkte `light`, `proposed?` (T1), `dark`, `ts`, `minContrastOn`):
   ```json
   {"color":{
      "bg":{"light":"#F6F3EE","dark":"#151417","ts":"colors.bg"},
      "inkFaint":{"light":"#9A96A3","proposed":"#6F6B78","dark":"#8E8995","ts":"colors.inkFaint","minContrastOn":["bg","surface"]},
      "live":{"light":"#D9480F","proposed":"#B5380A","dark":"#FF8A5B","ts":"colors.live","minContrastOn":["surface","bg","liveSoft"]},
      "liveVivid":{"light":"#D9480F","dark":"#FF8A5B","ts":"colors.liveVivid","minContrastOn":[]},
      "success":{"light":"#2B7A3D","proposed":"#256B36","dark":"#7CCB8D","ts":"colors.success","minContrastOn":["successSoft","surface"]},
      "borderInput":{"light":"#8A8791","dark":"#8E8995","ts":"colors.borderInput","minContrastOn":["surface","bg"]},
      "neutral":{"light":"#5E5A66","dark":"#B8B3BE","ts":"colors.inkMuted","minContrastOn":["surfaceMuted"]}},
    "space":{"lg":{"value":16,"ts":"space.lg"}},"radius":{"lg":{"value":16,"ts":"radius.lg"}},
    "type":{"h1":{"size":26,"lineHeight":32,"weight":800,"letterSpacing":-0.3,"ts":"type.h1"},
            "caption":{"size":12,"lineHeight":16,"weight":600,"letterSpacing":0.4,"textTransform":"uppercase","locale":"tr-TR","ts":"type.caption"}},
    "touch":{"min":{"value":48,"ts":"touch.min"}},"motion":{"fast":{"ms":120,"ts":"motion.fast"}}}
   ```
   CSS değişken eşlemesi (tasarım → admin `styles.css`): `--color-bg→--bg`, `--color-surface→--surface`, `--color-ink→--ink`, `--color-inkMuted→--muted`, `--color-line→--line`, `--color-accent→--accent`, `--color-live→--live`, `--color-success→--ok`, `--color-warning→--warn`, `--color-danger→--danger`; ayrıca `--space-lg`, `--radius-lg`, `--type-h1-size`.
2. **Bileşen sayfaları:** §5.3’teki 28 bileşen, her biri kendi sayfasında; varyant × durum matrisi; light (+ dark P2); 1.0× + 1.6×; en uzun Türkçe kopya ile. Her bileşenin üstünde `ts: primitives.tsx › Button` gibi kaynak notu.
3. **Ekran çerçeveleri:** 390×844 (iOS) ve 360×800 (Android), light (+ dark `[M1+]`), her ekranın tüm durumları: Giriş (idle/busy/error), Kayıt (idle/busy/error), Ana Sayfa (loading/error/offline/loaded × oturum kartı 5 durum × joined + null), Keşfet (loading/loaded/filtered/empty/error/offline), **Yarış (loading/error/offline/loaded × oturum kartı 5 durum × joined + boş)**, Kültür (loading/loaded/empty/error), Profil (loading/view/editing/error; geçmiş boş/dolu; kayıtlı boş/dolu; profil yüklenemedi `[M1+]`), İçerik detayı (loading/error/offline/card/radar/completed/saved/toast 3 varyant), Quiz 11 faz (loading, error, preview + 3 zorunlu join hatası (§4.4), joining, scheduled, lobby (+≤0), question × 5 cevap durumu × late-join, expired, reveal × 4 varyant, completed loading, completed result × katılımcı/izleyici, completed sonuç yüklenemedi, cancelled × 5 sebep) + 2 şerit, **TabBar / 390 / light / 1.6x**. Çerçeve adı: `M0 / Quiz / question / accepted / 390 / light / 1.0x`.
4. **Tıklanabilir prototip, 3 ana akış:**
   - **Akış A — Günün 5’i:** Giriş → Ana Sayfa (Planlandı, `Katıl`) → Preview (`Katıl`) → `Katıldın` → `Bekleme salonu` → Soru 1 idle → picked/submitting → accepted → Süre doldu → Reveal (doğru) → Soru 2 … → `Son soruydu. Sonuçlar hesaplanıyor…` → Sonuç → `Kartı aç` → İçerik detayı → `Tamamladım` (+10 XP). Ara yüklemeler gerçek sürelerle (reveal 6 sn, soru 12 sn) prototiplenir; 3-2-1 giriş animasyonu yok.
   - **Akış B — Keşfet ve öğrenme:** Keşfet → chip `Tarih` → ContentCard → Detay → `Kaynağı aç` (harici) → `Tamamladım` → toast → `Kaydet` → geri (badge’ler `Tamamlandı` + `Kayıtlı`) → Profil (Öğrenme XP, Kaydettiklerim).
   - **Akış C — Hata ve kenar durumları:** Soru fazında offline şerit → seçim → unknown → `Tekrar gönder` → reconnecting → reveal; ikinci cihaz (PARTICIPATION_EXISTS preview hatası); Oturum iptal edildi (admin sebebiyle); Profil → Yarışma geçmişi → `Sonucu gör`; StateView error → `Tekrar dene`.
5. **Redline / handoff notları:** her ekranda yan boşluk 16, kart padding 16, kart gap 8, bölüm gap 16, buton 48/24/pill, seçenek 56/16/16/2 pt + aralık 12, badge 8×4/8, input 48/12/12/1 pt, progress 8, şerit 12/12 (slot §4.12), tab bar 64+inset, header sistem. Her ölçü token adıyla etiketlenir (`space.lg` gibi), ham pt tek başına yazılmaz.
6. **Erişilebilirlik kontrol listesi (teslimatta imzalanır):**
   - [ ] Her dokunulabilir ≥48×48 (chip dahil); seçenek ≥56.
   - [ ] Metin < 24 pt normal / < 18.66 pt bold: ≥4,5:1 (12 pt caption dahil). Büyük metin (display, h1, h2 ≥20 pt w700 — sayaç dahil): ≥3:1. Etkileşimli bileşen sınırı ve odak halkası: ≥3:1. Ölçüm tablosu §1.3 ile birebir; bilinen ihlaller (inkFaint, live/beyaz, live/liveSoft, success/successSoft 4.49, line kenarlıklar) T1 değerleriyle çözülmüş.
   - [ ] 1.6× ölçekte hiçbir ekran kırpılmıyor; soru ekranı §1.4/2 bütçesine göre çerçevelenmiş, sınırlama handoff’ta yazılı (A-3).
   - [ ] Renk tek başına anlam taşımıyor: doğru/yanlış ✓/✗ + metin; seçili seçenek `selected` durumu; alındı rozeti nötr ve glifsiz.
   - [ ] Ekran okuyucu etiketleri: butonlar (title), girişler (label), seçenekler (`Seçenek N: …`), sayaç (`N saniye kaldı`), progress (label + değer), durum değişimleri polite, hatalar assertive; duyurular iki platformda (§0.3).
   - [ ] Reduced motion: önerilen tüm hareketler 0 ms’ye düşer; içerik ve cevap geri bildirimi hiçbir durumda animasyon beklemez.
   - [ ] Türkçe büyük harf (İ/ı) tüm caption örneklerinde doğru; ş/ğ/ç/ö/ü sistem fontunda kontrol edildi.
   - [ ] Ödülsüz test etiketi: **bkz. §6.7/5, 7 konum** — hepsi çerçevelerde var.
   - [ ] Hiçbir çerçevede sahte sayaç, kazanan, sponsor, ödül, kupa, seri yok; puan ve XP aynı bileşende değil.
   - [ ] Hiçbir çerçevede lisansı belirsiz görsel yok.
7. **Adlandırma kuralları:** bileşen `Merak/<Alan>/<Bileşen>` (Alan: Core, Content, Quiz, Form, Navigation); varyant özellikleri `Tone=primary|secondary|live|ghost|danger`, `State=default|pressed|disabled|loading|focus|selected`, `Kind=card|radar_pick`, `Phase=…`. Token `color/live`, `space/lg`, `type/h1` (slash). Çerçeve `M0 / <Ekran> / <Durum> / <Genişlik> / <Tema> / <Ölçek>`. M0 dışı her şey `[M1+] ` önekiyle ayrı sayfada; T1 düzeltmeleri ana çerçevelerde, çerçeve notunda `T1/n` referansıyla.

### 5.10 Mühendislik eşlemesi (token adı → `tokens.ts`)

Değer önerileri yalnızca §1.3’tedir; bu tablo ad eşlemesidir.

| Tasarım | Kod | Not |
|---|---|---|
| color/* | `colors.*` (aynı anahtar) | T1: `inkFaint`, `live`, `success` değerleri; yeni alanlar `liveVivid`, `borderInput`. Dark için `colors` haritası `useColorScheme()` ile seçilir `[M1+]`. |
| type/* | `type.*` | `caption.textTransform` → locale-duyarlı (T1/6). |
| space/*, radius/*, touch/min, motion/* | `space.*`, `radius.*`, `touch.min`, `motion.*` | Değer değişikliği yok. |
| shadow/card | `shadow.card` | Dark’ta kenarlıkla değişim `[M1+]`. |
| Merak/Core/Button Tone=* | `Button tone=` | Focus halkası T1/19. |
| Merak/Core/Badge Tone=* | `Badge tone=` | `neutral` tonu T1/1. |
| Merak/Core/Card Tone=* | `Card tone=` | — |
| Merak/Core/StateView Kind=* | `StateView kind=` | — |
| Merak/Core/ProgressBar Tone=* | `ProgressBar tone=` | — |
| Merak/Form/TextInput | ekran içi `styles.input` (login/register/profile) | Ortak primitive yok; `[M1+]` `Input` primitive’e taşı; `maxFontSizeMultiplier` T1/13. |
| Merak/Form/Chip | `discover.tsx › Chip` | 48 / paddingH 16 (T1/8). |
| Merak/Content/ContentCard Kind=* | `ContentCardView` | — |
| Merak/Quiz/SessionCard Status=*, Joined=* | `QuizSessionCard` | `tabular-nums` T1/5. |
| Merak/Quiz/OptionButton State=* | `quiz/[id].tsx › styles.option*` | Reveal durumları aynı geometri; a11y T1/15; aralık 12 T1/9. |
| Merak/Quiz/AnswerStatus Status=* | `AnswerStatus` | accepted ton nötr T1/1. |
| Merak/Quiz/Banner Kind=offline\|reconnecting | `styles.banner` | Slot rezervi; socket öncesi yok T1/3. |
| Merak/Quiz/Timer, Countdown | `quiz-timer`, `formatCountdown` | — |
| Merak/Core/StatTile | `profile.tsx › Stat` | — |
| Merak/Quiz/LeaderboardRow | `ResultPane › Row` | — |
| Merak/Core/Toast Inline | `content-toast` | Yüzen snackbar `[M1+]`. |
| Merak/Navigation/TabBar, StackHeader | `(tabs)/_layout.tsx`, `_layout.tsx` | Rozet yok; etiket 1.3× T1/13. |


---

## 6. Yönetim paneli, içerik ve ton rehberi, hata sunumu, kapsam dışı ve açık sorular

Yönetim paneli (`apps/admin`) masaüstü bir web uygulamasıdır; bu bölümde ölçüler **CSS px**’tir (§0.2). Katman etiketleri §0.1’deki gibidir.

### 6.1 Yönetim paneli — rol, çerçeve ve genel kurallar

1. Yönetim panelini **dar bir editoryal araç** olarak tasarla: inceleme, onay, yayın, planlama, denetim. Pazarlama, analitik gösterge paneli, grafik, “hoş geldin” ekranı, boş modül kartı **tasarlama**. API’de `GET /admin/analytics/active-users` var ama sayfası yok; bir analitik sayfası çizersen `[M1+]` etiketiyle ayrı bir bölüme koy.
2. Hedef görünüm alanı **1280 × 900 px masaüstü**; içerik sütunu 1100 px (mevcut `main { max-width: 1100px; padding: 20px }`). 1024 px altını tasarlama; duyarlı/mobil admin `[M1+]`. URL yönlendirmesi yoktur (sekme durumu bellekte); tarayıcı geri tuşu sekme değiştirmez.
3. Mevcut CSS değişkenleri (`styles.css`, mobil token’larla aynı değerler): `--bg #F6F3EE`, `--surface #fff`, `--ink #17161A`, `--muted #5E5A66`, `--line #E2DDD4`, `--accent #1F5F5B`, `--live #D9480F`, `--ok #2B7A3D`, `--warn #A15C00`, `--danger #B42318`. Gövde 15/1.45 sistem font yığını; `.card` radius 12, padding 16, 1 px line kenarlık; buton pill. **T1/17:** değişkenler §1.3 T1 değerleriyle güncellenir — `--live` metin/rozet ve dolgulu `button.live` zemini için #B5380A (beyaz metin 5.94), `--ok` #256B36; giriş alanı, select ve nötr düğme kenarlığı `border/input` #8A8791 (etkileşimli sınır ≥ 3:1; `--line` 1.35 ile yetmez); `.badge.live`/`.badge.lobby` metni #B5380A (as-built #D9480F liveSoft üstünde 3.53 ✗), `.badge.published`/`.badge.completed` metni #256B36 (as-built 4.49 ✗). `--muted` ve `--warn` aynen kalır. Yeni renk tanımlama; eksik olanı §1.3’ten (surfaceMuted, accentSoft, liveSoft, successSoft, dangerSoft, warningSoft) al.
4. Düğme yüksekliği as-built 36 px; tasarımda **40 px** (masaüstü fare hedefi) `[M1+ küçük düzeltme]`. Tehlikeli işlem düğmeleri (`Reddet`, `İptal et`, `Arşivle`) kırmızı metin + kırmızı kenarlık; dolgulu kırmızı düğme kullanma. Panelde tek dolgulu turuncu düğme `Planla`dır (canlı yarışma yaratır).
5. **Üst çubuk** (sticky, surface, alt çizgi line, padding 12×20): h1 18 px `Merak Yönetim` + muted `M0 · yerel test` → nav `Sorular` · `İçerik` · `Oturumlar` · `Denetim` (muted w600; aktif = accent) → boşluk → muted `merak_admin · admin` + `Çıkış`. `M0 · yerel test` etiketi her sayfada görünür kalır; kaldırılamaz (§6.7/5). Varsayılan sekme `Sorular`.
6. **Enum etiketleri:** M0 kodu durum ve yöntem değerlerini **ham İngilizce** gösterir (`draft`, `published`, `ai_assisted`, `admin_cancelled`, `pending`). Tasarımda aşağıdaki Türkçe etiketleri kullan ve “`[M1+ küçük düzeltme]` — M0 kodu ham enum gösterir” notunu düş:

| Alan | Değer | Etiket | Rozet tonu (zemin / metin) |
|---|---|---|---|
| status | draft | Taslak | surfaceMuted / muted |
| status | review | İncelemede | warningSoft / warn |
| status | approved | Onaylı | accentSoft / accent |
| status | published | Yayında | successSoft / `status/success` |
| status | rejected | Reddedildi | dangerSoft / danger |
| status | archived | Arşivde | surfaceMuted / muted |
| productionMethod | human | İnsan | — (düz metin) |
| productionMethod | ai_assisted | AI destekli | — |
| productionMethod | ai_generated | AI üretimi | — |
| productionMethod | seed_sample | Örnek test içeriği | warningSoft / warn |
| oturum status | scheduled · lobby · live · completed · cancelled | Planlandı · Bekleme salonu açık · Canlı · Tamamlandı · İptal edildi | accent · live/default · live/default · success · danger |
| soru status (oturum içi) | pending · open · closed · revealed | Bekliyor · Açık · Kapandı · Açıklandı | muted · live/default · muted · accent |
| cancelReason | admin_cancelled · server_restart · missed_start · question_approval_withdrawn · question_revision_changed | yönetici iptal etti · sunucu yeniden başladı · başlangıç kaçırıldı · bir sorunun onayı geri çekildi · bir soru değiştirildi | danger metin |

7. **Diyaloglar:** bugün tarayıcının `window.prompt` / `window.confirm`’ü kullanılır. Tasarımda aynı kopyayı taşıyan **satır içi onay paneli** (kartın içinde açılan, metin alanı + iki düğme) çiz; `[M1+]` etiketle. Kopya değişmez: `Ret gerekçesi (zorunlu):`, `Onay notu (isteğe bağlı). Kaynağı gerçekten kontrol ettin mi?`, `İptal gerekçesi (kullanıcıya gösterilir):`, toplu onay metni (§6.3/5). As-built: prompt’ta `İptal`e basmak veya boş bırakmak ret/iptal işlemini durdurur; onay notu boş geçilebilir.
8. **Geri bildirim satırları** inline kalır (toast yok): başarı `p.ok` yeşil 13 px (`Onayla: tamam`, `Oturum planlandı. Soruların onaylı revizyonları sabitlendi.`), hata `p.error` kırmızı 13 px; hata metni biçimi `{mesaj}` + details varsa ` — {JSON}` (ör. `Gönderilen veri geçersiz. — [{"path":"prompt","message":"…"}]`); ağ hatası `API’ye ulaşılamadı (http://localhost:3000).`; bilinmeyen `HTTP {status}` veya `Hata`. **`REVISION_STALE`** as-built aynı `p.error` satırıdır (`Kayıt sen açtıktan sonra değişti. Yeniden yükle.`), düğme yoktur — kullanıcı sekmeyi değiştirip dönmeli ya da sayfayı yenilemelidir. `[M1+]`: ayrı uyarı bandı + `Yeniden yükle` düğmesi.
9. **Sahte veri yasağı:** demo çerçevelerinde yalnızca seed verisi (5 konu, 13 kart, 4 Radar, 12 taslak soru, `editor@merak.local`, `admin@merak.local` / `merak_admin`, oturum başlığı `Ödülsüz test oturumu` veya `Web demo — ödülsüz test`). Katılımcı sayısı, cevap sayısı, sıralama uydurma; 0 ve 2 gibi gerçekçi küçük sayılar kullan.
10. **Erişilebilirlik (masaüstünde klavye ana giriş yöntemidir):** tüm odaklanabilirlerde `:focus-visible` 2 px accent halka, 2 px offset (T1/19); satır içi onay paneli açılınca odak ilk alana gider, `Escape` kapatır, odak tetikleyen düğmeye döner; `p.error` ve `REVISION_STALE` bandı `role="alert"`, `p.ok` `role="status"`; nav bağlantıları gerçek `<button>` ya da `<a>` + `aria-current="page"`; checkbox satırları (toplu seçim, oturum soru seçici) 40 px yüksekliğinde, tam satır tıklanabilir `<label>` (native 13 px checkbox WCAG 2.5.8 24×24 hedefinin altındadır); tablo başlıkları `<th scope="col">`; her `<select>`/`<input>` görünür `<label for>` ile bağlı. Bunlar `[M1+ küçük düzeltme]` (renk/odak kısmı T1/17, T1/19).

### 6.2 Giriş ve yetki durumları

Beş durum tasarla:

| Durum | Görünüm | Kopya (aynen) |
|---|---|---|
| Yükleniyor | `<main>` içinde (max 1100, padding 20) **sol hizalı düz metin**; spinner yok, ortalanmamış | `Yükleniyor…` |
| Giriş | 380 px kart, üstten 80 px, ortalı | h2 `Merak Yönetim` · muted `Editör veya admin hesabıyla giriş yap. Yerel seed: editor@merak.local / admin@merak.local` · etiket `E-posta` · etiket `Şifre` · `Giriş` (primary; meşgulken disabled, spinner yok) · hata `p.error` |
| Yetki yok (member) | 380 px kart | h2 `Yetki yok` · muted `Bu hesap (ayse) editör veya admin değil. Rol sunucuda doğrulanır; gizli bir buton yoktur.` · `Çıkış` |
| Editör / Admin | tam panel | editörde `Oturumlar` sekmesi yalnızca warnbox gösterir: `Oturum planlama yalnızca admin rolü için. Editörler soru ve içerik inceleyebilir.` |
| **Profil alınamadı** (oturum var, GET /me hata) | As-built: tam panel render edilir; `main`’in üstünde `p.error` (API metni); üst çubukta kullanıcı adı ve rol boş; `isAdmin=false` olduğu için `Oturumlar` editör uyarısını gösterir (admin de olsa) | `[M1+]`: içerik yerine ayrı hata bandı (`role="alert"`) + `Yeniden dene`; rol bilinmeden Oturumlar uyarısı gösterilmez |

Etiketler 12 px w700 BÜYÜK HARF (CSS `text-transform`; `index.html` `lang="tr"` taşıdığı için İ doğru üretilir). Giriş hatası ham GoTrue mesajı olarak **İngilizce** gelir (ör. `Invalid login credentials`; admin’de çeviri katmanı yok). Tasarımda mobil ile aynı Türkçe sığınağı kullan: `Giriş yapılamadı. Lütfen tekrar dene.` — `[M1+ küçük düzeltme]` (§3.1). Şifre sıfırlama, kayıt, 2FA **tasarlama** (hesaplar seed/Supabase’den gelir).

### 6.3 Sorular sayfası

1. **Araç çubuğu:** h2 `Sorular` + muted `(12)` · durum `<select>` (`Tümü` + 6 durum; as-built ham değer, tasarımda §6.1/6 etiketleri) · `Yeni soru` (primary) · `Seçilileri test-onayla + yayınla (0)` (nötr düğme; 0 seçiliyken disabled; data-testid `bulk-publish`). Arama, sıralama, sayfalama `[M1+]`.
2. **Uyarı kutusu** her zaman görünür (warnbox: warningSoft zemin, warn metin, 13 px, radius 8, padding 8×12), metin aynen: `Ödüllü sorularda insan onayı zorunludur. Seed soruları “örnek test içeriği”dir; kaynakları editör tarafından doğrulanmamıştır. Düzenleme yapınca önceki onay geçersiz olur.`
3. **Soru kartı** (surface, radius 12, padding 16, `data-testid question-{id}`):
   - Üst satır sol: checkbox (toplu seçim) · durum rozeti · muted `Bilim ve Doğa · v1 · İnsan` (as-built `· v1 · seed_sample` ham) + seed ise ` · örnek test içeriği`.
   - Üst satır sağ: `Düzenle` + duruma göre eylemler (tablo). Geçersiz eylemi gizle; sahte disabled düğme koyma.
   - Gövde: **kalın** soru metni (8–400 karakter; 400 karakterlik örnekle test et) · 4 seçenek listesi; doğru olan `status/success` renkte + ` ✓` — **cevap anahtarı yalnızca yönetim panelinde (editör ve admin rolleri) görünür; mobil sözleşmesinde yoktur ve mobile asla gitmez** · muted `Açıklama: …` (≤ 1000) · muted `Kaynak: <bağlantı veya —> · doğrulandı|doğrulanmadı · tr` + varsa ` · inceleme: 15.10.2026 00:56:02 (not)`.
   - Onaylı revizyon güncel değilse (`approvedRevisionId ≠ currentRevision.id`) warning rozeti `Onaylı revizyon güncel değil` `[M1+]`.

| Durum | Eylemler (sıra ve ton) |
|---|---|
| Taslak | `İncelemeye gönder` · `Arşivle` (danger kenarlık) |
| İncelemede | `Onayla` (primary) · `Reddet` (danger) |
| Onaylı | `Havuza yayınla` (primary) · `Reddet` (danger) · `Arşivle` |
| Yayında | `Arşivle` |
| Reddedildi | `İncelemeye gönder` · `Yeniden aç` |
| Arşivde | `Yeniden aç` |

4. **Ret gerekçesi zorunlu:** `Reddet` → panel `Ret gerekçesi (zorunlu):` + metin alanı (≤ 300) + `Reddet` (danger; boşken disabled) + `Vazgeç`. Sunucu boş gerekçeyi `Ret için gerekçe zorunlu.` ile reddeder. **Onay notu:** `Onayla` → `Onay notu (isteğe bağlı). Kaynağı gerçekten kontrol ettin mi?` + `Onayla` + `Vazgeç`. Gerekçe/not denetim kaydında ve kartta `(…)` olarak görünür. Her geçiş `expectedRevisionId` gönderir; kayıt bu arada değiştiyse `REVISION_STALE` (§6.1/8).
5. **Toplu test-onay:** onay paneli metni aynen: `{n} soruyu incelemeye gönder → onayla → yayınla. Bu bir TEST onayıdır; gerçek editoryal inceleme yerine geçmez. Devam?` (ör. `3 soruyu …`). Düğmeler `Devam` (nötr, live tonu değil) + `Vazgeç`. Sonuçta kartlarda inceleme notu `TEST ONAYI — toplu işlem, insan incelemesi değildir` görünür; bu notu küçültme veya gizleme.
6. **Soru formu** (`Yeni soru` / `Soruyu düzenle (yeni revizyon v2; onay sıfırlanır)`), listenin üstünde inline kart; etiketler 12 px w700 büyük harf:

| Etiket (aynen) | Kontrol | Kural |
|---|---|---|
| `Konu` | select | 5 konu |
| `Üretim yöntemi` | select | İnsan / AI destekli / AI üretimi (as-built ham `human`/`ai_assisted`/`ai_generated`). **Seed öğe düzenlenirse `seed_sample` → `human` olur** |
| `Soru metni` | textarea (zorunlu) | 8–400; karakter sayacı `[M1+]` |
| `Seçenekler (tam olarak bir doğru)` | 4 × [radio + input `Seçenek 1..4`] | her biri 1–120, hepsi zorunlu; hata `Tam olarak bir doğru seçenek olmalı.` |
| `Açıklama (reveal sonrası gösterilir)` | textarea (zorunlu) | ≤ 1000 |
| `Kaynak URL` / `Kaynak başlığı` | input (`https://`) / input | url / ≤ 200 |
| `Kaynağı bizzat kontrol ettim (doğrulandı etiketi)` | checkbox | işaretli değilse mobilde `Kaynak henüz editör tarafından doğrulanmadı` görünür — formun yanında küçük bilgi satırı olarak göster |
| `İlgili içerik id (isteğe bağlı)` | input `uuid` | sonuç ekranındaki `Merakın devam etsin` köprüsü; ham UUID girişi, içerik seçici `[M1+]` |
| `Değişiklik gerekçesi (denetim kaydı)` | input | ≤ 300 |
| — | `Kaydet` (primary) · `Vazgeç` | hata: `Gönderilen veri geçersiz.` + alan listesi (JSON) |

   **Düzenleme modu uyarısı** (formun başlığı altında kalıcı, warnbox): `Kaydedince yeni revizyon oluşur; önceki onay geçersiz olur. Bu soru planlı bir oturumda sabitliyse o oturum lobi öncesi iptal edilir.` (As-built: yalnızca başlıktaki `onay sıfırlanır` ibaresi var; uzun metin `[M1+ küçük düzeltme]`.) İşlemsel sonuç bugün de geçerlidir: planlı bir oturumda sabitlenmiş bir soru düzenlenirse `revisionStillValid=false` olur, zamanlayıcı oturumu lobi öncesi `question_revision_changed` ile iptal eder (kullanıcılar `bir soru değiştirildi` görür); admin bunu ancak sonradan oturum listesinde fark eder. `[M1+ öneri]`: kayıttan önce “planlı oturumda kullanılıyor” uyarısı (AdminQuestion’da sabitleme bilgisi yok; GET /admin/sessions ile türetilir). **Seed etiketi kaybı:** seed öğe düzenlenince yöntem `İnsan` olur; yeni revizyon yayınlanınca mobildeki `Örnek test içeriği` rozeti (yönteme bağlı) kalkar, yalnızca `Kaynak henüz editör tarafından doğrulanmadı` satırı kalır. `[M1+ öneri]`: formda kalıcı bilgi satırı `Bu kayıt örnek test içeriğinden türetildi; kaynağı kontrol etmeden yayınlama.` Dil seçici formda yok (varsayılan `tr`); ekleme `[M1+]`.

### 6.4 İçerik sayfası (kart / Radar)

1. **Araç çubuğu:** h2 `İçerik` + muted `(17)` · `Yeni kart / Radar önerisi` (primary). Açıklama satırı aynen: `Kullanıcılar yalnızca yayınlanmış revizyonu görür. Yayındaki bir kartı düzenlersen eski revizyon, yeni revizyon yayınlanana kadar yayında kalır.` Mesaj satırı `p.ok` / `p.error` (§6.1/8).
2. **Kart:** durum rozeti · muted `Kart · Sanat ve Mimari · v1` veya `Radar · Edebiyat · v1`; `publishedRevisionId ≠ currentRevision.id` ise ` (yayında: eski revizyon)` (tasarımda warning renkte; as-built muted) ; seed ise ` · örnek test içeriği` · `Düzenle` + eylemler (§6.3 matrisi; yayınlama etiketi burada `Yayınla`) · **kalın** başlık + muted `/kaplumbaga-terbiyecisi` · muted özet · muted `Kaynak: … · doğrulandı|doğrulanmadı · seed_sample` (as-built ham yöntem). Ret → `Ret gerekçesi (zorunlu):`; içerikte onay notu paneli **yok**.
3. **Form** (`Yeni içerik` / `İçeriği düzenle (yeni revizyon)`): `Tür` (`Keşif kartı` | `Kültür Radarı önerisi`) · `Konu` · `Başlık` (2–140) · `Özet` (2–300) · `Metin` (textarea min 140 px; 2–6000; düz metin, markdown/görsel yok) · Radar ise `Medya` (`Kitap` | `Film`) · `Yazar / Yönetmen` (≤ 120) · `Yıl` (0–2100) · `Neden öneriyoruz` (≤ 400); kart ise `Okuma süresi (dk)` (1–60, varsayılan 2) · `Kaynak URL` · `Kaynak başlığı` · `Kaynağı bizzat kontrol ettim` · `Değişiklik gerekçesi` · `Kaydet` / `Vazgeç`. Sunucu özel hatası: `Bu slug zaten kullanılıyor.` Seed öğe düzenlemesi için §6.3/6’daki seed etiketi kaybı notu burada da geçerlidir (yöntem `İnsan` olur, mobil rozet yayından sonra kalkar).
4. Görsel/kapak yükleme alanı **tasarlama** (lisans kararı; metin odaklı içerik). Slug alanı UI’da yok; sunucu üretir. Dil seçici yok.

### 6.5 Oturumlar sayfası (yalnızca admin)

1. h2 `Test oturumları` + warnbox aynen: `M0: yalnızca ödülsüz yerel test. Oturum, seçilen soruların o anki onaylı revizyonunu sabitler; sonradan düzenleme canlı soruyu değiştirmez, zamanlayıcı lobi öncesi yeniden doğrular.` Liste 5 sn’de bir yenilenir (polling); yenileme göstergesi koyma.
2. **Planlama formu** `Yeni oturum planla` (2 sütun grid):
   - `Başlık` (varsayılan `Ödülsüz test oturumu`, 2–120) · `Başlangıç (yerel saat)` (`datetime-local`, varsayılan şimdi + 3 dk; geçmiş → `Başlangıç zamanı gelecekte olmalı.`) · `Soru süresi (sn) — varsayılan 12` (1–60) · `Reveal süresi (sn) — varsayılan 6` (1–30) · `Lobi açılış öncesi (sn) — varsayılan 60` (0–600).
   - Üç değerden biri varsayılandan saparsa formun altında **test override işareti**: warning rozeti `m0-v1+test-override` + metin `Varsayılan dışı süre: bu oturum deneme ayarıyla etiketlenir ve denetim kaydında görünür.` (as-built etiket yalnızca listede `rules.rulesVersion` olarak görünür; form içi uyarı `[M1+]`).
   - `Sorular (sırayla tam 5 yayınlanmış soru seç) — seçili: 2/5`: her yayınlanmış soru bir checkbox satırı (`{prompt}` + muted `({konu}, v{n})`); seçilenlerin önüne `1. `, `2. `… (seçim sırası = oynanma sırası); 5 dolunca diğerleri pasif; boş havuz: `Havuzda yayınlanmış soru yok. Önce Sorular sekmesinden onayla + yayınla.` Sürükle-bırak sıralama `[M1+]`.
   - `Planla` düğmesi **live tonu** (`live/default`, tek turuncu düğme; data-testid `session-create`), tam 5 seçilmeden disabled. Hatalar: `Oturumda tam olarak beş soru olmalı.`, `Onaylanmamış soru planlanamaz.`, `Aynı soru birden fazla kez seçilemez.`, `Soru bulunamadı: {id}`. Başarı: `Oturum planlandı. Soruların onaylı revizyonları sabitlendi.`
3. **Oturum kartı:** durum rozeti · **kalın** başlık · muted `15.10.2026 21:00:00 · 2 katılımcı · 7 cevap · v13 · m0-v1` (admin için stateVersion ve rulesVersion görünür kalır; operasyon bilgisidir) · `Detay` (aç/kapa) · `İptal et` (danger; yalnızca Planlandı / Bekleme salonu açık / Canlı). İptal edilmişse kırmızı satır `İptal: admin_cancelled` (as-built ham enum) → tasarımda `İptal: yönetici iptal etti`.
4. **Detay tablosu** sütunları aynen: `#` · `Soru` · `Rev.` · `Durum` · `Açılış` · `Kapanış` · `Revizyon geçerli mi?`; saatler `toLocaleTimeString('tr-TR')` (`21:00:00`) veya `—`; son sütun `evet` (ok) / `HAYIR — oturum başlatılmaz` (error, kalın). Bu sütunda `HAYIR` varsa kartın üstüne uyarı bandı: `Sabitlenmiş bir soru artık geçerli değil; zamanlayıcı lobi öncesi oturumu iptal edecek.` `[M1+]`.
5. **İptal paneli:** `İptal gerekçesi (kullanıcıya gösterilir):` + metin (3–300) + yardımcı satır `Bu metin katılımcılara aynen gösterilir.` + `İptal et` (danger) + `Vazgeç`. Zaten bitmiş/iptal edilmiş oturum için sunucu `Oturum zaten tamamlandı veya iptal edildi.` döner.
6. Tasarlanmayacaklar: canlı katılımcı listesi, sonuç/sıralama görünümü, cevap dışa aktarma, tekrarlayan takvim (Pazartesi–Cumartesi 21:00 otomasyonu M1). Bunlar için kart çizme.

### 6.6 Denetim kaydı

Tek kart: h2 `Denetim kaydı` · muted `Önemli yönetim işlemlerinin aktörü, zamanı ve gerekçesi. Aktörü boş olan satırlar sistem (zamanlayıcı/seed) işlemleridir.` · tablo 13 px, sütunlar aynen `Zaman` · `Aktör` · `İşlem` · `Hedef` · `Gerekçe` · `Detay`. Aktör boşsa muted `sistem`. İşlem ham dize (`content.seed_publish`, `question.approve`, `question.publish`, `session.create`, `session.cancel`, `session.auto_cancel`); monospace 13 px (`type/mono`). Hedef `quiz_session 3f2a9c1d` (ilk 8 karakter). Detay: JSON’un ilk 120 karakteri, muted; genişletme/filtre/arama/sayfalama `[M1+]`. En yeni üstte, 200 satır. Otomatik iptal satırlarında gerekçe sütunu motor ayrıntısını taşır (ör. `API süreci canlı oturum sırasında yeniden başladı`).

### 6.7 İçerik ve ton rehberi

1. **Dil:** Türkçe; ikinci tekil “sen” (`Bugün ne öğreniyoruz?`, `Merakın devam etsin`, `Bir seçenek seç.`). Admin de “sen” kullanır (`Kaynağı gerçekten kontrol ettin mi?`). “Siz” yalnızca yasal metinlerde (M0’da yok).
2. **Yetişkinlere saygılı, premium:** emoji yok, **ünlem yok** (istisna yok; tek as-built ünlem `Günlük görev tamamlandı!` T1/18 ile noktaya çevrilir). Yasak kelimeler: `Aferin`, `Harika!`, `Süpersin`, `başlangıç seviyesi`, `acemi`, `öğrendin`, `ustalaştın`, `bilgi seviyen`, `elendin`, `kaybettin`, `maalesef`. Yanlış cevap `Yanlış · 0 puan`; cevapsız `Cevapsız · 0 puan`; eleme yok: `yanlış cevap elemez`.
3. **Öğrenme başarısı iddiası yok:** içerik detayındaki dipnot aynen kalır: `“Tamamladım” bir öğrenme kanıtı değil, kendi ilerlemeni takip etmen için bir işarettir.` Ustalık yüzdesi, sertifika, seviye çubuğu tasarlama.
4. **Puan ≠ XP:** `puan` yalnızca yarışma (live bağlamı), `XP` yalnızca içerik tamamlama (accent bağlamı). Profil notu aynen: `Yarışma puanı ile öğrenme XP’si ayrı tutulur; bu puanlar XP’ye dönüşmez.` Toplam/birleşik skor, “seviye”, kazanım rozeti **yok**. XP yalnızca ilk tamamlamadan gelir (kaydetme, günlük görev ve yarışma XP vermez).
5. **Ödülsüz test etiketi — kanonik liste (7 zorunlu konum):**
   1. Oturum kartı caption’ı: `Günün 5’i · ödülsüz test` (Ana Sayfa ve Yarış)
   2. Quiz stack başlığı: `Günün 5’i · Test`
   3. Quiz üst satırı (her faz): `Ödülsüz test oturumu`
   4. Preview dipnotu: `Katılım ücretsizdir. Bu sürümde ödül yoktur.`
   5. Sonuç hero dipnotu: `Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.`
   6. Giriş ekranı dipnotu: `M0 yerel test sürümü. Yarışmalar ödülsüzdür; katılım ücretsizdir.`
   7. Admin üst çubuğu: `M0 · yerel test`
   Ek konumlar (sayılmaz ama kaldırılmaz): Yarış kurallar kartı `• Bu sürümde oturumlar ödülsüz yerel testtir.`, boş oturum kartı metni, admin Oturumlar warnbox’ı, toplu test-onay metni. Kupa, para, hediye, sponsor logosu ikonografisi yasak. Bu etiket hukuki değerlendirme gibi yazılmaz.
6. **Kaynak şeffaflığı:** her içerik detayında `Kaynak` bloğu; doğrulama satırının görsel kuralı **bkz. §3.5/7** (doğrulandı: caption ink + `✓`; doğrulanmadı: caption inkMuted, glif yok, warning/danger yok). `Örnek test içeriği` rozeti (warning) seed içeriğin her detayında görünür; liste kartına taşınması `[M1+]` (sözleşmeye `productionMethod` gerekir).
7. **Sayı ve tarih biçimleri (kanonik):** as-built tarih-saat `15.10.2026 21:00:02` (`toLocaleString('tr-TR')`), yalnız saat `21:00:02`. **Mühendislik notu:** `toLocaleString` **cihazın** (admin’de tarayıcının) saat dilimini kullanır; Europe/Istanbul’dan farklı bir bölgeye ayarlı telefonda başlangıç saati yanlış görünür. **Öneri (tüm ekranlar; §3.7 ve §4.4 bu biçimi kullanır) `[M1+ küçük düzeltme]`:** `15 Ekim 2026, 21:00` (`dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul'`). Tasarım İstanbul saatini varsayar. Diğer biçimler: geri sayım `2 sa 5 dk` · `1 dk 13 sn` · `46 sn` · `şimdi` (≤0 varyantı §3.3/§4.6); süre `12 sn/soru`; puan `97 puan`, `+97 puan`; XP `+10 XP · toplam 30`; sıra `1. sıra / 2 katılımcı`, `sıralama dışı`; okuma süresi `2 dk okuma`; sürüm `sürüm 1`; binlik ayırıcı nokta (`1.000`), ondalık virgül. Günlük görev satırı `0/3 içerik · Europe/Istanbul gününe göre` kalır; saat dilimi notunu kaldırma (gün sınırı her kullanıcı için yerel gece yarısı değildir).
8. **Türkçe tipografi — karar (b):** BÜYÜK HARF korunur, dönüşüm locale-duyarlı (T1/6) — **bkz. §1.4/1**. Kesme `’`, tırnak `“ ”`, üç nokta `…`, ayırıcı `·`; `ş ğ ı İ ç ö ü â` glifleri seçilen fontta zorunlu; sistem fontuyla başlanır.
9. **Hata ve bilgi görsel ağırlığı (üç seviye):**
   - **Bilgi** — muted metin, ikon yok (`Bu kartı daha önce tamamlamıştın; XP bir kez verilir.`, `Sonuçlar hazır.`).
   - **Uyarı** — warningSoft bant ya da warning metin, polite duyuru: bağlantı şeridi, geç katılım kilit uyarısı (`NOT_ELIGIBLE_FOR_QUESTION`’ı önceden bildiren satır), bilinmeyen teslim, seed rozeti.
   - **Hata** — danger metin, assertive duyuru: form hataları, cevap satırındaki **tüm ret metinleri** (teslim hatasıdır; doğruluk bildirmez; metin suçlayıcı değildir), preview katılım hataları (danger metin ama sakin yerleşim, alarm ikonu yok), sayfa düzeyinde StateView `Bir sorun oldu` + `Tekrar dene`.
   - Kabul (`Cevabın kabul edildi`) **nötr** tondadır (§1.3 `status/neutral`, T1/1); yeşil yalnızca reveal’deki doğru cevaba ve `Tamamlandı` rozetine aittir.

### 6.8 Hata sunumu kuralları

1. Her API/WS hatası tek bir koda sahiptir; istemci mesajı `describeError` ile **aynen** gösterir. Mesajlar ya `errorMessagesTr` tablosundan (tam liste **Ek A.1**) ya da sunucunun koda eklediği özel metinden (**§6.8b**, Ek A.2) gelir. Kopyayı yeniden yazma; tasarım yalnızca seviyeyi (§6.7/9), konumu ve duyuru davranışını belirler.
2. **Konuma göre sunum:** liste/detay ilk yüklemesi → StateView (error/offline) + `Tekrar dene`; içerik detayı eylemleri → durum satırı (as-built accent, T1 değil `[M1+ küçük düzeltme]` ile danger); cevap → `AnswerStatus` ret satırı (danger, assertive, seçenekler açılır); katılım → preview kartındaki hata satırı; profil formu → form altı tek satır; admin → `p.error` satırı.
3. **Kimlik hataları (`AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`, `AUTH_TOKEN_EXPIRED`) — as-built:** mobilde `api.ts`’te 401 işleyicisi **yoktur**; bu kodlar diğer hatalar gibi ekranın StateView’ında veya durum satırında metin + `Tekrar dene` olarak görünür. `/login`’e yönlendirme yalnızca GoTrue oturumu tamamen düştüğünde (Gate) olur, API 401’inde olmaz. `[M1+ öneri]`: `api.ts` 401 → `signOut()` ve otomatik giriş yönlendirmesi; ayrı `[M1+]` sayfasında `StateView · oturum süresi doldu` çerçevesi (mesaj `Oturumun süresi doldu. Lütfen yeniden giriş yap.` + ghost `Yeniden giriş yap`).
4. **Ağ hataları:** mobil istemci kodu `NETWORK` → `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.` (StateView offline türü); kimlik sunucusuna ulaşılamazsa giriş ekranında `Kimlik sunucusuna ulaşılamadı. Yerel stack çalışıyor mu?`; admin `API’ye ulaşılamadı (http://localhost:3000).`
5. `SESSION_COMPLETED` katılımda hata olarak gösterilmez; istemci sonucu yükler. `SESSION_CANCELLED` iptal panosuna geçirir. `ANSWER_ALREADY_ACCEPTED` ret değil kabul olarak işlenir.
6. `SESSION_NOT_JOINABLE` pratikte yalnızca id ile açılan taslak oturumda görülür; normal akışta ulaşılmaz, çerçevesi zorunlu değildir (§4.4).

### 6.8b Sunucu özel mesajları (errorMessagesTr dışında, aynen)

| Kod | Mesaj (aynen) | Nerede görünür |
|---|---|---|
| `NOT_FOUND` | `Soru bu oturuma ait değil.` | Mobil cevap satırı (POST answers; normalde görülmez) |
| `NOT_FOUND` | `Soru bulunamadı: {id}` | Admin oturum planlama `p.error` |
| `NOT_PARTICIPANT` | `Önce oturuma abone ol.` | WS `state.resync` ack’i; istemci resync hatasını göstermez (UI’da görünmez) |
| `INVALID_TRANSITION` | `Oturum henüz tamamlanmadı.` | Sonuç yükleme (GET result) → `completed` × sonuç yüklenemedi StateView’ı (§4.2, T1/21) |
| `INVALID_TRANSITION` | `Oturum zaten tamamlandı veya iptal edildi.` | Admin `İptal et` `p.error` |
| `INVALID_TRANSITION` | `'{from}' durumundan '{action}' yapılamaz.` (ham enum; ör. `'draft' durumundan 'approve' yapılamaz.`) | Admin Sorular/İçerik `p.error`; enum Türkçeleştirme `[M1+]` |
| `VALIDATION_FAILED` | `Ret için gerekçe zorunlu.` | Admin Reddet |
| `VALIDATION_FAILED` | `Bu slug zaten kullanılıyor.` | Admin içerik formu |
| `VALIDATION_FAILED` | `Doğru seçenek bulunamadı.` | Admin (doğru seçeneği olmayan revizyon; form normalde engeller) |
| `VALIDATION_FAILED` | `Aynı soru birden fazla kez seçilemez.` | Admin oturum formu |
| `VALIDATION_FAILED` | `Gönderilen veri geçersiz.` + details `[{path, message}]` (zod alan listesi) | Admin `p.error` (`… — [{"path":…}]`); mobil profil formu (yalnızca metin) |
| `QUESTION_NOT_APPROVED` | `Onaylanmamış soru planlanamaz.` + details `{questionId, status}` | Admin oturum formu |
| `INTERNAL` | `Kullanıcı adı üretilemedi.` | İlk GET /me (profil oluşturma) → Profil yüklenemedi durumu (§3.7) |
| WS iptal ayrıntıları | `API süreci canlı oturum sırasında yeniden başladı` · `Planlanan başlangıç kaçırıldı (API kapalıydı)` · `İlk soru açılamadı` · `Soru {N} açılamadı` · `Soru {questionId}` (UUID) | Mobil iptal panosu gövdesi (§4.11) |

İstemci üretimi ek metinler (sunucudan gelmez): `Cevabın zaten kayıtlıydı.` (tekrar makbuz), `Cevabın iletilemedi; bağlantı gelince aynı cevapla tekrar denenir.` (unknown), `Abonelik başarısız` (subscribe hatası yedeği), admin `HTTP {status}` / `Hata` yedekleri. Tam liste Ek A.

### 6.9 Kapsam dışı — tasarlanmayacaklar

Aşağıdakiler için ekran, sekme, rozet, “Yakında” kartı, kilitli ikon veya yer tutucu **çizme**. Keşif amaçlı eskiz yapılacaksa ayrı bir “M1/M2 önerisi — uygulanmadı” bölümüne koy.

| Konu | Neden |
|---|---|
| Ödül, ödül havuzu, kazanan vitrini, sponsor | K-7 / A-5: hukuki, mağaza ve operasyon kararı yok; sahte ödül yasak |
| Haftalık sıralama, lig, sezon, terfi | K-2 / A-2: haftalık hesap kuralı açık (altı gün toplamı mı, en iyi beş gün mü); veri var, ürün kararı yok |
| Ödeme, premium, mağaza, satış ortaklığı (Radar’da “satın al”) | K-1, K-4; yarışmada hiçbir şey satın alınamaz |
| Düello, arkadaş, kulüp, davet, **paylaşım** | ROADMAP M2+; puanı artıramaz (K-3). §4.19’daki paylaşım kartı fikri yalnızca bu ayrı sayfada |
| Bildirim merkezi, push, hatırlatıcı | Kapsam dışı; “21:00” taahhüdü yok |
| Görsel/ses/eşleştirme/sıralama soru tipleri | M0 yalnızca 4 seçenekli metin sorusu |
| Seri (streak), rozet/başarım, seviye, birleşik skor | K-3 ve K-6; öğrenme iddiası üretir |
| Yedi yan modülün kartları (Bilgi Yolculukları, Bugün Ne Yapsam?, Yaşayan Şehir, Kültür Pasaportu, Kültür Kulüpleri, Farklı Bakışlar) | Brief §3: boş ekran/yer tutucu yasağı; Kültür sekmesi = yalnızca Radar |
| Görsel, kapak, poster, stok fotoğraf | Lisans; metin odaklı içerik |
| AI içerik üretim arayüzü | Model çağrısı yok; yalnızca üretim yöntemi alanı |
| “Adil”, “hile korumalı”, “ping telafili”, “100 bin kişiye hazır” iddiaları | ARCHITECTURE §8; gecikme telafisi yok |
| Potansiyel puan göstergesi (“doğruysa ≤ N”) | İstemci saati sunucu `receivedAt`’ından farklıdır; telafi/adalet algısı üretir (§4.7) |
| Karanlık mod, özel font, logo/ikon seti — **varlık olarak** | A-1 marka kilitlenmedi; token ve öneri olarak tasarlanır (§1.3 F, §1.4, §1.9), uygulama varlığı olarak teslim edilmez |
| Analitik gösterge paneli (admin) | API var, ürün kararı yok |
| İkinci cihaz devralma, “oturumu buraya taşı” | `PARTICIPATION_EXISTS`: M0’da devralma yok |

### 6.10 Açık sorular — kurucuya sorulacaklar

Claude Design bu soruları kurucuya **tek tek, evet/hayır veya seçenekli** sorar; cevaplanmadan nihai karar varsaymaz. Her soruda varsayılan belirtilir; sapma `[M1+]` etiketlenir. “Kapalı” işaretli sorular belgede karara bağlanmıştır; yalnızca itiraz varsa açılır.

1. **A-1 Ad/marka:** “Merak” çalışma adı tescil, alan adı ve mağaza taraması yapılmadan kalsın mı? Logotype bir yazı tipi ayarıyla sınırlı mı tutulsun? (Varsayılan: evet; ikona/illüstrasyona ad gömülmez.)
2. **A-2 Haftalık hesap:** altı gün toplamı mı, en iyi beş gün mü? (M0’da gösterilmez; M1 eskizi iki varyantla hazırlanır.)
3. **A-3 Süre ve erişilebilirlik:** Belgelenen kırılmalar şunlardır — ekran okuyucuyla 12 sn’de cevaplanabilir soru yalnızca prompt ≤ 60 + seçenek ≤ 20 karakterdir (§4.15/1); 1.6× ölçekte kaydırmasız prompt bütçesi 390×844’te ≈ 80, 360×800’de ≈ 60 karakterdir (§1.4/2). Seçenekler: (a) zamanlı sorular için editoryal üst sınır konsun mu (öneri: prompt ≤ 160 / seçenek ≤ 60 — 1.0×’te kaydırmasız sığar; daha sıkı seçenek prompt ≤ 120 / seçenek ≤ 40), (b) süre değişsin mi, (c) uzun prompt kaydırmalı kalsın ve “zamanlı yarışmada eşit erişim iddiası yok” notu mu yeterli? (Varsayılan: c + raporlama. Zamanlayıcı ve seçenekler hiçbir seçenekte küçülmez.)
4. **A-4 Geç katılım:** açık soruya kalan süreyle girilsin mi (alternatif), yoksa mevcut kural (açık soru dâhil 0 puan) mı kalsın? Uyarı bileşeni tek yerden değişecek şekilde tasarlanır.
5. **A-5 Ödül:** ödülsüz etiketler hangi karardan sonra kalkar? (Tasarımda etiket kalıcıdır; kaldırma takvime bağlı otomatik bir adım değildir.)
6. **A-6 İlgi alanları:** yalnızca profil alanı mı, kişiselleştirme girdisi mi? (Varsayılan: profil alanı; onboarding’de ilgi seçici **tasarlanmaz**, §2.5’teki ekran yalnızca “kişiselleştirme” cevabı gelirse çizilir.)
7. **Font ailesi:** sistem fontu (SF/Roboto) mu kalsın, yoksa Türkçe glifleri ve `tnum`’u doğrulanmış tek bir OFL aile (Inter, Manrope, IBM Plex Sans) token olarak mı önerilsin? Yön A seçilirse serif başlık ailesi hangisi? (Soru ekranı her durumda sans.)
8. **Caption büyük harf — kapalı (varsayılan b):** BÜYÜK HARF + locale-duyarlı dönüşüm (§1.4/1). İtiraz yoksa kapalı; alternatif (küçük harf + harf aralığı) karşılaştırma sayfasında durur.
9. **Karanlık mod önceliği:** `userInterfaceStyle: light` sabit. Dark token seti M1’de mi, pilot öncesi mi uygulanır? (Varsayılan: tasarım çıktısı light; dark yalnızca §1.3 F tablosu ve P2 örnek çerçeveler.)
10. **Ses ve titreşim:** M0’da yok; M1+ için §1.8 seti (varsayılan kapalı, kabulde `selection`, reveal’da yok) uygun mu?
11. **Kabul rozeti tonu — kapalı:** nötr `status/neutral`, glifsiz (T1/1).
12. **Debug göstergesi — kapalı:** `v{stateVersion}` son kullanıcıdan gizli (T1/2); admin oturum kartında görünür kalır.
13. **Admin diyalogları:** tarayıcı prompt/confirm yerine satır içi onay paneli M1’de mi?
14. **Oturum kartı CTA etiketleri:** iptal edilmiş oturumda her iki durumda `Ayrıntı` önerisi (§3.3) kabul mü? Katılmamış kullanıcı için tamamlanmış oturumda `Detay` mı, `Sonuçlar` mı?
15. **Tab bar mimarisi (K-8):** beş sekme kullanılabilirlik testine kadar sabit mi?

### 6.11 Başarı ölçütleri — kabul kontrol listesi

Tasarım kabul kontrol listesinin tamamı **Ek D**’dedir. Madde numaraları aynıdır: §6.11/n = Ek D/n (ör. §6.11/10 = duyuruların iki platformda test edilmesi; Ek D/15 = Türkçe büyük harf ve düz kesme/tırnak yokluğu). Her ekran teslimi Ek D’deki maddelerin tamamını geçmeden “tamam” sayılmaz.


---

## Ek A — Hata kodları ve Türkçe mesajlar (tam liste)

Kaynak: `packages/contracts/src/common.ts` (`ErrorCodeSchema`, `errorMessagesTr`), `apps/api/src/common/errors.ts` (HTTP durumları), sunucu modüllerindeki `AppError(..., mesaj)` çağrıları, `apps/mobile/src/lib/api.ts`, `apps/admin/src/lib/api.ts`, `apps/mobile/src/features/auth/AuthProvider.tsx`. Hata zarfı: `{ error: { code, message, details?, requestId? } }`. Mesajlar **aynen** gösterilir; seviye ve konum kuralları §6.7/9 ve §6.8’dedir.

### A.1 `errorMessagesTr` — 29 kod

| Kod | HTTP | Mesaj (aynen) | Seviye | Mobilde nerede | Admin’de nerede |
|---|---|---|---|---|---|
| `AUTH_REQUIRED` | 401 | `Devam etmek için giriş yapmalısın.` | Hata | Ekranın StateView’ı / durum satırı / preview hata satırı + `Tekrar dene` (as-built; otomatik `/login` yok — §6.8/3) | `p.error` |
| `AUTH_INVALID_TOKEN` | 401 | `Oturum doğrulanamadı. Lütfen yeniden giriş yap.` | Hata | Aynı (as-built); `[M1+]` 401 → `signOut` + `Yeniden giriş yap` | `p.error` |
| `AUTH_TOKEN_EXPIRED` | 401 | `Oturumun süresi doldu. Lütfen yeniden giriş yap.` | Hata | Aynı (as-built); `[M1+]` çerçevesi `StateView · oturum süresi doldu` | `p.error` |
| `FORBIDDEN` | 403 | `Bu işlem için yetkin yok.` | Hata | (Mobilde admin rotası yok) | `p.error` (rol yetersiz) |
| `NOT_FOUND` | 404 | `Aradığın kayıt bulunamadı.` | Hata | İçerik detayı StateView; quiz `error` fazı (T1/12 → `Yarış sekmesine dön`); preview hata satırı | `p.error` |
| `VALIDATION_FAILED` | 400 | `Gönderilen veri geçersiz.` (+ `details` alan listesi) | Hata | Profil formu (form altı satır); preview (bozuk saklanmış katılım belirteci); cevap satırı | `p.error` + ` — {JSON}` |
| `RATE_LIMITED` | 429 | `Çok hızlı istek gönderdin. Biraz bekleyip tekrar dene.` | Hata (ret satırı) | Cevap satırı (30 cevap / 10 sn); preview | `p.error` |
| `PAYLOAD_TOO_LARGE` | 413 | `İstek çok büyük.` | Hata | Cevap satırı (nadir) | Form `p.error` (gövde > 32 KB) |
| `USERNAME_TAKEN` | 409 | `Bu kullanıcı adı alınmış.` | Hata | `[M1+]` kullanıcı adı alanı altı (API hazır, mobil formda alan yok) | — |
| `CONTENT_NOT_PUBLISHED` | 404 | `Bu içerik henüz yayında değil.` | Hata | İçerik detayı StateView (T1 değil; `[M1+ küçük düzeltme]` ghost `Geri dön`) | — |
| `SESSION_NOT_JOINABLE` | 409 | `Bu oturuma şu anda katılınamıyor.` | Hata (sakin) | Preview hata satırı — pratikte yalnızca taslak oturum (§4.4) | — |
| `SESSION_CANCELLED` | 409 | `Bu oturum iptal edildi.` | Bilgi | Katılımda → iptal panosu gövdesi; cevap sırasında → ret satırı, ardından iptal panosu; WS iptal mesajı yedeği | — |
| `SESSION_COMPLETED` | 409 | `Bu oturum tamamlandı.` | Bilgi (gösterilmez) | Katılımda → sonuç yüklenir; cevap sırasında → ret satırı, ardından `completed` | — |
| `PARTICIPATION_EXISTS` | 409 | `Bu oturuma başka bir cihazdan katıldın. M0 sürümünde ikinci cihaz devralamaz.` | Hata (sakin) | Preview hata satırı; ikinci cihaz çerçevesi (zorunlu) | — |
| `PARTICIPATION_TOKEN_INVALID` | 403 | `Katılım bilgin doğrulanamadı. Oturuma yeniden katıl.` | Hata | Cevap satırı; socket aboneliği düşerse preview/error’da (`[M1+]` ghost `Yeniden katıl`) | — |
| `NOT_PARTICIPANT` | 403 | `Bu oturuma katılmış görünmüyorsun.` | Hata | Cevap satırı | — |
| `QUESTION_NOT_OPEN` | 409 | `Soru henüz açılmadı.` | Hata (ret satırı) | Cevap satırı (saat kayması; oturum `live` değilken) | — |
| `QUESTION_CLOSED` | 409 | `Sorunun süresi doldu; bu cevap kabul edilmedi.` | Hata (ret satırı; suçlayıcı değil) | Cevap satırı; ardından `expired` | — |
| `NOT_ELIGIBLE_FOR_QUESTION` | 409 | `Bu soru açıldıktan sonra katıldığın için cevaplayamazsın. Bir sonraki sorudan devam et.` | Hata (ret satırı) — önceden bildiren kilit satırı ise Uyarı | Cevap satırı (saat kayması); normalde geç katılım uyarısı önler | — |
| `ANSWER_ALREADY_ACCEPTED` | 409 | `Bu soru için cevabın zaten kabul edildi; cevap değiştirilemez.` | Bilgi | Kabul olarak işlenir + resync; metin `[M1+]` rozet altında | — |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | `Aynı istek anahtarıyla farklı bir cevap gönderildi; istek reddedildi.` | Hata (ret satırı) | Cevap satırı | — |
| `OPTION_INVALID` | 400 | `Seçenek bu soruya ait değil.` | Hata (ret satırı) | Cevap satırı; seçenekler açılır | — |
| `QUESTION_NOT_APPROVED` | 409 | `Onaylanmamış soru planlanamaz.` | Hata | — | Oturum formu `p.error` |
| `QUESTION_COUNT_INVALID` | 400 | `Oturumda tam olarak beş soru olmalı.` | Hata | — | Oturum formu `p.error` |
| `INVALID_TRANSITION` | 409 | `Bu durum geçişi şu anda yapılamaz.` | Hata | Sonuç yükleme (özel mesajla, §6.8b) | İnceleme eylemleri, iptal (çoğunlukla özel mesajla) |
| `REVISION_STALE` | 409 | `Kayıt sen açtıktan sonra değişti. Yeniden yükle.` | Hata | — | `p.error` (as-built, düğmesiz); `[M1+]` bant + `Yeniden yükle` |
| `SCHEDULE_IN_PAST` | 400 | `Başlangıç zamanı gelecekte olmalı.` | Hata | — | Oturum formu `p.error` |
| `SCHEDULER_NOT_LEADER` | 503 | `Canlı oturum zamanlayıcısı bu süreçte etkin değil.` | Hata (operasyon) | — | Operasyon/`GET /ready`; panelde nadir |
| `INTERNAL` | 500 | `Beklenmeyen bir hata oldu. Lütfen tekrar dene.` | Hata | Her yerde son çare; `describeError` bilinmeyen hatalar için de kullanır (ör. socket açılamadı) | `p.error` |

### A.2 Sunucu özel mesajları (errorMessagesTr dışında, aynen) — §6.8b ile aynı tablo

| Kod | Mesaj (aynen) | Nerede görünür |
|---|---|---|
| `NOT_FOUND` | `Soru bu oturuma ait değil.` | Mobil cevap satırı (POST answers; normalde görülmez) |
| `NOT_FOUND` | `Soru bulunamadı: {id}` | Admin oturum planlama `p.error` |
| `NOT_PARTICIPANT` | `Önce oturuma abone ol.` | WS `state.resync` ack’i; istemci resync hatasını göstermez (UI’da görünmez) |
| `INVALID_TRANSITION` | `Oturum henüz tamamlanmadı.` | Sonuç yükleme (GET result) → `completed` × sonuç yüklenemedi StateView’ı (§4.2, T1/21) |
| `INVALID_TRANSITION` | `Oturum zaten tamamlandı veya iptal edildi.` | Admin `İptal et` `p.error` |
| `INVALID_TRANSITION` | `'{from}' durumundan '{action}' yapılamaz.` (ham enum; ör. `'draft' durumundan 'approve' yapılamaz.`) | Admin Sorular/İçerik `p.error`; enum Türkçeleştirme `[M1+]` |
| `VALIDATION_FAILED` | `Ret için gerekçe zorunlu.` | Admin Reddet |
| `VALIDATION_FAILED` | `Bu slug zaten kullanılıyor.` | Admin içerik formu |
| `VALIDATION_FAILED` | `Doğru seçenek bulunamadı.` | Admin (doğru seçeneği olmayan revizyon; form normalde engeller) |
| `VALIDATION_FAILED` | `Aynı soru birden fazla kez seçilemez.` | Admin oturum formu |
| `VALIDATION_FAILED` | `Gönderilen veri geçersiz.` + details `[{path, message}]` (zod alan listesi) | Admin `p.error` (`… — [{"path":…}]`); mobil profil formu (yalnızca metin) |
| `QUESTION_NOT_APPROVED` | `Onaylanmamış soru planlanamaz.` + details `{questionId, status}` | Admin oturum formu |
| `INTERNAL` | `Kullanıcı adı üretilemedi.` | İlk GET /me (profil oluşturma) → Profil yüklenemedi durumu (§3.7) |
| WS iptal ayrıntıları | `API süreci canlı oturum sırasında yeniden başladı` · `Planlanan başlangıç kaçırıldı (API kapalıydı)` · `İlk soru açılamadı` · `Soru {N} açılamadı` · `Soru {questionId}` (UUID) | Mobil iptal panosu gövdesi (§4.11) |

### A.3 İstemci kaynaklı metinler (sunucudan gelmez)

| Kaynak | Metin (aynen) | Nerede |
|---|---|---|
| Mobil `NETWORK` (sözde kod) | `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.` | StateView offline mesajı; durum satırı; preview |
| Admin `NETWORK` | `API’ye ulaşılamadı (http://localhost:3000).` (kodda düz `'`; tasarımda `’`) | `p.error` |
| Admin bilinmeyen | `HTTP {status}` · `Hata` | `p.error` yedekleri |
| Mobil cevap — tekrar makbuz | `Cevabın zaten kayıtlıydı.` | Kodda üretilir, gösterilmez (`[M1+]` rozet altında) |
| Mobil cevap — teslim bilinmiyor | `Cevabın iletilemedi; bağlantı gelince aynı cevapla tekrar denenir.` | `unknown` satırı + `Tekrar gönder` |
| Mobil socket aboneliği | `Abonelik başarısız` (sunucu mesajı yoksa yedek) | `preview`/`error` fazında hata satırı |
| Mobil bağlantı şeridi | `Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.` · `Yeniden bağlanılıyor… durum sunucudan yenilenecek.` | §4.12 |
| Kimlik (GoTrue) eşlemesi — giriş/kayıt | `E-posta veya şifre hatalı.` · `Bu e-posta zaten kayıtlı. Giriş yapmayı dene.` · `Şifre en az 8 karakter olmalı.` · `Kimlik sunucusuna ulaşılamadı. Yerel stack çalışıyor mu?` · eşleşmeyen mesaj ham İngilizce (`[M1+ küçük düzeltme]`: `Giriş yapılamadı. Lütfen tekrar dene.`) | Giriş/Kayıt form altı satır |
| Kayıt — oturum dönmezse | `Kayıt alındı; e-posta doğrulaması gerekiyor olabilir. Giriş yapmayı dene.` | Kayıt form altı satır |
| Admin girişi | GoTrue ham İngilizce (eşleme yok; `[M1+ küçük düzeltme]` aynı Türkçe sığınak) | Admin giriş `p.error` |

### A.4 Sözleşme doğrulama metinleri

| Şema | Metin (aynen) | Nerede |
|---|---|---|
| `UsernameSchema` (3–24, `^[a-z0-9_]+$`) | `Küçük harf, rakam ve alt çizgi kullan.` | `[M1+]` kullanıcı adı alanı |
| `AdminQuestionInputSchema` (tam 4 seçenek, tek doğru) | `Tam olarak bir doğru seçenek olmalı.` | Admin soru formu (details içinde) |

### A.5 İptal sebepleri ve kullanıcıya giden metin

| `cancelledReason` | `cancelReasonTr` (kart ve `Sebep:` gövdesi) | WS `session.cancelled.message` (aynen; yalnızca ekran açıkken) |
|---|---|---|
| `admin_cancelled` | `yönetici iptal etti` | Admin’in yazdığı gerekçe (3–300 karakter) |
| `server_restart` | `sunucu yeniden başladı` | `API süreci canlı oturum sırasında yeniden başladı` |
| `missed_start` | `başlangıç kaçırıldı` | `Planlanan başlangıç kaçırıldı (API kapalıydı)` |
| `question_approval_withdrawn` | `bir sorunun onayı geri çekildi` | `İlk soru açılamadı` · `Soru {N} açılamadı` · lobi öncesi `Soru {questionId}` (UUID; `[M1+ küçük düzeltme]` gösterme) |
| `question_revision_changed` | `bir soru değiştirildi` | Lobi öncesi `Soru {questionId}` (UUID; aynı not) |
| (ayrıntı yok) | — | `Bu oturum iptal edildi.` |

Oturum sonradan açılırsa (GET) ayrıntı gelmez; gövde `Sebep: {cancelReasonTr}.` olur. Kart gövdesi: `İptal edildi ({cancelReasonTr}).` Dipnot: `Verdiğin cevaplar denetim için saklanır; bu oturum sıralamaya girmez.`

## Ek B — Mevcut token değerleri (`tokens.ts`)

### B.1 `apps/mobile/src/theme/tokens.ts` (aynen, T0)

```ts
/**
 * Swappable design tokens. Not a final brand: colors, type scale, spacing, radius and motion are
 * the only things screens reference, so a later brand pass touches this file first.
 */
export const colors = {
  bg: '#F6F3EE', // warm paper
  surface: '#FFFFFF',
  surfaceMuted: '#EFEAE2',
  ink: '#17161A',
  inkMuted: '#5E5A66',
  inkFaint: '#9A96A3',
  line: '#E2DDD4',
  // culture/learning: calm
  accent: '#1F5F5B', // deep teal
  accentSoft: '#DCEBE8',
  // live competition: energetic
  live: '#D9480F',
  liveSoft: '#FDE4D8',
  success: '#2B7A3D',
  successSoft: '#DDF1E1',
  danger: '#B42318',
  dangerSoft: '#FBE3E0',
  warning: '#A15C00',
  warningSoft: '#FDEFD8',
  overlay: 'rgba(23,22,26,0.55)',
} as const;

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.4, textTransform: 'uppercase' as const },
  mono: { fontSize: 14, lineHeight: 20, fontFamily: 'monospace' as const },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const touch = { min: 48 } as const;
export const motion = {
  // Keep motion short; never delay content or answer feedback behind an animation.
  fast: 120,
  base: 200,
} as const;

export const shadow = {
  card: { shadowColor: '#17161A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
} as const;
```

Diğer sabitler (T0): `T` bileşeni tüm metinlerde `maxFontSizeMultiplier={1.6}`; seçenek butonu `minHeight 56`; tab bar yükseklik 64, `paddingTop 6`, `paddingBottom 8`, etiket 12/600; `app.json` → `userInterfaceStyle: 'light'`, splash/arka plan `#F6F3EE`; özel font yok (sistem fontu).

### B.2 `apps/admin/src/styles.css` değişkenleri (aynen, T0)

```css
:root { --bg:#F6F3EE; --surface:#fff; --ink:#17161A; --muted:#5E5A66; --line:#E2DDD4; --accent:#1F5F5B; --live:#D9480F; --ok:#2B7A3D; --warn:#A15C00; --danger:#B42318; }
```

Admin sabit renkleri (T0): `.badge` zeminleri `#EFEAE2` (draft), `#FDEFD8` (review), `#DCEBE8` (approved, scheduled), `#DDF1E1` (published, completed), `#FBE3E0` (rejected, cancelled), `#FDE4D8` (live, lobby); `.warnbox` `#FDEFD8`; düğme `min-height: 36px`, `padding: 6px 14px`; giriş `padding: 8px 10px`, radius 8; etiket 12 px w700 büyük harf; gövde 15/1.45.

### B.3 T1 değişiklik özeti (değerlerin tek kaynağı §1.3)

| Token | T0 | T1 | Neden (§1.3 C) |
|---|---|---|---|
| `inkFaint` → `text/tertiary` | #9A96A3 | #6F6B78 (yalnızca bg/surface üzerinde) | 2.61/2.89 → 4.68/5.18 |
| `live` (metin, live buton, seçili seçenek, rozet, tint) → `live/default` | #D9480F | #B5380A | #FFF üstünde 4.30 → 5.94; liveSoft üstünde 3.53 → 4.88 |
| `live/vivid` (yeni ad) | — | #D9480F (yalnızca progress dolgusu ve ≤3 sn sayaç rakamı) | Büyük metin 3.88 ≥ 3 |
| `success` | #2B7A3D | #256B36 | successSoft üstünde 4.49 → 5.48 |
| `border/input` (yeni) | — (`line` kullanılıyor) | #8A8791 | Etkileşimli sınır 1.35 → 3.53 |
| `type.caption.textTransform` | `'uppercase'` | locale-duyarlı (`toLocaleUpperCase('tr-TR')`; web `lang="tr"`) | `GÜNÜN 5’I` → `GÜNÜN 5’İ` |
| `type.display/h1.fontWeight` | `'800'` | iOS `'800'`, Android `'700'` | Android 800 → 700/900 belirsizliği |
| Admin `--live` / `--ok` | #D9480F / #2B7A3D | #B5380A / #256B36 | Aynı kontrast nedenleri (T1/17) |

`space`, `radius`, `touch`, `motion`, `shadow` değerleri değişmez. Dark değerleri yalnızca §1.3 F’dedir (`[M1+]`).


---

## Ek C — Mevcut mikro-metinler (ekran bazında)

Bu ek, bugün kodda bulunan (T0) bütün kullanıcıya görünür metinleri ekran ekran listeler. Çerçevelerdeki her dize buradan **birebir** alınır. “Tasarımda” sütunu yalnızca T1 düzeltmesini (§0.1) veya `[M1+]` önerisini gösterir; boşsa metin aynen kullanılır. Hata kodlarının metinleri Ek A’dadır. `{…}` veriden gelen alanı gösterir.

### C.1 Ortak bileşenler

| Öğe | Metin (T0, aynen) | Tasarımda |
|---|---|---|
| StateView loading | `Yükleniyor…` | — |
| StateView empty | `Henüz bir şey yok` / `Burası yakında dolacak.` | — |
| StateView error | `Bir sorun oldu` / `Tekrar denemek ister misin?` (ekranlar mesaj yerine API metnini geçer) | — |
| StateView offline | `Bağlantı yok` / `İnternete bağlanınca kaldığın yerden devam edebilirsin.` | — |
| Retry düğmesi | `Tekrar dene` | — |
| Ağ hatası | `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.` | — |
| Stack geri | `Geri` | — |

### C.2 Tab bar ve stack başlıkları

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Sekmeler | `Ana Sayfa` · `Keşfet` · `Yarış` · `Kültür` · `Profil` | — |
| İçerik detayı başlığı | (boş) | — |
| Canlı oturum başlığı | `Günün 5’i · Test` | Tint `live/default` (T1/7) |

### C.3 Giriş — `/(auth)/login`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Kelime işareti | `Merak` | Wordmark adayı (§1.9) |
| Slogan | `Her akşam beş soru. Her gün biraz kültür.` | Ton referansı; takvim vaadi değil |
| Alan etiketleri | `E-posta` · `Şifre` | — |
| Yer tutucular | `sen@ornek.com` · `••••••••` | — |
| Birincil düğme | `Giriş yap` | — |
| İkincil bağlantı | `Hesap oluştur` | — |
| Dipnot | `M0 yerel test sürümü. Yarışmalar ödülsüzdür; katılım ücretsizdir.` | small inkMuted (T1/10) |
| Hatalar | `E-posta veya şifre hatalı.` · `Bu e-posta zaten kayıtlı. Giriş yapmayı dene.` · `Şifre en az 8 karakter olmalı.` · `Kimlik sunucusuna ulaşılamadı. Yerel stack çalışıyor mu?` · (eşleşmeyen: ham İngilizce) | Eşleşmeyen için `Giriş yapılamadı. Lütfen tekrar dene.` `[M1+ küçük düzeltme]` |

### C.4 Kayıt — `/(auth)/register`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Başlık | `Hesap oluştur` | — |
| Ortam notu | `Yerel test ortamında e-posta doğrulaması kapalıdır.` | — |
| Alan etiketleri | `E-posta` · `Şifre (en az 8 karakter)` | — |
| Birincil düğme | `Kaydol` | — |
| İkincil bağlantı | `Zaten hesabım var` | — |
| Oturum dönmezse | `Kayıt alındı; e-posta doğrulaması gerekiyor olabilir. Giriş yapmayı dene.` | Assertive duyuru (§3.2) |

### C.5 Ana Sayfa — `/(tabs)/index`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Selamlama | `Merhaba, {displayName}` (caption → `MERHABA, AYŞE`); profil yoksa `Merhaba` | small, normal yazım `Merhaba, Ayşe` `[M1+ küçük düzeltme]` |
| Başlık | `Bugün ne öğreniyoruz?` | — |
| Günlük görev etiketi | `Günlük görev` · `{learningXpTotal} XP` | — |
| Günlük görev başlığı (sunucu) | `Bugün 3 farklı içerik tamamla` | — |
| Görev durumu | `{progress}/{target} içerik · Europe/Istanbul gününe göre` · `Bugünkü görev tamam.` | `[M1+]` `{progress}/{target} içerik · gün 00:00 İstanbul saatinde yenilenir` |
| Progress etiketi (a11y) | `Günlük görev ilerlemesi` | — |
| Bölüm başlığı | `Keşif kartları` | — |
| Kart yok | `Yayınlanmış kart yok.` | — |

### C.6 Günün 5’i oturum kartı (`QuizSessionCard`, Ana Sayfa ve Yarış)

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Boş kart | `Günün 5’i` · `Planlanmış test oturumu yok` · `Yönetim panelinden ödülsüz bir test oturumu planlandığında burada görünür.` | `[M1+]` `Şu an planlanmış bir oturum yok. Yeni bir ödülsüz test oturumu planlandığında burada görünür.` |
| Caption | `Günün 5’i · ödülsüz test` | Büyük harf `GÜNÜN 5’İ · ÖDÜLSÜZ TEST` (T1/6) |
| Durum rozetleri | `Taslak` (kullanıcıya gelmez) · `Planlandı` · `Bekleme salonu açık` · `Canlı` · `Tamamlandı` · `İptal edildi` | — |
| scheduled | `Başlangıç: {geri sayım} sonra · {n} soru · {s} sn/soru` | ≤0 → `Başlıyor…` `[M1+ öneri]` (as-built `Başlangıç: şimdi sonra …`) |
| lobby | `{geri sayım} sonra başlıyor · {n} katılımcı` | ≤0 → `Başlıyor…` `[M1+ öneri]` |
| live | `Şu an canlı · {konum}/{n}. soru` | — |
| completed | `Sonuçlar hazır.` | — |
| cancelled | `İptal edildi ({sebep}).` | — |
| CTA | `Katıl` · `Bekleme salonu` · `Oturuma dön` · `Sonucu gör` · `Detay` | İptalde `Ayrıntı` `[M1+ küçük düzeltme]` |
| Geri sayım biçimi | `şimdi` · `{h} sa {m} dk` · `{m} dk {s} sn` · `{s} sn` | — |
| İptal sebepleri | `yönetici iptal etti` · `sunucu yeniden başladı` · `başlangıç kaçırıldı` · `bir sorunun onayı geri çekildi` · `bir soru değiştirildi` | — |

### C.7 Keşfet — `/(tabs)/discover`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Başlık | `Keşfet` | — |
| Açıklama | `Kısa kartlar, net kaynaklar. Okuyup “tamamladım” diyerek XP kazanırsın.` | — |
| Çipler | `Tümü` · `Sanat ve Mimari` · `Tarih` · `Bilim ve Doğa` · `Edebiyat` · `Dünya ve Coğrafya` | — |
| Konu boş | `Henüz bir şey yok` / `Bu konuda yayınlanmış kart yok.` | `[M1+]` `Bu konuda kart yok` / `Başka bir konu seç.` |
| Kart alt satırı | `{n} dk okuma` | caption `text/tertiary` (T1/10) |
| Kart rozetleri | `Tamamlandı` · `Kayıtlı` | — |
| Radar alt başlığı (liste) | `Kitap · {yazar} · {yıl}` / `Film · {yönetmen} · {yıl}` | — |

### C.8 İçerik detayı — `/content/[id]`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Üst caption | `{konu}` · `Kültür Radarı · Kitap` · `Kültür Radarı · Film` | — |
| Seed rozeti | `Örnek test içeriği` | — |
| Radar satırı | `{yazar/yönetmen} · {yıl}` | — |
| Radar kartı | `Neden öneriyoruz` | — |
| Kaynak kutusu | `Kaynak` · `{kaynak başlığı}` ya da `Belirtilmemiş` · `Kaynağı aç` | — |
| Doğrulama satırı | `Editör tarafından kontrol edildi · TR · sürüm {n}` / `Kaynak henüz editör tarafından doğrulanmadı · TR · sürüm {n}` | Görsel kural §3.5/7 |
| Eylemler | `Tamamladım` → `Tamamlandı ✓` · `Kaydet` ⇄ `Kaydedildi ✓` | — |
| Durum satırı (ilk tamamlama) | `+{xp} XP · toplam {toplam}` + ` · Günlük görev tamamlandı!` | ` · Günlük görev tamamlandı.` (T1/18) |
| Durum satırı (tekrar) | `Bu kartı daha önce tamamlamıştın; XP bir kez verilir.` | — |
| Dipnot | `“Tamamladım” bir öğrenme kanıtı değil, kendi ilerlemeni takip etmen için bir işarettir.` | — |
| Hatalar | `Bu içerik henüz yayında değil.` · `Aradığın kayıt bulunamadı.` | `[M1+ küçük düzeltme]` ghost `Geri dön` |
| Quiz bağlam şeridi | (yok) | `[M1+]` `Günün 5’i` · `Bu kart, az önce oynadığın bir sorunun konusundan.` · `Sonuca dön` |

### C.9 Kültür Radarı — `/(tabs)/culture`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Başlık | `Kültür Radarı` | — |
| Açıklama | `Editör seçkisi: dört kitap ve film önerisi, kısa gerekçeyle. Beğendiğini kaydet.` | — |
| Boş | `Henüz bir şey yok` / `Burası yakında dolacak.` | `[M1+]` `Radar’da henüz seçki yok` / `Editör seçkisi yayınlandığında burada görünür.` |
| Seed seçkiler | `Tutunamayanlar` · `Sapiens` · `Bir Zamanlar Anadolu’da` · `Ruhların Kaçışı` | — |

### C.10 Profil — `/(tabs)/profile`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Başlık | `Profil` | — |
| Kimlik satırı | `@{kullanıcıadı}` + (rol üye değilse) ` · editor` / ` · admin` | Rozet `Editör` / `Admin` `[M1+ küçük düzeltme]` |
| İstatistikler | `Öğrenme XP` · `Tamamlanan` · `Kayıtlı` (veri yokken son ikisi `–`) | — |
| İlgi alanları | `İlgi alanları: {liste}` / `İlgi alanları: henüz seçilmedi` | small inkMuted (T1/10) |
| Düzenleme | `Profili düzenle` · yer tutucular `Görünen ad` · `İlgi alanları (virgülle: sanat, tarih)` · `Kaydet` · `Vazgeç` | — |
| Geçmiş başlığı | `Yarışma geçmişi` | — |
| Ayrım notu | `Yarışma puanı ile öğrenme XP’si ayrı tutulur; bu puanlar XP’ye dönüşmez.` | — |
| Geçmiş satırı | `{tarih} · {puan} puan · {sıra}. sıra` · `{tarih} · iptal edildi` · `Sonucu gör` | rank null → `{puan} puan · sıralama dışı`; iptal → `iptal edildi · {sebep}`; tarih `15 Ekim 2026, 21:00` (`[M1+ küçük düzeltme]`) |
| Geçmiş boş | `Henüz bir oturuma katılmadın.` | `[M1+]` başlık `Henüz oturum yok` |
| Kaydettiklerim | `Kaydettiklerim` · boş: `Kaydettiğin içerik yok.` | `[M1+]` `Bir kartta “Kaydet”e dokununca burada birikir.` |
| Çıkış | `Çıkış yap` | `[M1+]` onay: `Çıkış yapmak istiyor musun?` · `Kayıtlı içeriklerin ve XP’n hesabında kalır.` · `Canlı bir oturuma katıldın; çıkarsan sen yokken kapanan sorular 0 puan sayılır.` |
| Kullanıcı adı alanı | (yok) | `[M1+]` `Kullanıcı adı` · `Küçük harf, rakam ve alt çizgi; 3–24 karakter.` · `Sıralamada bu adla görünürsün.` |

### C.11 Yarış — `/(tabs)/play`

| Öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Başlık | `Yarış` | — |
| Açıklama | `Herkes aynı anda, aynı beş soru. Doğru ve hızlı cevap daha çok puan; yanlış cevap elemez.` | — |
| Kurallar başlığı | `Kurallar (M0 deneme ayarı)` | — |
| Kural 1 | `• Soru başına 12 saniye; puan 60–100 arası, hız sunucu saatine göre hesaplanır.` | `[M1+]` süre `session.rules`’tan |
| Kural 2 | `• İlk kabul edilen cevap geçerlidir; değiştirilemez.` | — |
| Kural 3 | `• Geç katılırsan henüz açılmamış sorulardan itibaren yarışırsın.` | — |
| Kural 4 | `• Bu sürümde oturumlar ödülsüz yerel testtir.` | — |

### C.12 Canlı oturum — `/quiz/[id]` (faz bazında)

| Faz / öğe | Metin (T0) | Tasarımda |
|---|---|---|
| Üst satır | `Ödülsüz test oturumu` + rozet `v{stateVersion}` | Rozet gizli (T1/2) |
| loading | `Yükleniyor…` | — |
| error | `Bir sorun oldu` + API metni + `Tekrar dene` | NOT_FOUND’da ghost `Yarış sekmesine dön` (T1/12) |
| preview | `{n} soru · soru başına {s} sn · {k} katılımcı` · `Başlangıç: {tarih}` · `Katıl` · `Katılım ücretsizdir. Bu sürümde ödül yoktur.` | Dipnot caption inkMuted (T1/10); tarih biçimi `[M1+ küçük düzeltme]` |
| joining | `Katılınıyor…` | — |
| scheduled | `Katıldın` · `Bekleme salonu {geri sayım} sonra açılır.` · `{k} katılımcı bekliyor. Sorular herkese aynı anda, sunucu saatine göre açılır.` | ≤0 → `Bekleme salonu açılıyor…` `[M1+ öneri]` |
| lobby | `Bekleme salonu` · `İlk soru {geri sayım} sonra açılır. Hazır ol.` · aynı katılımcı satırı | ≤0 → `Başlıyor…` `[M1+ öneri]` |
| question | `Soru {p}/{t}` · `{s} sn` (a11y `{s} saniye kaldı`) · progress a11y `Kalan süre` · seçenek a11y `Seçenek {i}: {metin}` | — |
| Geç katılım | `Bu soru sen katılmadan önce açıldı; bir sonraki sorudan itibaren yarışacaksın.` | — |
| Cevap durumu | `Bir seçenek seç. İlk kabul edilen cevap geçerlidir.` · `Gönderiliyor…` · `Cevabın kabul edildi` · (ret metni) · `Cevabın iletilemedi; bağlantı gelince aynı cevapla tekrar denenir.` + `Tekrar gönder` | İpucu small inkMuted (T1/10); rozet nötr (T1/1) |
| expired | `Süre doldu` · `Doğru cevap sunucudan geliyor… Yeni cevap kabul edilmez.` · `Durumu yenile` | Pano kilitli kalır (T1/4) |
| reveal | `Soru {p}/{t} · sonuç` · `Doğru · +{puan} puan` · `Yanlış · 0 puan` · `Cevapsız · 0 puan` · `Açıklama` · `Sonraki soru {s} sn içinde.` · `Son soruydu. Sonuçlar hesaplanıyor…` · a11y `, doğru cevap` / `, senin cevabın` | Yerel seçim notu `Bu seçim sunucuya ulaşmadı; cevapsız sayıldı.` (T1/20) |
| completed | `Sonuç hesaplanıyor…` · `Oturum tamamlandı` · `{puan} puan` · `{d}/{n} doğru · {sıra}. sıra / {k} katılımcı` (ya da `sıralama dışı`) · `Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.` · `Merakın devam etsin` · `Kartı aç` · `Sorular` · `Soru {p}` · `+{puan}` · `0 puan` · `cevapsız` · `Doğru: {metin}` · `Senin cevabın: {metin}` · `İlgili kart` · `Sıralama` · `{sıra}. {kullanıcıadı} (sen)` | İzleyici: `Bu oturuma katılmadın` · `{k} katılımcı · sonuçlar aşağıda` `[M1+ küçük düzeltme]`; yüklenemezse StateView (T1/21); `[M1+]` `İlk 50 gösteriliyor` |
| cancelled | `Oturum iptal edildi` · (WS mesajı) ya da `Sebep: {sebep}.` · `Verdiğin cevaplar denetim için saklanır; bu oturum sıralamaya girmez.` | Dipnot small inkMuted (T1/10) |
| Bağlantı şeridi | `Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.` · `Yeniden bağlanılıyor… durum sunucudan yenilenecek.` | Socket öncesi yok (T1/3) |

### C.13 Yönetim paneli

| Ekran / öğe | Metin (T0, aynen) | Tasarımda |
|---|---|---|
| Sekme başlığı (tarayıcı) | `Merak Yönetim (M0)` | — |
| Üst çubuk | `Merak Yönetim` · `M0 · yerel test` · `Sorular` · `İçerik` · `Oturumlar` · `Denetim` · `{kullanıcıadı} · {rol}` · `Çıkış` | — |
| Yükleniyor | `Yükleniyor…` | — |
| Giriş | `Merak Yönetim` · `Editör veya admin hesabıyla giriş yap. Yerel seed: editor@merak.local / admin@merak.local` · `E-posta` · `Şifre` · `Giriş` | Hata sığınağı `[M1+ küçük düzeltme]` |
| Yetki yok | `Yetki yok` · `Bu hesap ({kullanıcıadı}) editör veya admin değil. Rol sunucuda doğrulanır; gizli bir buton yoktur.` · `Çıkış` | — |
| Sorular araç çubuğu | `Sorular ({n})` · `Tümü` · ham durumlar · `Yeni soru` · `Seçilileri test-onayla + yayınla ({n})` | Durum etiketleri §6.1/6 `[M1+ küçük düzeltme]` |
| Sorular warnbox | `Ödüllü sorularda insan onayı zorunludur. Seed soruları “örnek test içeriği”dir; kaynakları editör tarafından doğrulanmamıştır. Düzenleme yapınca önceki onay geçersiz olur.` | — |
| Soru kartı | `{konu} · v{n} · {yöntem}` · ` · örnek test içeriği` · `Düzenle` · `Açıklama: {metin}` · `Kaynak: {bağlantı|—} · doğrulandı|doğrulanmadı · {dil}` · ` · inceleme: {tarih} ({not})` | — |
| Soru eylemleri | `İncelemeye gönder` · `Onayla` · `Reddet` · `Havuza yayınla` · `Arşivle` · `Yeniden aç` · başarı `{eylem}: tamam` | — |
| Soru diyalogları | `Ret gerekçesi (zorunlu):` · `Onay notu (isteğe bağlı). Kaynağı gerçekten kontrol ettin mi?` · `{n} soruyu incelemeye gönder → onayla → yayınla. Bu bir TEST onayıdır; gerçek editoryal inceleme yerine geçmez. Devam?` · not `TEST ONAYI — toplu işlem, insan incelemesi değildir` | Satır içi panel `[M1+]` |
| Soru formu | `Yeni soru` · `Soruyu düzenle (yeni revizyon v{n}; onay sıfırlanır)` · `Konu` · `Üretim yöntemi` · `Soru metni` · `Seçenekler (tam olarak bir doğru)` · `Seçenek 1..4` · `Açıklama (reveal sonrası gösterilir)` · `Kaynak URL` (`https://`) · `Kaynak başlığı` · `Kaynağı bizzat kontrol ettim (doğrulandı etiketi)` · `İlgili içerik id (isteğe bağlı)` (`uuid`) · `Değişiklik gerekçesi (denetim kaydı)` · `Kaydet` · `Vazgeç` | Düzenleme uyarısı genişletilir (§6.3/6) `[M1+ küçük düzeltme]` |
| İçerik | `İçerik ({n})` · `Yeni kart / Radar önerisi` · `Kullanıcılar yalnızca yayınlanmış revizyonu görür. Yayındaki bir kartı düzenlersen eski revizyon, yeni revizyon yayınlanana kadar yayında kalır.` · `Kart` / `Radar` · ` (yayında: eski revizyon)` · `Yayınla` | — |
| İçerik formu | `Yeni içerik` · `İçeriği düzenle (yeni revizyon)` · `Tür` (`Keşif kartı` / `Kültür Radarı önerisi`) · `Konu` · `Başlık` · `Özet` · `Metin` · `Medya` (`Kitap` / `Film`) · `Yazar / Yönetmen` · `Yıl` · `Neden öneriyoruz` · `Okuma süresi (dk)` · `Kaynak URL` · `Kaynak başlığı` · `Kaynağı bizzat kontrol ettim` · `Değişiklik gerekçesi` | — |
| Oturumlar (editör) | `Oturum planlama yalnızca admin rolü için. Editörler soru ve içerik inceleyebilir.` | — |
| Oturumlar (admin) | `Test oturumları` · `M0: yalnızca ödülsüz yerel test. Oturum, seçilen soruların o anki onaylı revizyonunu sabitler; sonradan düzenleme canlı soruyu değiştirmez, zamanlayıcı lobi öncesi yeniden doğrular.` · `Yeni oturum planla` · `Başlık` (varsayılan `Ödülsüz test oturumu`) · `Başlangıç (yerel saat)` · `Soru süresi (sn) — varsayılan 12` · `Reveal süresi (sn) — varsayılan 6` · `Lobi açılış öncesi (sn) — varsayılan 60` · `Sorular (sırayla tam 5 yayınlanmış soru seç) — seçili: {n}/5` · `Havuzda yayınlanmış soru yok. Önce Sorular sekmesinden onayla + yayınla.` · `Planla` · `Oturum planlandı. Soruların onaylı revizyonları sabitlendi.` | Override uyarısı `[M1+]` |
| Oturum kartı | `{tarih} · {k} katılımcı · {c} cevap · v{n} · {kuralSürümü}` · `Detay` · `İptal et` · `İptal: {ham sebep}` · `İptal gerekçesi (kullanıcıya gösterilir):` | `İptal: yönetici iptal etti` `[M1+ küçük düzeltme]` |
| Oturum detay tablosu | `#` · `Soru` · `Rev.` · `Durum` · `Açılış` · `Kapanış` · `Revizyon geçerli mi?` · `evet` · `HAYIR — oturum başlatılmaz` | — |
| Denetim | `Denetim kaydı` · `Önemli yönetim işlemlerinin aktörü, zamanı ve gerekçesi. Aktörü boş olan satırlar sistem (zamanlayıcı/seed) işlemleridir.` · `Zaman` · `Aktör` · `İşlem` · `Hedef` · `Gerekçe` · `Detay` · `sistem` | — |

### C.14 Demo ve seed verisi (çerçevelerde kullanılacak gerçek örnekler)

- **Konular (5):** Sanat ve Mimari · Tarih · Bilim ve Doğa · Edebiyat · Dünya ve Coğrafya.
- **Kartlar (13, metin):** ör. `Kaplumbağa Terbiyecisi’nin hikâyesi` (2 dk), `Mimar Sinan’ın “ustalık eserim” dediği yapı`, `Marie Curie’nin iki Nobel’i`. Hepsi `Örnek test içeriği`, kaynak `doğrulanmadı`, `sürüm 1`.
- **Radar (4):** Tutunamayanlar (Kitap · Oğuz Atay · 1972), Sapiens, Bir Zamanlar Anadolu’da, Ruhların Kaçışı.
- **Sorular (12 taslak):** ör. `İki farklı bilim dalında Nobel Ödülü alan ilk kişi kimdir?`, `DNA’nın çift sarmal yapısını öneren makale hangi yıl yayımlandı?`, `Gazelde şairin mahlasını söylediği son beyte ne ad verilir?`, `“Kürk Mantolu Madonna” romanının yazarı kimdir?`, `Kapadokya’daki peribacaları ağırlıklı olarak hangi kaya türünden oluşur?`
- **Hesaplar:** üyeler `ayse`, `mehmet`; `editor@merak.local`; `admin@merak.local` (`merak_admin`).
- **Demo oturumu:** `Web demo — ödülsüz test`, 5 soru, 8 sn/soru + 3 sn reveal + 25 sn lobi (test override, `m0-v1+test-override`); sonuç ayse 0 · mehmet 97 (2 katılımcı).
- **Günlük görev:** `Bugün 3 farklı içerik tamamla` (hedef 3, İstanbul günü); ilk tamamlama 10 XP.

## Ek D — Kabul kontrol listesi

Her teslim aşağıdaki maddelerin tamamını geçmeden “tamam” sayılmaz. Madde numaraları §6.11 ile aynıdır. Her madde evet/hayır işaretlenir; “hayır” ise gerekçe ve `VARSAYIM`/`[M1+]` notu yazılır.

**Durum kapsamı**
1. [ ] Mobilde her liste ekranı (Ana Sayfa, Keşfet, Kültür, Yarış, Profil alt listeleri) için durumlar çizildi: loading (`Yükleniyor…`), loaded, empty (ekrana özgü kopya: `Yayınlanmış kart yok.`, `Bu konuda yayınlanmış kart yok.`, `Henüz bir şey yok` / `Burası yakında dolacak.`, `Henüz bir oturuma katılmadın.`, `Kaydettiğin içerik yok.`; Yarış’ta boş = `Planlanmış test oturumu yok` kartı), error (`Bir sorun oldu` + API metni + `Tekrar dene`), offline (`Bağlantı yok` + `İnternete bağlanınca kaldığın yerden devam edebilirsin.`). Yarış’ta kurallar kartı her durumda görünür.
2. [ ] Canlı oturum: 11 faz; `question` × 5 cevap durumu (idle, submitting, accepted, rejected, unknown) + geç katılım kilidi; `expired`; `reveal` × 4 varyant; `completed` × katılımcı/izleyici × sonuç yüklendi/yüklenemedi; `cancelled` × 5 sebep × (WS mesajı / yalnızca `Sebep:`); bağlantı şeridi × 2 (yalnızca socket açıldıktan sonra).
3. [ ] Oturum kartı: 5 kullanıcı durumu × katıldı/katılmadı + boş = 11 çerçeve (Taslak kullanıcıya gelmez) + ≤0 geri sayım varyantı; CTA matrisi (`Katıl` / `Bekleme salonu` / `Oturuma dön` / `Sonucu gör` / `Detay`).
4. [ ] Admin: Yükleniyor (sol hizalı düz metin), Giriş, Yetki yok, editör, admin, Profil alınamadı; her sayfada `p.ok` / `p.error`; `REVISION_STALE` as-built `p.error` (+ `[M1+]` bant); form doğrulama hatası (`Gönderilen veri geçersiz.` + alan listesi).

**Erişilebilirlik**
5. [ ] Tüm dokunulabilirler ≥ 48 × 48 pt; Keşfet çipleri 48 pt (T1/8, hitSlop yok); seçenekler ≥ 56 pt; admin düğmeleri ≥ 40 px.
6. [ ] Kontrast: normal metin (< 24 pt normal / < 18.66 pt bold) ≥ 4.5:1, 12 pt caption dahil; büyük metin (display, h1, ≥ 20 pt w700 h2 — sayaç dahil) ≥ 3:1; etkileşimli bileşen sınırı ve odak halkası ≥ 3:1. Ölçüm tablosu §1.3 ile birebir; bilinen ihlaller (inkFaint, live/beyaz, live/liveSoft, success/successSoft 4.49, `line` kenarlıklar) T1/7 değerleriyle çözüldü; `text/tertiary` yalnızca canvas/surface üzerinde.
7. [ ] 1.6× ölçekte hiçbir ekran kırpılmıyor; soru ekranı §1.4/2 bütçesine göre 80 ve 400 karakterlik prompt ile çerçevelendi (prompt bölgesi kaydırılır, seçenekler + durum satırı + sayaç sabit); şerit slotu bütçeden düşüldü; tab etiketi 1.3×; `TextInput` 1.6× tavanlı; 1.6× tavanının WCAG 1.4.4 altında bilinçli bir sınırlama olduğu A-3 raporunda yazılı.
8. [ ] Renk tek taşıyıcı değil: doğru/yanlış ✓/✗ + metin + kenarlık; seçili seçenek `selected` (+ hint), `disabled` yalnızca seçilmemiş kilitlilerde; sayaç `N saniye kaldı`; progress `accessibilityValue`; alındı rozeti nötr ve glifsiz.
9. [ ] Reduced motion: §1.7’deki her hareketin RM eşdeğeri tanımlı; soru açılışı, cevap geri bildirimi ve reveal hiçbir animasyonu beklemez; yığın/sekme geçişleri RM’de `animation: 'none'`; sayaç ve progress saniyede bir adım.
10. [ ] Duyurular: hatalar assertive, durum/bağlantı polite; her duyuru iki platformda test edildi (Android `accessibilityLiveRegion`, iOS `announceForAccessibility`, §0.3); zamanlı akışta yalnızca açılış ve 3 sn duyurusu (§4.15/1).

**Kopya ve ton**
11. [ ] Tüm dizeler Ek C ve koddaki kopyayla birebir; `errorMessagesTr` (Ek A.1) ve sunucu özel mesajları (§6.8b) yeniden yazılmadı; yeni dizeler T1 ya da `[M1+]` etiketli.
12. [ ] `ödülsüz test` etiketi §6.7/5’teki 7 zorunlu konumda mevcut; sahte sayaç, kazanan, sponsor, ödül, `Yakında` yok.
13. [ ] `puan` ve `XP` hiçbir bileşende birlikte toplanmıyor; renk bağlamları ayrık (live vs accent); Profil tamamen sakin palet.
14. [ ] Küçümseyen/övgü dili, ünlem ve öğrenme başarısı iddiası yok; `“Tamamladım” bir öğrenme kanıtı değil…` dipnotu detayda.
15. [ ] Türkçe büyük harf (`İ`) bütün caption örneklerinde doğru; hiçbir çerçevede düz kesme/tırnak yok (arama: ASCII 0x27, 0x22); tr-TR tarih/saat/sayı biçimleri §6.7/7 ile uyumlu.
16. [ ] Kaynak bloğu ve `Örnek test içeriği` rozeti her seed içerikte; doğrulama satırı §3.5/7’ye uygun (doğrulanmamış kaynak glif, warning veya danger taşımıyor).

**M0 gerçeğiyle uyum**
17. [ ] Her ekrandaki her veri alanı bir sözleşme alanına eşlenir (ContentCardSummary, ContentDetail, QuizSessionSummary, OpenQuestionView, RevealView, SessionResultView, LearningProgress, Profile, AdminQuestion…); sözleşmede olmayan alan (avatar, görsel, haftalık puan, e-posta) ekranda yok.
18. [ ] Süreler `session.rules` alanlarından gelir; sabit `12` yalnızca `Kurallar (M0 deneme ayarı)` kartında ve `[M1+]` onboarding ekranında deneme ayarı etiketiyle.
19. [ ] M0 dışı her öğe `[M1+]` ile işaretli ve ayrı sayfada; T1 düzeltmeleri ana çerçevelerde `T1/n` notuyla; işaretsiz öneri yok.
20. [ ] Tasarım yalnızca token’larla (renk, tip, boşluk, radius, hareket) ifade edildi; marka değişikliği `tokens.ts` üzerinden yapılabilir; ekran başına özel renk yok.
21. [ ] Ekran görüntüleri (Expo web 390×844) kanıt sayılmadı: iOS/Android güvenli alanlar, çentik, home indicator, klavye kaçınma (giriş/kayıt/profil formları) ve 64 pt tab bar ayrıca belirtildi; 390×844 ve 360×800 çerçeveleri var.
22. [ ] Açık sorular (§6.10) listelendi; her birinde varsayılan + alternatif yazılı; cevaplanmamış soru için kesin karar yazılmadı.

**Ek maddeler**
23. [ ] Yarış sekmesi (§3.8) çerçeveleri: loading/error/offline/loaded × oturum kartı (5 durum × katıldı/katılmadı + boş) + kurallar kartı.
24. [ ] Akışlar A–E (§2.6–§2.10) `from` değerleriyle belgelendi; üç prototip akışı (§5.9/4) gerçek sürelerle çalışıyor, 3-2-1 perdesi yok.
25. [ ] `v{stateVersion}` rozeti hiçbir mobil çerçevede yok (admin oturum kartında görünür kalır).
26. [ ] Bağlantı şeridi `loading/error/preview/joining` fazlarında yok; `question`/`expired`’de rezerve slotta, seçenekler kaymıyor (§4.12).
27. [ ] Lisansı belirsiz görsel, kapak, poster, stok fotoğraf ve görsel yer tutucu yok.
28. [ ] Teslim öncelikleri (§5.9/0): P0 (≈44 çerçeve) eksiksiz; P1 ve P2 kapsamı ayrı listelendi.
29. [ ] Handoff sayfası: T1 listesi (§0.1) ile çerçeve eşlemesi, varsayımlar listesi, A-3 erişilebilirlik raporu, token JSON/CSS dışa aktarımı, §5.10 eşleme tablosu.
30. [ ] Yönetim paneli: enum Türkçe etiketleri `[M1+]` notuyla; cevap anahtarı yalnızca panelde (editör ve admin); `Planla` tek turuncu düğme; §6.1/10 erişilebilirlik maddeleri; T1/17 renkleri.
