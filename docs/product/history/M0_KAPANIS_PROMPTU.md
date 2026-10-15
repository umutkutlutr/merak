# Merak — M0 teslim kontrolü, yedekleme ve inceleme paketi

Tarih: 15 Ekim 2026

Bu, tamamlandığı bildirilen M0 için yeni çalışma talimatıdır. Ürün sahibi teslim özetini gördü; kodu, tam raporu ve kanıtları henüz incelemedi. Mevcut durum **M0 kapsamı özet üzerinden uyumlu; nihai kabul inceleme bekliyor**. Bu görevin amacı mevcut teslimatı incelenebilir ve yeniden kurulabilir hale getirmek, tespit edilen somut M0 eksiklerini kapatmaktır.

M1'i başlatma. M0'ı sıfırdan yazma. Paketteki `M0_ILK_PROMPT_REFERANSI.md` ilk talimatın referans kopyasıdır; içindeki başlangıç komutunu yeniden başlama talimatı sayma. Bu dosya mevcut görevin sırasını belirler.

## 1. Bildirilen durumu başlangıç kabul et, doğrulama ile ayır

Önceki teslim özetinde aşağıdakiler bildirildi:

- Repo: `umutkutlutr/merak`; çalışma klasörü: `/home/user/merak`.
- Dal: `claude/wonderful-johnson-25mox5`; üç yerel commit; temiz çalışma ağacı; push 403 nedeniyle tamamlanmamış.
- NestJS 12, Expo 57 / RN 0.86, Vite 8 / React 19, pnpm monorepo, PostgreSQL 16, kaynaktan derlenmiş GoTrue v2.197.0.
- 23 birim ve 48 gerçek PostgreSQL entegrasyon testi; iki kullanıcılı API/WS ve iki tarayıcı bağlamıyla Expo web demosu.
- 21 ekran görüntüsü; native iOS/Android doğrulaması ve uzak CI çalışması yok.
- Altı açık karar ve özgün Master Brief'in eksikliği.

Bunları tekrar etmek kanıt değildir. Gerçek repo durumuyla karşılaştır. Sayı veya sürüm farklı çıkarsa doğru olanı yaz, eski özeti düzelt. Eksik ortam nedeniyle koşulamayan kontrolü başarısız test ile karıştırma; `DOĞRULANDI / KISMİ / DOĞRULANMADI / ENGELLİ` kullan.

## 2. İlk iş: mevcut çalışmayı koru

Repo/dal/çalışma ağacını kontrol et; mevcut üç commitin SHA'larını, mesajlarını ve test edilen kod commitini kaydet. Remote bilgisini kimlik bilgileri içermeyecek şekilde raporla. Hiçbir kullanıcı değişikliğini silme; reset, force-push veya geçmişi yeniden yazma yapma.

GitHub bağlantısına bağımlı olmayan, ilgili dalın commitlerini koruyan bir Git bundle oluştur ve `git bundle verify` ile doğrula. Çıktıyı `MERAK_M0_BACKUP.bundle` adıyla indirilebilir sun. Yalnızca çalışma ortamında bırakmak kurucunun elinde yedek olduğu anlamına gelmez. Bundle içindeki commit geçmişinde gerçek secret olup olmadığını paylaşmadan kontrol et; token/anahtar değerlerini çıktıya basma. Bir secret bulursan bundle'ı paylaşma, değeri göstermeden dosya/commit düzeyinde bildir ve güvenli kaynak arşivini yine hazırla; geçmişi kendiliğinden yeniden yazma.

Bu yedek adımı uzak GitHub yetkisi düzelene kadar beklemeyecek. Yedek ile sonraki düzeltmelerin commitleri farklıysa bunu teslim sonunda belirt; nihai yedeği de güncel durum için üret.

## 3. Özgün kapsamı geri bağla

Bu paketteki `MASTER_BRIEF_V1.md`, kurucunun 14 Ekim 2026 tarihli özgün kapsam metninin değiştirilmemiş kopyasıdır. Mevcut `docs/product/MASTER_BRIEF.md` yalnızca bir eksiklik notu içeriyorsa o notu geçmiş kaydı olarak sakla, ilgili dosyaya özgün briefi yerleştir. Mevcut özgün içerik varsa gereksiz üstüne yazma.

