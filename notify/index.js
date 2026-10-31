// Telegram bildirimleri (Cloudflare Worker, cron): bilgisayar kapalıyken de çalışır.
// Sabah: son tarihi bugün veya 1–2 gün sonra olan, sitede işaretlenmemiş yapılacaklar.
// Akşam (gezi günleri, JST 21.00): o gün alınacaklardan işaretlenmeyenler ve sonraki fırsat.
// Gizliler: BOT_TOKEN, CHAT_ID, isteğe bağlı EXTRA_CHAT_IDS (virgüllü ek alıcılar, ör. eşi) (wrangler secret). Tikler sitenin KV'sinden yalnız okunur.
import pratik from '../data/pratik.json' with {type:'json'};
import plan from '../data/plan.json' with {type:'json'};
import mustbuy from '../data/mustbuy.json' with {type:'json'};
import trip from '../data/trip.json' with {type:'json'};
import {runAlerts} from './alerts.js';
import {FOLIAGE_URL,parseFoliage,foliageLine} from './foliage.js';

const TRIP=['2037-11-09','2037-11-24'];
const items=Object.fromEntries(mustbuy.categories.flatMap(c=>c.items.map(i=>[i.id,i])));
const keyOf=id=>items[id].checkKey??'buy-'+id;
const dayTr=d=>`${Number(d.slice(8))} ${d.slice(5,7)==='10'?'Ekim':'Kasım'}`;
const addDays=(d,n)=>new Date(Date.parse(d)+n*864e5).toISOString().slice(0,10);
export const dateIn=(ms,offsetH)=>new Date(ms+offsetH*36e5).toISOString().slice(0,10);

// Hatırlatma açık mı: kendisi ya da skipIf ile bağlı olduğu (yedek planı gereksiz kılan) iş tiklenmemiş olmalı.
const openR=(r,checks)=>!checks['todo-'+r.id]&&![].concat(r.skipIf??[]).some(k=>checks['todo-'+k]);
// Son tarihi bugün veya 1–2 gün sonra olan, işaretlenmemiş işler: sabit takvim + sizin eklediğiniz yapılacaklar.
const dueLines=(date,checks,todos=[])=>[...pratik.reminders.filter(r=>r.date>=date&&r.date<=addDays(date,2)&&openR(r,checks)).map(r=>`• ${r.date===date?'BUGÜN':dayTr(r.date)} — ${r.title}: ${r.detail}`),
  ...todos.filter(t=>!t.done&&t.due&&t.due<=addDays(date,2)).map(t=>`• ${t.due<date?'GECİKTİ':t.due===date?'BUGÜN':dayTr(t.due)} — ${t.text}${t.who?` (${t.who})`:''}`)];

export function morning(date,checks,todos){
  if(date>TRIP[1])return null;
  const due=dueLines(date,checks,todos);
  if(!due.length)return null;
  return ['🇯🇵 Japonya hatırlatma',...due,'','Tamamlayınca sitede ana sayfadaki Yapılacaklar listesinden işaretleyin.'].join('\n');
}

