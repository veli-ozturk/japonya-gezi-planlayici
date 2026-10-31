// Gezide anlık uyarılar (10 dakikada bir): deprem/tsunami (P2P地震情報, JMA verisi) ve tren aksaması (Yahoo!路線情報 sayfası).
// Aynı olay için tek mesaj: gönderilenler KV 'alerts-sent' anahtarında tutulur.
// shortcut: tren verisi resmî API değil, sayfa ayrıştırılıyor; sayfa değişirse uyarı sessizce durur (test örnek HTML ile korur).
export const QUAKE_PREFS=['大阪府','京都府','奈良県','兵庫県','東京都','神奈川県','千葉県','埼玉県'];
const PREF_TR={'大阪府':'Osaka','京都府':'Kyoto','奈良県':'Nara','兵庫県':'Hyogo (Kobe)','東京都':'Tokyo','神奈川県':'Kanagawa','千葉県':'Chiba','埼玉県':'Saitama'};
const SHINDO={10:'1',20:'2',30:'3',40:'4',45:'5 zayıf',50:'5 güçlü',55:'6 zayıf',60:'6 güçlü',70:'7'};
// Deprem: izlenen illerde JMA şiddeti 4 ve üstü; tsunami: Osaka/Tokyo/Kyoto kıyı bölgeleri için iptal edilmemiş uyarı.
// 30 dakikadan eski bildirimler atlanır (ilk çalışmada geçmiş depremler gelmesin).
const ageMin=(q,ms)=>(ms-Date.parse(String(q.time).replace(/\//g,'-').replace(' ','T').slice(0,19)+'+09:00'))/6e4;
export function quakeAlerts(items,seen=[],ms=Date.now()){
  const out=[];
  for(const q of items){if(seen.includes(q.id)||!(ageMin(q,ms)<=30))continue;
    if(q.code===551){const pts=(q.points??[]).filter(p=>QUAKE_PREFS.includes(p.pref)&&p.scale>=40);if(!pts.length)continue;
      const byPref={};for(const p of pts)byPref[p.pref]=Math.max(byPref[p.pref]??0,p.scale);
      const e=q.earthquake??{},t=(e.time??'').slice(11,16);
      out.push({id:q.id,text:[`⚠️ Deprem ${t} (Japonya saati) · büyüklük M${e.hypocenter?.magnitude??'?'}${e.hypocenter?.name?' · merkez '+e.hypocenter.name:''}`,
        'Hissedilen şiddet (JMA, 0–7): '+Object.entries(byPref).map(([p,s])=>`${PREF_TR[p]} ${SHINDO[s]??s/10}`).join(', '),
        e.domesticTsunami&&!['None','Unknown'].includes(e.domesticTsunami)?'🌊 TSUNAMİ riski bildirildi: kıyıdan ve nehir ağızlarından uzaklaşın, yüksek binaya çıkın.':'Tsunami bildirimi yok.',
        'Güvendeyseniz birbirinize yazın; artçılara dikkat. Acil: 119 ambulans/itfaiye, 110 polis.'].join('\n')})}
    if(q.code===552&&!q.cancelled){const areas=(q.areas??[]).filter(a=>/大阪|東京|京都|兵庫|和歌山|神奈川|千葉/.test(a.name));if(!areas.length)continue;
      out.push({id:q.id,text:`🌊 TSUNAMİ UYARISI: ${areas.map(a=>a.name).join(', ')}\nHemen kıyıdan, limandan ve nehir kenarından uzaklaşın; yüksek ve sağlam binaya çıkın. Görevlilerin talimatına uyun.`})}}
  return out;
}
// İzlenen hatlar (Yahoo!路線情報 adıyla eşleşir); Osaka günleri Kinki, Tokyo günleri Kanto bölgesi.
export const LINES={6:['御堂筋線','堺筋線','長堀鶴見緑地線','千日前線','南海本線','南海空港線','関西空港線','JR京都線','大阪環状線','JR奈良線','嵯峨野線','京阪本線','近鉄奈良線','阪急京都本線','東海道新幹線'],
  4:['山手線','京浜東北','中央線快速','総武線','銀座線','日比谷線','丸ノ内線','浅草線','京急空港線','京急本線','東京モノレール','東海道新幹線']};
const STATUS={'運転見合わせ':'🛑 seferler durdu','列車遅延':'⏱ gecikme','運転状況':'⚠️ aksama','運転計画':'ℹ️ plan değişikliği','交通障害情報':'⚠️ aksama'};
// Sayfadaki "trouble" tablosu: [hat, durum] çiftleri.
export const parseTrouble=html=>{const t=html.match(/<div class="elmTblLstLine trouble">([\s\S]*?)<\/table>/);if(!t)return [];
  return [...t[1].matchAll(/<a href="[^"]*">([^<]+)<\/a><\/td><td>(?:<span[^>]*><\/span>)?<span class="colTrouble">([^<]+)<\/span>/g)].map(m=>[m[1],m[2]])};
export function trainAlerts(rows,area,prev={}){
  const now={},out=[];
  for(const [line,status] of rows){if(!LINES[area].some(w=>line.includes(w))||status==='運転再開')continue;now[line]=status;
    if(prev[line]!==status)out.push(`${STATUS[status]??'⚠️ '+status}: ${line}`)}
  return {now,text:out.length?['🚃 Tren durumu',...out,'Ayrıntı ve alternatif: Google Maps toplu taşıma veya istasyon ekranları. Gecikme belgesi (遅延証明書) çıkışta verilir.'].join('\n'):null};
}
export async function runAlerts(env,ms,send){
  const jst=new Date(ms+9*36e5),date=jst.toISOString().slice(0,10),h=jst.getUTCHours();
  if(date<'2037-11-09'||date>'2037-11-24')return;
  let st={};try{st=JSON.parse(await env.CHECKS.get('alerts-sent')||'{}')}catch{}
  st.quakes??=[];st.lines??={};let dirty=false;
  try{const j=await (await fetch('https://api.p2pquake.net/v2/history?codes=551&codes=552&limit=20')).json();
    for(const a of quakeAlerts(j,st.quakes,ms)){await send(a.text);st.quakes.push(a.id);dirty=true}
    for(const q of j)if(!st.quakes.includes(q.id)){st.quakes.push(q.id);dirty=true}
    st.quakes=st.quakes.slice(-60)}catch{}
  if(h>=6&&h<23){const areas=date<'2037-11-17'?[6]:date>'2037-11-17'?[4]:[6,4];
    for(const area of areas){try{const html=await (await fetch(`https://transit.yahoo.co.jp/diainfo/area/${area}`,{headers:{'user-agent':'Mozilla/5.0'}})).text();
      const r=trainAlerts(parseTrouble(html),area,st.lines[area]);if(r.text)await send(r.text);if(JSON.stringify(r.now)!==JSON.stringify(st.lines[area]??{})){st.lines[area]=r.now;dirty=true}}catch{}}}
  if(dirty)await env.CHECKS.put('alerts-sent',JSON.stringify(st));
}