Özgün briefi, ilk M0 promptunu ve uygulanan kapsamı karşılaştır. Kısa bir tablo hazırla: gereksinim / M0 karşılığı / gelecek aşama / varsa çelişki. Ürünün iki motorunu, yedi yan modülü, ücretsiz rekabeti, ayrı XP'yi, insan editör onayını ve ödülün koşullu açılmasını özellikle kontrol et.

Özgün belgedeki uzun vadeli özelliklerin M0'da yapılmamış olması tek başına hata değildir. Sırf tam belge geldi diye bütün vizyonu şimdi geliştirme. Kesin ürün ilkesine aykırılık varsa somut olarak bildir ve M0 sınırında düzelt.

Merak adı **çalışma adı** olarak kalabilir. Nihai marka/tescil uygunluğu veya kurucunun marka onayı verilmiş gibi kayıt oluşturma.

## 4. Gerçek sürümler ve kurulum tekrar edilebilirliği

`package.json`, lockfile, runtime çıktıları ve kullanılan resmi uyumluluk belgelerine dayanarak bildirilen sürümleri kontrol et. Node, pnpm, Expo, RN, React, NestJS, Vite, PostgreSQL ve GoTrue için şu alanları yaz: bildirilen sürüm / çözümlenen veya çalışan sürüm / kanıt / kontrol durumu. Expo'nun desteklediği RN/React eşleşmesini kontrol et. Sırf daha yeni sürüm var diye upgrade yapma; somut uyumsuzluk varsa düzelt.

GoTrue'nun Docker olmadan kaynaktan derlenmesi otomatik olarak hata değildir. Fakat yeniden üretilebilir olmalıdır:

- Kullanılan resmi repository, sabit tag/commit, toolchain, derleme ve başlatma adımları.
- Auth şemasını hazırlayan migration'lar, uygulama migration'ları ve sıraları.
- `.env.example` değişkenleri; yalnızca yerel test amaçlı varsayımlar; runtime secret'ları göstermeden.
- Uygulama rollerinin ve auth erişiminin hazırlanması; gerçek giriş/yenileme/çıkış akışı.
- İmzalama algoritması ile API doğrulama yolunun uyumu. JWT decode etmek doğrulama sayılmaz.
- Demo sırasında ve ilgili güvenlik testlerinde auth guard/JWT doğrulaması devre dışı mı, mock mu, gerçek mi? Her ortam için açık cevap.

Var olan yöntem çalışıyorsa onu koru. Supabase CLI yolunu README'ye yazmak o yolun test edildiği anlamına gelmez; ayrı durum ver. Yeni bir auth servisi yazma ve gereksiz altyapı göçü yapma.

Başka bir geçici klasör ve boş test veritabanı kullanarak, dokümante edilmiş temiz kurulumdan kritik smoke akışını doğrula. Çalışan veritabanını sıfırlama. Kontrol yalnızca aynı makinede yapıldıysa bunu açıkça belirt; Mac/native kurulum kanıtı sayma. Ortam eksikse tam engeli yaz, başarı uydurma.

## 5. Mevcut testleri gerçek risklerle eşleştir

İlk prompttaki K01–K12'nin her biri için test dosyası/test adı, komut, tarih/ortam, test edilen commit ve gerçek sonuç bulunsun. Test sayısının yüksekliği tek başına kabul gerekçesi değildir.

Önce mevcut test/kanıtları incele. Yalnızca aşağıdaki somut riski mevcut kanıt kapatmıyorsa hedefli test ekle veya yeniden çalıştır:

