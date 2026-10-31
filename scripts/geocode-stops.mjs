// Günün rota haritası için saatli programdaki durakları (trip.hourly mapQuery) coords.json'a "q:<sorgu>" anahtarıyla yazar.
// Sonuç o günün şehrine 45 km'den uzaksa reddedilir. Nominatim: saniyede en fazla 1 istek. Çalıştır: node scripts/geocode-stops.mjs
import fs from 'node:fs';
const load=n=>JSON.parse(fs.readFileSync(new URL('../data/'+n,import.meta.url),'utf8'));
const trip=load('trip.json'),file=new URL('../data/coords.json',import.meta.url),out=load('coords.json');
const C={Osaka:[34.68,135.5],Kyoto:[35.01,135.75],Nara:[34.685,135.83],Tokyo:[35.68,139.76],Rinku:[34.41,135.3],Gotemba:[35.31,138.97]};
const km=([a,b],[c,d])=>Math.hypot((a-c)*111,(b-d)*91);
const cityOf=r=>/Gotemba/.test(r[2])?'Gotemba':/Rinku/.test(r[2])?'Rinku':['Kyoto','Nara','Tokyo'].find(c=>r[2].includes(c))??'Osaka';
// Sonuç o günün şehrine (günübirlik gezilerde Osaka’ya da) en fazla 45 km olmalı; aynı adlı başka şehirdeki yerleri eler.
const near=(ll,city)=>km(ll,C[city])<45||(city!=='Tokyo'&&city!=='Gotemba'&&km(ll,C.Osaka)<45)||(city==='Gotemba'&&km(ll,C.Tokyo)<45);
const geo=async q=>{const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=3&countrycodes=jp&q='+encodeURIComponent(q),{headers:{'user-agent':'japonya-gezi-private-trip-planner/1.0 (one-time geocoding)','accept-language':'en'}});return r.ok?r.json():[]};
const miss=[];
for(const r of trip.routes)for(const h of trip.hourly[r[0]]??[]){
  const q=h[6];if(!q||/Ulaşım/.test(h[2])||out['q:'+q])continue;
  const m=q.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);if(m){out['q:'+q]=[+m[1],+m[2]];continue}
  let hit=null;for(const x of await geo(q)){const ll=[+(+x.lat).toFixed(5),+(+x.lon).toFixed(5)];if(near(ll,cityOf(r))){hit=ll;break}}
  await new Promise(res=>setTimeout(res,1100));
  if(hit)out['q:'+q]=hit;else miss.push(q);
}
fs.writeFileSync(file,JSON.stringify(out,null,1)+'\n');
console.log(JSON.stringify({toplam:Object.keys(out).filter(k=>k.startsWith('q:')).length,bulunamayan:miss}));