// Gezi sabahı (JST 08.00): günün durakları, hava, rezervasyonlar, alınacaklar ve yaklaşan işler.
const WX={0:'☀ Açık',1:'🌤 Az bulutlu',2:'⛅ Parçalı bulutlu',3:'☁ Kapalı',45:'🌫 Sisli',48:'🌫 Sisli',51:'🌦 Çisenti',53:'🌦 Çisenti',55:'🌧 Çisenti',61:'🌧 Hafif yağmur',63:'🌧 Yağmur',65:'🌧 Kuvvetli yağmur',80:'🌦 Sağanak',81:'🌧 Sağanak',82:'⛈ Kuvvetli sağanak',95:'⛈ Fırtına'};
export const CITY={Osaka:[34.6937,135.5023],Kyoto:[35.0116,135.7681],Nara:[34.6851,135.8048],Tokyo:[35.6812,139.7671]};
export const cityOf=place=>['Kyoto','Nara','Tokyo'].find(c=>place.includes(c))??'Osaka';
// Kıyafet önerisi: sabah/akşam en düşük, gün içi en yüksek sıcaklık ve yağış olasılığına göre.
export function outfit({max,min,rain=0}){
  const top=max>=20?'tişört + ince hırka':max>=15?'uzun kollu + hafif ceket':max>=10?'kazak + mont':'kalın mont, atkı';
  const tips=[];if(max-min>=8)tips.push('katmanlı giyin, sabah/akşam serin');if(min<=7)tips.push('sabah erken çok soğuk');if(rain>=50)tips.push('su geçirmez ayakkabı veya yedek çorap');
  return `Giyim: ${top}${tips.length?' · '+tips.join(' · '):''}`;
}
export function tripMorning(date,checks,{todos=[],res=[],wx=null,foliage=null}={}){
  const r=trip.routes.find(x=>x[0]===date);if(!r)return null;
  const stops=(trip.hourly[date]??[]).filter(h=>!/Ulaşım|Hazırlık|Konaklama/.test(h[2])).map(h=>`${h[0]} ${h[3]}`);
  const buy=(plan.days[date]?.buy??[]).filter(([id])=>!checks[keyOf(id)]);
  const lines=[`☀ Günaydın – ${dayTr(date)}`,r[3]];
  if(wx)lines.push(`Hava (${cityOf(r[2])}): ${WX[wx.code]??'🌡'} ${Math.round(wx.max)}° / ${Math.round(wx.min)}°, yağış %${wx.rain??0}${wx.rain>=50?' → ☔ şemsiye alın':''}`);
  if(wx)lines.push('👕 '+outfit(wx));
  if(foliage)lines.push(foliage);
  if(plan.days[date]?.meet)lines.push(`🤝 Kaybolursanız buluşma: ${plan.days[date].meet}`);
  if(wx?.rain>=60&&plan.days[date]?.rain)lines.push(`☔ Yağmur planı: ${plan.days[date].rain}`);
  const rs=res.filter(x=>x.date===date).sort((a,b)=>(a.time??'').localeCompare(b.time??''));
  if(rs.length)lines.push('','📅 Rezervasyon:',...rs.map(x=>`• ${x.time?x.time+' ':''}${x.title}${x.place?' · '+x.place:''}`));
  if(stops.length)lines.push('','📍 Duraklar:',...stops.slice(0,8).map(s=>'• '+s));
  if(buy.length)lines.push('',`🛍 Bugün alınacak (${buy.length}): ${buy.slice(0,6).map(([id])=>items[id].name.split(' (')[0]).join(', ')}${buy.length>6?'…':''}`);
  const due=dueLines(date,checks,todos);if(due.length)lines.push('','⏰ Yaklaşan işler:',...due);
  return lines.join('\n');
}
// Yarının özeti (akşam mesajı): son tarihi yarın olan açık işler, gezi günüyse çıkış saati, ilk duraklar ve alınacaklar.
export function tomorrowLines(date,checks,todos=[]){
  const t=addDays(date,1),out=[];
  const jobs=[...pratik.reminders.filter(r=>r.date===t&&openR(r,checks)).map(r=>`• ${r.title}: ${r.detail}`),...todos.filter(x=>!x.done&&x.due===t).map(x=>`• ${x.text}${x.who?` (${x.who})`:''}`)];
  if(jobs.length)out.push(`📝 Yarın (${dayTr(t)}) yapılacaklar:`,...jobs);
  const hs=trip.hourly[t]??[],stops=hs.filter(h=>!/Ulaşım|Hazırlık|Konaklama/.test(h[2]));
  if(hs.length){out.push('',`🗓 Yarın (${dayTr(t)}): ilk çıkış ${hs[0][0]} — ${hs[0][3]}`);if(stops.length)out.push('Duraklar: '+stops.slice(0,5).map(h=>`${h[0]} ${h[3]}`).join(' · '));
    const buy=(plan.days[t]?.buy??[]).filter(([id])=>!checks[keyOf(id)]);if(buy.length)out.push(`🛍 Yarın alınacak: ${buy.length} ürün`)}
  return out.join('\n');
}
// Gezi öncesi akşam (TR 20.00): yarın yapılacak bir şey varsa haber verir.
export function preEvening(date,checks,todos){
  if(addDays(date,1)>TRIP[0])return null;const t=tomorrowLines(date,checks,todos);
  return t?['🌙 Yarın için hatırlatma',t,'','Tamamlayınca sitede ana sayfadaki Yapılacaklar listesinden işaretleyin.'].join('\n'):null;
}
// Ertesi günün rezervasyonları (akşam mesajına eklenir).
export const tomorrowRes=(date,res=[])=>{const t=addDays(date,1),xs=res.filter(x=>x.date===t).sort((a,b)=>(a.time??'').localeCompare(b.time??''));return xs.length?['',`📅 Yarın (${dayTr(t)}) rezervasyon:`,...xs.map(x=>`• ${x.time?x.time+' ':''}${x.title}${x.place?' · '+x.place:''}`)].join('\n'):''};