1. **Eşzamanlı cevap ve kayıp alındı:** Paralel isteklerde tek kalıcı cevap/puan; commit sonrası alındı kaybı; soru kapandıktan sonra tekrar isteğin eski alındıyı getirmesi. Aynı anahtar/farklı payload ve farklı anahtar/cevap değiştirme ayrı ele alınsın.
2. **Yanıt sızıntısı:** Soru kapanmadan ack, snapshot, REST, WS ve public veri erişiminde doğru cevap/puan sızmaması; gelecekteki sorulara erişilememesi. Yalnızca UI'da gizlemek kanıt değildir.
3. **Gerçek kimlik ve yetki:** Normal kullanıcı admin işlemine veya başka kullanıcının özel kaydına erişemesin. Geçersiz/süresi dolmuş token reddedilsin. Test bypass'ı üretim veya normal demo ayarında açılamasın. Gerçek Supabase imzalama türüyle doğrulama gösterilsin.
4. **Scheduler kilidi:** Advisory lock hangi bağlantıda tutuluyor, bağlantı kaybında otorite nasıl duruyor? İkinci API süreci başlatıldığında ilk sürecin sağlıklı canlı oturumu yanlışlıkla iptal ediliyor mu? M0 tek instance sınırını koru; çoklu instance mimarisine geçme.
5. **Zaman ve sıralama:** Server receivedAt, kapanış sınırı, sahte client zamanı, seçeneklerin sabit optionId ile eşleşmesi, gecikmeli işlem. Süre dolmadan alınmış isteğin transaction/close yarışı beklenen kurala uysun.
6. **Editoryal onay:** Seed veya test hesabının otomatik onayı gerçek insan kontrolü sayılmasın. Onaylı revizyonun sonradan değişmemesi, düzenleme sonrası onayın düşmesi ve planlı oturumun başlangıç kontrolü gösterilsin.
7. **İptal ve XP:** Restart/iptal kayıtları korusun ve oturumu geçersiz kılsın. Öğrenme XP'si tekrar işlemde çoğalmasın; yarışma puanını değiştirmesin; günlük görev farklı içerikleri saysın.

“İki kullanıcılı demo” için kullanıcıların ayrı oturumlarını, ortak soru takvimini, kalıcı sonuçları ve sonuçtan kültür içeriğine geçişi aynı kanıt setinde göster. Otomatik API istemcisi, web ve native kanıtını ayrı tut.

Görsellerin varlığı tek başına işlem doğruluğu kanıtı değildir. Buna karşılık yalnızca unit testler de mobil kullanılabilirlik kanıtı değildir. Web testinin gerçekten mobile uygulamasının Expo web sürümünde yapılıp yapılmadığını belirt.

Hız adaleti, 100/1.000 kullanıcı yük testleri, haftalık toplam modeli ve sürümlü puan düzeltmesi M1 kapsamındadır; bu görevde bunların tamamını ekleme. İnceleme sırasında somut bir M0 hatası çıkarsa yalnızca gerekli düzeltmeyi yap ve etkilediği kontrolleri çalıştır. İlgisiz test genişletmesi yapma.

## 6. Native ve CI durumunu doğru sınıflandır

Native iOS/Android: SDK veya cihaz yoksa `DOĞRULANMADI` kalsın. M0 kapanış dosyalarını hazırlamak için pahalı bulut build veya yeni hesap açma. Kurucunun Mac'inde bir sonraki adımda çalıştırılacak komutları, API adresini ve beklenen ekran akışını yaz. Sonraki aşamada native doğrulama ayrı iş olacak.

CI: yapılandırma varsa dosyasını ve çalıştıracağı gerçek komutları ekle. Uzak run yoksa yeşil durum verme. Uzak CI çalışırsa URL, commit SHA, sonucunu ve ilgili logları ekle. Uzak erişim yoksa çalıştırılabilen yerel karşılıkları göster; bunu uzak CI sonucu diye adlandırma.

## 7. Altı açık kararı görünür yap

`docs/product/DECISIONS.md` içindeki altı açık kararın başlığını ve içeriğini rapora aktar. Kaç madde olduğu gerçekte farklıysa gerçek sayıyı ver. Her biri için seçenekler, teknik/ürün etkisi, senin önerin, karar gerektiren aşama ve M0 için engel olup olmadığı bulunsun.

Kurucuya sunulmuş öneriyi kurucunun onayı olarak yazma. Saat, puan formülü, haftada en iyi beş gün, ligler, sezon, ödül veya marka gibi konularda yeni bağlayıcı karar verme. Geri alınabilir teknik ayrıntıları kendin çöz; ürün kararını değiştirmen gerekiyorsa somut seçenekleri sun.

## 8. GitHub erişim engeli

Push'un 403 dönmesi tek başına kesin kök neden kanıtı değildir. Elindeki hata çıktısını secret'ları temizleyerek kaydet; kurulum/yetki ekranını görmediysen “App kurulu değil” yerine “kurulum veya erişim yetkisi şüphesi” yaz. Repo erişimi, kullanılan bağlantı yöntemi, dal kısıtları ve varsa workflow dosyası yazma yetkisini birbirinden ayır.

