# Claude Code — İlk geliştirme ve proje mimarisi promptu

Sürüm: 1.0 · 14 Ekim 2026

Bu dosyanın tamamı Claude Code'a verilecek çalışma talimatıdır. Kaynak olarak kurucunun paylaştığı **Master Brief V1.0 — Hibrit Kültür, Mikro Öğrenme ve Sosyal Rekabet Platformu** metnini de kullan. Kaynak dosyanın yüklenen adı `Yapıştırılan metin(20261014-192405).txt` olabilir.

## 1. Görevin ve çalışma ilişkimiz

Bu projenin teknik lideri ve uygulayıcı geliştiricisisin. Kurucu ürünün nihai karar sahibidir. ChatGPT ürün sahibi, danışman ve teslimat denetçisi olarak kapsamı, öncelikleri ve kabul ölçütlerini yönetecek. Teknik uygulama, çalışan kod, migration, gerekli testler ve kanıtlı teslim raporu senin sorumluluğunda.

Bu talimatın amacı **M0: proje mimarisini ve çalışan ilk uçtan uca ürün kesitini kurmak**. Yalnızca öneri veya mimari metin yazıp bitirme; belirtilen kapsamı uygula ve çalıştır. Bütün uzun vadeli ürünü bu görevde geliştirme.

Önce mevcut çalışma klasörünü ve varsa repo talimatlarını incele. Mevcut çalışmayı silme veya gereksiz yeniden yazma. Mevcut kod varsa bu sprint için gerekli uyarlamayı yap; çalışan farklı bir teknoloji tercihi varsa göç maliyetini değerlendir. Boş projede aşağıdaki başlangıç mimarisini kullan.

Kaynak brief varsa özgün haliyle `docs/product/MASTER_BRIEF.md` içine al. Bulamazsan aşağıdaki bağlayıcı özetle ilerle, özgün belge eksikliğini raporla; tam metni okumuş gibi davranma. Ana briefteki uzun vadeli araştırma taleplerini bu sprintte tümünü gerçekleştirme talimatı sayma. **Bu görev için geliştirme sırasını bu prompt belirler; sonradan gelen kurucu kararları önceliklidir.**

Ürün kararlarını üç sınıfta tut: `KESİN`, `M0_DENEY_AYARI`, `AÇIK`. Teknik uygulama tercihlerini ayrıca gerekçelendir. Bir deneme ayarını kurucunun nihai kararı olarak yazma.

## 2. Ürünün korunacak özü

Türkiye'de başlayacak, geniş kitleye hitap eden, eğlenerek bilgi ve kültür kazandıran mobil bir platform geliştiriyoruz. İki temel deneyim birlikte çalışacak:

- **Canlı rekabet:** Haftada altı gün, Pazartesi–Cumartesi, herkesin aynı belirlenmiş saatte katıldığı ücretsiz beş soruluk “Günün 5'i”. Doğru ve hızlı cevap daha fazla puan kazandırır; yanlış cevap puan getirmez ve kullanıcıyı elemez.
- **Günlük kültür ve öğrenme:** Kısa keşif kartları, görevler, ilerleme, kitap/film önerileri ve zamanla gerçek dünya keşifleri. Uygulama yarışma saatinin dışında da değerli olmalıdır.

Kesin ilkeler:

1. Yarışmaya giriş ücretsizdir. Katılım, ek puan, hız avantajı veya kazanma şansı satın alınamaz.
2. Haftalık sıralama ve ödüller hedef ürün kapsamındadır; uzun sezonlarda daha büyük ödüller planlanır. Paris seyahati gibi örnekler taahhüt veya hazır sponsor anlaşması değildir.
3. Yarışma puanı ile öğrenme XP'si ayrıdır. Keşif, davet, premium üyelik ve gelecekteki düellolar ödüllü yarışma puanını artırmaz.
4. Canlı yarışma edinim ve geri dönüş mekanizmasıdır. Gelir adayları sponsorluk, kültürel ticaret, gelişmiş öğrenme hizmetleri ve ileride B2B ürünlerdir. Bu sprintte ödeme sistemi kurulmaz.
5. AI destekli içerik üretimi kalıcı operasyon vizyonudur. Ödüllü sorularda insan onayı zorunludur. Kaynak ve editoryal denetim AI çıktısıyla ikame edilemez.
6. Premium, modern, güçlü tipografili, yetişkinlere de hitap eden bir deneyim hedeflenir. Öğrenme seviyesi üzerinden küçümseyen dil kullanılmaz.
7. Maddi ödüllü yayın, hukuki/mağaza uygunluğu ve ödül operasyonu doğrulanmadan açılmaz. **M0 yalnızca ödülsüz yerel testtir.** Bu ifade hukuki uygunluk değerlendirmesi değildir.
8. Ana bilgi mimarisi Ana Sayfa, Keşfet, Yarış, Kültür, Profil olmak üzere beş bölüm önerisi üzerine kurulur. Bu navigasyon M0 tasarım varsayımıdır; kullanılabilirlik bulgusuyla değiştirilebilir.
9. Ürün adı belirlenmedi. Teknik repo adı gerekiyorsa `culture-platform` kullan; bunu marka kararı sayma.

