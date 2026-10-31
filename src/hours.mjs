// Serbest yazılmış açılış saatlerinden kaba açık/kapalı verisi: r = [başlangıç, bitiş] dakika aralıkları, c = düzenli kapalı gün (0=Pazar).
// shortcut: hafta içi/sonu farkı ve öğle arası birleştirilir; "ayın 1. Salı", "düzensiz" gibi kapanışlar kapalı sayılmaz. Arayüz bunu "yaklaşık" diye gösterir.
const DAYS=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
export function parseHours(h){
  if(!h?.hours)return null;
  const r=/24 saat/i.test(h.hours)?[[0,1440]]:[...h.hours.matchAll(/(\d{1,2})[.:](\d\d)\s*[–-]\s*(\d{1,2})[.:](\d\d)/g)].map(m=>[+m[1]*60+ +m[2],+m[3]*60+ +m[4]]).map(([s,e])=>[s,e<=s?e+1440:e]);
  if(!r.length)return null;
  const closed=h.closed&&!/ayın|düzensiz|bazı|bağlı|yalnız/i.test(h.closed)?h.closed.split(/\(/)[0]:'';
  const c=DAYS.map((d,i)=>new RegExp(`(^|[^a-zçğıöşü])${d}([^a-zçğıöşü]|$)`,'i').test(closed)?i:-1).filter(i=>i>=0);
  return {r,c};
}
// Durum: 'open' | 'soon' (60 dk içinde kapanır) | 'closed'. dow 0=Pazar, min = gün içi dakika (JST).
export function openState(o,dow,min){
  if(o.c.includes(dow))return 'closed';
  if(o.r.some(([s,e])=>s===0&&e>=1440))return 'open';
  const hit=o.r.find(([s,e])=>min>=s&&min<e)??o.r.find(([s,e])=>e>1440&&min+1440<e);
  if(!hit)return 'closed';
  const end=min>=hit[0]&&min<hit[1]?hit[1]:hit[1]-1440;return end-min<=60?'soon':'open';
}
// Google Maps bağlantısını Apple Haritalar karşılığına çevirir (Apple Watch'ta Google Maps iyi çalışmıyor).
// Apple bağlantısı ara durak almaz: çok duraklı rotada ilk durağa gider (first=true).
export function appleMapsUrl(href,name='Konum'){
  let u;try{u=new URL(href)}catch{return null}
  if(!/google\.[^/]+$/.test(u.hostname)||!u.pathname.startsWith('/maps'))return null;
  const q=u.searchParams,ll=s=>/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(s??'');
  if(u.pathname.startsWith('/maps/dir')){const wp=(q.get('waypoints')??'').split('|').filter(Boolean),to=wp[0]??q.get('destination');if(!to)return null;
    const p=new URLSearchParams({daddr:to,dirflg:{walking:'w',transit:'r',driving:'d'}[q.get('travelmode')]??'r'});if(q.get('origin'))p.set('saddr',q.get('origin'));
    return {url:'https://maps.apple.com/?'+p,first:wp.length>0}}
  const query=q.get('query');if(!query)return null;
  return {url:'https://maps.apple.com/?'+new URLSearchParams(ll(query)?{ll:query,q:name}:{q:query}),first:false};
}