const yen=n=>'¥'+Math.round(n).toLocaleString('tr-TR');
// Harcama özeti: o günün toplamı, günlük ve toplam bütçeye göre kalan (Harcama sayfasındaki ortak veriden).
export function spendLine(date,expenses=[],st={}){
  const today=expenses.filter(x=>x.date===date).reduce((n,x)=>n+x.amount,0),total=expenses.reduce((n,x)=>n+x.amount,0);
  const out=[`💴 Bugün harcanan: ${yen(today)}${st.budgetDay?` / ${yen(st.budgetDay)}${today>st.budgetDay?` (${yen(today-st.budgetDay)} aşıldı)`:` (kalan ${yen(st.budgetDay-today)})`}`:''}`];
  if(st.budgetTotal)out.push(`Toplam: ${yen(total)} / ${yen(st.budgetTotal)} · kalan ${yen(st.budgetTotal-total)}`);
  return out.join('\n');
}

export function evening(date,checks,expenses,st,res,todos=[]){
  const day=plan.days[date];if(!day)return null;
  const later=Object.entries(plan.days).filter(([d])=>d>date);
  const missing=day.buy.filter(([id])=>!checks[keyOf(id)]);
  const lines=[`🛍 Gün sonu – ${dayTr(date)}`,`Alınanlar: ${day.buy.length-missing.length} / ${day.buy.length}`];
  if(!missing.length)lines.push('Bugünün listesi tamam, eline sağlık!');
  else{lines.push('Alınmayanlar:');for(const [id,where] of missing){const next=later.find(([,x])=>x.buy.some(b=>b[0]===id));const nextWhere=next?.[1].buy.find(b=>b[0]===id)[1];lines.push(`• ${items[id].name} (${where}) → ${next?`sonraki fırsat ${dayTr(next[0])}: ${nextWhere}`:'son fırsattı'}`)}}
  const tl=tomorrowLines(date,checks,todos);lines.push('',spendLine(date,expenses,st),...[tomorrowRes(date,res)].filter(Boolean),...(tl?['',tl]:[]),'','Alındıysa sitede Alışveriş sayfasından işaretleyin.');
  return lines.join('\n');
}

