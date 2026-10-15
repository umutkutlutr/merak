# Yol Haritası

| Aşama | Amaç | Çıkış kanıtı | Durum |
|---|---|---|---|
| **M0 (bu teslim)** | Mimari, yerel çalışma ortamı ve iki ana deneyimin ince fakat gerçek uygulaması | İki kullanıcıyla canlı oturum; kalıcı puan; sonuçtan kültür içeriğine geçiş; ayrı XP | Teslim edildi — bkz. `docs/reports/M0_DELIVERY_REPORT.md` |
| M1 | Yarışma güvenilirliği, hız adaleti deneyi, haftalık toplamlar ve operasyon | Kesinti/iptal/düzeltme testleri; gecikme ölçümü; 100 → 1.000 eşzamanlı test sonuçları | Başlatılmadı |
| M2 | Günlük alışkanlık ve içerik operasyonu | Görevler; temel arkadaşlık; kaydetme; Kültür Radarı; AI taslak–editör–yayın akışı | Başlatılmadı |
| M3 | 100–200 kişilik kontrollü pilot hazırlığı | Mobil cihaz doğrulaması; kullanılabilirlik; destek ve gizlilik akışları; canlı/dışı kullanım ölçümü | Başlatılmadı |
| Sonrası | Bağlılık, ticaret, ekosistem | Pilot verisine ve ortaklıklara göre seçilecek modüller | — |

Maddi ödülün açılması takvime bağlı otomatik bir adım değildir; ayrı ürün, hukuk ve operasyon kararıdır.

## Yedi yan modül (korunuyor, iptal değil)

| Modül | Başlangıç yaklaşımı | M0’daki altyapı izi |
|---|---|---|
| Kültür Radarı | M0’da küçük editoryal kitap/film seçkisi; M2’de tercih ve kaydetme üzerinden gelişim | `content_items.kind = radar_pick`, 4 öneri, kaydetme çalışıyor |
| Bilgi Yolculukları | Keşif içeriği altyapısını kullanacak; program/tekrarlar pilot sonrası | `topics` + `content_items` + `learning_completions` |
| Bugün Ne Yapsam? | Etkinlik verisi ve iş ortaklığı doğrulandıktan sonra | — |
| Yaşayan Şehir | Pilot sonrası İstanbul odaklı dar deneme | — |
| Kültür Pasaportu | Kaydetme/ilerleme altyapısı ve gerçek dünya kullanımından sonra | `saved_items`, `learning_xp_events` |
| Kültür Kulüpleri | Arkadaşlık kullanımı ve moderasyon kapasitesi doğrulandıktan sonra | — |
| Farklı Bakışlar | Kaynak ve editoryal süreç olgunlaştıktan sonra; yüksek denetim gerektirir | Revizyon/kaynak/onay modeli |

M0’da gelecek modüller için boş ekran, kullanılmayan tablo veya eklenti sistemi üretilmedi.

## Bu sprintin kapsam dışı işleri (bilinçli)

- Haftalık sıralama, lig terfileri, sezonlar, ödül tahsisi
- Ödeme, premium, sponsorluk, satış ortaklığı bağlantıları
- Görsel/ses/eşleştirme/sıralama soru tipleri
- Düellolar, arkadaşlık, kulüpler, bildirimler
- AI içerik üretimi entegrasyonu (üretim yöntemi alanı hazır; model çağrısı yok)
- Çoklu API instance, Redis, yayın dağıtımı, sıralama önbelleği
- Gecikme telafisi (RTT) ve adalet deneyleri
- Üretim ortamı, mağaza gönderimi, ücretli servis kurulumu
- Native (iOS/Android) cihaz doğrulaması (bu ortamda yapılamadı; bkz. teslim raporu)

## M1 için ölçek planı (öneri, uygulanmadı)

Bağlantı sayısı ile “soru açıldıktan sonraki toplu cevap trafiği” ayrı ölçülür.

| Adım | Senaryo | Ölçülecek metrikler | Büyütme koşulu |
|---|---|---|---|
| 100 | Tek API, tek PostgreSQL; 100 WS bağlantısı, 100 eşzamanlı cevap/soru | p50/p95 `receivedAt − clientSentAt` (tanı), WS yayın gecikmesi, DB lock bekleme, hata oranı | p95 kabul < 300 ms, 0 çift kayıt |
| 1.000 | Aynı mimari; 1.000 bağlantı, 1.000 cevap/2 sn | + CPU/bellek, event-loop gecikmesi, pool doluluğu | p95 < 500 ms; yayın < 1 sn; aksi hâlde Socket.IO Redis adapter ve 2 instance |
| 10.000 | 2–4 API instance + Redis adapter; scheduler tek lider (advisory lock) | + Redis gecikmesi, lider devri süresi, PostgreSQL yazma IOPS | p95 < 800 ms; yazma darboğazı varsa cevap kayıtlarında toplu/sıralı yazma |
| 50.000 | Yük dengeleyici, WS sticky session; sıralama önbelleği | + yeniden bağlanma fırtınası, snapshot isteği oranı | Snapshot isteği < bağlantı × 0.2/dk |
| 100.000 | Bölgesel dağıtım kararı | Maliyet/gecikme | Pilot verisine göre |

Her adımda K05–K06 davranışları (tek cevap, sınırda ret) yük altında yeniden kanıtlanmalıdır.
