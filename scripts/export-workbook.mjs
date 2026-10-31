import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
import {directionsUrl} from '../src/maps.mjs';

const base=path.dirname(fileURLToPath(import.meta.url));
const project=path.resolve(base,'..');
const input=JSON.parse(await fs.readFile(path.join(project,'data/shopping.json'),'utf8'));
const extra=JSON.parse(await fs.readFile(path.join(project,'data/extras.json'),'utf8'));
const transport=JSON.parse(await fs.readFile(path.join(project,'data/transport.json'),'utf8'));
input.items.push(...extra.items); input.stores.push(...extra.stores);
const trip=JSON.parse(await fs.readFile(path.join(project,'data/trip.json'),'utf8'));
input.routes=trip.routes;
input.assumptions=trip.assumptions;
input.stores.forEach(s=>{s[8]=trip.storeDays[s[0]]??s[8];});
input.calendar.forEach(r=>{const note=trip.calendarNotes[r[0]+'|'+r[3]];if(note)r[7]=note;if(r[0]==='2037-11-15'&&r[3]==='Tokyo City Flea Market')r[6]='Osaka konaklamasıyla çakışıyor';if(r[0]==='2037-11-22'&&r[3]==='Tokyo City Flea Market')r[6]='Ana Oi ziyareti';});
const out=path.join(project,'docs/downloads');
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create();
const names=['Rota','SaatliRota','Ulasim','KartOdeme','Alisveris','Magazalar','GezilecekYerler','Takvim','Outletler'];
const sheets=Object.fromEntries(names.map(n=>[n,wb.worksheets.add(n)]));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const map=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const dirs=q=>{const a=q.split('|');return a.length===1?map(a[0]):'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(a[0])+'&destination='+encodeURIComponent(a.at(-1))+(a.length>2?'&waypoints='+encodeURIComponent(a.slice(1,-1).join('|')):'')+'&travelmode='+(q.includes('Shinjuku Central Park')&&q.includes('Harajuku')?'transit':'walking');};
const walkDates=['2037-11-09','2037-11-15','2037-11-16','2037-11-18','2037-11-23'];
const routeMap=r=>{const leg=transport.legs.find(l=>l.date===r[0]);return leg?directionsUrl(leg.origin,leg.destination,leg.mode):map(r[8].split('|')[0]);};
const timeValue=t=>{const [h,m]=t.split(':').map(Number);return (h*60+m)/1440;};
const hourRows=Object.entries(trip.hourly).flatMap(([d,slots])=>slots.map((s,i)=>[d,...s.slice(0,5),s[5]+(i===0&&trip.alternatives[d]?' Alternatif: '+trip.alternatives[d]:''),s[6]]));
const previousPlaces={};
for(const r of hourRows){const prev=previousPlaces[r[0]]??(r[0]<='2037-11-17'?trip.hotel.mapQuery:null);r.push(prev);previousPlaces[r[0]]=r[7];}
const hourMap=r=>r[8]&&r[8]!==r[7]?directionsUrl(r[8],r[7],r[3].includes('Ulaşım')?'transit':'walking'):map(r[7]);
const date=s=>new Date(s+'T12:00:00Z');
const col=n=>{let t='';for(n++;n;n=Math.floor((n-1)/26))t=String.fromCharCode(65+(n-1)%26)+t;return t;};
const money=n=>n==null?'—':new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(n);
const link=(url,label='Kaynak')=>`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
function setup(s,title,sub,headers,rows,widths,start=7,tableName='Data'){
  s.showGridLines=false;
  s.tabColor='#243B53';
  const end=start+rows.length;
  const range=s.getRange(`A1:${col(headers.length-1)}${end}`);
  range.format.font={name:'Arial',size:10,color:'#243B53'};
  range.format.verticalAlignment='center';
  range.format.wrapText=true;
  s.getRange(`A2:${col(headers.length-1)}2`).merge();
  s.getRange(`A3:${col(headers.length-1)}3`).merge();
  s.getRange('A2').values=[[title]];s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#142D4E'};
  s.getRange(`A2:${col(headers.length-1)}2`).format.rowHeight=27;
  s.getRange('A3').values=[[sub]];
  s.getRange(`A3:${col(headers.length-1)}3`).format.rowHeight=28;
  s.getRange(`A3:${col(headers.length-1)}3`).format.font={name:'Arial',size:10,italic:true,color:'#596D81'};
  s.getRange(`A${start}:${col(headers.length-1)}${end}`).values=[headers,...rows];
  s.tables.add(`A${start}:${col(headers.length-1)}${end}`,true,tableName);
  s.getRange(`A${start}:${col(headers.length-1)}${start}`).format={fill:'#243B53',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:34,wrapText:true,horizontalAlignment:'center',verticalAlignment:'center'};
  widths.forEach((w,i)=>s.getRange(`${col(i)}1:${col(i)}${end}`).format.columnWidth=w);
  for(let i=0;i<rows.length;i++){
    const rn=start+1+i;
    const lines=Math.max(...rows[i].map((v,j)=>String(v??'').split('\n').reduce((a,t)=>a+Math.max(1,Math.ceil(t.length/Math.max(8,widths[j]-3))),0)));
    s.getRange(`A${rn}:${col(headers.length-1)}${rn}`).format.rowHeight=Math.max(34,Math.min(150,lines*14+14));
    if(i%2===1)s.getRange(`A${rn}:${col(headers.length-1)}${rn}`).format.fill='#F0F4F8';
  }
  s.freezePanes.freezeRows(start);s.freezePanes.freezeColumns(2);
  return end;
}

const routeRows=input.routes.map(r=>[date(r[0]),r[1],r[2],r[3],r[4],r[5],r[6],r[7],routeMap(r)]);
setup(sheets.Rota,'Japonya gezi ve alışveriş rotası','Örnek Otel Shinsaibashi konaklama. Kyoto 10/13 Kasım, Nara 11 Kasım, Tokyo geçişi 17 Kasım. Ayrıntılar SaatliRota sekmesinde.',
 ['Tarih','Gün','Şehir','Günün odağı','Duraklar ve sıra','Ulaşım / mağaza kodları','Süre planı','Alternatif ve kontrol','Google Maps'],routeRows,[13,20,21,28,64,57,36,62,65],7,'RoutePlan');
sheets.Rota.getRange(`A8:A${7+routeRows.length}`).setNumberFormat('dd/mm/yyyy');
sheets.Rota.getRange('A4:I4').merge();
sheets.Rota.getRange('A4').values=[['Osaka oteli: '+trip.hotel.name+' | '+trip.hotel.address+' | Shinsaibashi M19/N15 yürüyüş tahmini 7–10 dk.']];
sheets.Rota.getRange('A4:I4').format.rowHeight=28;
sheets.Rota.getRange('A5:I5').merge();
sheets.Rota.getRange('A5').values=[['Otel adresi kaynağı: '+trip.hotel.source+'   Harita: '+map(trip.hotel.mapQuery)]];
sheets.Rota.getRange('A5:I5').format.rowHeight=28;

const hourlyEnd=setup(sheets.SaatliRota,'Saat saat gezi ve alışveriş','Saatler JST ve planlama hedefidir; canlı sefer değildir. Tokyo otelden çıkış saatleri otel belli olunca eklenecek.',
 ['Tarih','Başlangıç','Bitiş','Şehir','Tür','Durak / etkinlik','Ulaşım / geçiş','Not / esneklik','Google Maps'],
 hourRows.map(r=>[date(r[0]),timeValue(r[1]),timeValue(r[2]),input.routes.find(d=>d[0]===r[0])[2],r[3],r[4],r[5],r[6],hourMap(r)]),[13,12,12,25,24,47,64,78,64],7,'HourlyPlan');
sheets.SaatliRota.getRange(`A8:A${hourlyEnd}`).setNumberFormat('dd/mm/yyyy');
sheets.SaatliRota.getRange(`B8:C${hourlyEnd}`).setNumberFormat('hh:mm');
const sourceText=keys=>keys.map(k=>transport.sources[k]).join('\n');
const legRows=transport.legs.map(l=>[date(l.date),l.from,l.to,l.duration,l.payment,l.steps.map(s=>s[0]+': '+s[1]+' → '+s[2]+'; yön '+s[3]+'; '+s[4]).join('\n'),l.note,directionsUrl(l.origin,l.destination,l.mode),sourceText(l.sources)]);
const legEnd=setup(sheets.Ulasim,'Hatlar, duraklar ve ulaşım süreleri',transport.timingNote,['Tarih','Başlangıç','Bitiş','Yaklaşık süre','Ödeme / bilet','Hat / biniş / iniş / yön / süre','Uygulama notu','Başlangıç–bitiş Google Maps','İşletmeci kaynakları'],legRows,[13,34,43,47,43,110,105,80,90],7,'TransportLegs');
sheets.Ulasim.getRange(`A8:A${legEnd}`).setNumberFormat('dd/mm/yyyy');
legRows.forEach((r,i)=>{const lines=Math.max(...r.map((v,j)=>String(v??'').split('\n').reduce((a,x)=>a+Math.max(1,Math.ceil(x.length/[10,31,40,44,40,107,102,77,87][j])),0)));sheets.Ulasim.getRange(`A${i+8}:I${i+8}`).format.rowHeight=Math.min(340,Math.max(60,lines*15+16));});
const payRows=[...transport.cards.map(c=>['Kart / bilet',c.name,c.buy+'\n'+c.use,c.pay,c.limits,sourceText(c.sources)]),...transport.payments.map(p=>['Ödeme',p.where,p.detail,p.method,'',sourceText(p.sources)])];
setup(sheets.KartOdeme,'ICOCA, bilet ve ödeme rehberi','25 Ekim 2037 kontrolü. Fiziksel ICOCA yüklemesi için nakit; Shinkansen ve rezervasyonlu otobüs için ayrı bilet.',['Tür','Kart / durum','Nasıl kullanılır?','Ödeme / yükleme','Dikkat / kapsam','Kaynak'],payRows,[23,50,110,100,110,100],7,'PaymentGuide');
const attractionsEnd=setup(sheets.GezilecekYerler,'Görülecek yerler ve ziyaret bilgileri','Süreler öneridir. Ücret kişi başı yetişkin referansı; sıfır yalnız belirtilen ücretsiz alanı kapsar. Saatler JST.',
 ['Kod','Şehir','Yer','Planlanan zaman','Önerilen süre','Açılış / kapanış','Referans JPY','Ücretin kapsamı','Adres / konum','Resmî kaynak','Ziyaret notu','Google Maps'],trip.attractions.map(r=>[...r,map(r[2]+' '+r[8])]),[10,16,43,29,29,66,18,60,67,72,78,64],7,'SightseeingGuide');
sheets.GezilecekYerler.getRange(`G8:G${attractionsEnd}`).setNumberFormat('"¥"#,##0');

const shopRows=input.items.map(r=>[r[0],r[1],r[2],r[3],r[4],null,r[5],null,r[6],r[7],r[8]]);
const shopEnd=setup(sheets.Alisveris,'Alışveriş adayları','Fiyatlar referanstır. Boş fiyatlar doğrulanmadı. Alım önerisi, garantili stok veya satın alma zorunluluğu değildir.',
 ['Öncelik','Ürün / model','Sıfır / ikinci el','Referans JPY','Fiyatın niteliği','Yaklaşık TL','TR referans TL','TR eksi JP TL','Alım kararı','Almadan önce kontrol','Durum'],shopRows,[23,43,28,17,34,18,18,19,60,63,18],7,'ShoppingList');
sheets.Alisveris.getRange('A4').values=[['JPY / TL']];sheets.Alisveris.getRange('B4').values=[[input.rate]];
sheets.Alisveris.getRange('B4').format.fill='#FFF2CC';sheets.Alisveris.getRange('B4').setNumberFormat('0.0000');
sheets.Alisveris.getRange('D4:K4').merge();
sheets.Alisveris.getRange('A4:K4').format.rowHeight=32;
sheets.Alisveris.getRange('D4').values=[['Fark = TR referansı − JP brüt TL. Kur ve garanti aynı gün tekrar kontrol edilir.']];
sheets.Alisveris.getRange('M7').values=[['Ürün fiyatı / bilgi kaynağı']];sheets.Alisveris.getRange(`M7:M${shopEnd}`).format.columnWidth=75;
sheets.Alisveris.getRange(`M7:M${shopEnd}`).format.wrapText=true;
sheets.Alisveris.getRange('M7').format={fill:'#526D82',font:{name:'Arial',bold:true,color:'#FFFFFF',size:10}};
input.items.forEach((r,i)=>{const n=i+8;sheets.Alisveris.getRange(`F${n}`).formulas=[[`=IF(D${n}="","",D${n}*$B$4)`]];sheets.Alisveris.getRange(`H${n}`).formulas=[[`=IF(OR(D${n}="",G${n}=""),"",G${n}-F${n})`]];sheets.Alisveris.getRange(`M${n}`).values=[[r[9]]];});
sheets.Alisveris.getRange(`D8:D${shopEnd}`).setNumberFormat('"¥"#,##0');
sheets.Alisveris.getRange(`F8:H${shopEnd}`).setNumberFormat('#,##0" TL"');
sheets.Alisveris.getRange(`K8:K${shopEnd}`).dataValidation={rule:{type:'list',values:['Planlandı','Alındı','Vazgeçildi']}};
sheets.Alisveris.getRange(`K8:K${shopEnd}`).conditionalFormats.add('containsText',{text:'Alındı',format:{fill:'#DCFCE7',font:{color:'#166534'}}});
const noteStart=shopEnd+4;
sheets.Alisveris.getRange(`A${noteStart}:C${noteStart+input.comparisons.length}`).values=[['Ek kaynak','Bağlantı','Kaynak notu'],...input.comparisons];
sheets.Alisveris.getRange(`A${noteStart}:C${noteStart+input.comparisons.length}`).format.wrapText=true;
sheets.Alisveris.getRange(`A${noteStart}:C${noteStart+input.comparisons.length}`).format.rowHeight=100;

const storeRows=input.stores.map(r=>[...r.slice(0,9),r[9],map(r[3]+' '+r[6])]);
setup(sheets.Magazalar,'Mağazalar ve yerel dükkânlar','Kaynak ve harita her satırda. Saatler 25 Ekim araştırmasıdır; ziyaret sabahı kontrol et.',
 ['Kod','Şehir','Bölge','Mağaza','Tür','Ne için?','Adres / konum','Saat','Rota günü','Resmî kaynak','Google Maps'],storeRows,[10,23,25,36,25,57,64,50,28,72,66],7,'StoreGuide');

const calRows=input.calendar.map(r=>[date(r[0]),date(r[1]),...r.slice(2)]);
setup(sheets.Takvim,'Outlet ve bit pazarı takvimi','İlan edilmiş etkinlikler ve aylık düzenli pazarlar ayrı belirtilmiştir. İptal duyurularını kontrol et.',
 ['Başlangıç','Bitiş','Yer','Etkinlik','Teyit durumu','Yerel saat','Ne aranır?','Ziyaret notu','Organizatör kaynağı'],calRows,[14,14,26,37,48,43,48,68,74],7,'EventCalendar');
sheets.Takvim.getRange(`A8:B${7+calRows.length}`).setNumberFormat('dd/mm/yyyy');

setup(sheets.Outletler,'Hangi outlet?','Ana tercih Rinku. Gotemba, ihtiyaç ve Fuji/Hakone programına göre ikinci seçenek; üç outlet gezmek hedef değil.',
 ['Outlet','Karar','Önerilen zaman','Neden?','Ulaşım','Saat','İlgili mağazalar / bölüm kodları','Resmî kaynak'],input.outlets,[34,39,48,57,74,34,78,73],7,'OutletComparison');
const assumptionsStart=14;
sheets.Outletler.getRange(`A${assumptionsStart}:H${assumptionsStart}`).merge();
sheets.Outletler.getRange(`A${assumptionsStart}`).values=[['Planın varsayımları ve kullanımı']];
sheets.Outletler.getRange(`A${assumptionsStart}`).format.font={name:'Arial',size:13,bold:true,color:'#142D4E'};
input.assumptions.forEach((s,i)=>{const row=assumptionsStart+1+i;sheets.Outletler.getRange(`A${row}`).values=[[i+1]];sheets.Outletler.getRange(`B${row}:H${row}`).merge();sheets.Outletler.getRange(`B${row}`).values=[[s]];sheets.Outletler.getRange(`B${row}`).format.wrapText=true;sheets.Outletler.getRange(`A${row}:H${row}`).format.rowHeight=40;});

wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Rota!A16:D17',include:'values',tableMaxRows:2,tableMaxCols:4,maxChars:900})).ndjson);
console.log((await wb.inspect({kind:'table',range:'SaatliRota!A11:C12',include:'values',tableMaxRows:2,tableMaxCols:3,maxChars:600})).ndjson);
console.log((await wb.inspect({kind:'table',range:'Alisveris!D8:H13',include:'values,formulas',tableMaxRows:6,tableMaxCols:5,maxChars:3500})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:2000})).ndjson);
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(path.join(out,'Japonya_Alisveris_ve_Rota.xlsx'));
for(const [name,range] of [['Rota','A1:I13'],['SaatliRota','A1:I12'],['Ulasim','A1:I11'],['KartOdeme','A1:F10'],['Alisveris','A36:K42'],['Magazalar','A36:K43']]){
  const blob=await wb.render({sheetName:name,range,scale:1,format:'png'});
  await fs.writeFile(path.join(project,'.previews','preview-'+name+'.png'),new Uint8Array(await blob.arrayBuffer()));
}
