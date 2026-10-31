import test from 'node:test';
import assert from 'node:assert/strict';
import {outfit,messageFor,morning,evening,testMessage,spendLine,tripMorning,tomorrowRes} from '../notify/index.js';
const at=s=>Date.parse(s);
test('Bildirim: sabah gezi öncesi TR, gezide JST; akşam yalnız gezi günleri; işaretlenenler atlanır',()=>{
  const m=messageFor('0 6 * * *',at('2037-10-26T06:00:00Z'),{});assert.match(m,/Tokyo otelini ayırt/);
  assert.equal(messageFor('0 6 * * *',at('2037-10-26T06:00:00Z'),{'todo-tokyo-otel':true}),null);
  assert.equal(messageFor('0 23 * * *',at('2037-10-26T23:00:00Z'),{}),null,'gezi öncesi JST sabahı sessiz');
  assert.equal(messageFor('0 6 * * *',at('2037-11-10T06:00:00Z'),{}),null,'gezide TR sabahı sessiz');
  assert.match(messageFor('0 23 * * *',at('2037-11-21T23:00:00Z'),{}),/Valizleri Haneda/,'JST 22 Kasım sabahı');
  assert.equal(messageFor('0 12 * * *',at('2037-11-05T12:00:00Z'),{}),null);
  const e=messageFor('0 12 * * *',at('2037-11-09T12:00:00Z'),{'buy-jagariko':true});
  assert.match(e,/Gün sonu – 9 Kasım/);assert.doesNotMatch(e,/Jagariko/);assert.match(e,/Bölgesel Kit Kat.*sonraki fırsat 17 Kasım/);
  assert.match(evening('2037-11-24',{}),/son fırsattı/);assert.match(testMessage(at('2037-10-25T16:00:00Z'),{}),/denemesi[^]*28 Ekim — Tokyo otelini/);assert.equal(morning('2037-11-26',{}),null);
});
test('Gün sonu harcama satırı: günlük ve toplam bütçeye göre',()=>{const ex=[{date:'2037-11-09',amount:42000},{date:'2037-11-10',amount:8000}];assert.match(spendLine('2037-11-09',ex,{budgetDay:30000,budgetTotal:600000}),/¥42\.000 \/ ¥30\.000 \(¥12\.000 aşıldı\)[\s\S]*Toplam: ¥50\.000 \/ ¥600\.000 · kalan ¥550\.000/);assert.equal(spendLine('2037-11-11',[],{}),'💴 Bugün harcanan: ¥0');assert.match(evening('2037-11-09',{},ex,{}),/💴 Bugün harcanan: ¥42\.000/);});
test('Gezi sabahı: hava, rezervasyon, duraklar, alınacaklar ve kendi işleriniz; akşam yarının rezervasyonu',()=>{const res=[{date:'2037-11-16',time:'19:00',title:'Kisshokichi',place:'Nishi-Shinsaibashi'},{date:'2037-11-17',time:'10:00',title:'Shinkansen',place:'Shin-Osaka'}];const todos=[{text:'Valiz tartısı',due:'2037-11-16',done:false},{text:'Bitmiş iş',due:'2037-11-16',done:true}];
  const m=tripMorning('2037-11-16',{},{todos,res,wx:{code:61,max:15.4,min:9.2,rain:70}});
  assert.match(m,/Günaydın – 16 Kasım/);assert.match(m,/15° \/ 9°, yağış %70 → ☔ şemsiye alın/);assert.match(m,/19:00 Kisshokichi/);assert.match(m,/📍 Duraklar:/);assert.match(m,/🛍 Bugün alınacak/);assert.match(m,/BUGÜN — Valiz tartısı/);assert.doesNotMatch(m,/Bitmiş iş/);
  assert.match(messageFor('0 23 * * *',Date.parse('2037-11-15T23:00:00Z'),{},[],{},{res}),/Günaydın – 16 Kasım/);
  assert.match(tomorrowRes('2037-11-16',res),/Yarın \(17 Kasım\) rezervasyon:\n• 10:00 Shinkansen/);assert.match(evening('2037-11-16',{},[],{},res),/Yarın \(17 Kasım\)/);
  assert.match(morning('2037-11-03',{},[{text:'Pasaport fotokopisi',due:'2037-11-04',done:false}]),/4 Kasım — Pasaport fotokopisi/);});
test('Yağmur planı: tahmin %60 ve üstünde sabah mesajına girer',()=>{assert.match(tripMorning('2037-11-22',{},{wx:{code:63,max:12,min:8,rain:80}}),/☔ Yağmur planı: Oi bit pazarı iptal/);assert.match(tripMorning('2037-11-22',{},{}),/🤝 Kaybolursanız buluşma: Oi Keibajo-mae/);assert.doesNotMatch(tripMorning('2037-11-22',{},{wx:{code:1,max:15,min:8,rain:10}}),/Yağmur planı/);});
test('Kıyafet önerisi: sıcaklık ve yağmura göre değişir, sabah mesajına girer',()=>{
  assert.match(outfit({max:22,min:14,rain:10}),/tişört/);assert.match(outfit({max:9,min:3,rain:70}),/kalın mont.*sabah erken çok soğuk.*su geçirmez/);assert.match(outfit({max:17,min:8}),/katmanlı/);
  assert.match(tripMorning('2037-11-16',{},{wx:{code:1,max:16,min:9,rain:0}}),/👕 Giyim: uzun kollu/);});
