import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {renderSite} from '../src/render.mjs';
import {mapUrl,directionsUrl} from '../src/maps.mjs';
import {bilgiText} from '../src/bilgi.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const readJson=async name=>JSON.parse(await fs.readFile(path.join(root,'data',name),'utf8'));
const [shopping,trip,extra,transport,picks,guide,travel,money,mustbuy,instagram,photos,pratik,plan,weights,prices,hours,emergency,reservations]=await Promise.all(['shopping.json','trip.json','extras.json','transport.json','picks.json','guide.json','travel.json','money.json','mustbuy.json','instagram.json','photos.json','pratik.json','plan.json','weights.json','prices.json','hours.json','emergency.json','reservations.json'].map(readJson));
const coords=JSON.parse(await fs.readFile(path.join(root,'data','coords.json'),'utf8').catch(()=>'{}'));
shopping.items.push(...extra.items);shopping.stores.push(...extra.stores);
shopping.stores.forEach(s=>s[8]=trip.storeDays[s[0]]??s[8]);
shopping.calendar.forEach(r=>{const n=trip.calendarNotes[r[0]+'|'+r[3]];if(n)r[7]=n;if(r[0]==='2037-11-15'&&r[3]==='Tokyo City Flea Market')r[6]='Osaka konaklamasıyla çakışıyor';if(r[0]==='2037-11-22'&&r[3]==='Tokyo City Flea Market')r[6]='Ana Oi ziyareti';});
const [style,checksApp,pageApp,plannerApp,hoursLib]=await Promise.all(['site.css','checks.js','app.js','planner.js','hours.mjs'].map(n=>fs.readFile(path.join(root,'src',n),'utf8')));
// hours.mjs hem derlemede hem telefonda kullanılır: tarayıcı için export kaldırılıp koda eklenir.
const script=[hoursLib.replace(/^export /gm,''),checksApp,pageApp,plannerApp].join('\n');
// Stil ve kod her sayfaya gömülmez: içerik özetli adla bir kez indirilir, önbellekte kalır (değişince ad değişir).
const digest=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,10);
const cssName=`site.${digest(style)}.css`,jsName=`app.${digest(script)}.js`;
const out=path.join(root,'docs');await fs.mkdir(path.join(out,'downloads'),{recursive:true});
for(const img of ['bg-japan.webp','bg-mobile.webp','icon-512.png','icon-192.png','icon-180.png','manifest.webmanifest'])await fs.copyFile(path.join(root,'src',img),path.join(out,img));
// iOS kökte /apple-touch-icon.png de arar.
await fs.copyFile(path.join(root,'src','icon-180.png'),path.join(out,'apple-touch-icon.png'));
for(const n of await fs.readdir(out))if(/^(site|app)\.[0-9a-f]{10}\.(css|js)$/.test(n)&&n!==cssName&&n!==jsName)await fs.unlink(path.join(out,n));
await fs.writeFile(path.join(out,cssName),style);await fs.writeFile(path.join(out,jsName),script);
for(const [file,html] of Object.entries(renderSite({shopping,trip,transport,picks,guide,travel,money,mustbuy,instagram,photos,pratik,plan,weights,prices,hours,emergency,reservations,coords,style:cssName,script:jsName})))await fs.writeFile(path.join(out,file),html);
const pagesOut=(await fs.readdir(out)).filter(n=>n.endsWith('.html'));
const precache=['./',...pagesOut,cssName,jsName,'bg-japan.webp','bg-mobile.webp','icon-192.png','icon-512.png','manifest.webmanifest','search.json',...Object.values(photos.photos).map(x=>x.thumb)];
const swSrc=await fs.readFile(path.join(root,'src','sw.js'),'utf8');
const version=(await import('node:crypto')).createHash('sha256').update(JSON.stringify(precache)+swSrc+(await Promise.all(pagesOut.map(n=>fs.readFile(path.join(out,n),'utf8')))).join('')).digest('hex').slice(0,12);
await fs.writeFile(path.join(out,'sw.js'),'const VERSION='+JSON.stringify('jp26-'+version)+';\nconst PRECACHE='+JSON.stringify(precache)+';\n'+swSrc);
export const csv=rows=>'\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
const pins=[['Name','Address','City','Category','Notes','Website','GoogleMaps'],[trip.hotel.name,trip.hotel.address,'Osaka','Konaklama',trip.hotel.access,trip.hotel.source,mapUrl(trip.hotel.mapQuery)],...shopping.stores.map(r=>[r[3],r[6],r[1],r[4],r[8]+' / '+r[5]+' / '+r[7],r[9],mapUrl(r[3]+' '+r[6])]),...trip.attractions.map(r=>[r[2],r[8],r[1],'Gezi',r[3]+' / '+r[10],r[9],mapUrl(r[2]+' '+r[8])]),...picks.picks.map(p=>[p.name,p.mapQuery,p.city,'Claude önerisi / '+p.type+' / '+p.tier+' / '+p.score+'/5',p.when+' / '+p.why,p.url??'',mapUrl(p.mapQuery)])];
await fs.writeFile(path.join(out,'downloads/Google_Maps_Tum_Duraklar.csv'),csv(pins));
await fs.writeFile(path.join(out,'downloads/Google_Maps_Magazalar.csv'),csv([pins[0],...shopping.stores.map(r=>[r[3],r[6],r[1],r[4],r[8]+' / '+r[5],r[9],mapUrl(r[3]+' '+r[6])])]));
await fs.writeFile(path.join(out,'downloads/Ulasim_Rotalari.csv'),csv([['Tarih','Baslangic','Bitis','Sure_Tahmini','Odeme','Hatlar_Duraklar','Not','Rota_URL','Ters_Rota_URL','Kaynaklar'],...transport.legs.map(l=>[l.date,l.from,l.to,l.duration,l.payment,l.steps.map(s=>s.join(' / ')).join(' → '),l.note,directionsUrl(l.origin,l.destination,l.mode),directionsUrl(l.destination,l.origin,l.mode),l.sources.map(k=>transport.sources[k]).join(' ')])]));
await fs.writeFile(path.join(out,'downloads/Saatli_Rota.csv'),csv([['Tarih','Baslangic_JST','Bitis_JST','Tur','Durak','Ulasim','Not','Harita'],...Object.entries(trip.hourly).flatMap(([d,ss])=>ss.map(s=>[d,...s.slice(0,6),mapUrl(s[6])]))]));
// Bot cevabına sayfa adresi: id → derlenmiş sayfa (pratik ve yolculuk önce, alt sayfalardan önce ana sayfa).
const idPage={};for(const n of ['pratik.html','yolculuk.html',...pagesOut])for(const m of (await fs.readFile(path.join(out,n),'utf8')).matchAll(/ id="([^"]+)"/g))idPage[m[1]]??=n;
const SITE='https://japonya-gezi.pages.dev/';
await fs.writeFile(path.join(out,'bilgi.txt'),bilgiText({trip,transport,pratik,plan,picks,hours,mustbuy,travel,emergency},id=>idPage[id]?SITE+idPage[id].replace(/.html$/,'')+'#'+id:null));
console.log(JSON.stringify({output:out,items:shopping.items.length,stores:shopping.stores.length,legs:transport.legs.length,pins:pins.length-1}));
