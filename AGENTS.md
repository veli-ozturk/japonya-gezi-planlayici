# Proje kuralları

- Kullanıcı Türkçe konuşuyor. İçerik ve açıklamalar Türkçe, teknik dosya adları sade olabilir.
- Kaynak veriyi `data/` içinde değiştir, sonra üret. Yalnız üretilmiş `docs/index.html` dosyasını elle yamalama.
- Tarih, otel, bütçe ve kapsam için README/CLAUDE içindeki kullanıcı tercihlerini koru.
- Bilinmeyen fiyat/saat/konaklama bilgisini uydurma. Resmî işletmeci/mağaza kaynaklarını ve kontrol tarihini tut.
- Dakikaları yaklaşık süre olarak işaretle; canlı sefer/peron iddiası kurma.
- Harita rota URL'lerinde başlangıç + bitiş olsun. Transit waypoint yok.
- Değişiklik sonrası `npm run build` ve `npm test` çalıştır. Saat çakışmalarını ve kaynak anahtarlarını kontrol et.
- Web build bağımlılıksızdır. Excel ayrı runtime gerektirir; `node_modules`/runtime dosyalarını depoya koyma.
- Private depoyu kullanıcı ayrıca istemeden public yapma veya siteyi dışarıya yayımlama.
- Başka ajan/delegasyon gerektiği varsayılmaz; kullanıcı istemedikçe tek ajanla devam et.