## 3. Yol haritası ve bu görevin sınırı

| Aşama | Amaç | Çıkış kanıtı |
|---|---|---|
| M0 — Bu görev | Mimari, yerel çalışma ortamı ve iki ana deneyimin ince fakat gerçek uygulaması | İki kullanıcıyla canlı oturum; kalıcı puan; sonuçtan kültür içeriğine geçiş; ayrı XP |
| M1 | Yarışma güvenilirliği, hız adaleti deneyi, haftalık toplamlar ve operasyon | Kesinti/iptal/düzeltme testleri; gecikme ölçümü; 100 ve ardından 1.000 eşzamanlı test sonuçları |
| M2 | Günlük alışkanlık ve içerik operasyonu | Görevler; temel arkadaşlık; kaydetme; Kültür Radarı; AI taslak–editör–yayın akışı |
| M3 | 100–200 kişilik kontrollü pilot hazırlığı | Mobil cihaz doğrulaması; kullanılabilirlik; destek ve gizlilik akışları; canlı ve yarışma dışı kullanım ölçümü |
| Sonraki aşamalar | Bağlılık, ticaret ve ekosistem | Pilot verilerine ve ortaklıklara göre seçilecek modüller |

M1 ve sonraki aşamalar bu görevde otomatik başlatılmayacak. Her aşamanın kapsamı önceki teslim raporuna göre güncellenir. Maddi ödülün açılması takvime bağlı otomatik bir adım değildir; ayrı ürün ve operasyon kararıdır.

Yedi yan modülün hepsini yol haritasında koru:

| Modül | Başlangıç yaklaşımı |
|---|---|
| Kültür Radarı | M0'da küçük editoryal kitap/film seçkisi; M2'de tercih ve kaydetme üzerinden gelişim |
| Bilgi Yolculukları | Keşif içeriği altyapısını kullanacak; gelişmiş program ve tekrarlar pilot sonrası |
| Bugün Ne Yapsam? | Etkinlik verisi ve iş ortaklığı doğrulandıktan sonra |
| Yaşayan Şehir | Pilot sonrası İstanbul odaklı dar deneme |
| Kültür Pasaportu | Kaydetme/ilerleme altyapısı ve gerçek dünya kullanımından sonra |
| Kültür Kulüpleri | Arkadaşlık kullanımı ve moderasyon kapasitesi doğrulandıktan sonra |
| Farklı Bakışlar | Kaynak ve editoryal süreç olgunlaştıktan sonra; yüksek denetim gerektirir |

Bu sıralama başlangıç ürün önerisidir; modüllerin iptali değildir. M0'da gelecek modüller için boş ekranlar, kullanılmayan tablolar veya geniş eklenti sistemleri üretme. Veri ilişkilerini konu/kategori/içerik kimlikleriyle genişlemeye uygun kurmak yeterli.

## 4. Başlangıç teknik mimarisi

Önerilen yapı **TypeScript monorepo + modüler monolit backend**. Ürün küçükken bağımsız mikroservisler, Kubernetes, Kafka veya her modül için ayrı veritabanı kurma.

| Katman | Başlangıç tercihi | Sorumluluk |
|---|---|---|
| Mobil | React Native + Expo + Expo Router + TypeScript | iOS/Android kullanıcı deneyimi; development build yolu |
| API | Node.js + NestJS | Kimlik doğrulama, iş kuralları, yönetim API'leri, canlı oturum otoritesi |
| Canlı iletişim | Socket.IO | Soru/durum yayını, cevap alındısı, yeniden bağlantı |
| Kalıcı veri | PostgreSQL | Kabul edilen cevaplar, puanlar, yayın sürümleri, içerik ve denetim kayıtları |
| Kimlik | Supabase Auth | Yerelde gerçek test kullanıcıları; doğrulanmış oturumlar |
| Admin | React + Vite + TypeScript | Dar editoryal onay ve test yarışması yönetimi |
| Arka plan işleri | Gerektiğinde aynı backend kodundan worker | İçerik üretimi ve diğer ertelenebilir işler; M0'da ihtiyaç yoksa ayrı süreç açma |
| Analitik | Sağlayıcıdan bağımsız olay şeması + yerel kayıt | Yarışma ve kültür kullanımını ayrı ölçmek |