// UTC cron: 06.00 = TR 09.00 (gezi öncesi sabah), 17.00 = TR 20.00 (gezi öncesi akşam: yarın), 23.00 = JST 08.00 (gezide sabah), 12.00 = JST 21.00 (gezide akşam + yarın).
export function messageFor(cron,ms,checks,expenses,st,x={}){
  const jst=dateIn(ms,9),tr=dateIn(ms,3);
  if(cron==='0 6 * * *')return tr<TRIP[0]?morning(tr,checks,x.todos):null;
  if(cron==='0 23 * * *')return jst>=TRIP[0]&&jst<=TRIP[1]?tripMorning(jst,checks,x):null;
  if(cron==='0 12 * * *')return jst>=TRIP[0]&&jst<=TRIP[1]?evening(jst,checks,expenses,st,x.res,x.todos):null;
  if(cron==='0 17 * * *')return preEvening(tr,checks,x.todos);
  return null;
}
// Open-Meteo (anahtarsız) günlük tahmin; hata olursa mesaj havasız gider.
async function weather(date){const r=trip.routes.find(x=>x[0]===date);if(!r)return null;const [la,lo]=CITY[cityOf(r[2])];
  try{const j=await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${date}&end_date=${date}`)).json();const d=j.daily;return {code:d.weather_code[0],max:d.temperature_2m_max[0],min:d.temperature_2m_min[0],rain:d.precipitation_probability_max[0]}}catch{return null}}

export function testMessage(ms,checks){
  const tr=dateIn(ms,3),next=pratik.reminders.find(r=>r.date>=tr&&openR(r,checks));
  return ['🧪 Cloudflare bildirim denemesi: çalışıyor, bilgisayar kapalıyken de mesaj gelecek.',`Sitedeki işaretli iş sayısı: ${Object.keys(checks).length}`,next?`Sıradaki hatırlatma: ${dayTr(next.date)} — ${next.title} (2 gün önceden sabah 09.00'da gelir).`:''].filter(Boolean).join('\n');
}

// Alıcılar: sahip + ek alıcılar; tekrarlar ve boşlar atılır.
export const chatIds=env=>[...new Set([env.CHAT_ID,...String(env.EXTRA_CHAT_IDS??'').split(',')].map(x=>String(x??'').trim()).filter(Boolean))];

export default{
  async scheduled(event,env,ctx){
    // Her alıcıya ayrı gönderilir; biri hata verse de diğerleri alır, hepsi başarısızsa hata.
    const tg=async text=>{const res=await Promise.allSettled(chatIds(env).map(async id=>{const r=await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:id,text:text.slice(0,4000),disable_web_page_preview:true})});if(!r.ok)throw new Error('Telegram '+r.status)}));if(!res.some(x=>x.status==='fulfilled'))throw res[0].reason};
    // 10 dakikada bir: gezide deprem/tsunami ve tren aksaması uyarıları.
    if(event.cron==='*/10 * * * *')return runAlerts(env,event.scheduledTime,tg);
    let checks={},expenses=[],st={},note='';
    try{checks=JSON.parse(await env.CHECKS.get('checks')||'{}')}catch{note='\n(Tikler okunamadı; liste işaretsiz.)'}
    try{expenses=JSON.parse(await env.CHECKS.get('expenses')||'[]');st=JSON.parse(await env.CHECKS.get('settings')||'{}')}catch{}
    const x={};try{x.todos=JSON.parse(await env.CHECKS.get('todos')||'[]');x.res=JSON.parse(await env.CHECKS.get('reservations')||'[]')}catch{}
    if(event.cron==='0 23 * * *'){const d=dateIn(event.scheduledTime,9);x.wx=await weather(d);
      // Kyoto günlerinde güncel yaprak durumu (sayfa okunamazsa satır eklenmez).
      const r=trip.routes.find(z=>z[0]===d);if(r&&cityOf(r[2])==='Kyoto'){try{x.foliage=foliageLine(parseFoliage(await (await fetch(FOLIAGE_URL,{headers:{'user-agent':'Mozilla/5.0'}})).text()),d)}catch{}}}
    // TEST_CRON (geçici değişken) eşleşirse, hatırlatma olmasa da deneme mesajı gider; normalde tanımsızdır.
    const text=event.cron===env.TEST_CRON?testMessage(event.scheduledTime,checks):messageFor(event.cron,event.scheduledTime,checks,expenses,st,x);
    if(!text)return;
    await tg(text+note);
  }
};