import {quakeAlerts,trainAlerts,parseTrouble} from '../notify/alerts.js';
test('Deprem uyarısı: izlenen ilde şiddet 4+ ve 30 dk içindeyse; tekrar ve uzak/zayıf depremde yok',()=>{
  const ms=Date.parse('2037-11-12T05:40:00Z');// JST 14:40
  const q={code:551,id:'q1',time:'2037/11/12 14:35:10.000',earthquake:{time:'2037/11/12 14:33:00',domesticTsunami:'None',hypocenter:{magnitude:5.8,name:'大阪府北部'}},points:[{pref:'大阪府',scale:45},{pref:'京都府',scale:40},{pref:'熊本県',scale:70}]};
  const [a]=quakeAlerts([q],[],ms);assert.match(a.text,/Deprem 14:33.*M5.8/);assert.match(a.text,/Osaka 5 zayıf, Kyoto 4/);assert.doesNotMatch(a.text,/Kumamoto|熊本/);
  assert.equal(quakeAlerts([q],['q1'],ms).length,0);
  assert.equal(quakeAlerts([{...q,id:'q2',points:[{pref:'大阪府',scale:30}]}],[],ms).length,0);
  assert.equal(quakeAlerts([{...q,id:'q3',time:'2037/11/12 12:00:00.000'}],[],ms).length,0);
  assert.match(quakeAlerts([{code:552,id:'t1',time:'2037/11/12 14:36:00.000',cancelled:false,areas:[{name:'大阪府'}]}],[],ms)[0].text,/TSUNAMİ UYARISI: 大阪府/);});
test('Tren uyarısı: izlenen hat, yalnız yeni veya değişen durum',()=>{
  const html='<div class="elmTblLstLine trouble"><table><tbody><tr><th>路線</th></tr><tr><td><a href="/diainfo/321/0">大阪メトロ御堂筋線</a></td><td><span class="icnAlert"></span><span class="colTrouble">運転見合わせ</span></td><td>x</td></tr><tr><td><a href="/diainfo/266/0">琵琶湖線</a></td><td><span class="icnAlert"></span><span class="colTrouble">列車遅延</span></td><td>y</td></tr></tbody></table></div>';
  const rows=parseTrouble(html);assert.deepEqual(rows,[['大阪メトロ御堂筋線','運転見合わせ'],['琵琶湖線','列車遅延']]);
  const r=trainAlerts(rows,6,{});assert.match(r.text,/seferler durdu: 大阪メトロ御堂筋線/);assert.doesNotMatch(r.text,/琵琶湖/);
  assert.equal(trainAlerts(rows,6,r.now).text,null);assert.deepEqual(parseTrouble('<html>yok</html>'),[]);});
import {parseFoliage,foliageLine} from '../notify/foliage.js';
test('Kyoto yaprak durumu: yalnız güncel rapor sütunu, bilinen yerler, geçen sezon verisi gösterilmez',()=>{
  const row=(n,icons)=>`<tr class="all status4"><td class="meta"><p class="name"><a href="./single.php?flower_id=1"><i class="icon-arrow-right"></i>${n}</a></p></td>${icons.map(i=>`<td class="icon">${i?`<i class="icon-momiji is_color0${i}"></i>`:''}</td>`).join('')}</tr>`;
  const html=`<table class="spotTable viewPc"><thead><tr><th>スポット情報</th><th>11/03</th><th>11/07</th><th>11/14</th></tr></thead><tbody>${row('清水寺',[1,2,0])}${row('嵐山',[1,3,0])}${row('知らない寺',[2,4,0])}</tbody></table>`;
  const f=parseFoliage(html);assert.equal(f.rows.length,3);
  assert.equal(foliageLine(f,'2037-11-10'),'🍁 Yaprak (Kyoto, 7.11 raporu): Kiyomizu-dera dönmeye başladı · Arashiyama %30–50 renkli');
  assert.equal(foliageLine(f,'2037-11-02'),null);assert.equal(foliageLine(f,'2037-11-30'),null);assert.equal(parseFoliage('<p>yok</p>'),null);
  assert.match(tripMorning('2037-11-10',{},{foliage:'🍁 test'}),/🍁 test/);});
test('Yedek plan hatırlatması, ana plan tiklenince gönderilmez',async()=>{const {morning}=await import('../notify/index.js');assert.match(morning('2037-11-15',{})??'',/B planı/);assert.doesNotMatch(morning('2037-11-15',{'todo-gotemba-otobus':true})??'',/B planı|A planı/)});
test('Telegram alıcıları: sahip + ek alıcılar, tekrarsız',async()=>{const {chatIds}=await import('../notify/index.js');assert.deepEqual(chatIds({CHAT_ID:'1',EXTRA_CHAT_IDS:' 2, ,1'}),['1','2']);assert.deepEqual(chatIds({CHAT_ID:'1'}),['1'])});
test('Akşam: ertesi günün işleri ve gezi planı',async()=>{const {preEvening,evening,messageFor}=await import('../notify/index.js');
  assert.match(preEvening('2037-11-01',{})??'',/Yarın \(2 Kasım\) yapılacaklar:[^]*Örnek Otel misafir/);
  assert.equal(preEvening('2037-11-01',{'todo-osaka-otel-form':true,'todo-apa-mesaj':true}),null);
  assert.equal(preEvening('2037-11-20',{}),null);
  assert.match(messageFor('0 17 * * *',Date.parse('2037-11-01T17:00:00Z'),{},[],{},{})??'',/Yarın için hatırlatma/);
  assert.match(evening('2037-11-19',{},[],{},[])??'',/Yarın \(20 Kasım\): ilk çıkış 08:25/);
});
