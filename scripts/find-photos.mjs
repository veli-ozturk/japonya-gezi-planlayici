// Gezi yerleri için Wikimedia Commons'ta serbest lisanslı fotoğraf arar ve data/photos.json'a yazar.
// Fotoğraflar indirilmez; sayfa Commons küçük resmini doğrudan gösterir. Çalıştır: node scripts/find-photos.mjs
import fs from 'node:fs';
const QUERIES={
  G01:'Dotonbori Glico sign',G02:'Hozenji Yokocho',G04:'Osaka Castle main tower',G05:'Umeda Sky Building',G06:'Tsutenkaku Shinsekai',
  G07:'Fushimi Inari Taisha torii',G08:'Kiyomizu-dera stage',G09:'Ninenzaka Kyoto',G10:'Arashiyama bamboo grove',G11:'Tenryu-ji garden',G12:'Kinkaku-ji',
  G13:'Nishiki Market Kyoto',G14:'Kofuku-ji five-storied pagoda',G15:'Sika deer in Nara Park',G16:'Todaiji Great Buddha Hall exterior',G17:'Kasuga Taisha lanterns',G18:'Senso-ji Kaminarimon',
  G19:'Ameyoko Ueno',G20:'Meiji Jingu torii',G21:'Shibuya Crossing',G22:'Tokyo Station Marunouchi building',G23:'Universal Studios Japan',
  tofukuji:'Tofuku-ji Tsutenkyo',sanjusangendo:'Sanjusangendo',ryoanji:'Ryoan-ji rock garden',nijo:'Nijo Castle Ninomaru',himeji:'Himeji Castle',ginkakuji:'Ginkaku-ji',
  byodoin:'Byodo-in Phoenix Hall',horyuji:'Horyu-ji',shitennoji:'Shitenno-ji',tnm:'Tokyo National Museum Honkan',nikko:'Nikko Toshogu Yomeimon',kamakura:'Kotoku-in Great Buddha',
  'east-gardens':'East Gardens Imperial Palace Tokyo','namba-yasaka':'Namba Yasaka Shrine lion head stage',yanaka:'Yanaka Ginza',tocho:'Tokyo Metropolitan Government Building',
  kabuki:'Kabuki-za',katsuoji:'Katsuo-ji Minoh daruma',isuien:'Isuien Garden Nara',naramachi:'Naramachi Nara',kaiyukan:'Kaiyukan aquarium building Osaka',minoo:'Minoo Falls',
  omoide:'Omoide Yokocho',shimokita:'Shimokitazawa',amerikamura:'Amerikamura Osaka'
};
// Kuromon ve Shibuya Sky bilerek yok: Commons aramaları yanlış yerin fotoğrafını getiriyor.
const FREE=/^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+|CC BY(-SA)?)/i;
const api=q=>`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(q+' filetype:bitmap')}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|Artist&iiurlwidth=500`;
const file=new URL('../data/photos.json',import.meta.url);
const out=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')).photos:{};
// Commons istek sınırı: yanıt JSON değilse bekleyip yeniden dene.
const getJson=async url=>{for(let t=0;t<6;t++){const r=await fetch(url,{headers:{'user-agent':'japonya-gezi-private-planner/1.0'}});const txt=await r.text();try{return JSON.parse(txt)}catch{await new Promise(x=>setTimeout(x,4000*(t+1)))}}throw new Error('Commons yanıt vermedi')};
for(const [key,q] of Object.entries(QUERIES)){
  if(out[key]&&!process.argv.includes(key))continue;
  const j=await getJson(api(q));
  const pages=Object.values(j.query?.pages??{}).sort((a,b)=>a.index-b.index);
  const hit=pages.map(p=>({p,i:p.imageinfo?.[0]})).find(({i})=>i&&i.mime==='image/jpeg'&&i.width>=i.height&&FREE.test(i.extmetadata?.LicenseShortName?.value??''));
  if(hit)out[key]={title:hit.p.title.replace(/^File:/,''),thumb:hit.i.thumburl.replace(/\?.*$/,''),page:hit.i.descriptionurl,license:hit.i.extmetadata.LicenseShortName.value,artist:(hit.i.extmetadata.Artist?.value??'').replace(/<[^>]+>/g,'').trim().slice(0,60)};
  console.log(key.padEnd(14),hit?out[key].title.slice(0,60)+' | '+out[key].license:'BULUNAMADI');
  await new Promise(r=>setTimeout(r,1500));
  fs.writeFileSync(file,JSON.stringify({source:'Wikimedia Commons',checkedAt:'2037-10-25',photos:out},null,2)+'\n');
}