PostgreSQL ve Supabase için ikinci bir uygulama veritabanı yaratma; yerel Supabase'in PostgreSQL'i uygulama verisi için de kullanılabilir. Şema erişim yetkilerini bilinçli tasarla.

M0'da tek API instance'ı yeterlidir. Redis zorunlu değildir. Çoklu instance, yayın dağıtımı ve sıralama önbelleği ihtiyacını M1 ölçümleriyle değerlendir. Socket.IO yeniden bağlantısını veri güvenilirliği garantisi sayma: uygulama katmanında kalıcı cevap kaydı, tekrar güvenliği ve güncel durumu yeniden alma gerekir.

Örnek dizin sınırları: `apps/mobile`, `apps/api`, `apps/admin`, `packages/contracts`, `packages/config`, `docs`. Worker ve ek paketleri ancak gerçek ihtiyaç varsa ekle. `packages/contracts` içinde yalnızca istemciye açık veri sözleşmeleri bulunmalı; doğru cevap anahtarlarını ve sunucu puanlama otoritesini mobil pakete taşıma.

Backend'in ilk modül sınırları: identity/access, profiles, editorial-content, question-bank, live-quiz, scoring/results, learning-progress, analytics, admin/audit. Bunlar ayrı servisler değildir. Modüller arası veri sahipliği açık olsun; her modülün her tabloya yazabildiği dağınık bir yapı kurma.

Uygun ORM, doğrulama ve test araçlarını seçip birer kısa gerekçe yaz. ORM şemasının yanı sıra gerçek veritabanı unique/foreign key kısıtlarını ve transaction davranışını uygula. Çalışan repo varsa araçları sırf tercih farkından değiştirme.

Paket/SDK/Node sürümlerini uygulama gününde resmi dokümantasyondan kontrol et. Uyumlu ve desteklenen kararlı sürümleri sabitle; beta/canary kullanma. Lockfile ve runtime sürümü repoda bulunsun. Expo'nun desteklediği React Native sürümünü kullan. Erişim yoksa doğrulanmamış sürümü “en güncel” ilan etme.

İlk dağıtım mimarisini uzun ömürlü bağlantıya uygun container/VM hizmeti ve PostgreSQL olarak tarif et. M0'da yerel çalışmayı tamamla; ücretli kaynak açma, üretim ortamı yayımlama veya mağazaya gönderme.

## 5. M0'da gerçekten çalışacak ürün kesiti

### 5.1. Kullanıcı ve mobil temel

- Yerel Supabase Auth üzerinden kayıt, giriş, oturumu koruma ve çıkış. Yerel test e-postaları yeterli; gerçek SMTP/SMS kurulumu bu görevi bloklamasın.
- Kullanıcı adı ve basit profil. Temel ilgi alanı seçimi birkaç konu etiketiyle sınırlı olabilir.
- Beş ana bölümün çalışır navigasyonu. Kültür bölümünde yalnızca gerçekten uygulanmış küçük Radar seçkisi görünsün; yedi boş modül kartı gösterme.
- Ana Sayfa: sıradaki test yarışması, birkaç keşif kartı ve öğrenme ilerlemesi. Sahte kullanıcı sayısı, kazanan, sponsor veya hazır olmayan ödül gösterme.

### 5.2. Kültür ve öğrenme tarafı

- En az üç kategoride toplam 12 örnek mikro içerik. Metin odaklı kartlar yeterli; lisansı belirsiz görsel/kapak kullanma.
- Kart listesi → detay → kaynak bilgisi → açık bir “tamamladım” veya hatırlama etkileşimi → kaydetme.
- Tamamlama bir kez XP kazandırsın; yenileme ve tekrar istekleri XP çift yazmasın. Örnek XP miktarı deney ayarıdır.
- Günlük görev örneği: “Bugün 3 farklı içerik tamamla.” Gün sınırı Europe/Istanbul'a göre hesaplanır. M0'da görev tamamlamak ayrıca ödül veya yarışma puanı vermez.
- Kültür Radarı'nda toplam dört editoryal kitap/film önerisi, kısa öneri gerekçesi ve kaydetme. Ücretli veri API'si ve satış ortaklığı bağlantısı gerekmez.
- Kullanıcının kaydettikleri ve XP'si yeniden giriş sonrası korunur. Tamamlama, öğrenme başarısının bilimsel kanıtı gibi sunulmaz.

### 5.3. Canlı yarışma tarafı

