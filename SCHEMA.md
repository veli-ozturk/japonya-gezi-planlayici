# Veri alanları

Önceki teslimatla uyum için bazı listeler dizisel tutuldu. Yeni ulaşım bilgileri okunabilir nesneler kullanır.

## shopping.json / extras.json

`items`: `[öncelik, ürün, durum/sıfır-ikinci el, JPY veya null, fiyat türü, TR TL veya null, karar notu, kontrol notu, alışveriş durumu, kaynak URL]`

`stores`: `[kod, şehir, semt, mağaza, tür, ne için, adres, saat, önerilen ziyaret günü, resmî URL]`

`calendar`: `[başlangıç ISO tarih, bitiş ISO tarih, yer, etkinlik, teyit durumu, saat, ne için, rota notu, organizatör URL]`

`outlets`: `[outlet, karar, zaman, neden, ulaşım, saat, mağazalar/kodlar, URL]`

`comparisons`: `[konu, URL, not]`

## picks.json

Claude önerileri; okunabilir nesneler. `picks[]`: `id` (tik anahtarı `pick-<id>`, değiştirme), `type` Gezi/Yemek/Alışveriş, `city`, `name`, `area`, `day` (ISO tarih veya null), `when`, `tier` Ücretsiz/F/P/Orta/Lüks, `score` 1–5, `why`, `plus`, `minus`, `mapQuery`, `url` (doğrulanmış resmî sayfa veya null). Gezi önerilerinde isteğe bağlı `kind` (Tarihi / Özel deneyim / Manzara / Doğa / Şehir), `must` (Mutlaka / Önerilir / Vakit kalırsa), `unesco`, `era`. Gün kartı tiki `day-<tarih>`. `attractionScores[kod]`: `[puan, fiyat seviyesi, yer türü, seviye, UNESCO, dönem]` (trip.json gezi yerleri; tik anahtarı `place-<kod>`). `dayLoad[tarih]`: `[yoğunluk 1–5, not]`. `options[]`: `date`, `title`, `why`, `choices[]` (`name`, `pick` — tam bir tanesi true, `plus`, `minus`). Saatli programa yeni durak eklemez.

## travel.json / guide.json

travel.json: flights[] (date, flight, from/to kodu ve adı, dep/arr yerel HH:mm, arrDate), drive (route, tolls, out/back: timeline [saat, adım, not] ve choices; tam biri pick), parking.options[] (name, tier, score, price metni veya null), rules[] (title, items, sources anahtarları), checklist[] (id → tik travel-<id>, when, text), sources. guide.json: sections[] (id = bilgiler.html çapası, items [konu, açıklama]), dayTips[tarih] = [bölüm id, kısa not].

travel.json ayrıca: `chinaFlight` (intro, do[], dont[], esim{intro, verdict, options[] name/tier/score/price/plus/minus}, sources), `tokyoHotel` (intro, points[]), `airportIntro`, `airports[]` (id = yolculuk.html çapası, when, title, steps `[saat, adım, not]`, isteğe bağlı choices ve maps `[etiket, başlangıç, bitiş, mod]`).

## money.json / mustbuy.json

money.json: cash.plan `[konu, öneri]`, cards.rows[] (card, role, why, todo), cards.rules[], checklist[] (tik `money-<id>`), sources. mustbuy.json: categories[] (id → alisveris.html#kat-<id>, title, items[]: id, name, where, tier, score, note, isteğe bağlı checkKey; yoksa tik `buy-<id>`).

## instagram.json

posts[] (i, handle, url, summary, status: oneri / urun / bilgi / belirsiz / elendi), commentNotes[] (topic, text, ig). Öneri (`picks[].ig`), mutlaka-alınacak (`items[].ig`) ve rehber satırı (üçüncü eleman) gönderi numaralarıyla bağlanır; sitede "Instagram" etiketi ve video linki olarak görünür.

## trip.json

`routes`: `[ISO tarih, gün adı, şehir, başlık, günlük özet, ulaşım özeti, süre, alternatif/kontrol, harita konumları]`

`hourly[ISO tarih]`: `[başlangıç HH:mm, bitiş HH:mm, tür, durak adı, ulaşım, not, Google konum sorgusu]`

`attractions`: `[kod, şehir, yer, önerilen zaman, ziyaret süresi, açılış bilgisi, JPY/null, ücret kapsamı, adres, URL, not]`

`hotel`: ad, adres, harita koordinatı (`mapQuery`), kaynak, istasyon kaynağı ve erişim notları. `transfer`: 17 Kasım kesin geçiş tarihi.

`storeDays` ve `calendarNotes`, ilk araştırmadaki eski önerileri geçersiz kılan güncel eşlemelerdir.

## transport.json

`sources`: kısa kaynak anahtarı → resmî URL.

`cards` / `payments`: kart, satın alma/yükleme ve nerede nasıl ödeme rehberi.

`legs`: her ulaşım bölümü için `id`, `date`, `from`, `origin`, `to`, `destination`, `mode`, `duration`, `payment`, `steps`, `note`, `sources`.

`steps`: `[hat/araç, biniş durağı, iniş durağı, yön, yaklaşık süre]`. `variant` varsa ana rota dışı alternatif/isteğe bağlı bölüm. `mode` transit/walking/driving/bicycling. Süreler dakika aralığı metnidir; gerçek zamanlı API hesabı değildir.