Kurucu mevcut bağlantıyı düzelttiğinde ve push yetkisi bulunduğunda mevcut çalışma dalını push edebilirsin. Uzak repo/dalı doğrula, force-push ve main'e merge yapma. Hata sürerse sınırlamayı aşmaya çalışma veya sohbetten token isteme; temiz hata ve gerekli kullanıcı adımını ver. Bu engel, yerel rapor/inceleme paketi üretimini durdurmayacak.

Push başarılıysa yerel teslim commit'i ile uzak dalın commit'inin eşleştiğini doğrula. Push başarısını test başarısı, CI başarısı veya ürün kabulü yerine kullanma.

## 9. Teslim edilecek inceleme paketi

`docs/reports/M0_CLOSEOUT_REPORT.md` oluştur. Kısa durum özeti, kapsam eşlemesi, K01–K12 kanıt tablosu, kurulum/sürüm sonucu, altı karar, varsa düzeltmeler, native/CI/GitHub durumu ve kalan engeller yer alsın.

Kurucuya yüklenebilir tek bir **`MERAK_M0_REVIEW_PACK.zip`** ver. İçinde:

- `M0_CLOSEOUT_REPORT.md` ve mevcut `M0_DELIVERY_REPORT.md`.
- README, kararlar, roadmap, mimari, API/event sözleşmeleri ve güncel proje durumu.
- `source/` altında incelenen commit'in kaynak kodu, testleri, migration'ları, seed'leri, package manifestleri, lockfile ve CI dosyaları. node_modules ve derlenmiş büyük çıktılar gerekmiyor.
- Çalıştırılmış kontrollerin okunabilir çıktıları: komut, exit code, ortam ve commit ile; token/kişisel veri temizlenmiş.
- Ana Sayfa, keşif detayı, canlı soru, sonuç ve admin için temsilî gerçek ekran görüntüleri; diğer mevcut görseller de makul boyuttaysa eklenebilir. Hangi ortamdan olduklarını belirt.
- `MANIFEST.md`: repo/dal, test edilen ve paketlenen commit SHA'ları, dosya listesi, dışarıda bırakılan yollar ve değişiklik varsa açıklaması. Kod ile doküman commitleri farklıysa aradaki farkı açıkla; yalnızca doküman değişikliği için bütün testleri yeniden çalıştırma.

Gerçek `.env`, token, JWT secret, bağlantı parolası, auth veritabanı, kullanıcı verisi veya kimlik bilgisi içeren logları pakete koyma. Örnek yapılandırmalar yer alabilir. Kaynak snapshot'ından güvenlik nedeniyle dosya dışarıda bırakılırsa manifestte bunu belirt; snapshot'ın eksiksiz olduğu iddiasında bulunma. Kaynak kodu olmadan sadece özeti “inceleme paketi tamamlandı” diye sunma.

ZIP dosyasını gerçekten açıp gerekli dosyaların bulunduğunu doğrula. Chat arayüzü dosyayı teslim edemiyorsa “indirilebilir” diye iddia etme; desteklenen dosya aktarım yolunu ve engeli belirt. Yedek bundle, kaynak inceleme paketinden ayrı teslim olabilir.

## 10. Son yanıtın

Şu altı bilgiyi kısa olarak ver:

1. İnceleme paketi ve yedeğin dosya bağlantıları veya erişilebilir gerçek yolları.
2. Test edilen commit, teslim commit'i ve push durumu.
3. Mevcut rapordan düzeltilen iddialar veya bulunan gerçek hatalar.
4. K01–K12'de kalan açık maddeler.
5. Açık ürün kararlarının tamamı.
6. Native ve CI için doğrulanmayanlar.

M0'ın nihai kabulünü ürün sahibi yapacak. Raporun sonunda yeni özellik geliştirmeye geçme. **Şimdi önce mevcut commitleri koru, sonra bu kapanış görevini tamamla.**

## Resmi teknik başvuru kaynakları

15 Ekim 2026 tarihinde kontrol edilen kaynaklar; gerçek repo hatası için yerine geçen kanıt değildir:

- [Claude Code cloud GitHub bağlantı yöntemleri](https://code.claude.com/docs/en/claude-code-on-the-web#github-authentication-options)
- [Claude Code on the web yardım sayfası](https://support.claude.com/en/articles/12618689-claude-code-on-the-web)
- [GitHub App repository permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