- Admin, onaylı sorulardan beş soruluk **ödülsüz test oturumu** oluşturabilsin, yakın bir başlangıç zamanına planlayabilsin ve iptal edebilsin.
- En az iki bağımsız kullanıcı aynı oturumda aynı soruları aynı sunucu takvimine göre görsün. Bir cihazdaki yerel sayaç diğer kullanıcıların oturumunu yönetmesin.
- Bekleme salonu → soru → cevap alındısı → süre kapandıktan sonra doğru cevap/açıklama → sonraki soru → oturum sonucu.
- Başlangıçta dört seçenekli, tek doğru cevaplı metin sorusu yeterli. Görsel, ses, eşleştirme ve sıralama tipleri M0 kapsamı değildir.
- Hız puanı sunucuda hesaplanır. Yanlış cevap ve cevapsız soru sıfır puandır; eleme yoktur.
- Oturum sonucu kullanıcının gerçek cevabı, doğru sayısı, soru puanları ve toplamını göstersin. İki kullanıcı için oturum sıralaması çalışsın.
- Sonuçtan en az bir ilgili kültür kartına geçiş çalışsın. Yarışma sonrası kültür kullanımını ölçen olay üretilsin.
- Haftalık sıralama, lig terfileri, sezonlar ve ödül tahsisi bu görevde uygulanmaz; veri modeli bunları kalıcı oturum sonuçlarından sonradan üretmeye elverişli olsun.

### 5.4. Yönetim ve içerik güveni

- Admin kullanıcı rolü sunucuda doğrulansın. Mobilde buton gizlemek yetkilendirme sayılmaz.
- Basit soru/kart düzenleme, kaynak görme, inceleme ve onay/yayın işlemleri olsun. M0'da içerik editör onayı kapısından geçsin; ücretli canlı AI entegrasyonu gerekmez. Otomatik testlerin editör hesabıyla verdiği onay yalnızca test onayıdır, gerçek insan incelemesi sayılmaz. Yerel test verisi üretime taşınamaz.
- Soru havuzunda iki test oturumuna yetecek en az 10 soru bulunsun. Seed içerik “örnek test içeriği” olarak ayırt edilsin; otomatik yüklemek editör onayı anlamına gelmesin.
- Soru/kart için kaynak URL'si, kaynak başlığı, dil, kategori, üretim yöntemi, inceleme durumu ve sürüm bulunsun. Gerçekten kontrol edilmemiş kaynağa doğrulanmış etiketi koyma.
- Soru düzenlenirse eski onay geçersiz olsun. Planlanan oturum, onaylı sorunun belirli ve değişmez sürümünü kullansın; sonradan düzenleme canlı soruyu sessizce değiştirmesin.
- En az `draft → review → approved → published` yaşam döngüsünü, ret/yeniden düzenleme davranışıyla kur. Planlanmış soru onayının sonradan geri çekilmesi halinde oturumu yeniden doğrula veya başlatma.
- Önemli admin işlemlerinin aktörü, zamanı ve gerekçesi kaydedilsin.

## 6. Deneme kuralları: nihai ürün kararı değildir

Bu ayarları `docs/product/DECISIONS.md` içinde M0_DENEY_AYARI olarak kaydet. Ayarlar yayınlanmış/başlamış oturumda değişmesin; her oturum kullandığı kural sürümünü saklasın.

| Konu | M0 deneme kararı |
|---|---|
| Saat dilimi | Europe/Istanbul; veritabanında zaman damgaları UTC |
| Genel yayın adayı | Pazartesi–Cumartesi 21.00; M0 admin yerel test için yakın saat seçebilir |
| Soru sayısı | 5 |
| Soru süresi | 12 saniye; okunabilirlik ve erişilebilirlik deneyi bekliyor |
| Puan | Doğru cevaba `round(60 + 40 × (1 − elapsedMs / durationMs))`; 60–100 arası; yanlış/cevapsız/geçersiz 0 |
| Cevap aralığı | `opensAt <= receivedAt < closesAt`; sınır anında ve sonrasında gelen yeni cevap reddedilir |
| Değişiklik | İlk geçerli kabulden sonra cevap değiştirilemez |
| Geç katılım | Henüz açılmamış sorulardan itibaren yarışılır; kaçırılan sorular 0; açık soruya sonradan dahil olup tam süre kazanılamaz |
| Yeniden bağlantı | Aynı kullanıcı önceki katılımıyla döner; açık soruya daha önce dahilse yalnızca kalan ortak süreyi kullanır |
| İkinci cihaz | İlk aktif yarışma katılımı korunur; M0'da ikinci cihaz devralamaz. Uygulama yeniden açılışında katılımın geri alınması güvenli katılım kimliğiyle yapılır |
| Eşit puan | Aynı sıra; görsel sıralamada kullanılan sabit ikinci anahtar ödül/tie-break avantajı değildir |
| API'nin canlı oturum sırasında yeniden başlaması | M0'da oturumu güvenle iptal et, cevap kayıtlarını koru, geçerli sıralamaya dahil etme |
| Haftalık hesap | M1'e kadar açık; altı günün toplamı veya en iyi beş gün seçilmiş sayılmaz |

