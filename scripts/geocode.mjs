// Harita sayfası için yer koordinatlarını OpenStreetMap Nominatim'den bir kez çeker; data/coords.json'a yazar.
// Nominatim kuralı: saniyede en fazla 1 istek ve tanımlayıcı User-Agent. Bulunanlar tekrar sorgulanmaz.
// Çalıştır: node scripts/geocode.mjs
import fs from 'node:fs';
const load=n=>JSON.parse(fs.readFileSync(new URL('../data/'+n,import.meta.url),'utf8'));
const trip=load('trip.json'),shop=load('shopping.json'),extra=load('extras.json'),picks=load('picks.json');
const file=new URL('../data/coords.json',import.meta.url);
const out=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
// pick-ginza-happo elle (GSI adres: Ginza 8-10) girildi; ad araması Shinjuku şubesini buluyordu.
const SKIP=new Set(['pick-os-drug','pick-jangara','pick-ginza-happo','pick-kaitenzushi']);
// Her yer için önce özel sorgu, bulunamazsa sadeleştirilmiş sorgu denenir.
const jobs=[
  ...trip.attractions.map(r=>['place-'+r[0],[r[2]+' '+r[1],r[2].split(/[\/(,]/)[0].trim()+' '+r[1]]]),
  ...[...shop.stores,...extra.stores].map(r=>['store-'+r[0],[r[3]+' '+r[1],r[6]]]),
  ...picks.picks.map(p=>['pick-'+p.id,[p.mapQuery,p.name.split(/[(\/:]/)[0].trim()+' '+p.city]])
];
const geo=async q=>{const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q='+encodeURIComponent(q),{headers:{'user-agent':'japonya-gezi-private-trip-planner/1.0 (one-time geocoding)','accept-language':'en'}});if(!r.ok)return null;const j=await r.json();return j[0]?[+(+j[0].lat).toFixed(5),+(+j[0].lon).toFixed(5)]:null};
let found=0,miss=[];
for(const [key,qs] of jobs){
  // Zincir veya aynı adlı şube yüzünden yanlış yere düşen, elle silinmiş kayıtlar yeniden aranmaz.
  if(out[key]||SKIP.has(key))continue;
  let hit=null;for(const q of qs){hit=await geo(q);await new Promise(r=>setTimeout(r,1100));if(hit)break}
  if(hit){out[key]=hit;found++;fs.writeFileSync(file,JSON.stringify(out,null,1)+'\n')}else miss.push(key);
}
console.log(JSON.stringify({yeni:found,toplam:Object.keys(out).length,bulunamayan:miss}));
