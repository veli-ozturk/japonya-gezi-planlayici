// Kyoto yaprak durumu: Kyoto şehir turizm sitesinin (京都観光Navi) 紅葉 tablosu. Sütunlar rapor tarihleri, her satırda tarih başına ikon (is_color01–05).
// shortcut: resmî API değil, sayfa ayrıştırılıyor; biçim değişir ya da sezon verisi henüz yoksa satır eklenmez (mesaj yine gider).
export const FOLIAGE_URL='https://ja.kyoto.travel/flower/momiji/';
export const SPOTS={'清水寺':'Kiyomizu-dera','嵐山':'Arashiyama','天龍寺':'Tenryuji','東福寺':'Tofukuji','永観堂':'Eikando','南禅寺':'Nanzenji','鹿苑寺（金閣寺）':'Kinkakuji','金閣寺':'Kinkakuji','北野天満宮':'Kitano Tenmangu'};
const LEVEL={1:'yeşil',2:'dönmeye başladı',3:'%30–50 renkli',4:'🍁 zirvede',5:'zirve geçti'};
export function parseFoliage(html){
  const t=html.match(/<table class="spotTable viewPc">([\s\S]*?)<\/table>/);if(!t)return null;
  const dates=[...t[1].matchAll(/<th[^>]*>(\d{1,2})\/(\d{1,2})<\/th>/g)].map(m=>[+m[1],+m[2]]);
  const rows=t[1].split(/<tr class="all status\d[^"]*">/).slice(1).map(r=>{const name=r.match(/<p class="name"><a[^>]*>(?:<i[^>]*><\/i>)?([^<]+)<\/a>/)?.[1]?.trim();const icons=[...r.matchAll(/<td class="icon">(?:<i class="icon-momiji is_color0(\d)"><\/i>)?<\/td>/g)].map(m=>m[1]?+m[1]:0);return name&&icons.length?{name,icons}:null}).filter(Boolean);
  return {dates,rows};
}
// date: 'YYYY-MM-DD' (JST). Son raporun bu tarihten en çok 10 gün önce olması gerekir (geçen sezon verisi gösterilmesin).
export function foliageLine(f,date){
  if(!f?.dates.length)return null;
  const [, m, d]=date.split('-').map(Number),today=m*31+d;
  let col=-1;f.dates.forEach(([mm,dd],i)=>{const v=mm*31+dd;if(v<=today&&today-v<=10&&f.rows.some(r=>r.icons[i]))col=i});
  if(col<0)return null;
  const seen=new Set(),parts=[];for(const r of f.rows){const tr=SPOTS[r.name];if(!tr||seen.has(tr)||!r.icons[col])continue;seen.add(tr);parts.push(`${tr} ${LEVEL[r.icons[col]]}`)}
  return parts.length?`🍁 Yaprak (Kyoto, ${f.dates[col][1]}.${f.dates[col][0]} raporu): ${parts.join(' · ')}`:null;
}