Hız puanı ilk sürümde yetkili sunucunun aldığı zamana dayanır. **Bu yaklaşım ağ gecikmesini ortadan kaldırmaz ve ödüllü rekabet için tek başına adalet kanıtı değildir.** İstemcinin beyan ettiği tıklama saati veya RTT'yi sorgusuz puandan düşme. Ölçülen RTT/teslim gecikmesi yalnızca tanılama amacıyla ayrı kaydedilsin; istemci verisi güvenilir sunucu ölçümü diye etiketlenmesin. Gecikme telafisi M1'de saldırı ve adalet senaryolarıyla değerlendirilecek.

M0'da 12 saniyenin bütün kullanıcılar için uygun olduğu iddia edilmez. Büyük yazı ve ekran okuyucu kullanımını tasarımda hesaba kat; zamanlı yarışmadaki erişilebilirlik sınırlarını raporla. Üretim öncesi kurallar ayrıca karara bağlanacak.

## 7. Canlı motorun teknik değişmezleri

1. **Sunucu otoritesi:** Mobil istemci doğru cevabı, puanı, geçerli süreyi veya soru açılışını belirleyemez. API JWT'yi imza, süre, issuer/audience beklentileriyle doğrulasın; kullanılan Supabase imzalama türüne uygun doğrulama yolunu seçsin. Kimliği istemci payload'ındaki userId'den alma.
2. **Sızıntı engeli:** Açılmamış soru, seçenekleri, doğru cevap, açıklama ve cevapla ilişkili gizli içerik istemciye önceden gönderilmez. Doğru cevap o sorunun ortak süresi kapanmadan açıklanmaz. Erken cevap alındısı doğruluk/puan sızdırmaz. Kaynak kodu paketleri, genel API'ler, loglar ve Realtime erişimi de bu sınırı korur.
3. **Kalıcı durum:** Oturum ve soru durumlarını açık state machine ile tanımla. Örneğin oturum `draft/scheduled/lobby/live/completed/cancelled`, soru `pending/open/closed/revealed`. Başlangıç/bitiş zamanları, durum sürümü ve aktif soru kalıcıdır. Cihaz timer'ı gösterim içindir; yalnızca bellekte setTimeout zinciri doğruluk kaynağı olamaz.
4. **Tek otorite:** Aynı oturumu iki scheduler'ın ilerletmesini engelle. M0 tek API süreciyse bu sınırı açık yaz; yanlışlıkla ikinci instance açılmasına karşı kullanılan kilit/koruma mekanizmasını göster. Job tekrarında soru iki kez açılmasın.
5. **Tekrarlı gönderim:** Her cevap isteği bir idempotency key taşır. Ayrıca kullanıcı/oturum/soru kimliği için veritabanı tekillik kısıtı vardır. Aynı isteğin tekrarı aynı alındıyı getirir; aynı anahtarla farklı payload veya farklı anahtarla cevap değiştirme reddedilir. Reddedilen geçersiz istek ilk geçerli cevabın hakkını tüketmez.
6. **Kayıp alındı:** Cevabı kabul ettiğini ancak kalıcı transaction başarıyla tamamlandıktan sonra bildir. Kabul cevabı ağda kaybolduysa sonradan tekrar istek/cevap durumu sorgusu aynı kabulü getirsin; soru kapanmış olması daha önce kaydedilmiş alındıyı yok etmesin. Kabul durumu bilinmiyorsa mobil başarı uydurmasın.
7. **Zaman:** `receivedAt` güvenilir sunucu girişinde alınsın; kuyruk/işlem bitiş zamanı ile karıştırılmasın. Açılış/kapanış kontrolü ve kalıcı kaydın yarış koşulları test edilsin. Uygulama saatini değiştirmek süre veya puan avantajı sağlamasın. Sunucu saati bozulması ve yoğunluk M1 risk kaydında yer alsın.
8. **Seçenekler:** İstemci cevabı A/B/C/D sırasıyla değil sabit optionId ile yollar. Kullanıcı bazlı seçenek karıştırma oturum/soru boyunca kararlı olsun; yeniden bağlanınca seçeneklerin anlamı değişmesin.
9. **Yeniden eşitleme:** Bağlantı kesilip gelince yetkili durum snapshot'ı, sunucu zamanı ve kullanıcının kayıtlı cevapları alınsın. Olaylarda sürüm veya sıra numarasıyla eski/tekrar olayları ayıkla. Güncel durum bilinmiyorsa istemci eski soruyu yanıtlanabilir göstermesin.
10. **Puan tutarlılığı:** Cevap kaydı ve puan etkisi tek transaction veya tekrar güvenli hesaplama tasarımıyla bağlı olsun. Sıralama canonical sonuçlardan yeniden üretilebilsin. Cache kaynak veri sayılmaz. Learning XP ve quiz skorları ayrı model ve yazma yollarına sahip olsun.
11. **İptal:** İptal terminal durumdur. İptal sebebi kaydedilir, kullanıcıya gösterilir. Önceden kaydedilen cevaplar denetim için kalır; iptal edilen oturum geçerli rekabet toplamına girmez. Hatalı sorunun puan düzeltmesi M1'de sürümlü yeniden hesaplama olarak tasarlanacak; M0'da sessiz kayıt değiştirme yapılmaz.
12. **Sınırlar:** İstek boyutu, cevap endpoint'i hız sınırı, WS kimlik doğrulaması ve yetkisiz oda erişimi korunur. Kullanıcıya başka katılımcının özel cevap geçmişi/e-postası açılmaz. Admin ve cevap anahtarlarına erişim sadece yetkili backend yollarından olur; public şema/RLS yetkileri ayrıca doğrulanır.

M0'da “hileyi çözdük”, “kesin adil”, “tam exactly-once ağ teslimi” veya “100 bin kişiye hazır” iddiası üretme. Sağladığın uygulama etkilerini ve bilinen sınırlarını ayrı yaz.

## 8. Veri modeli ve API sözleşmeleri

Yalnızca M0'ın kullandığı tabloları oluştur. Beklenen varlıklar: profile, topic/category, content item ve revision/source, saved item, learning completion/XP event, question revision ve server-only answer key, quiz session, session question, participant, answer receipt, session result, analytics event, admin audit.

Tablo sayısı veya adları zorunlu değildir; kavramsal sorumluluklar zorunludur. Bazı ilişkiler daha sade çözülebilir. Her tablo için sahip modülü, temel indeksleri, gizlilik düzeyini ve kritik unique constraint'leri açıkla.

REST ve Socket.IO sözleşmeleri tipli olsun. En az şu akışları tanımla: login sonrası profile, feed/detail/save/complete, current quiz, join, answer submit/receipt, state resync, result, admin review/publish/schedule/cancel. Payload örnekleri ve kullanıcıya gösterilebilir hata kodları bulunsun.

Tüm sunucu sırları backend'de kalır. `EXPO_PUBLIC_*`, `VITE_*` ve ortak paketlere secret/service-role anahtarı konmaz. Mobilin skor tablosuna doğrudan yazması mümkün olmasın. Yerel seed hesapları üretimde açılamaz; auth bypass başarı için varsayılan çözüm değildir.

## 9. UI ve tasarım yaklaşımı

Bu sprintte nihai marka tasarımını kilitleme. Değiştirilebilir token sistemi kur: renk, tipografi, boşluk, radius, ikon ve hareket ilkeleri. Canlı yarışma enerjik; kültür akışı sakin ve okunabilir olsun. Metin yığınları, bütün ekranı kaplayan puan tabloları ve her kartta ayrı rastgele renk kullanma.

İlk akışlarda loading, empty, error, retry, offline, reconnecting ve expired durumları ele al. Cevabın kabul edilmesi, yanlış cevap ve bağlantı hatası farklı anlaşılır durumlar olmalı. Erişilebilir dokunma alanları, font ölçekleme, kontrast, ekran okuyucu etiketleri ve reduced motion düşünülmeli.

Gereksiz animasyonla sorunun görünmesini veya cevap alınmasını geciktirme. Yerel test oturumunu ödülsüz test olarak açıkça göster; üretim ekranına sahte ödül ekleme.

## 10. Analitik ve operasyon temeli

Minimum olaylar: `signup_completed`, `content_opened`, `content_completed`, `content_saved`, `daily_task_completed`, `quiz_joined`, `answer_accepted`, `quiz_completed`, `quiz_to_content_opened`, `connection_interrupted`, `state_resynced`.

Her olayda eventId, schemaVersion, eventTime, gerekli kullanıcı/oturum/içerik kimliği ve producer türü bulunsun. Güvenilir sunucu olaylarını istemci iddialarından ayır. Gereksiz kişisel veri, e-posta, token veya cevap anahtarı gönderme.

Canlı yarışma aktif kullanıcısı ile kültür/öğrenme aktif kullanıcısını ayrı hesaplayacak bir örnek sorgu oluştur. Sadece app_open veya sekme görüntüleme anlamlı kültür kullanımı sayılmasın. Gün ve kullanıcı tekilleştirmesini tanımla; iki küme kesişebilir, toplamları doğrudan DAU değildir.

M0 logları yapılandırılmış, request/session kimliğiyle izlenebilir ve sırları maskeleyen yapıda olsun. Health/readiness endpoint'i, örnek config ve temel hata izleme arayüzü yeterli; ücretli izleme platformu zorunlu değildir.

## 11. Doğrulama ve M0 kabul ölçütleri

Uygun birim testleriyle kritik puanlama/durum mantığını ve **gerçek PostgreSQL üzerinde** transaction/tekillik davranışını doğrula. Her şeye test eklemek yerine aşağıdaki riskleri kapat:

| ID | Kanıtlanacak davranış |
|---|---|
| K01 | Temiz yerel kurulumda migration ve seed çalışır; tekrar seed kritik veri çoğaltmaz |
| K02 | Gerçek test kullanıcıları giriş yapabilir; normal kullanıcı admin ve başka kullanıcının özel verisine erişemez |
| K03 | Onaysız soru planlanamaz/yayınlanamaz; onaylı revizyon sonradan sessizce değişmez |
| K04 | İki farklı kullanıcı aynı beş soruluk oturumu tamamlar; sonuçlar yeniden girişte korunur |
| K05 | Doğru/yanlış/cevapsız, açılıştan önce, kapanış sınırında ve sonra gönderim beklenen puanı veya reddi üretir |
| K06 | Paralel çift cevap, farklı anahtarla tekrar ve kayıp alındı senaryoları tek cevap/tek puan etkisi oluşturur |
| K07 | Uydurma client timestamp ve client score sonucu değiştirmez; yanlış veya süresi dolmuş kimlik reddedilir |
| K08 | Yeniden bağlantıda doğru durum ve önceki cevap geri gelir; ikinci cihaz ve geç katılım kuralları uygulanır |
| K09 | Aktif sorunun süresi kapanmadan doğru cevap sızmaz; açılmamış soruya normal API/WS/veri yolu üzerinden ulaşılamaz |
| K10 | Sunucu restart ve admin iptali kayıtları korur, oturumu geçersiz kılar; yarım başarı görüntülenmez |
| K11 | İçerik tamamlama XP'yi bir kez artırır; quiz toplamını değiştirmez; görev üç farklı içeriği sayar |
| K12 | Sonuçtan ilgili karta geçilir; quiz ve kültür kullanım olayları ayrı kaydedilir |

K04 için API/WS entegrasyon testinin yanı sıra mümkün olan mobil ortamda gerçek akışı çalıştır. İki gerçek telefon zorunlu değildir; iki bağımsız oturumlu istemci kullanılabilir. Bunun simülatör, web, fiziksel cihaz veya otomatik istemci olduğunu açıkça belirt.

Native ortam yoksa API/DB/WS testlerini yine tamamla, desteklenen önizlemeyi kullan, native çalışma durumunu **DOĞRULANMADI** yaz. Web görüntüsü iOS/Android doğrulaması sayılmaz. Test edilemeyen kabul kriteri tamamlandı işaretlenmez.

İlk görevde 100 bin kullanıcı yük testi yapma. M1 için 100 → 1.000 → 10.000 → 50.000 → 100.000 ölçek senaryolarını, hangi metriklerin ölçüleceğini ve hangi sonuçtan sonra büyütüleceğini kısaca planla. Bağlantı sayısı ile soru açıldıktan sonraki toplu cevap trafiğini ayrı düşün.

## 12. Teslim dosyaları

Belgeler uygulanmış sistemi anlatmalı; gereksiz uzunluk veya yalnızca başlık doldurma hedef değil.

- `README.md`: temiz kurulum, gerçek komutlar, ön koşullar, migrate/seed/test ve demo adımları. Mobilde localhost/LAN/simülatör API adresi farkını açıkla.
- `docs/product/MASTER_BRIEF.md`: kaynak mevcutsa özgün metin.
- `docs/product/DECISIONS.md`: kesin kararlar, deneme ayarları, açık kararlar; tarih ve gerekçe.
- `docs/product/ROADMAP.md`: aşamalar, yedi modül ve bu sprintin kapsam dışı işleri.
- `docs/architecture/ARCHITECTURE.md`: süreçler, modül/veri sınırları, canlı akış, güvenlik, failure davranışları, teknoloji sürümleri ve temel karar gerekçeleri. Gerekirse küçük bir Mermaid diyagramı ekle.
- `docs/contracts/API_AND_EVENTS.md`: gerçek API/WS sözleşmeleri ve hata kodları.
- `docs/reports/M0_DELIVERY_REPORT.md`: aşağıdaki rapor formatı.
- `docs/PROJECT_STATE.md`: son tamamlanan adım, doğrulama durumu, açık engeller, sonraki önerilen iş. Sonraki Claude oturumları önce bunu okuyabilsin.
- Migration, örnek env dosyaları, lockfile, gerekli testler ve erişilebilir yerel başlangıç komutları.

Bir CI yapılandırması uygunsa lint/typecheck/critical tests/build için ekle. Çalıştırılmamış uzak CI'yi yeşil raporlama. Mevcut kullanıcı değişikliklerini koru; git kullanılıyorsa yaptığın değişiklikleri ayırt edilebilir bırak, izinsiz yayın/push yapma.

### Teslim raporu zorunlu formatı

1. **Teslim özeti:** Hangi kullanıcı akışı gerçekten çalışıyor?
2. **Kapsam tablosu:** Her öğe için uygulandı / kısmi / yapılmadı; gerekiyorsa engel.
3. **Kabul kanıt tablosu:** K01–K12, test adı veya demo adımı, çalıştırılan komut, ortam, gerçek sonuç, kanıt dosyası. `UYGULANDI` ile `DOĞRULANDI` ayrı.
4. **Mimari ve kararlar:** Seçilen teknoloji/sürümler, gerekçeler, prompttan anlamlı sapmalar.
5. **Veri ve güvenlik:** Migration, yetkiler, idempotency ve gizli cevap erişimi kanıtları.
6. **Çalıştırma özeti:** Kurucunun yerelde demo yapması için kısa ve kopyalanabilir komutlar.
7. **Görsel kanıt:** Mümkünse Ana Sayfa, içerik detayı, canlı soru, sonuç ve admin görüntüleri; hangi ortamda çekildiği. Gerçek görüntü yoksa üretip çekilmiş gibi gösterme.
8. **Sınırlar ve teknik borç:** Ağ adaleti, native doğrulama, hile/ölçek ve üretim hazırlığı ayrı ayrı.
9. **Kurucu kararı gerektirenler:** Yalnızca gerçekten kapsamı etkileyen kararlar. Teknolojinin rutin ayrıntıları için gereksiz soru listesi çıkarma.
10. **M1 önerisi:** En fazla beş öncelikli iş ve bunların amacı. Bu önerileri otomatik uygulama.

## 13. Uygulama sırası ve çalışma disiplini

1. Repo/ortam incelemesi ve kısa uygulanabilir plan.
2. Mimari sınırlar, karar kaydı, çalışma ortamı ve veri şeması.
3. Auth, içerik–kaydetme–tamamlama–XP akışı.
4. Soru onayı, planlanan canlı oturum, sunucu puanlama ve kalıcı sonuçlar.
5. Mobil/admin uçtan uca bağlantı ve yarışma → kültür geçişi.
6. Kritik testler, çalıştırma doğrulaması ve dürüst teslim raporu.

Rutin ve geri alınabilir uygulama kararları için tekrar tekrar onay bekleme. Bir araç/hesap eksikse yapılabilen işleri tamamla, gereken adımı tam olarak belirt. Secret istemeyi gerektiren bulut kurulumunu yerel işlerin önüne koyma.

Bağlam veya süre sınırına yaklaşırsan mevcut çalışan durumu ve kalan işi `docs/PROJECT_STATE.md` içine yaz. İş bitmemişken bitmiş raporu oluşturma. Geri dönüşte aynı kapsamdan devam et; daha sonraki aşamalara kayma.

**Şimdi M0'ı uygula. İlk yanıtında kısa teknik planını belirt, ardından geliştirmeye başla. İşin sonunda M0_DELIVERY_REPORT.md dosyasını ve kurucunun bize iletebileceği kısa teslim özetini ver.**

## 14. Resmi teknik başvuru kaynakları

Aşağıdaki kaynaklar 14 Ekim 2026 tarihinde bu başlangıç önerisi hazırlanırken incelendi. Uygulama sırasında sürüm uyumluluğunu yeniden kontrol et. Bu kaynaklar ürünün ticari veya hukuki uygunluğuna ilişkin kanıt değildir.

- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/) — yerel/native geliştirme yolu.
- [Supabase JWT doğrulama](https://supabase.com/docs/guides/auth/jwts) — imza ve anahtar türüne uygun oturum doğrulama.
- [NestJS gateways](https://docs.nestjs.com/websockets/gateways) — backend canlı iletişim katmanı.
- [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/) — taşıma katmanı ile uygulama teslim güvenilirliğinin ayrılması.
- [Socket.IO connection state recovery](https://socket.io/docs/v4/connection-state-recovery/) — yeniden bağlantı ve durum kurtarma sınırları.
